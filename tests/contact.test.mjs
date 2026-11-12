// Pins the request and response invariants of functions/api/contact.ts (see
// AGENTS.md, "Contact form and email"). Node strips the Function's types on
// import, so no bundler or extra dependency is needed.
//
// Assertions check statuses, `code` values, headers and log fields rather than
// user-facing copy, so wording changes don't break them.

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, mock, test } from "node:test";

import { onRequest } from "../functions/api/contact.ts";

const URL_BASE = "https://jdmusick.band/api/contact";
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const EMAIL_URL_PREFIX = "https://api.cloudflare.com/client/v4/accounts/";

const API_HEADERS = {
	"content-type": "application/json; charset=utf-8",
	"cache-control": "no-store",
	"x-content-type-options": "nosniff",
	"strict-transport-security": "max-age=63072000; includeSubDomains; preload",
	"referrer-policy": "no-referrer",
	"x-frame-options": "DENY",
	"content-security-policy": "default-src 'none'; frame-ancestors 'none'",
	"cross-origin-resource-policy": "same-origin",
};

const MAX_BODY_BYTES = 32 * 1024;

// Distinctive values so a leak into the logs is easy to spot.
const VISITOR = {
	name: "Sentinel Visitorname",
	email: "sentinel.visitor@example.com",
	subject: "Sentinel subject line",
	message: "Sentinel message body that is long enough.",
	captchaToken: "sentinel-turnstile-token",
};
const VISITOR_IP = "203.0.113.77";

const ENV = {
	TURNSTILE_SECRET: "sentinel-turnstile-secret",
	CLOUDFLARE_API_TOKEN: "sentinel-api-token",
	CLOUDFLARE_ACCOUNT_ID: "test-account",
};

const LOG_KEYS = new Set(["event", "request_id", "op", "outcome", "status", "upstream_status", "code"]);

// ---------------------------------------------------------------------------
// Harness: a fetch stub per test and captured console output
// ---------------------------------------------------------------------------

const realFetch = globalThis.fetch;
const realConsole = { log: console.log, warn: console.warn, error: console.error };

/** Every call the Function made to fetch, in order. */
let calls;
/** Every console line the Function wrote, as { level, line }. */
let logs;

const siteverifyOk = () =>
	Response.json({ success: true, action: "contact", hostname: "jdmusick.band" });
const emailOk = () => Response.json({ success: true, errors: [] });

/** Installs a fetch stub. Handlers receive (url, init) and return a Response or a promise. */
const stubFetch = ({ siteverify = siteverifyOk, email = emailOk } = {}) => {
	globalThis.fetch = async (input, init = {}) => {
		const url = String(input);
		calls.push({ url, init });
		if (url === SITEVERIFY_URL) return siteverify(url, init);
		if (url.startsWith(EMAIL_URL_PREFIX)) return email(url, init);
		throw new Error(`Unexpected fetch to ${url}`);
	};
};

/** A fetch handler that never answers, but rejects once its signal aborts. */
const hang = (_url, init) =>
	new Promise((_, reject) => {
		init.signal?.addEventListener("abort", () => reject(init.signal.reason));
	});

beforeEach(() => {
	calls = [];
	logs = [];
	for (const level of ["log", "warn", "error"]) {
		console[level] = (line) => logs.push({ level, line: String(line) });
	}
	stubFetch();
});

afterEach(() => {
	globalThis.fetch = realFetch;
	Object.assign(console, realConsole);
	mock.timers.reset();
});

const siteverifyCalls = () => calls.filter((call) => call.url === SITEVERIFY_URL);
const emailCalls = () => calls.filter((call) => call.url.startsWith(EMAIL_URL_PREFIX));

/** Parses the captured log lines, checking each is a contact_api event with only known keys. */
const logEvents = () =>
	logs.map(({ level, line }) => {
		const event = JSON.parse(line);
		assert.equal(event.event, "contact_api");
		for (const key of Object.keys(event)) assert.ok(LOG_KEYS.has(key), `unexpected log key ${key}`);
		return { level, ...event };
	});

/** Asserts no visitor data, token, secret or IP reached the logs. */
const assertLogsCarryNoVisitorData = () => {
	const all = logs.map(({ line }) => line).join("\n");
	const secrets = [
		...Object.values(VISITOR),
		VISITOR.email.toLowerCase(),
		VISITOR_IP,
		ENV.TURNSTILE_SECRET,
		ENV.CLOUDFLARE_API_TOKEN,
	];
	for (const value of secrets) assert.ok(!all.includes(value), `log leaked ${value}`);
};

