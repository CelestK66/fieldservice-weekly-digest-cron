import { infrai } from "./infrai.ts";
import { buildDigest, type WorkOrder } from "./digest_decision.ts";
const orders: WorkOrder[] = [{ id: "WO-1042", address: "18 King St", photos: ["arrival.jpg"], dispatch_status: "complete", technician_follow_up: null }, { id: "WO-1043", address: "7 Market Rd", photos: ["panel.jpg"], dispatch_status: "en_route", technician_follow_up: "Confirm replacement part" }];
const task = process.env.DIGEST_TASK_URL ?? "https://example.com/field-service-digest";
const job = await infrai.cron.create({ cron_expr: "0 8 * * 1", task });
await infrai.queue.publish(buildDigest(orders));
console.log(JSON.stringify({ job_id: job.job_id, queued: true }));

