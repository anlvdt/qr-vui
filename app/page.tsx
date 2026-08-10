"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

type Mode = "link" | "wifi" | "bank" | "text" | "email";
type Bank = { bin: string; shortName: string; name: string; transferSupported?: number };
type QRStyle = "square" | "round" | "dots";

const palettes = [
  { name: "Đen đá", value: "#171717", accent: "#FFD338" },
  { name: "Ổi hồng", value: "#9F1239", accent: "#FDA4AF" },
  { name: "Rong biển", value: "#075E54", accent: "#6EE7B7" },
  { name: "Tím lịm", value: "#4C1D95", accent: "#C4B5FD" },
];

const modes: { id: Mode; label: string; icon: string }[] = [
  { id: "link", label: "Đường dẫn", icon: "↗" },
  { id: "wifi", label: "Wi-Fi", icon: "⌁" },
  { id: "bank", label: "Ngân hàng", icon: "₫" },
  { id: "text", label: "Lời nhắn", icon: "✎" },
  { id: "email", label: "Thư điện tử", icon: "@" },
];

const qrStyles: { id: QRStyle; name: string; note: string; caption: string }[] = [
  { id: "square", name: "Vuông mà vương", note: "Rõ ràng, cứng cáp", caption: "QUÉT PHÁT, ĂN NGAY" },
  { id: "round", name: "Bo tròn lon ton", note: "Mềm mắt, vẫn chắc", caption: "ĐƯA MÁY LẠI, QUÉT MỘT CÁI" },
  { id: "dots", name: "Chấm bi lí nhí", note: "Nhí nhảnh, dễ nhìn", caption: "CHẤM CHẤM, QUÉT CHẮC" },
];