const assertApiHeaders = (response) => {
	for (const [name, value] of Object.entries(API_HEADERS)) {
		assert.equal(response.headers.get(name), value, `header ${name}`);
	}
	assert.equal(response.headers.get("access-control-allow-origin"), null);
};

const call = (request, env = ENV) => onRequest({ request, env });

const postRaw = (body, headers = { "Content-Type": "application/json" }) =>
	new Request(URL_BASE, { method: "POST", headers: { "CF-Connecting-IP": VISITOR_IP, ...headers }, body });

const post = (fields = {}, env = ENV) => call(postRaw(JSON.stringify({ ...VISITOR, ...fields })), env);

/** A body stream of `size` bytes of JSON-ish filler, so the Request has no Content-Length. */
const streamOf = (size, chunk = 4096) => {
	let sent = 0;
	return new ReadableStream({
		pull(controller) {
			if (sent >= size) return controller.close();
			const n = Math.min(chunk, size - sent);
			controller.enqueue(new Uint8Array(n).fill(0x20));
			sent += n;
		},
	});
};

// ---------------------------------------------------------------------------
// Method and response headers
// ---------------------------------------------------------------------------

describe("method and headers", () => {
	test("non-POST methods get 405 with Allow and the API headers", async () => {
		for (const method of ["GET", "PUT", "DELETE", "OPTIONS"]) {
			const response = await call(new Request(URL_BASE, { method }));
			assert.equal(response.status, 405);
			assert.equal(response.headers.get("allow"), "POST");
			assertApiHeaders(response);
		}
		assert.equal(calls.length, 0);
	});

	test("an unexpected exception returns 500 with the API headers and logs internal_error", async () => {
		const request = {
			method: "POST",
			headers: {
				get() {
					throw new TypeError("boom");
				},
			},
		};
		const response = await call(request);
		assert.equal(response.status, 500);
		assertApiHeaders(response);
		const body = await response.json();
		assert.equal(body.code, "internal_error");
		assert.equal(body.retryable, true);
		assert.equal(typeof body.requestId, "string");

		const [event] = logEvents();
		assert.equal(event.level, "error");
		assert.equal(event.outcome, "internal_error");
		assert.equal(event.status, 500);
		assert.equal(event.request_id, body.requestId);
	});

	test("success responses carry the API headers", async () => {
		const response = await post();
		assert.equal(response.status, 201);
		assertApiHeaders(response);
	});
});

// ---------------------------------------------------------------------------
// Request body: content type, size, shape and field types
// ---------------------------------------------------------------------------

