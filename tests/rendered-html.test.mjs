import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { extractReceiptTotal, splitBillEvenly } from "../app/bill-utils.ts";

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

test("server-renders the QR Vui product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /QR Vui/);
  assert.match(html, /Mã QR không nhất thiết/);
  assert.match(html, /phải đơn điệu/);
  assert.match(html, /Tạo mã QR/);
  assert.match(html, /Ngân hàng/);
  assert.match(html, /Chia bill/);
  assert.match(html, /Công nghệ/);
  assert.match(html, /Ô bo góc/);
  assert.match(html, /Đơn điệu và khó tạo ấn tượng/);
  assert.match(html, /Một mã QR vui vẻ/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("keeps QR reliability guardrails in source", async () => {
  const [page, frames, layout, styles, packageJson, sitesPlugin] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/art-frames.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../build/sites-vite-plugin.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /errorCorrectionLevel:\s*"H"/);
  assert.match(page, /QRCode\.create\(payload, \{ errorCorrectionLevel: "H" \}\)/);
  assert.match(page, /function escapeSvgText/);
  assert.match(page, /window\.setTimeout\(\(\) => URL\.revokeObjectURL/);
  assert.match(page, /const pasteFromClipboard = async/);
  assert.match(page, /autoCapitalize="none"/);
  assert.match(page, /disabled=\{artworkLoading\}/);
  assert.match(page, /export const dynamic = "force-static"/);
  assert.match(page, /NEXT_PUBLIC_ASSET_PREFIX/);
  assert.match(page, /const quiet = 4/);
  assert.match(page, /canvas\.width = 1400/);
  assert.match(page, /WIFI:T:/);
  assert.match(page, /makeVietQRContent/);
  assert.match(page, /crc16/);
  assert.match(page, /9_999_999_999_999/);
  assert.match(page, /const initiationMethod = amount \? "12" : "11"/);
  assert.match(page, /const billShares = useMemo/);
  assert.match(page, /splitBillEvenly/);
  assert.match(page, /Tự chia bill như ảnh/);
  assert.match(page, /Mỗi đồng lẻ/);
  assert.match(page, /const passwordField = wifiSecurity === "nopass"/);
  assert.match(page, /modules\.isReserved/);
  assert.match(page, /styledSVG/);
  assert.match(page, /uploadArtwork/);
  assert.match(page, /drawArtboard/);
  assert.match(page, /sampleLightSurface/);
  assert.match(page, /contrastOnWhite/);
  assert.match(page, /artCanvasRef/);
  assert.match(page, /type="file"/);
  assert.match(page, /THƯ VIỆN MINH HỌA/);
  assert.match(page, /artLibrary/);
  assert.match(page, /Cách chọn ảnh phù hợp/);
  assert.match(page, /meo-mat-lanh\.png/);
  assert.match(page, /artLibrary\.length/);
  assert.match(page, /Ngành nghề/);
  assert.match(page, /Phim ảnh & giải trí/);
  assert.match(page, /kinh-doanh\/banh-mi\.png/);
  assert.match(page, /giai-tri\/rap-chieu\.png/);
  assert.match(page, /su-kien\/dam-cuoi\.png/);
  assert.match(page, /su-kien\/le-an-hoi\.png/);
  assert.match(page, /su-kien\/thoi-noi\.png/);
  assert.match(page, /su-kien\/tan-gia\.png/);
  assert.match(page, /su-kien\/tat-nien\.png/);
  assert.match(page, /Lời nhắn chuyển khoản vui vẻ/);
  assert.match(page, /transferNotePresets/);
  assert.match(page, /Bản đồ bố cục riêng cho từng mẫu/);
  assert.match(page, /Math\.max\(options\.width, 18\)/);
  assert.match(page, /Math\.max\(options\.height, 18\)/);
  assert.match(page, /Nông nghiệp/);
  assert.match(page, /Hàng rong/);
  assert.match(page, /Phong cảnh/);
  assert.match(page, /Miền Bắc & miền Trung/);
  assert.match(page, /nong-nghiep\/lua-gao\.png/);
  assert.match(page, /hang-rong\/ganh-hang\.png/);
  assert.match(page, /mien-nam-bien\/can-tho\.png/);
  assert.match(page, /Thú cưng vui nhộn/);
  assert.match(page, /Công sở dí dỏm/);
  assert.match(page, /Ẩm thực vui nhộn/);
  assert.match(page, /Đời thường vui vẻ/);
  assert.match(page, /hai-thu\/meo-sep\.png/);
  assert.match(page, /hai-cong-so\/vat-may-in\.png/);
  assert.match(page, /hai-do-an\/nuoc-mam-sieu-nhan\.png/);
  assert.match(page, /hai-doi-thuong\/san-wifi\.png/);
  assert.match(page, /Góc xoay/);
  assert.match(page, /rotation: -2/);
  assert.match(page, /context\.transform\(1, skewY, skewX, 1, 0, 0\)/);
  assert.match(page, /const embeddedSurface = options\.paper \? "#FFFFFF" : sampleLightSurface/);
  assert.match(page, /if \(options\.paper\)/);
  assert.match(page, /const labelTop = copyCenterY - labelHeight/);
  assert.match(page, /const qrCenterX = clampLocal/);
  assert.match(page, /drawProjectedQR/);
  assert.match(page, /bilinearPoint/);
  assert.match(page, /canvasFontFamily\(\)/);
  assert.match(page, /Khôi phục bố cục chuẩn/);
  assert.match(page, /Kích thước QR/);
  assert.match(page, /Chữ theo chiều dọc/);
  assert.match(page, /Chiều rộng/);
  assert.match(page, /Nghiêng ngang/);
  assert.match(page, /#DFFF45/);
  assert.match(page, /setArtRotation\(frame\.rotation\)/);
  assert.match(frames, /export const artFrames/);
  assert.match(frames, /function buildLayout/);
  assert.match(frames, /x: landscape \? 33 : 50/);
  assert.match(frames, /size: portrait \? 82 : landscape \? 82 : 78/);
  assert.match(frames, /quad: flatQuad/);
  assert.match(frames, /quad: \[\{ x: 0\.01, y: 0\.05 \}/);
  assert.match(frames, /qr: \{ x:/);
  assert.match(frames, /copy: \{ x:/);
  assert.match(frames, /"thoi-trang"/);
  assert.match(frames, /"ninh-binh"/);
  assert.doesNotMatch(page, /Chọn một chiếc vibe|Server không|app ngân hàng|Tech stack|không drama/i);
  assert.doesNotMatch(page, /QUÉT ĐI, NHÌN GÌ|SẾP BẢO QUÉT ĐI|DỪNG LẠI, QUÉT CÁI|Câu chuyển khoản siêu hài/i);
  assert.match(page, /MỜI BẠN QUÉT MÃ!/);
  assert.doesNotMatch(page, /drawLegacyWorkshopDoodle/);
  assert.match(layout, /lang="vi"/);
  assert.match(layout, /og-qr-vui\.png/);
  assert.match(layout, /NEXT_PUBLIC_SITE_URL/);
  assert.match(layout, /"700", "800"/);
  assert.match(styles, /--text-base:16px/);
  assert.match(styles, /input,textarea,select\{font-size:16px\}/);
  assert.match(styles, /font-synthesis:none/);
  assert.match(styles, /h1,h2,h3\{text-wrap:balance\}p\{text-wrap:pretty\}/);
  assert.match(packageJson, /"build:pages"/);
  assert.match(packageJson, /"qrcode"/);
  assert.match(packageJson, /"name": "qr-vui"/);
  assert.doesNotMatch(page, /QRồi Xong|qroi-xong/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(sitesPlugin, /let packaging = Promise\.resolve\(\)/);
  assert.match(sitesPlugin, /packaging = packaging\.then/);
});

test("extracts the payable total instead of an item or invoice number", () => {
  const receipt = `Mã HĐ: 20260824-0011\nBudweiser 330ml 1 26.000 26.000\nRượu Em Mơ 15 299.000 4.485.000\nTổng: 8.851.000 đ\nThuế đồ ăn 708.080 đ\nTổng thanh toán: 9.661.560 đ`;
  assert.equal(extractReceiptTotal(receipt), "9661560");
  assert.equal(extractReceiptTotal("GRAND TOTAL\n1,250,000 VND"), "1250000");
  assert.equal(extractReceiptTotal("Mã hóa đơn 202608240011\nBàn B2.14"), null);
});

test("splits every đồng exactly once", () => {
  const shares = splitBillEvenly(9_661_560, 7);
  assert.deepEqual(shares, [1_380_223, 1_380_223, 1_380_223, 1_380_223, 1_380_223, 1_380_223, 1_380_222]);
  assert.equal(shares.reduce((sum, share) => sum + share, 0), 9_661_560);
  assert.deepEqual(splitBillEvenly(10_000, 3), [3_334, 3_333, 3_333]);
});

test("keeps illustration captions welcoming and courteous", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const library = page.slice(page.indexOf("const artLibrary"), page.indexOf("const artCategories"));
  const captions = [...library.matchAll(/caption: "([^"]+)"/g)].map((match) => match[1]);
  assert.equal(captions.length, 96);
  assert.ok(captions.every((caption) => /MỜI/.test(caption)), "Mỗi caption cần là một lời mời lịch sự");
  assert.doesNotMatch(page, /Trả nợ để còn nhìn mặt nhau|Nhận đi, đừng hỏi nguồn|Chốt sổ, khỏi nhắc lần ba/i);
});
