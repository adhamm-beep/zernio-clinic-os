import assert from "node:assert/strict";
import test from "node:test";

import { permissionsForPath } from "../../lib/access/permission-routes.ts";
import { isBearerRoute, isPublicRoute, isServiceRoute } from "../../lib/security/route-policy.ts";
import { requiresMfa } from "../../lib/security/mfa-policy.ts";

test("scheduled reports bypass session middleware only on exact secret-protected paths", () => {
  assert.equal(isServiceRoute("/api/admin/daily-reports/summary"), true);
  assert.equal(isServiceRoute("/api/admin/daily-reports/exceptions"), true);
  assert.equal(isServiceRoute("/api/admin/daily-reports/summary/extra"), false);
  assert.equal(isServiceRoute("/api/admin/users/invite"), false);
});

test("sensitive employee APIs are not public", () => {
  assert.equal(isPublicRoute("/api/reports/daily"), false);
  assert.equal(isPublicRoute("/api/admin/users/invite"), false);
  assert.equal(isPublicRoute("/api/ai/customer-summary"), false);
  assert.equal(isPublicRoute("/api/payments/moyasar/create"), false);
});

test("patient payment creation uses an exact bearer-authenticated route", () => {
  assert.equal(isBearerRoute("/api/payments/moyasar/create"), true);
  assert.equal(isBearerRoute("/api/payments/moyasar/create/extra"), false);
  assert.equal(isBearerRoute("/api/payments/moyasar/callback"), false);
});

test("sensitive employee APIs have permission gates", () => {
  assert.deepEqual(permissionsForPath("/api/reports/daily"), ["reports.view", "reports.export"]);
  assert.deepEqual(permissionsForPath("/api/admin/users/invite"), ["users.manage"]);
  assert.deepEqual(permissionsForPath("/api/ai/customer-summary"), ["ai.use"]);
  assert.equal(permissionsForPath("/api/payments/moyasar/create"), null);
});

test("MFA is required for every employee page and API", () => {
  assert.equal(requiresMfa("/accounting"), true);
  assert.equal(requiresMfa("/accounting/journal"), true);
  assert.equal(requiresMfa("/settings/users"), true);
  assert.equal(requiresMfa("/api/admin/users/invite"), true);
  assert.equal(requiresMfa("/appointments"), true);
  assert.equal(requiresMfa("/dashboard"), true);
  assert.equal(requiresMfa("/api/audit/activity"), true);
  assert.equal(requiresMfa("/mfa"), false);
});