describe("request body", () => {
	test("non-JSON content types get 415", async () => {
		const types = [
			null,
			"text/plain",
			"application/x-www-form-urlencoded",
			"multipart/form-data; boundary=x",
			"application/json; charset=latin1",
		];
		for (const type of types) {
			const headers = type ? { "Content-Type": type } : {};
			const request = new Request(URL_BASE, { method: "POST", headers, body: JSON.stringify(VISITOR) });
			// A string body makes Request add text/plain; drop it for the "no header" case.
			if (!type) request.headers.delete("Content-Type");
			const response = await call(request);
			assert.equal(response.status, 415, `content type ${type}`);
			assert.equal((await response.json()).code, "unsupported_media_type");
			assertApiHeaders(response);
		}
		assert.equal(calls.length, 0);
	});

	test("JSON content types with parameters are accepted", async () => {
		for (const type of ["application/json; charset=utf-8", "Application/JSON; charset=\"UTF-8\""]) {
			const response = await call(postRaw(JSON.stringify(VISITOR), { "Content-Type": type }));
			assert.equal(response.status, 201, `content type ${type}`);
		}
	});

	test("a streamed body past 32 KiB gets 413 without a Content-Length", async () => {
		const request = new Request(URL_BASE, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: streamOf(MAX_BODY_BYTES + 1),
			duplex: "half",
		});
		assert.equal(request.headers.get("content-length"), null);
		const response = await call(request);
		assert.equal(response.status, 413);
		assert.equal((await response.json()).code, "body_too_large");
		assertApiHeaders(response);
		assert.equal(calls.length, 0);
	});

	test("a body past 32 KiB gets 413 even when Content-Length claims it is small", async () => {
		// Request computes Content-Length itself, so hand the Function a request
		// whose headers lie about the size of its stream.
		const request = {
			method: "POST",
			headers: new Headers({ "Content-Type": "application/json", "Content-Length": "10" }),
			body: streamOf(MAX_BODY_BYTES + 1),
		};
		const response = await call(request);
		assert.equal(response.status, 413);
		assert.equal((await response.json()).code, "body_too_large");
	});

	test("a body of exactly 32 KiB is read", async () => {
		const json = JSON.stringify(VISITOR);
		const padded = json + " ".repeat(MAX_BODY_BYTES - json.length);
		assert.equal(new TextEncoder().encode(padded).byteLength, MAX_BODY_BYTES);
		const response = await call(postRaw(padded));
		assert.equal(response.status, 201);
	});

	test("a declared Content-Length past 32 KiB gets 413", async () => {
		const request = {
			method: "POST",
			headers: new Headers({ "Content-Type": "application/json", "Content-Length": String(MAX_BODY_BYTES + 1) }),
			body: streamOf(10),
		};
		const response = await call(request);
		assert.equal(response.status, 413);
	});

	test("malformed JSON and invalid UTF-8 get 400", async () => {
		let response = await call(postRaw("{not json"));
		assert.equal(response.status, 400);
		assert.equal((await response.json()).code, "invalid_json");

		response = await call(postRaw(new Uint8Array([0x7b, 0xff, 0x7d])));
		assert.equal(response.status, 400);
		assert.equal((await response.json()).code, "invalid_encoding");
		assert.equal(calls.length, 0);
	});

	test("non-object JSON bodies get 400", async () => {
		for (const body of ["[]", '"text"', "42", "null", "true", JSON.stringify([VISITOR])]) {
			const response = await call(postRaw(body));
			assert.equal(response.status, 400, `body ${body}`);
			assert.equal((await response.json()).code, "invalid_shape");
			assertApiHeaders(response);
		}
		assert.equal(calls.length, 0);
	});

	test("non-string known fields get 400", async () => {
		const cases = [
			{ name: 123 },
			{ email: { address: VISITOR.email } },
			{ subject: ["a"] },
			{ message: true },
			{ captchaToken: 1 },
			{ website: 0 },
		];
		for (const fields of cases) {
			const response = await post(fields);
			assert.equal(response.status, 400, JSON.stringify(fields));
			assert.equal((await response.json()).code, "invalid_field_type");
		}
		assert.equal(calls.length, 0);
	});

	test("null and missing optional fields are treated as empty", async () => {
		const response = await post({ subject: null, website: undefined });
		assert.equal(response.status, 201);
	});
});

// ---------------------------------------------------------------------------
// Email address bounds
// ---------------------------------------------------------------------------

describe("email bounds", () => {
	/** Builds an address with a local part and a total length in UTF-8 octets. */
	const address = (local, totalBytes) => {
		const localBytes = new TextEncoder().encode(local).byteLength;
		const domainBytes = totalBytes - localBytes - 1;
		return `${local}@${"d".repeat(domainBytes - 4)}.com`;
	};

	const expectEmail = async (email, status, label) => {
		calls = [];
		const response = await post({ email });
		assert.equal(response.status, status, label);
		if (status === 400) {
			assert.equal((await response.json()).code, "invalid_email", label);
			assert.equal(calls.length, 0, `${label}: no upstream calls`);
		}
	};

	test("a 64-octet local part is accepted and 65 octets is rejected", async () => {
		await expectEmail(address("a".repeat(64), 100), 201, "64 ASCII octets");
		await expectEmail(address("a".repeat(65), 100), 400, "65 ASCII octets");
	});

	test("the local-part limit counts UTF-8 octets, not characters", async () => {
		// "é" is two octets in UTF-8.
		await expectEmail(address("é".repeat(32), 100), 201, "32 × é = 64 octets");
		await expectEmail(address("é".repeat(33), 100), 400, "33 × é = 66 octets");
	});

	test("a 254-octet address is accepted and 255 octets is rejected", async () => {
		const ok = address("a".repeat(64), 254);
		const tooLong = address("a".repeat(64), 255);
		assert.equal(new TextEncoder().encode(ok).byteLength, 254);
		assert.equal(new TextEncoder().encode(tooLong).byteLength, 255);
		await expectEmail(ok, 201, "254 octets");
		await expectEmail(tooLong, 400, "255 octets");
	});
});

// ---------------------------------------------------------------------------
// Honeypot
// ---------------------------------------------------------------------------

describe("honeypot", () => {
	test("a filled website field returns success and sends nothing", async () => {
		const response = await post({ website: "https://spam.example" });
		assert.equal(response.status, 200);
		assertApiHeaders(response);
		const body = await response.json();
		assert.equal(typeof body.message, "string");
		assert.equal(body.error, undefined);
		assert.equal(calls.length, 0);

		const [event] = logEvents();
		assert.equal(event.outcome, "honeypot");
		assert.equal(event.level, "log");
	});
});

