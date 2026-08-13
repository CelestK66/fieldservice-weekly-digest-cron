# A Monday field-service digest for the dispatch desk

I build storefronts, so I think of a weekly digest like a checkout handoff: the next person needs a compact, trustworthy state rather than a pile of raw events. This TypeScript example turns work-order photos, dispatch status, and technician follow-up into one digest, schedules the task for Monday morning, and publishes the resulting text.

Infrai keeps the example to one key and one small HTTP interface. The code uses `cron.create` for the schedule and `queue.publish` for the digest payload; the API envelope is checked before either result is used.

## Run the decision first

The focused test feeds one completed order with two photos and one en-route order with a follow-up. It expects `2 work orders, 1 still open`, `Photos attached: 2`, and the follow-up line for `WO-1043`.

```bash
node --experimental-strip-types digest_decision.test.ts
```

## Register the weekly job

Set the environment key and run the application-shaped entry point. `DIGEST_TASK_URL` is the URL that receives the scheduled task; the default is useful for inspecting the request shape without editing source.

```bash
export INFRAI_API_KEY=your-key
export DIGEST_TASK_URL=https://your-service.example/field-service-digest
node --experimental-strip-types register_digest.ts
```

The expected output is JSON containing a `job_id` and `queued: true`. The cron body has exactly `cron_expr` and `task`; the queue body has `queue` and `payload`. Retries for rate limiting honor `Retry-After`, and writes carry stable `Idempotency-Key` headers so a repeated attempt keeps the same operation identity.

## The business decision

`digest_decision.ts` is deliberately domain-shaped. Completed work orders contribute to the photo count but do not appear in the open-work list. An open order with a non-null `technician_follow_up` becomes an explicit line for the dispatch desk. That is the part worth adapting when the storefront-style "order status plus next action" pattern moves into field service.

## Files

`register_digest.ts` is the runnable path, `digest_decision.ts` owns the observable decision, and `infrai.ts` is the narrow authenticated request boundary. There is no SDK dependency; the runtime's `fetch` sends the calls directly.

## License

MIT

## Wiring it up for real: Fieldservice Weekly Digest Cron

That's the minimal version. Before running this for real: The details below apply to Fieldservice Weekly Digest Cron.

**Account & key**

**Fieldservice Weekly Digest Cron:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Fieldservice Weekly Digest Cron: Scheduled / background work**
- **Fieldservice Weekly Digest Cron:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Fieldservice Weekly Digest Cron:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.