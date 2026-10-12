import { test } from "node:test";
import assert from "node:assert/strict";
import { checkFile, demoReference, sniffFileType, validateField, validateForm } from "./validation.ts";

const TODAY = "2026-10-06";
const base = { fullName: "Ahmed Saleh Ali", phone: "777 123 456", nationalId: "01234567890", city: "Sana'a", consent: true, locale: "en" };

test("Yemeni mobile numbers: spaces stripped, operator prefixes enforced", () => {
  for (const ok of ["777123456", "77 712 3456", "+967 733 123 456", "967711234567", "781234567", "701234567"]) {
    assert.equal(validateField("callback", "phone", { phone: ok }), null, ok);
  }
  for (const bad of ["721234567", "751234567", "0777123456", "77712345", "7771234567", "+966777123456", "abc"]) {
    assert.equal(validateField("callback", "phone", { phone: bad }), "phone", bad);
  }
  assert.equal(validateField("callback", "phone", { phone: "  " }), "required");
});

test("account application: valid payload is normalised and typed", () => {
  const r = validateForm("account", { ...base, accountType: "savings", website: "", extra: "dropped" }, TODAY);
  assert.equal(r.ok, true);
  assert.equal(r.data.phone, "777123456");
  assert.equal(r.data.type, "account");
  assert.equal(r.data.consent, true);
  assert.equal("extra" in r.data, false);
});

test("account application: every required field reported", () => {
  const r = validateForm("account", {}, TODAY);
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errors).sort(), ["accountType", "city", "consent", "fullName", "nationalId", "phone"]);
  assert.equal(r.errors.consent, "consent");
  assert.equal(validateForm("account", { ...base, accountType: "gold" }, TODAY).errors.accountType, "choice");
});

test("name, national ID and email rules", () => {
  assert.equal(validateField("account", "fullName", { fullName: "Ali" }), "minLength");
  assert.equal(validateField("account", "fullName", { fullName: "x".repeat(121) }), "maxLength");
  assert.equal(validateField("account", "nationalId", { nationalId: "1234567" }), "nationalId");
  assert.equal(validateField("account", "nationalId", { nationalId: "12345678" }), null);
  assert.equal(validateField("account", "email", { email: "" }), null, "optional email may be empty");
  assert.equal(validateField("account", "email", { email: "not-an-email" }), "email");
  assert.equal(validateField("job", "email", { email: "" }), "required", "job email is required");
});

test("financing: amounts and terms parsed from strings and bounded", () => {
  const ok = validateForm("financing", { ...base, financingProductId: "personal", amount: "2,000,000", months: "24", monthlyIncome: "350000" }, TODAY);
  assert.equal(ok.ok, true);
  assert.equal(ok.data.amount, 2_000_000);
  assert.equal(ok.data.months, 24);
  const bad = validateForm("financing", { ...base, financingProductId: "personal", amount: "50", months: "120", monthlyIncome: "x" }, TODAY);
  assert.deepEqual(bad.errors, { amount: "min", months: "max", monthlyIncome: "number" });
});

test("card: last four digits required only when the applicant has an account", () => {
  const card = { ...base, cardId: "debit" };
  assert.equal(validateForm("card", { ...card, hasAccount: false }, TODAY).ok, true);
  assert.equal(validateForm("card", { ...card, hasAccount: "true" }, TODAY).errors.accountLast4, "required");
  assert.equal(validateForm("card", { ...card, hasAccount: true, accountLast4: "12a4" }, TODAY).errors.accountLast4, "accountLast4");
  const ok = validateForm("card", { ...card, hasAccount: "on", accountLast4: "4721" }, TODAY);
  assert.equal(ok.ok, true);
  assert.equal(ok.data.accountLast4, "4721");
  assert.equal(ok.data.hasAccount, true);
});

test("callback: message length and consent is checked but not forwarded", () => {
  const values = { fullName: "Huda Abdullah", phone: "733111222", subject: "cards", message: "short", consent: true };
  assert.equal(validateForm("callback", values, TODAY).errors.message, "minLength");
  const r = validateForm("callback", { ...values, message: "Please call me about the prepaid card." }, TODAY);
  assert.equal(r.ok, true);
  assert.equal("consent" in r.data, false);
  assert.equal("type" in r.data, false);
});

test("complaint: dates cannot be in the future; attachment optional but checked", () => {
  const c = { fullName: "Khaled Omar", phone: "771234567", category: "fees", description: "I was charged twice for the same transfer last week.", consent: true };
  assert.equal(validateForm("complaint", c, TODAY).ok, true);
  assert.equal(validateForm("complaint", { ...c, transactionDate: "2026-10-07" }, TODAY).errors.transactionDate, "futureDate");
  assert.equal(validateForm("complaint", { ...c, transactionDate: "06/10/2026" }, TODAY).errors.transactionDate, "date");
  const exe = { name: "receipt.exe", size: 100, type: "application/octet-stream" };
  assert.equal(validateForm("complaint", { ...c, attachment: exe }, TODAY).errors.attachment, "fileType");
  const png = { name: "receipt.png", size: 1000, type: "image/png" };
  assert.equal(validateForm("complaint", { ...c, attachment: png }, TODAY).ok, true);
});

test("job: CV required, PDF only, 5 MB max", () => {
  const j = { fullName: "Sara Mohammed", phone: "771234567", email: "sara@example.com", city: "Aden", education: "BSc Accounting", experienceYears: "3", consent: true, jobSlug: "teller-aden" };
  assert.equal(validateForm("job", j, TODAY).errors.cv, "required");
  assert.equal(validateForm("job", { ...j, cv: { name: "cv.png", size: 10, type: "image/png" } }, TODAY).errors.cv, "fileTypePdf");
  assert.equal(validateForm("job", { ...j, cv: { name: "cv.pdf", size: 6 * 1024 * 1024, type: "application/pdf" } }, TODAY).errors.cv, "fileSize");
  const ok = validateForm("job", { ...j, cv: { name: "cv.pdf", size: 2048, type: "application/pdf" } }, TODAY);
  assert.equal(ok.ok, true);
  assert.equal(ok.data.experienceYears, 3);
  assert.equal("jobSlug" in ok.data, false);
});

test("file helpers: extension/type/size and magic-byte sniffing", () => {
  assert.equal(checkFile({ name: "a.PDF", size: 10, type: "application/pdf" }, "pdf"), null);
  assert.equal(checkFile({ name: "a.pdf", size: 10, type: "image/png" }, "pdf"), "fileTypePdf");
  assert.equal(checkFile({ name: "a.jpg", size: 0, type: "image/jpeg" }, "doc-image"), "fileSize");
  assert.equal(sniffFileType(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])), "application/pdf");
  assert.equal(sniffFileType(new Uint8Array([0x89, 0x50, 0x4e, 0x47])), "image/png");
  assert.equal(sniffFileType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(sniffFileType(new Uint8Array([0x4d, 0x5a])), null);
});

test("demo reference follows WTQ-<PREFIX>-<YEAR>-###### format", () => {
  assert.equal(demoReference("financing", () => 0.000412, 2026), "WTQ-FIN-2026-000412");
  assert.match(demoReference("callback"), /^WTQ-CB-\d{4}-\d{6}$/);
});
