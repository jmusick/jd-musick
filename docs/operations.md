# Contact endpoint operations

How `POST /api/contact` ([`functions/api/contact.ts`](../functions/api/contact.ts))
limits requests, reports failures and logs events. It also records which
Cloudflare settings have been checked and which the owner still has to set up.

## Request limits (enforced in code)

| Check | Limit | Response |
| --- | --- | --- |
| Method | `POST` only | 405 with `Allow: POST` |
| `Content-Type` | `application/json`, optionally `charset=utf-8` | 415 |
| Body size | 32 KiB (32,768 bytes) actually read | 413 |
| Body encoding | Valid UTF-8 | 400 `invalid_encoding` |
| Body syntax | Valid JSON | 400 `invalid_json` |
| Body shape | A JSON object (not `null`, an array or a primitive) | 400 `invalid_shape` |
| Field types | `name`, `email`, `subject`, `message`, `captchaToken`, `website` must be strings, or absent/`null` | 400 `invalid_field_type` |
| Name | 1–100 UTF-16 code units, the same as the form's `maxlength` | 400 |
| Email | Simple address pattern, at most 254 UTF-8 octets in total and 64 in the local part (RFC 5321). No spaces, `<>()[]\,;:"` | 400 `invalid_email` |
| Subject | 0–150 code units | 400 |
| Message | 10–4,000 code units | 400 |
| Turnstile token | 1–2,048 characters | 400 |

The body cap is read with a byte counter as the stream arrives. The Function
stops reading and returns 413 as soon as the count passes 32 KiB, whatever
`Content-Length` says. A declared `Content-Length` above the cap is rejected
without reading. The cap was sized from the field limits:

- Every field at its limit, in ASCII: about 7 KB.
- Every name, subject and message character as a 3-byte UTF-8 character: about 15 KB.
- Worst-case JSON escaping, where every message character becomes a 6-byte `\u00XX` escape: about 27 KB.

## Deadlines and retries

| Upstream call | Deadline | On timeout |
| --- | --- | --- |
| Turnstile Siteverify | 10 s | 504 `verification_timeout`, `retryable: true` |
| Email Sending REST API | 10 s | 504 `delivery_timeout`, `retryable: true` |
| Browser `fetch` in `contact.astro` | 25 s | Button re-enabled, retryable error announced through the `aria-live` status |

Each deadline covers the whole upstream exchange, including reading the
response body. An email timeout leaves delivery **ambiguous**: Cloudflare may
have accepted the message before the deadline. The Function never resends on
its own. The visitor is told the message "may or may not have been sent" and
asked to wait before trying again. The form keeps their text, and Turnstile is
reset so a retry gets a fresh single-use token.

Upstream and server failures (5xx) include a `requestId` that matches the
`request_id` in the log event.

## Response headers

Every Function response, including 405, 4xx, 5xx, `HEAD` and `OPTIONS`, sets:

```
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Referrer-Policy: no-referrer
X-Frame-Options: DENY
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
Cross-Origin-Resource-Policy: same-origin
```

There are no CORS headers. The form posts same-origin, and cross-origin
preflights get 405. `public/_headers` does not apply to Function responses.

## Log events

Each request that reaches the handler writes at most one JSON line:

```json
{"event":"contact_api","request_id":"<uuid>","op":"email_send","outcome":"delivery_rejected","status":502,"upstream_status":400,"code":"10001"}
```

| Field | Values |
| --- | --- |
| `op` | `request`, `siteverify`, `email_send` |
| `outcome` | `sent`, `honeypot`, `bad_request`, `verification_failed`, `timeout`, `upstream_unavailable`, `config_error`, `delivery_rejected`, `internal_error` |
| `status` | HTTP status returned to the visitor |
| `upstream_status` | HTTP status from Siteverify or Email Sending, if one was received |
| `code` | Fixed reason (for example `invalid_email`), a Turnstile error code, a numeric Cloudflare API error code, or a JavaScript error name. Anything that doesn't match `^[a-z0-9_.-]{1,40}$` is dropped |

Successful sends and honeypot hits use `console.log`, other 4xx events use
`console.warn`, and 5xx events use `console.error`. Names, email addresses,
subjects, messages, Turnstile tokens, IP addresses, secrets and upstream
error text are never logged. 405 responses are not logged.

