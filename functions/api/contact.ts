/// <reference types="@cloudflare/workers-types" />

/**
 * Contact form endpoint — POST /api/contact
 *
 * This Cloudflare Pages Function verifies Turnstile and sends the message
 * through Cloudflare Email Sending. The rest of the site remains static.
 *
 * Hardening summary (see README "Contact form"):
 * - Only `application/json` bodies are accepted (415 otherwise).
 * - The body is stream-read with a byte counter and rejected with 413 once it
 *   passes MAX_BODY_BYTES, whatever Content-Length claims.
 * - The parsed value must be a plain object whose known fields are strings.
 * - Siteverify and Email Sending calls each have a finite deadline; timeouts
 *   return a generic, retryable 504.
 * - Every response, including 405/4xx/5xx, carries the API security headers.
 * - Logs are single-line structured events with no visitor data or raw
 *   upstream text.
 */

interface Env {
	CLOUDFLARE_API_TOKEN?: string;
	CLOUDFLARE_ACCOUNT_ID?: string;
	EMAIL_FROM_CONTACT?: string;
	CONTACT_TO_EMAIL?: string;
	TURNSTILE_SECRET?: string;
	TURNSTILE_HOSTNAMES?: string;
}

/** Field limits in UTF-16 code units, matching the form's `maxlength` attributes. */
const LIMITS = {
	name: 100,
	subject: 150,
	messageMin: 10,
	messageMax: 4000,
	/** RFC 5321 path limit, counted in UTF-8 octets. */
	emailMaxBytes: 254,
	/** RFC 5321 local-part limit, counted in UTF-8 octets. */
	emailLocalMaxBytes: 64,
	/** Turnstile tokens are at most 2048 characters. */
	captchaToken: 2048,
} as const;

/**
 * Actual-byte cap for the request body (32 KiB). Every field at its maximum
 * length is about 7 KB of ASCII or about 15 KB if every character takes three
 * UTF-8 bytes; worst-case JSON escaping (\u00XX for every message character)
 * is about 27 KB and still fits. Larger bodies get 413 before full buffering.
 */
const MAX_BODY_BYTES = 32 * 1024;

/** Deadline for the Turnstile Siteverify request. */
const SITEVERIFY_TIMEOUT_MS = 10_000;
/** Deadline for the Email Sending request. */
const EMAIL_TIMEOUT_MS = 10_000;

/** Sender must be on a connected and verified Email Sending domain. */
const DEFAULT_FROM = "contact@jdmusick.band";
/** Destination inbox — keep in step with CONTACT_EMAIL in src/config/site.ts. */
const DEFAULT_TO = "contact@jdmusick.band";
const TURNSTILE_ACTION = "contact";
const DEFAULT_TURNSTILE_HOSTNAMES = ["jdmusick.band"];
const SUCCESS_MESSAGE = "Thanks — your message has been sent.";

/**
 * Applied to every Function response. `public/_headers` does not reach Pages
 * Function responses, so the API sets its own. HSTS matches `_headers`.
 * No CORS headers: the form posts same-origin only.
 */
const API_HEADERS: Record<string, string> = {
	"Content-Type": "application/json; charset=utf-8",
	"Cache-Control": "no-store",
	"X-Content-Type-Options": "nosniff",
	"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
	"Referrer-Policy": "no-referrer",
	"X-Frame-Options": "DENY",
	"Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
	"Cross-Origin-Resource-Policy": "same-origin",
};

const json = (
	payload: Record<string, unknown>,
	status = 200,
	extraHeaders: Record<string, string> = {},
): Response =>
	new Response(JSON.stringify(payload), {
		status,
		headers: { ...API_HEADERS, ...extraHeaders },
	});

// ---------------------------------------------------------------------------
// Structured logging
// ---------------------------------------------------------------------------

type Operation = "request" | "siteverify" | "email_send";
type Outcome =
	| "sent"
	| "honeypot"
	| "bad_request"
	| "verification_failed"
	| "timeout"
	| "upstream_unavailable"
	| "config_error"
	| "delivery_rejected"
	| "internal_error";

