import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/index.js', import.meta.url));
const { default: worker } = await import('data:text/javascript;base64,' + source.toString('base64'));
const writes = [];
const env = {
  ADMIN_PASSWORD: 'local-test-only',
  DB: {
    prepare(sql) {
      return {
        bind(...args) { this.args = args; return this; },
        async first() { return null; },
        async run() { writes.push({ sql, args: this.args }); },
      };
    },
  },
};
const submit = (path, body, password) => worker.fetch(new Request('https://example.test' + path, {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...(password ? { 'x-admin-password': password } : {}) },
  body: JSON.stringify(body),
}), env);
const enquiry = { name: 'Test Customer', email: 'test@example.com', subject: 'A written request' };
const photoDataUrl = 'data:image/png;base64,iVBORw0KGgo=';

for (const source of ['about_contact', 'shop_request']) {
  const response = await submit('/api/requests', { ...enquiry, source });
  assert.equal(response.status, 200);
  assert.match((await response.json()).id, /^REQ-/);
  assert.equal(writes.at(-1).args[8], null, 'Text requests must store no attachment');
}
assert.equal((await submit('/api/requests', { ...enquiry, source: 'about_contact', photoDataUrl })).status, 200);
assert.equal(writes.at(-1).args[8], photoDataUrl, 'Customers can attach an optional reference image');
for (const invalid of ['not-an-image', 'data:image/svg+xml;base64,PHN2Zy8+', 'data:image/png;base64,' + 'A'.repeat(800_000)]) {
  const before = writes.length;
  assert.equal((await submit('/api/requests', { ...enquiry, photoDataUrl: invalid })).status, 400);
  assert.equal(writes.length, before, 'Unsupported or oversized references must not be stored');
}
assert.equal((await submit('/api/requests', { ...enquiry, photoDataUrl }, env.ADMIN_PASSWORD)).status, 200);
assert.equal(writes.at(-1).args[8], photoDataUrl, 'Admin reference-image tools must continue to work');
assert.equal((await submit('/api/orders', { ...enquiry, photoDataUrl, items: [{ name: 'Test piece', price: 1, qty: 1 }] })).status, 403);
assert.equal((await submit('/api/upload', {})).status, 401);
console.log('Request upload checks passed: text requests, optional reference images, unsupported/oversized image rejection, admin attachments, and protected original-file upload routes.');