## Cloudflare configuration status

Checked on October 12, 2026 with read-only API `GET` requests using the
local Wrangler OAuth login (account identifiers redacted). No Cloudflare
configuration was changed.

### Verified

- Zone `jdmusick.band` is active on the **Free** plan.
- The Pages project that serves `jdmusick.band` and `www.jdmusick.band` is
  connected to Git and deploys `main` to production. In production,
  `CLOUDFLARE_API_TOKEN` and `TURNSTILE_SECRET` are encrypted secrets; the
  other variables are plaintext.
- The project configuration returned by the API has no observability or
  Logpush setting. Cloudflare documents Pages Functions logs as real-time
  only ("Logs are not stored"): they appear in `wrangler pages deployment tail`
  or the dashboard's Functions log stream while someone is watching. They are
  hidden above 100 requests/s.
- The Email Sending domain `jdmusick.band` is enabled, with return path
  `cf-bounce.jdmusick.band`.
- Thirteen `GET`/`HEAD` requests to `https://jdmusick.band/api/contact` within
  a few seconds all returned 405, and none returned 429. On the Free plan a
  rate-limiting rule can match only on path, not method. So no rule on this
  path with a threshold of 12 or fewer requests per 10 s exists. No `POST`
  was sent.

### Could not verify

The OAuth token has `zone (read)` but not WAF, Logs or Notifications read
access, so these returned HTTP 403:

- WAF custom rules and rate-limiting rules (`http_request_firewall_custom`,
  `http_ratelimit` rulesets)
- Logpush jobs, account and zone
- Notification (alert) policies
- Zone security level and bot settings
- Email Sending daily quota and any sending budget

### Checked by the owner in the dashboard (October 12, 2026)

- **Rate-limiting rule** "Contact form" is deployed and active with the Free
  plan values in item 1 below. Five quick `GET` requests to `/api/contact`
  returned 405, 405, 405, 429, 429; the homepage still returned 200.
- **Email Sending quota**: 200 messages per day, resetting daily. There is no
  separate spending or budget setting. Sending reputation was Healthy
  (100% delivery, 0% bounce, spam complaint and spam rejection rates).
- **Email preview** (Email Sending → Settings) is **on**: Cloudflare keeps a
  readable preview of each sent message, including the visitor's name,
  email, subject and message, in the Activity log for about 7 days. The
  Privacy Policy discloses this. If you turn it off, remove that sentence
  from `src/pages/privacy-policy.astro`.
- **Drop suppressed recipients** is off (the default): a send to a suppressed
  address fails instead of being silently dropped.

### To be configured by the owner

Item 1 and item 2 are done (see above). Item 3 is still open.

1. **Rate-limiting rule** (Security → Security rules → Rate limiting rules):

   | Setting | Free plan (fixed values) | If the plan is upgraded to Pro |
   | --- | --- | --- |
   | Expression | `(http.request.uri.path eq "/api/contact")` | same |
   | Characteristics | IP | IP |
   | Requests / period | 3 per 10 s | 5 per 1 min |
   | Action | Block | Block |
   | Duration | 10 s | 10 min |

   The Free plan allows only one rule, a path match, IP counting and a 10 s
   period and timeout. That stops bursts but not slow, steady abuse;
   Turnstile remains the per-message control. If the plan allows a custom
   response for the Block action, return 429 with `application/json` and
   `{"error":"Too many attempts. Please wait a minute and try again.","code":"rate_limited"}`.
   Without one, Cloudflare returns its default 429 page, and the contact page
   shows a generic "Too many attempts" message.

   To confirm the rule without sending email, make four `GET` requests to
   `/api/contact` within 10 s. The first three should return 405 and the
   fourth 429.
2. **Sending budget**: 200 messages per day (recorded above).
3. **Delivery-failure alert**: Pages Functions logs are not stored, so there
   is nothing to alert on yet. Options, in order of effort:
   - After each deploy, and about monthly, send a real test message through
     the live form and confirm it arrives.
   - Enable persistent logs (for example Logpush for Workers trace events, if
     the plan supports it) and alert on `outcome` values `delivery_rejected`,
     `timeout`, `upstream_unavailable` and `config_error`. This adds log
     retention, so update the Privacy Policy first.
   - Use any Email Sending delivery or bounce notifications Cloudflare offers
     for the account.