const fallbackBanks: Bank[] = [
  { bin: "970436", shortName: "Vietcombank", name: "Ngân hàng TMCP Ngoại thương Việt Nam" },
  { bin: "970418", shortName: "BIDV", name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam" },
  { bin: "970415", shortName: "VietinBank", name: "Ngân hàng TMCP Công thương Việt Nam" },
  { bin: "970422", shortName: "MB", name: "Ngân hàng TMCP Quân đội" },
  { bin: "970407", shortName: "Techcombank", name: "Ngân hàng TMCP Kỹ thương Việt Nam" },
  { bin: "970432", shortName: "VPBank", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng" },
  { bin: "970416", shortName: "ACB", name: "Ngân hàng TMCP Á Châu" },
  { bin: "970423", shortName: "TPBank", name: "Ngân hàng TMCP Tiên Phong" },
  { bin: "970403", shortName: "Sacombank", name: "Ngân hàng TMCP Sài Gòn Thương Tín" },
  { bin: "970405", shortName: "Agribank", name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam" },
];

const escapeWifi = (value: string) => value.replace(/([\\;,\":])/g, "\\$1");

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const pad2 = (value: number) => value.toString().padStart(2, "0");

function crc16(value: string) {
  let crc = 0xffff;
  for (let i = 0; i < value.length; i++) {
    crc ^= value.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
  }
  return (crc & 0xffff).toString(16).padStart(4, "0").toUpperCase();
}

function cleanTransferNote(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, " ").trim().slice(0, 50).toUpperCase();
}

function makeVietQRContent(bankId: string, accountId: string, amount: string, description: string) {
  const consumer = `0010A00000072701${pad2(bankId.length + accountId.length + 8)}00${pad2(bankId.length)}${bankId}01${pad2(accountId.length)}${accountId}0208QRIBFTTA`;
  let content = `00020101021138${pad2(consumer.length)}${consumer}5303704`;
  if (amount) content += `54${pad2(amount.length)}${amount}`;
  content += "5802VN";
  if (description) {
    const additional = `08${pad2(description.length)}${description}`;
    content += `62${pad2(additional.length)}${additional}`;
  }
  content += "6304";
  return content + crc16(content);
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, size: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, size, size, radius);
  context.fill();
}

function drawQR(context: CanvasRenderingContext2D, payload: string, color: string, style: QRStyle, x: number, y: number, outputSize: number) {
  const qr = QRCode.create(payload, { errorCorrectionLevel: "H" });
  const modules = qr.modules as typeof qr.modules & { isReserved(row: number, column: number): number };
  const quiet = 4;
  const cell = outputSize / (modules.size + quiet * 2);
  context.fillStyle = "#FFFFFF";
  context.fillRect(x, y, outputSize, outputSize);
  context.fillStyle = color;

  for (let row = 0; row < modules.size; row++) {
    for (let column = 0; column < modules.size; column++) {
      if (!modules.get(row, column)) continue;
      const moduleX = x + (column + quiet) * cell;
      const moduleY = y + (row + quiet) * cell;
      const protectedModule = Boolean(modules.isReserved(row, column));
      if (style === "square" || protectedModule) {
        context.fillRect(moduleX, moduleY, cell + 0.08, cell + 0.08);
      } else if (style === "round") {
        const inset = cell * 0.035;
        roundedRect(context, moduleX + inset, moduleY + inset, cell - inset * 2, cell * 0.24);
      } else {
        context.beginPath();
        context.arc(moduleX + cell / 2, moduleY + cell / 2, cell * 0.46, 0, Math.PI * 2);
        context.fill();
      }
    }
  }
}

function renderPreview(canvas: HTMLCanvasElement, payload: string, color: string, style: QRStyle) {
  const scale = window.devicePixelRatio || 1;
  const size = 336;
  canvas.width = size * scale;
  canvas.height = size * scale;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.scale(scale, scale);
  drawQR(context, payload, color, style, 0, 0, size);
}

function downloadStyledPNG(payload: string, color: string, accent: string, style: QRStyle, caption: string, filename: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 1540;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.fillStyle = accent;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#171717";
  context.fillRect(58, 58, 1284, 1284);
  drawQR(context, payload, color, style, 74, 74, 1252);
  context.fillStyle = "#171717";
  context.fillRect(110, 1370, 1180, 104);
  context.fillStyle = "#FFFFFF";
  context.font = "700 38px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(caption, 700, 1422);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${filename}.png`;
  link.click();
}

function styledSVG(payload: string, color: string, accent: string, style: QRStyle, caption: string) {
  const qr = QRCode.create(payload, { errorCorrectionLevel: "H" });
  const modules = qr.modules as typeof qr.modules & { isReserved(row: number, column: number): number };
  const quiet = 4;
  const qrSize = 1252;
  const origin = 74;
  const cell = qrSize / (modules.size + quiet * 2);
  const pieces: string[] = [`<rect width="1400" height="1540" fill="${accent}"/>`, `<rect x="58" y="58" width="1284" height="1284" fill="#171717"/>`, `<rect x="74" y="74" width="1252" height="1252" fill="#fff"/>`];
  for (let row = 0; row < modules.size; row++) {
    for (let column = 0; column < modules.size; column++) {
      if (!modules.get(row, column)) continue;
      const px = origin + (column + quiet) * cell;
      const py = origin + (row + quiet) * cell;
      const protectedModule = Boolean(modules.isReserved(row, column));
      if (style === "dots" && !protectedModule) pieces.push(`<circle cx="${px + cell / 2}" cy="${py + cell / 2}" r="${cell * 0.46}" fill="${color}"/>`);
      else pieces.push(`<rect x="${px}" y="${py}" width="${cell + 0.08}" height="${cell + 0.08}" rx="${style === "round" && !protectedModule ? cell * 0.24 : 0}" fill="${color}"/>`);
    }
  }
  const safeCaption = caption.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  pieces.push(`<rect x="110" y="1370" width="1180" height="104" fill="#171717"/><text x="700" y="1434" fill="#fff" font-family="Arial,sans-serif" font-size="38" font-weight="700" text-anchor="middle">${safeCaption}</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1540" viewBox="0 0 1400 1540">${pieces.join("")}</svg>`;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("link");
  const [value, setValue] = useState("qr.denso-wave.com");
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiSecurity, setWifiSecurity] = useState("WPA");
  const [emailSubject, setEmailSubject] = useState("");
  const [banks, setBanks] = useState<Bank[]>(fallbackBanks);
  const [bankId, setBankId] = useState(fallbackBanks[0].bin);
  const [bankAccount, setBankAccount] = useState("");
  const [bankAmount, setBankAmount] = useState("");
  const [bankNote, setBankNote] = useState("");
  const [palette, setPalette] = useState(palettes[0]);
  const [qrStyle, setQrStyle] = useState<QRStyle>("round");
  const [notice, setNotice] = useState("Mã ngon, quét giòn");

  useEffect(() => {
    fetch("https://api.vietqr.io/v2/banks")
      .then((response) => response.json())
      .then((result: { data?: Bank[] }) => {
        const supported = result.data?.filter((bank) => bank.transferSupported !== 0);
        if (supported?.length) setBanks(supported.sort((a, b) => a.shortName.localeCompare(b.shortName)));
      })
      .catch(() => undefined);
  }, []);

  const payload = useMemo(() => {
    if (mode === "link") return normalizeUrl(value);
    if (mode === "wifi") {
      if (!wifiName.trim()) return "";
      return `WIFI:T:${wifiSecurity};S:${escapeWifi(wifiName)};P:${escapeWifi(wifiPassword)};;`;
    }
    if (mode === "email") {
      if (!value.trim()) return "";
      return `mailto:${value.trim()}${emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : ""}`;
    }
    if (mode === "bank") {
      if (!bankId || !bankAccount) return "";
      return makeVietQRContent(bankId, bankAccount.trim().toUpperCase(), bankAmount, cleanTransferNote(bankNote));
    }
    return value.trim();
  }, [mode, value, wifiName, wifiPassword, wifiSecurity, emailSubject, bankId, bankAccount, bankAmount, bankNote]);

  const inputIsValid = useMemo(() => {
    if (!payload) return false;
    if (mode === "link") {
      try {
        return ["http:", "https:"].includes(new URL(payload).protocol);
      } catch {
        return false;
      }
    }
    if (mode === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    if (mode === "bank") {
      const accountOk = /^[A-Za-z0-9]{6,19}$/.test(bankAccount.trim());
      const amountOk = !bankAmount || (/^[1-9]\d*$/.test(bankAmount) && Number(bankAmount) < 500_000_000);
      return accountOk && amountOk;
    }
    return true;
  }, [payload, mode, value]);

  useEffect(() => {
    if (!canvasRef.current || !inputIsValid) return;
    try {
      renderPreview(canvasRef.current, payload, palette.value, qrStyle);
    } catch {
      setNotice("Chữ dài như sớ, bớt một mớ nhé");
    }
  }, [payload, palette, qrStyle, inputIsValid]);

  useEffect(() => {
    setNotice(
      !payload
        ? "Thiếu nguyên liệu, bếp chưa lên lửa"
        : !inputIsValid
          ? "Dữ liệu hơi lạ, xem lại nha"
          : payload.length > 500
            ? "Chữ nhiều như sớ — quét xa hơi khó"
            : "Mã ngon, quét giòn",
    );
  }, [payload, inputIsValid]);

  const download = async (format: "png" | "svg") => {
    if (!inputIsValid) return;
    const filename = `qroi-xong-${Date.now()}`;
    const selectedStyle = qrStyles.find((item) => item.id === qrStyle) ?? qrStyles[0];
    if (format === "png") {
      downloadStyledPNG(payload, palette.value, palette.accent, qrStyle, selectedStyle.caption, filename);
    } else {
      const svg = styledSVG(payload, palette.value, palette.accent, qrStyle, selectedStyle.caption);
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    }
    setNotice(`${format.toUpperCase()} về máy — đẹp trai, hết sẩy ✨`);
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setValue("");
    setEmailSubject("");
  };

  return (
    <main>
      <nav className="nav wrap" aria-label="Điều hướng chính">
        <a className="brand" href="#top" aria-label="QRồi Xong - trang chủ">
          <span className="brand-mark">QR!</span>
          <span>QRồi Xong!</span>
        </a>
        <div className="nav-links"><a href="#about">Giới thiệu</a><a href="#tech">Đồ nghề</a></div>
        <div className="nav-note"><span /> Mã tĩnh · Kín mít · Không gài phí</div>
      </nav>

      <section className="hero wrap" id="top">
        <div className="hero-copy">
          <div className="eyebrow">Máy làm mã bớt nghiêm số 1 vũ trụ*</div>
          <h1>Mã chuẩn chỉnh.<br /><em>Tính tình hơi nhây.</em></h1>
          <p>Quét phát ăn ngay — chẳng cần tài khoản, chẳng lo hết hạn, chẳng sợ nửa đường đòi tiền.</p>
          <small>*Vũ trụ tính từ bàn làm việc của tụi mình.</small>
        </div>
        <div className="doodle" aria-hidden="true">
          <span className="arrow">↳</span>
          <span className="doodle-copy">Đưa máy lên.<br />Quét một nhịp. Xong.</span>
        </div>
      </section>

      <section className="maker wrap" aria-label="Công cụ tạo mã QR">
        <div className="panel form-panel">
          <div className="panel-heading">
            <span className="step">01</span>
            <div><h2>Bạn muốn nhét gì vào mã?</h2><p>Cứ điền đi, tụi mình không ngó nghiêng.</p></div>
          </div>

          <div className="mode-tabs" role="tablist" aria-label="Loại nội dung QR">
            {modes.map((item) => (
              <button key={item.id} role="tab" aria-selected={mode === item.id} className={mode === item.id ? "active" : ""} onClick={() => switchMode(item.id)}>
                <b>{item.icon}</b>{item.label}
              </button>
            ))}
          </div>

          <div className="fields">
            {mode === "wifi" ? (
              <>
                <label>Tên mạng Wi-Fi<input value={wifiName} onChange={(e) => setWifiName(e.target.value)} placeholder="Ví dụ: NhaNayCoWifi" /></label>
                <div className="two-fields">
                  <label>Mật khẩu<input type="password" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} placeholder="Không ai nhìn đâu" /></label>
                  <label>Bảo mật<select value={wifiSecurity} onChange={(e) => setWifiSecurity(e.target.value)}><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">Không mật khẩu</option></select></label>
                </div>
              </>
            ) : mode === "bank" ? (
              <>
                <label>Ngân hàng nhận
                  <select value={bankId} onChange={(event) => setBankId(event.target.value)}>
                    {banks.map((bank) => <option value={bank.bin} key={bank.bin}>{bank.shortName} · {bank.bin}</option>)}
                  </select>
                </label>
                <label>Số tài khoản
                  <input value={bankAccount} onChange={(event) => setBankAccount(event.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 19))} placeholder="Nhập 6–19 chữ hoặc số" autoComplete="off" />
                </label>
                <div className="two-fields bank-fields">
                  <label>Số tiền (không bắt buộc)
                    <input inputMode="numeric" value={bankAmount} onChange={(event) => setBankAmount(event.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="Ví dụ: 150000" />
                    {bankAmount && <small className="amount-readout">{Number(bankAmount).toLocaleString("vi-VN")} ₫</small>}
                  </label>
                  <label>Nội dung chuyển khoản
                    <input value={bankNote} onChange={(event) => setBankNote(event.target.value)} maxLength={50} placeholder="Ví dụ: TIEN CAFE" />
                  </label>
                </div>
                <div className="bank-warning"><b>Nhắc nhẹ mà quan trọng:</b> Mã chỉ điền sẵn lệnh chuyển. Hãy kiểm tra tên người nhận, số tiền và lời nhắn trong ứng dụng ngân hàng trước khi xác nhận.</div>
              </>
            ) : (
              <>
                <label>
                  {mode === "link" ? "Dán đường dẫn vào đây" : mode === "email" ? "Địa chỉ thư điện tử" : "Lời nhắn kín (hoặc chẳng kín)"}
                  {mode === "text" ? (
                    <textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ví dụ: Nhớ mua rau. Thiệt đó." rows={4} />
                  ) : (
                    <input type={mode === "email" ? "email" : "text"} value={value} onChange={(e) => setValue(e.target.value)} placeholder={mode === "email" ? "hello@congty.vn" : "tenmien.vn/mon-ngon"} />
                  )}
                </label>
                {mode === "email" && <label>Tiêu đề (không bắt buộc)<input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Ví dụ: Em gửi file rồi ạ" /></label>}
              </>
            )}
            <div className="privacy-line"><span>◉</span> {mode === "bank" ? "Tài khoản và số tiền chỉ được ghép mã ngay trên máy bạn." : "Dữ liệu nằm yên trên máy. Máy chủ không hỏi, chẳng ai dòm ngó."}</div>
          </div>

          <div className="palette-section">
            <div className="label-row"><span>Chọn một sắc chất</span><span>Độ tương phản đã canh sẵn ✓</span></div>
            <div className="palettes">
              {palettes.map((item) => (
                <button key={item.name} className={palette.name === item.name ? "palette active" : "palette"} onClick={() => setPalette(item)} aria-label={`Chọn màu ${item.name}`}>
                  <i style={{ background: item.value }} /><span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="shape-section">
            <div className="label-row"><span>Chọn một dáng nhây</span><span>Mắt định vị luôn vuông vức ✓</span></div>
            <div className="shape-options">
              {qrStyles.map((item) => (
                <button key={item.id} className={qrStyle === item.id ? `shape-option active ${item.id}` : `shape-option ${item.id}`} onClick={() => setQrStyle(item.id)}>
                  <i aria-hidden="true"><span /><span /><span /><span /></i>
                  <b>{item.name}</b><small>{item.note}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="panel preview-panel" style={{ "--accent": palette.accent } as React.CSSProperties}>
          <div className="tape">MÃ NÓNG VỪA RA LÒ</div>
          <div className={`qr-costume ${qrStyle}`}>
          <div className="qr-shell">
            {inputIsValid ? <canvas ref={canvasRef} aria-label="Mã QR xem trước" /> : <div className="empty-qr"><span>?</span><p>QR đang ngồi chờ<br />nội dung của bạn</p></div>}
          </div>
          <div className="costume-caption">{(qrStyles.find((item) => item.id === qrStyle) ?? qrStyles[0]).caption}</div>
          </div>
          <div className={`health ${inputIsValid ? "good" : "wait"}`}><span>●</span>{notice}</div>
          <div className="tech-badges">
            <span>Sửa lỗi H · 30%</span><span>Viền an toàn · 4 ô</span><span>{mode === "bank" ? "VietQR · CRC16" : "Mã tĩnh · Bền dai"}</span>
          </div>
          <div className="download-row">
            <button className="primary" disabled={!inputIsValid} onClick={() => download("png")}>Tải PNG <span>↓</span></button>
            <button className="secondary" disabled={!inputIsValid} onClick={() => download("svg")}>SVG nét, in phết</button>
          </div>
          <p className="scan-tip">Mẹo nhỏ: quét thử trên màn hình trước khi in cả nghìn tờ. Chắc tay, khỏi ngẩn ngơ.</p>
        </aside>
      </section>

      <section className="why wrap">
        <div className="why-title"><span>KHÔNG CHỈ VUI</span><h2>Mã này có nghề.</h2></div>
        <div className="proof-grid">
          <article><b>4 ô</b><h3>Khoảng thở đàng hoàng</h3><p>Giữ nguyên vùng trắng chuẩn quanh mã để camera tìm thấy nó nhanh hơn.</p></article>
          <article><b>H</b><h3>Sửa lỗi cấp cao nhất</h3><p>Chịu được khoảng 30% hư hại dữ liệu. Cứng cáp, không liều mạng.</p></article>
          <article><b>0</b><h3>Không chuyển hướng lén</h3><p>Thông tin nằm thẳng trong mã. Không tài khoản, không giới hạn lượt quét.</p></article>
        </div>
      </section>

      <section className="about wrap" id="about">
        <div className="section-kicker">CHUYỆN NHÀ LÀM MÃ</div>
        <div className="about-grid">
          <div><h2>Sinh ra vì mã QR<br />không cần phải <em>buồn ngủ.</em></h2></div>
          <div className="about-copy">
            <p><b>QRồi Xong!</b> là một món đồ nhỏ làm đúng một việc: biến nội dung thành mã dễ quét, nhanh tải, tiện chuyền tay — rồi rắc chút duyên cho việc kỹ thuật bớt khô như bánh mì để quên.</p>
            <p>Tụi mình không rút gọn đường dẫn, không giữ nội dung, không biến mã tĩnh thành chiếc vé thu tiền dài hạn. Với mã ngân hàng, dữ liệu được tạo ngay trên máy theo cấu trúc VietQR; ứng dụng ngân hàng mới là nơi kiểm tra người nhận và xác nhận giao dịch.</p>
            <div className="about-sign">Làm nghiêm túc. Nói chuyện bớt nghiêm túc. ↗</div>
          </div>
        </div>
      </section>

      <section className="stack-section" id="tech">
        <div className="wrap">
          <div className="why-title"><span>MỞ NẮP MÁY</span><h2>Đồ nghề bên trong.</h2></div>
          <div className="stack-grid">
            <article><span>01</span><h3>React 19</h3><p>Giao diện phản hồi tức thì. Bạn gõ tới đâu, mã được nấu tới đó.</p></article>
            <article><span>02</span><h3>TypeScript</h3><p>Giữ dữ liệu ngay hàng thẳng lối, giảm những cú “ủa sao vậy ta”.</p></article>
            <article><span>03</span><h3>node-qrcode</h3><p>Bộ máy mã hóa trưởng thành, xuất PNG và SVG với sửa lỗi mức H.</p></article>
            <article><span>04</span><h3>VietQR · CRC16</h3><p>Payload chuyển khoản tạo tại máy theo cấu trúc VietQR/NAPAS, có số tiền tùy chọn.</p></article>
            <article><span>05</span><h3>Cloudflare Edge</h3><p>Trang tĩnh nhẹ tênh, phục vụ gần người dùng và không cần cơ sở dữ liệu.</p></article>
          </div>
          <p className="stack-footnote">Không chuỗi khối cho kêu. Không trí tuệ nhân tạo cho sang. Cần gì, dùng nấy.</p>
        </div>
      </section>

      <footer className="wrap">
        <div className="brand"><span className="brand-mark">QR!</span><span>QRồi Xong!</span></div>
        <p>Làm mã QR nghiêm túc, nói chuyện bớt nghiêm túc.</p>
        <a href="#top">Lên đầu trang ↑</a>
      </footer>
    </main>
  );
}