interface LogEvent {
	op: Operation;
	outcome: Outcome;
	/** HTTP status this Function returned. */
	status: number;
	/** HTTP status from Siteverify or Email Sending, when one was received. */
	upstream_status?: number;
	/** A fixed reason or sanitized upstream code; never free text. */
	code?: string;
}

/** Accept only short, code-like tokens so no free text can reach the logs. */
const safeCode = (value: unknown): string | undefined => {
	if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value < 1e7) {
		return String(value);
	}
	if (typeof value === "string" && /^[a-z0-9_.-]{1,40}$/i.test(value)) return value;
	return undefined;
};

/**
 * Emits one JSON line. Fields are limited to the request ID, operation,
 * outcome, statuses and a sanitized code. Names, emails, subjects, messages,
 * tokens, IP addresses and upstream response text are never logged.
 */
const log = (requestId: string, event: LogEvent): void => {
	const line = JSON.stringify({ event: "contact_api", request_id: requestId, ...event });
	if (event.outcome === "sent" || event.outcome === "honeypot") console.log(line);
	else if (event.status < 500) console.warn(line);
	else console.error(line);
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const utf8 = new TextEncoder();
const byteLength = (value: string): number => utf8.encode(value).byteLength;

/** Rejects with a TimeoutError once `ms` elapses, aborting the signal handed to `run`. */
const withDeadline = async <T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> => {
	const controller = new AbortController();
	let timer: ReturnType<typeof setTimeout> | undefined;
	const deadline = new Promise<never>((_, reject) => {
		timer = setTimeout(() => {
			const error = new DOMException("Deadline exceeded", "TimeoutError");
			controller.abort(error);
			reject(error);
		}, ms);
	});
	try {
		return await Promise.race([run(controller.signal), deadline]);
	} finally {
		clearTimeout(timer);
	}
};

/** Error name only; DOMException is not an Error subclass in every runtime. */
const errorName = (error: unknown): string | undefined =>
	typeof error === "object" && error !== null && typeof (error as { name?: unknown }).name === "string"
		? (error as { name: string }).name
		: undefined;

const isTimeout = (error: unknown): boolean => {
	const name = errorName(error);
	return name === "TimeoutError" || name === "AbortError";
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/** Characters that are never valid in an unquoted address or could confuse header parsing. */
const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;

const isValidEmail = (value: string): boolean => {
	if (!EMAIL_PATTERN.test(value)) return false;
	if (byteLength(value) > LIMITS.emailMaxBytes) return false;
	const local = value.slice(0, value.lastIndexOf("@"));
	return byteLength(local) <= LIMITS.emailLocalMaxBytes;
};

const escapeHtml = (value: string): string =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

/** Strip line breaks from values interpolated into header-like fields. */
const singleLine = (value: string): string => value.replace(/[\r\n]+/g, " ").trim();

// ---------------------------------------------------------------------------
// Request body
// ---------------------------------------------------------------------------

type BodyResult =
	| { ok: true; value: unknown }
	| { ok: false; status: number; error: string; code: string };

const isJsonContentType = (header: string | null): boolean => {
	if (!header) return false;
	const [mediaType, ...params] = header.split(";").map((part) => part.trim().toLowerCase());
	if (mediaType !== "application/json") return false;
	const charset = params.find((param) => param.startsWith("charset="));
	return !charset || charset.replace(/^charset=/, "").replace(/"/g, "") === "utf-8";
};

/** Reads at most MAX_BODY_BYTES from the stream, then decodes and parses it. */
const readJsonBody = async (request: Request): Promise<BodyResult> => {
	if (!isJsonContentType(request.headers.get("Content-Type"))) {
		return {
			ok: false,
			status: 415,
			error: "Requests must be sent as application/json.",
			code: "unsupported_media_type",
		};
	}

	const tooLarge: BodyResult = {
		ok: false,
		status: 413,
		error: "The message is too large.",
		code: "body_too_large",
	};

	// Cheap early rejection; the byte counter below is the real guarantee.
	const declared = Number(request.headers.get("Content-Length"));
	if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return tooLarge;

	const chunks: Uint8Array[] = [];
	let total = 0;
	if (request.body) {
		const reader = request.body.getReader();
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			total += value.byteLength;
			if (total > MAX_BODY_BYTES) {
				await reader.cancel().catch(() => undefined);
				return tooLarge;
			}
			chunks.push(value);
		}
	}

	const bytes = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}

	const malformed: BodyResult = {
		ok: false,
		status: 400,
		error: "Malformed request.",
		code: "invalid_json",
	};
	let text: string;
	try {
		text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		return { ...malformed, code: "invalid_encoding" };
	}
	try {
		return { ok: true, value: JSON.parse(text) };
	} catch {
		return malformed;
	}
};

const FIELDS = ["name", "email", "subject", "message", "captchaToken", "website"] as const;
type Field = (typeof FIELDS)[number];

/** Returns trimmed strings for each known field, or null if any has the wrong type. */
const readFields = (payload: Record<string, unknown>): Record<Field, string> | null => {
	const fields = {} as Record<Field, string>;
	for (const key of FIELDS) {
		const value = payload[key];
		if (value === undefined || value === null) fields[key] = "";
		else if (typeof value === "string") fields[key] = value.trim();
		else return null;
	}
	return fields;
};

// ---------------------------------------------------------------------------
// Upstream calls
// ---------------------------------------------------------------------------

type UpstreamResult =
	| { ok: true; upstreamStatus: number }
	| {
			ok: false;
			outcome: Outcome;
			status: number;
			error: string;
			code: string;
			upstreamStatus?: number;
			logCode?: string;
	  };

const verifyTurnstile = async (
	request: Request,
	env: Env,
	token: string,
): Promise<UpstreamResult> => {
	if (!env.TURNSTILE_SECRET) {
		return {
			ok: false,
			outcome: "config_error",
			status: 503,
			error: "The contact form is not configured.",
			code: "turnstile_unconfigured",
		};
	}

	if (!token || token.length > LIMITS.captchaToken) {
		return {
			ok: false,
			outcome: "bad_request",
			status: 400,
			error: "Please complete the verification challenge.",
			code: "missing_verification",
		};
	}

	const body = new URLSearchParams({
		secret: env.TURNSTILE_SECRET,
		response: token,
	});
	const remoteIp = request.headers.get("CF-Connecting-IP");
	if (remoteIp) body.set("remoteip", remoteIp);

	let upstreamStatus: number | undefined;
	try {
		const data = await withDeadline(SITEVERIFY_TIMEOUT_MS, async (signal) => {
			const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: body.toString(),
				signal,
			});
			upstreamStatus = response.status;
			if (!response.ok) return null;
			return (await response.json().catch(() => null)) as unknown;
		});

		if (!isPlainObject(data)) {
			return {
				ok: false,
				outcome: "upstream_unavailable",
				status: 502,
				error: "Could not reach the verification service. Please try again.",
				code: "verification_unavailable",
				upstreamStatus,
			};
		}

		const allowedHostnames = (env.TURNSTILE_HOSTNAMES || DEFAULT_TURNSTILE_HOSTNAMES.join(","))
			.split(",")
			.map((hostname) => hostname.trim().toLowerCase())
			.filter(Boolean);
		const valid =
			data.success === true &&
			data.action === TURNSTILE_ACTION &&
			typeof data.hostname === "string" &&
			allowedHostnames.includes(data.hostname.toLowerCase());

		if (valid) return { ok: true, upstreamStatus: upstreamStatus ?? 200 };

		const errorCodes = Array.isArray(data["error-codes"]) ? data["error-codes"] : [];
		const logCode =
			safeCode(errorCodes[0]) ??
			(data.success === true
				? data.action !== TURNSTILE_ACTION
					? "action_mismatch"
					: "hostname_mismatch"
				: undefined);
		return {
			ok: false,
			outcome: "verification_failed",
			status: 400,
			error: "Verification failed. Please try again.",
			code: "verification_failed",
			upstreamStatus,
			logCode,
		};
	} catch (error) {
		if (isTimeout(error)) {
			return {
				ok: false,
				outcome: "timeout",
				status: 504,
				error: "The verification service did not respond in time. Please try again.",
				code: "verification_timeout",
				upstreamStatus,
			};
		}
		return {
			ok: false,
			outcome: "upstream_unavailable",
			status: 502,
			error: "Could not reach the verification service. Please try again.",
			code: "verification_unavailable",
			upstreamStatus,
			logCode: safeCode(errorName(error)),
		};
	}
};

