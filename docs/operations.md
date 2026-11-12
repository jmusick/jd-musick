# Contact endpoint operations

What you need to run `POST /api/contact`
([`functions/api/contact.ts`](../functions/api/contact.ts)) that the code
can't show you: how to read its logs, and the Cloudflare dashboard settings it
relies on. The request limits, deadlines and response headers are enforced and
commented in the Function itself; [AGENTS.md](../AGENTS.md) lists the ones that
must not change.

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
`console.warn`, and 5xx events use `console.error`. 405 responses are not
logged. A 5xx response body includes a `requestId` that matches the event's
`request_id`, so a visitor's error report can be traced to its log line.

Pages Functions logs are real-time only ("Logs are not stored"): watch them
with `npx wrangler pages deployment tail` or the dashboard's Functions log
stream. They are hidden above 100 requests/s. Nothing alerts on delivery
failures yet; see [issue #33](https://github.com/jmusick/jd-musick/issues/33).

## Cloudflare settings

Last checked October 12, 2026, through read-only API requests and the
dashboard.

- **Plan and deploys:** zone `jdmusick.band` is on the **Free** plan. The Pages
  project serving `jdmusick.band` and `www.jdmusick.band` deploys `main` to
  production from Git. `CLOUDFLARE_API_TOKEN` and `TURNSTILE_SECRET` are
  encrypted secrets; the other variables are plaintext.
- **Email Sending:** domain `jdmusick.band` is enabled, with return path
  `cf-bounce.jdmusick.band`. The quota is 200 messages per day, resetting
  daily, with no separate budget setting. **Drop suppressed recipients** is off
  (the default), so a send to a suppressed address fails instead of being
  silently dropped.
- **Email preview** (Email Sending → Settings) is **on**: Cloudflare keeps a
  readable copy of each sent message, including the visitor's name, email,
  subject and message, in the Activity log for about 7 days. The Privacy
  Policy discloses this. If you turn it off, remove that sentence from
  `src/pages/privacy-policy.astro`.

### Rate-limiting rule

Rule "Contact form" (Security → Security rules → Rate limiting rules) is
deployed and active:

| Setting | Free plan (current) | If the plan is upgraded to Pro |
| --- | --- | --- |
| Expression | `(http.request.uri.path eq "/api/contact")` | same |
| Characteristics | IP | IP |
| Requests / period | 3 per 10 s | 5 per 1 min |
| Action | Block | Block |
| Duration | 10 s | 10 min |

The Free plan allows one rule, a path match, IP counting, and a 10 s period
and timeout. That stops bursts but not slow, steady abuse; Turnstile remains
the per-message control. Cloudflare returns its default 429 page, and the
contact page shows a generic "Too many attempts" message. If a plan upgrade
allows a custom Block response, return 429 with `application/json` and
`{"error":"Too many attempts. Please wait a minute and try again.","code":"rate_limited"}`.

To test the rule without sending email, make four `GET` requests to
`/api/contact` within 10 s. The first three should return 405 and the fourth
429.