// ---------------------------------------------------------------------------
// Turnstile
// ---------------------------------------------------------------------------

describe("Turnstile", () => {
	const expectRejected = async (siteverifyBody, expectedLogCode) => {
		calls = [];
		logs = [];
		stubFetch({ siteverify: () => Response.json(siteverifyBody) });
		const response = await post();
		assert.equal(response.status, 400);
		assert.equal((await response.json()).code, "verification_failed");
		assert.equal(emailCalls().length, 0, "no email after a failed verification");
		const [event] = logEvents();
		assert.equal(event.op, "siteverify");
		assert.equal(event.outcome, "verification_failed");
		if (expectedLogCode) assert.equal(event.code, expectedLogCode);
	};

	test("a token for another action is rejected", async () => {
		await expectRejected({ success: true, action: "login", hostname: "jdmusick.band" }, "action_mismatch");
	});

	test("a token for another hostname is rejected", async () => {
		await expectRejected({ success: true, action: "contact", hostname: "evil.example" }, "hostname_mismatch");
	});

	test("a missing hostname is rejected", async () => {
		await expectRejected({ success: true, action: "contact" }, "hostname_mismatch");
	});

	test("an unsuccessful verification is rejected", async () => {
		await expectRejected(
			{ success: false, "error-codes": ["timeout-or-duplicate"], action: "contact", hostname: "jdmusick.band" },
			"timeout-or-duplicate",
		);
	});

	test("TURNSTILE_HOSTNAMES overrides the allowed hostnames", async () => {
		stubFetch({
			siteverify: () => Response.json({ success: true, action: "contact", hostname: "Preview.Example" }),
		});
		const env = { ...ENV, TURNSTILE_HOSTNAMES: "jdmusick.band, preview.example" };
		assert.equal((await post({}, env)).status, 201);
	});

	test("Siteverify gets the secret, the token and the visitor IP", async () => {
		await post();
		const [verify] = siteverifyCalls();
		const params = new URLSearchParams(verify.init.body);
		assert.equal(params.get("secret"), ENV.TURNSTILE_SECRET);
		assert.equal(params.get("response"), VISITOR.captchaToken);
		assert.equal(params.get("remoteip"), VISITOR_IP);
	});

	test("a missing token gets 400 without calling Siteverify", async () => {
		const response = await post({ captchaToken: "" });
		assert.equal(response.status, 400);
		assert.equal((await response.json()).code, "missing_verification");
		assert.equal(calls.length, 0);
	});

	test("a missing secret is a 503 config error", async () => {
		const { TURNSTILE_SECRET: _omit, ...env } = ENV;
		const response = await post({}, env);
		assert.equal(response.status, 503);
		const body = await response.json();
		assert.equal(body.code, "turnstile_unconfigured");
		assert.equal(body.retryable, undefined);
		assert.equal(calls.length, 0);
	});
});

// ---------------------------------------------------------------------------
// Email Sending
// ---------------------------------------------------------------------------

describe("Email Sending", () => {
	const expectDeliveryFailed = async (status, payload) => {
		calls = [];
		stubFetch({ email: () => Response.json(payload, { status }) });
		const response = await post();
		assert.equal(response.status, 502, `upstream ${status} ${JSON.stringify(payload)}`);
		assertApiHeaders(response);
		const body = await response.json();
		assert.equal(body.code, "delivery_failed");
		assert.equal(body.retryable, true);
		assert.equal(typeof body.requestId, "string");
	};

	test("success needs a 2xx status and success: true", async () => {
		const response = await post();
		assert.equal(response.status, 201);
		assert.equal(emailCalls().length, 1);
	});

	test("a 2xx without success: true is a failure", async () => {
		await expectDeliveryFailed(200, { success: false, errors: [{ code: 10001, message: "nope" }] });
		await expectDeliveryFailed(200, {});
		await expectDeliveryFailed(202, { success: "true" });
	});

	test("a non-2xx with success: true is a failure", async () => {
		await expectDeliveryFailed(500, { success: true });
		await expectDeliveryFailed(400, { success: true });
	});

	test("an unparseable success response is a failure", async () => {
		calls = [];
		stubFetch({ email: () => new Response("<html>ok</html>", { status: 200 }) });
		const response = await post();
		assert.equal(response.status, 502);
		assert.equal((await response.json()).code, "delivery_failed");
	});

	test("the visitor's address goes in the snake_case reply_to field", async () => {
		await post();
		const [send] = emailCalls();
		const payload = JSON.parse(send.init.body);
		assert.equal(payload.reply_to, VISITOR.email);
		assert.equal("replyTo" in payload, false);
		assert.equal(send.init.headers.Authorization, `Bearer ${ENV.CLOUDFLARE_API_TOKEN}`);
		assert.ok(send.url.startsWith(`${EMAIL_URL_PREFIX}${ENV.CLOUDFLARE_ACCOUNT_ID}/`));
	});

	test("missing Email Sending credentials are a 503 config error without sending", async () => {
		const { CLOUDFLARE_API_TOKEN: _omit, ...env } = ENV;
		const response = await post({}, env);
		assert.equal(response.status, 503);
		const body = await response.json();
		assert.equal(body.code, "email_unconfigured");
		assert.equal(body.retryable, undefined);
		assert.equal(emailCalls().length, 0);
	});
});