const sendEmail = async (
	message: { to: string; from: string; subject: string; text: string; html: string; replyTo: string },
	env: Env,
): Promise<UpstreamResult> => {
	let upstreamStatus: number | undefined;
	try {
		const data = await withDeadline(EMAIL_TIMEOUT_MS, async (signal) => {
			const response = await fetch(
				`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/email/sending/send`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						to: message.to,
						from: message.from,
						subject: message.subject,
						text: message.text,
						html: message.html,
						// Cloudflare's REST schema requires this exact snake_case field.
						reply_to: message.replyTo,
					}),
					signal,
				},
			);
			upstreamStatus = response.status;
			return (await response.json().catch(() => null)) as unknown;
		});

		// Success requires both a 2xx status and `success: true` in the body.
		const status = upstreamStatus ?? 0;
		if (status >= 200 && status < 300 && isPlainObject(data) && data.success === true) {
			return { ok: true, upstreamStatus: status };
		}

		// Log only the numeric/code-like Cloudflare error code, never its message.
		const errors = isPlainObject(data) && Array.isArray(data.errors) ? data.errors : [];
		const firstError = errors.find(isPlainObject);
		return {
			ok: false,
			outcome: "delivery_rejected",
			status: 502,
			error: "Could not send your message. Please try again in a moment.",
			code: "delivery_failed",
			upstreamStatus,
			logCode: safeCode(firstError?.code),
		};
	} catch (error) {
		if (isTimeout(error)) {
			// The provider may have accepted the message before the deadline, so
			// delivery is ambiguous. Do not resend automatically.
			return {
				ok: false,
				outcome: "timeout",
				status: 504,
				error:
					"The mail service did not respond in time, so your message may or may not have been sent. Please wait a few minutes before trying again.",
				code: "delivery_timeout",
				upstreamStatus,
			};
		}
		return {
			ok: false,
			outcome: "upstream_unavailable",
			status: 502,
			error: "Could not send your message. Please try again in a moment.",
			code: "delivery_failed",
			upstreamStatus,
			logCode: safeCode(errorName(error)),
		};
	}
};

