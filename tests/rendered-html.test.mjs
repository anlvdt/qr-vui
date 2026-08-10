import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the QRồi Xong product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /QRồi Xong!/);
  assert.match(html, /Mã chuẩn chỉnh/);
  assert.match(html, /Không đăng nhập/);
  assert.match(html, /Tải PNG/);
  assert.match(html, /Ngân hàng/);
  assert.match(html, /Đồ nghề/);
  assert.match(html, /Bo tròn lon ton/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("keeps QR reliability guardrails in source", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /errorCorrectionLevel:\s*"H"/);
  assert.match(page, /const quiet = 4/);
  assert.match(page, /canvas\.width = 1400/);
  assert.match(page, /WIFI:T:/);
  assert.match(page, /makeVietQRContent/);
  assert.match(page, /crc16/);
  assert.match(page, /500_000_000/);
  assert.match(page, /modules\.isReserved/);
  assert.match(page, /styledSVG/);
  assert.doesNotMatch(page, /Chọn một chiếc vibe|Server không|app ngân hàng|Tech stack|không drama/i);
  assert.match(layout, /lang="vi"/);
  assert.match(layout, /og-v2\.png/);
  assert.match(packageJson, /"qrcode"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
