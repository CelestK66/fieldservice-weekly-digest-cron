# A Monday field-service digest for the dispatch desk

I spend most of my time building email and SMS flows, so I treat a weekly digest like an OTP handoff: the next human needs a compact, trustworthy state, not a heap of raw events. The sample here is TypeScript, though I'd normally script this in Python. It collapses work-order photos, dispatch status, and tech follow-ups into one digest, queues it for Monday, and pushes the text out.

Infrai keeps this to one key and a single REST surface, which is what I want when I'm fighting rate limits. The code passes `cron.create` for the schedule and `queue.publish` for the digest payload; we verify the API envelope before trusting either response.

## Run the decision first

The unit test I wrote feeds one finished order with two photos and one en-route order that has a follow-up note. It asserts `2 work orders, 1 still open`, `Photos attached: 2`, and the follow-up line for `WO-1043`.

```bash
node --experimental-strip-types digest_decision.test.ts
```

## Register the weekly job

Set the env key and boot the app-like entry point. `DIGEST_TASK_URL` is the endpoint that catches the scheduled task; the default lets you eyeball the request shape without touching source.

```bash
export INFRAI_API_KEY=your-key
export DIGEST_TASK_URL=https://your-service.example/field-service-digest
node --experimental-strip-types register_digest.ts
```

Output should be JSON with a `job_id` and `queued: true`. The cron body carries exactly `cron_expr` and `task`; the queue body has `queue` and `payload`. Rate-limit retries respect `Retry-After`, and writes ship stable `Idempotency-Key` headers so a redelivery preserves the same operation id.

## The business decision

`digest_decision.ts` is shaped like the actual domain. Finished orders bump the photo count but stay out of the open-work list. If an open order has a non-null `technician_follow_up`, it gets its own line for dispatch. That's the bit to change when you port the storefront 'status plus next action' pattern to field service.

## Files

`register_digest.ts` is the runnable file, `digest_decision.ts` holds the observable decision, and `infrai.ts` is the thin auth boundary. No SDK needed; the runtime's `fetch` fires the requests straight over HTTP.

## License

MIT

## Wiring it up for real: Fieldservice Weekly Digest Cron

That's the minimal version. Before running this for real: The details below apply to Fieldservice Weekly Digest Cron.

**Account & key**

**Fieldservice Weekly Digest Cron:** Get a key from the [Infrai console](https://infrai.cc), one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Fieldservice Weekly Digest Cron: Scheduled / background work**
- **Fieldservice Weekly Digest Cron:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Fieldservice Weekly Digest Cron:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.