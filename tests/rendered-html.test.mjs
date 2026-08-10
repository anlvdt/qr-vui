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
  assert.match(html, /Mã QR không nhất thiết/);
  assert.match(html, /phải đơn điệu/);
  assert.match(html, /Tạo mã QR/);
  assert.match(html, /Ngân hàng/);
  assert.match(html, /Công nghệ/);
  assert.match(html, /Ô bo góc/);
  assert.match(html, /Đơn điệu và khó tạo ấn tượng/);
  assert.match(html, /Một mã QR vui vẻ/);
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
  assert.match(page, /uploadArtwork/);
  assert.match(page, /drawArtboard/);
  assert.match(page, /contrastOnWhite/);
  assert.match(page, /artCanvasRef/);
  assert.match(page, /type="file"/);
  assert.match(page, /THƯ VIỆN MINH HỌA/);
  assert.match(page, /artLibrary/);
  assert.match(page, /Cách chọn ảnh phù hợp/);
  assert.match(page, /meo-mat-lanh\.png/);
  assert.match(page, /artLibrary\.length/);
  assert.match(page, /Ngành nghề/);
  assert.match(page, /Phim & vui/);
  assert.match(page, /kinh-doanh\/banh-mi\.png/);
  assert.match(page, /giai-tri\/rap-chieu\.png/);
  assert.match(page, /su-kien\/dam-cuoi\.png/);
  assert.match(page, /Vùng QR đã được căn sẵn/);
  assert.match(page, /Math\.max\(options\.size, 30\)/);
  assert.match(page, /min="30" max="68"/);
  assert.match(page, /Nông nghiệp/);
  assert.match(page, /Hàng rong/);
  assert.match(page, /Phong cảnh/);
  assert.match(page, /Bắc & Trung/);
  assert.match(page, /nong-nghiep\/lua-gao\.png/);
  assert.match(page, /hang-rong\/ganh-hang\.png/);
  assert.match(page, /mien-nam-bien\/can-tho\.png/);
  assert.match(page, /Thú lầy/);
  assert.match(page, /Công sở lụi/);
  assert.match(page, /Đồ ăn thành tinh/);
  assert.match(page, /Đời thường lầy/);
  assert.match(page, /hai-thu\/meo-sep\.png/);
  assert.match(page, /hai-cong-so\/vat-may-in\.png/);
  assert.match(page, /hai-do-an\/nuoc-mam-sieu-nhan\.png/);
  assert.match(page, /hai-doi-thuong\/san-wifi\.png/);
  assert.match(page, /Xoay cả cụm/);
  assert.match(page, /rotation: -2/);
  assert.match(page, /context\.fillText\(caption, 0, badgeSize \* 0\.39\)/);
  assert.match(page, /const labelTop = badgeSize \* 0\.33/);
  assert.match(page, /#DFFF45/);
  assert.match(page, /setArtRotation\(item\.rotation \?\? 0\)/);
  assert.doesNotMatch(page, /Chọn một chiếc vibe|Server không|app ngân hàng|Tech stack|không drama/i);
  assert.match(layout, /lang="vi"/);
  assert.match(layout, /og-v3\.png/);
  assert.match(packageJson, /"qrcode"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