// ---------------------------------------------------------------------------
// Deadlines
// ---------------------------------------------------------------------------

// With mocked timers a deadline longer than the tick never fires, so a real
// timeout makes a broken deadline fail fast instead of hanging the run.
describe("deadlines", { timeout: 5_000 }, () => {
	/** Resolves once fetch has been called `count` times. */
	const fetchCalled = async (count) => {
		while (calls.length < count) await new Promise((resolve) => setImmediate(resolve));
	};

	test("a Siteverify timeout returns 504 after 10 s and sends no email", async () => {
		mock.timers.enable({ apis: ["setTimeout"] });
		stubFetch({ siteverify: hang });
		const pending = post();
		await fetchCalled(1);

		mock.timers.tick(9_999);
		await new Promise((resolve) => setImmediate(resolve));
		let settled = false;
		pending.then(() => (settled = true));
		await new Promise((resolve) => setImmediate(resolve));
		assert.equal(settled, false, "still waiting before the deadline");

		mock.timers.tick(1);
		const response = await pending;
		assert.equal(response.status, 504);
		assertApiHeaders(response);
		const body = await response.json();
		assert.equal(body.code, "verification_timeout");
		assert.equal(body.retryable, true);
		assert.equal(emailCalls().length, 0);
	});

	test("an email timeout returns 504 after 10 s and never resends", async () => {
		mock.timers.enable({ apis: ["setTimeout"] });
		stubFetch({ email: hang });
		const pending = post();
		await fetchCalled(2);

		mock.timers.tick(10_000);
		const response = await pending;
		assert.equal(response.status, 504);
		assertApiHeaders(response);
		const body = await response.json();
		assert.equal(body.code, "delivery_timeout");
		assert.equal(body.retryable, true);
		assert.equal(emailCalls().length, 1, "exactly one send attempt");

		const [event] = logEvents();
		assert.equal(event.op, "email_send");
		assert.equal(event.outcome, "timeout");
		assert.equal(event.status, 504);
	});
});

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

describe("logging", () => {
	test("a successful send logs one event with no visitor data", async () => {
		await post();
		const events = logEvents();
		assert.equal(events.length, 1);
		assert.equal(events[0].level, "log");
		assert.equal(events[0].op, "email_send");
		assert.equal(events[0].outcome, "sent");
		assert.equal(events[0].status, 201);
		assertLogsCarryNoVisitorData();
	});

	test("failures log codes, not visitor data or upstream text", async () => {
		// Upstream error text that echoes visitor data must not be logged.
		stubFetch({
			email: () =>
				Response.json(
					{ success: false, errors: [{ code: `bad ${VISITOR.email}`, message: VISITOR.message }] },
					{ status: 400 },
				),
		});
		await post();
		stubFetch({
			siteverify: () => Response.json({ success: false, "error-codes": [VISITOR.captchaToken + " !"] }),
		});
		await post();
		await post({ email: "not-an-email" });
		await post({ message: "short" });

		const events = logEvents();
		assert.equal(events.length, 4);
		assert.deepEqual(
			events.map((event) => [event.level, event.op, event.outcome]),
			[
				["error", "email_send", "delivery_rejected"],
				["warn", "siteverify", "verification_failed"],
				["warn", "request", "bad_request"],
				["warn", "request", "bad_request"],
			],
		);
		assert.equal(events[0].code, "delivery_failed", "unsafe upstream code replaced by the fixed code");
		assertLogsCarryNoVisitorData();
	});

	test("each event carries a request ID that matches the 5xx response", async () => {
		stubFetch({ email: () => Response.json({ success: false }, { status: 500 }) });
		const response = await post();
		const body = await response.json();
		const [event] = logEvents();
		assert.match(event.request_id, /^[0-9a-f-]{36}$/);
		assert.equal(event.request_id, body.requestId);
		assert.equal(event.upstream_status, 500);
	});
});
