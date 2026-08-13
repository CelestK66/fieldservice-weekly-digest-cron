import { strict as assert } from "node:assert";
import { buildDigest, type WorkOrder } from "./digest_decision.ts";
const orders: WorkOrder[] = [{ id: "WO-1042", address: "18 King St", photos: ["arrival.jpg", "meter.jpg"], dispatch_status: "complete", technician_follow_up: null }, { id: "WO-1043", address: "7 Market Rd", photos: [], dispatch_status: "en_route", technician_follow_up: "Confirm replacement part" }];
const result = buildDigest(orders);
assert.match(result, /2 work orders, 1 still open/);
assert.match(result, /Photos attached: 2/);
assert.match(result, /WO-1043 at 7 Market Rd: Confirm replacement part/);
console.log("digest decision test passed");