const buildBodies = (fields: { name: string; email: string; subject: string; message: string }) => {
	const text = [
		"New message from the jdmusick.band contact form",
		"",
		`Name:    ${fields.name}`,
		`Email:   ${fields.email}`,
		`Subject: ${fields.subject}`,
		"",
		"Message:",
		fields.message,
	].join("\n");

	const safe = {
		name: escapeHtml(fields.name),
		email: escapeHtml(fields.email),
		subject: escapeHtml(fields.subject),
		message: escapeHtml(fields.message),
	};

	const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>Contact form message</title>
  </head>
  <body style="margin:0;padding:24px;background-color:#f3f4f6;color:#111827;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:700px;margin:0 auto;border-collapse:collapse;">
      <tr>
        <td style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
          <h2 style="margin:0 0 16px;font-size:20px;line-height:1.3;">New message from jdmusick.band</h2>
          <p style="margin:0 0 6px;"><strong>Name:</strong> ${safe.name}</p>
          <p style="margin:0 0 6px;"><strong>Email:</strong> <a href="mailto:${safe.email}" style="color:#111827;">${safe.email}</a></p>
          <p style="margin:0 0 16px;"><strong>Subject:</strong> ${safe.subject}</p>
          <div style="white-space:pre-wrap;background-color:#f9fafb;border:1px solid #e5e7eb;padding:12px;border-radius:8px;">${safe.message}</div>
          <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">Reply directly to this email to answer the sender.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

	return { text, html };
};

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const handlePost = async (request: Request, env: Env, requestId: string): Promise<Response> => {
	const badRequest = (status: number, error: string, code: string): Response => {
		log(requestId, { op: "request", outcome: "bad_request", status, code });
		return json({ error, code }, status);
	};
	/** Server-side and upstream failures include the request ID for correlation. */
	const failure = (op: Operation, result: Extract<UpstreamResult, { ok: false }>): Response => {
		log(requestId, {
			op,
			outcome: result.outcome,
			status: result.status,
			upstream_status: result.upstreamStatus,
			code: result.logCode ?? result.code,
		});
		return json(
			{
				error: result.error,
				code: result.code,
				...(result.status >= 500 && { requestId }),
				...(result.status >= 500 && result.outcome !== "config_error" && { retryable: true }),
			},
			result.status,
		);
	};

	const body = await readJsonBody(request);
	if (!body.ok) return badRequest(body.status, body.error, body.code);
	if (!isPlainObject(body.value)) {
		return badRequest(400, "Malformed request.", "invalid_shape");
	}

	const fields = readFields(body.value);
	if (!fields) return badRequest(400, "Malformed request.", "invalid_field_type");

	// Make honeypot submissions look successful without sending anything.
	if (fields.website) {
		log(requestId, { op: "request", outcome: "honeypot", status: 200 });
		return json({ message: SUCCESS_MESSAGE });
	}

	const name = singleLine(fields.name);
	const email = fields.email.toLowerCase();
	const subject = singleLine(fields.subject) || "Contact form message";
	const message = fields.message;

	if (!name || !email || !message) {
		return badRequest(400, "Name, email, and message are required.", "missing_field");
	}
	if (name.length > LIMITS.name) {
		return badRequest(400, `Name must be ${LIMITS.name} characters or less.`, "name_too_long");
	}
	if (!isValidEmail(email)) {
		return badRequest(400, "Please provide a valid email address.", "invalid_email");
	}
	if (subject.length > LIMITS.subject) {
		return badRequest(400, `Subject must be ${LIMITS.subject} characters or less.`, "subject_too_long");
	}
	if (message.length < LIMITS.messageMin) {
		return badRequest(400, `Message must be at least ${LIMITS.messageMin} characters.`, "message_too_short");
	}
	if (message.length > LIMITS.messageMax) {
		return badRequest(400, `Message must be ${LIMITS.messageMax} characters or less.`, "message_too_long");
	}

	const captcha = await verifyTurnstile(request, env, fields.captchaToken);
	if (!captcha.ok) return failure("siteverify", captcha);

	if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) {
		return failure("email_send", {
			ok: false,
			outcome: "config_error",
			status: 503,
			error: "The contact form is not configured.",
			code: "email_unconfigured",
		});
	}

	const { text, html } = buildBodies({ name, email, subject, message });

	const sent = await sendEmail(
		{
			to: env.CONTACT_TO_EMAIL || DEFAULT_TO,
			from: env.EMAIL_FROM_CONTACT || DEFAULT_FROM,
			replyTo: email,
			subject: `[jdmusick.band] ${subject} | ${name}`,
			text,
			html,
		},
		env,
	);
	if (!sent.ok) return failure("email_send", sent);

	log(requestId, { op: "email_send", outcome: "sent", status: 201, upstream_status: sent.upstreamStatus });
	return json({ message: SUCCESS_MESSAGE }, 201);
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
	const requestId = crypto.randomUUID();

	if (request.method !== "POST") {
		return json({ error: "Method not allowed." }, 405, { Allow: "POST" });
	}

	try {
		return await handlePost(request, env, requestId);
	} catch (error) {
		log(requestId, {
			op: "request",
			outcome: "internal_error",
			status: 500,
			code: safeCode(errorName(error)),
		});
		return json(
			{ error: "Something went wrong. Please try again in a moment.", code: "internal_error", retryable: true, requestId },
			500,
		);
	}
};
