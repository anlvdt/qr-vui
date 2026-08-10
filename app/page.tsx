"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

type Mode = "link" | "wifi" | "bank" | "text" | "email";
type Bank = { bin: string; shortName: string; name: string; transferSupported?: number };

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
  { id: "email", label: "Email", icon: "@" },
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
  const [notice, setNotice] = useState("Mã đang khỏe như trâu");

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
    QRCode.toCanvas(canvasRef.current, payload, {
      width: 336,
      margin: 4,
      errorCorrectionLevel: "H",
      color: { dark: `${palette.value}FF`, light: "#FFFFFFFF" },
    }).catch(() => setNotice("Mã hơi quá tải, bớt chữ giúp tui nha"));
  }, [payload, palette, inputIsValid]);

  useEffect(() => {
    setNotice(
      !payload
        ? "Cho tui chút dữ liệu để nấu mã"
        : !inputIsValid
          ? "Thông tin này còn hơi khả nghi nha"
          : payload.length > 500
            ? "Hơi nhiều chữ — mã sẽ dày và khó quét xa"
            : "Mã đang khỏe như trâu",
    );
  }, [payload, inputIsValid]);

  const download = async (format: "png" | "svg") => {
    if (!inputIsValid) return;
    const filename = `qroi-xong-${Date.now()}`;
    if (format === "png") {
      const url = await QRCode.toDataURL(payload, {
        width: 1400,
        margin: 4,
        errorCorrectionLevel: "H",
        color: { dark: `${palette.value}FF`, light: "#FFFFFFFF" },
      });
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.png`;
      link.click();
    } else {
      const svg = await QRCode.toString(payload, {
        type: "svg",
        margin: 4,
        errorCorrectionLevel: "H",
        color: { dark: `${palette.value}FF`, light: "#FFFFFFFF" },
      });
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    }
    setNotice(`${format.toUpperCase()} đã hạ cánh vào máy bạn ✨`);
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
        <div className="nav-links"><a href="#about">Giới thiệu</a><a href="#tech">Tech stack</a></div>
        <div className="nav-note"><span /> Tĩnh · Riêng tư · Không úp sọt</div>
      </nav>

      <section className="hero wrap" id="top">
        <div className="hero-copy">
          <div className="eyebrow">Trình tạo QR bớt nghiêm túc số 1 vũ trụ*</div>
          <h1>Mã chuẩn chỉnh.<br /><em>Tính tình hơi nhây.</em></h1>
          <p>Tạo mã QR quét phát ăn ngay — không tài khoản, không hết hạn, không có màn “bất ngờ chưa, trả tiền đi”.</p>
          <small>*Vũ trụ tính từ bàn làm việc của tụi mình.</small>
        </div>
        <div className="doodle" aria-hidden="true">
          <span className="arrow">↳</span>
          <span className="doodle-copy">Quét thử đi.<br />Có cắn đâu.</span>
        </div>
      </section>

      <section className="maker wrap" aria-label="Công cụ tạo mã QR">
        <div className="panel form-panel">
          <div className="panel-heading">
            <span className="step">01</span>
            <div><h2>Bạn muốn giấu gì trong mã?</h2><p>Yên tâm, tụi mình không nhìn trộm.</p></div>
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
                <div className="bank-warning"><b>Nhắc nhẹ mà quan trọng:</b> QR chỉ điền sẵn lệnh chuyển. Hãy kiểm tra đúng tên người nhận, số tiền và nội dung trong app ngân hàng trước khi xác nhận.</div>
              </>
            ) : (
              <>
                <label>
                  {mode === "link" ? "Dán đường dẫn vào đây" : mode === "email" ? "Địa chỉ email" : "Lời nhắn bí mật (hoặc không bí mật)"}
                  {mode === "text" ? (
                    <textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ví dụ: Nhớ mua rau. Thiệt đó." rows={4} />
                  ) : (
                    <input type={mode === "email" ? "email" : "text"} value={value} onChange={(e) => setValue(e.target.value)} placeholder={mode === "email" ? "hello@congty.vn" : "tenmien.vn/mon-ngon"} />
                  )}
                </label>
                {mode === "email" && <label>Tiêu đề (không bắt buộc)<input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Ví dụ: Em gửi file rồi ạ" /></label>}
              </>
            )}
            <div className="privacy-line"><span>◉</span> {mode === "bank" ? "Số tài khoản và số tiền chỉ được ghép mã trên máy bạn." : "Dữ liệu chỉ nằm trên máy bạn. Server không hóng chuyện."}</div>
          </div>

          <div className="palette-section">
            <div className="label-row"><span>Chọn một chiếc vibe</span><span>Tương phản đã được canh sẵn ✓</span></div>
            <div className="palettes">
              {palettes.map((item) => (
                <button key={item.name} className={palette.name === item.name ? "palette active" : "palette"} onClick={() => setPalette(item)} aria-label={`Chọn màu ${item.name}`}>
                  <i style={{ background: item.value }} /><span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="panel preview-panel" style={{ "--accent": palette.accent } as React.CSSProperties}>
          <div className="tape">HÀNG TƯƠI VỪA RA LÒ</div>
          <div className="qr-shell">
            {inputIsValid ? <canvas ref={canvasRef} aria-label="Mã QR xem trước" /> : <div className="empty-qr"><span>?</span><p>QR đang ngồi chờ<br />nội dung của bạn</p></div>}
          </div>
          <div className={`health ${inputIsValid ? "good" : "wait"}`}><span>●</span>{notice}</div>
          <div className="tech-badges">
            <span>Sửa lỗi H · 30%</span><span>Viền an toàn · 4 ô</span><span>{mode === "bank" ? "VietQR · CRC16" : "Mã tĩnh · Bền dai"}</span>
          </div>
          <div className="download-row">
            <button className="primary" disabled={!inputIsValid} onClick={() => download("png")}>Tải PNG <span>↓</span></button>
            <button className="secondary" disabled={!inputIsValid} onClick={() => download("svg")}>SVG nét căng</button>
          </div>
          <p className="scan-tip">Mẹo nhỏ: thử quét trên màn hình trước khi in 10.000 tờ rơi nhé. Đỡ “ủa”.</p>
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
        <div className="section-kicker">CHUYỆN NHÀ QR</div>
        <div className="about-grid">
          <div><h2>Sinh ra vì mã QR<br />không cần phải <em>buồn ngủ.</em></h2></div>
          <div className="about-copy">
            <p><b>QRồi Xong!</b> là một công cụ nhỏ làm đúng một việc: biến nội dung của bạn thành mã QR dễ quét, nhanh tải và dễ chia sẻ — rồi thêm chút duyên để thao tác kỹ thuật bớt khô như bánh mì để quên.</p>
            <p>Tụi mình không rút gọn link, không giữ nội dung và không biến một mã tĩnh thành chiếc vé đăng ký thuê bao. Với QR ngân hàng, dữ liệu được tạo cục bộ theo cấu trúc VietQR; ứng dụng ngân hàng mới là nơi kiểm tra người nhận và xác nhận giao dịch.</p>
            <div className="about-sign">Làm nghiêm túc. Nói chuyện bớt nghiêm túc. ↗</div>
          </div>
        </div>
      </section>

      <section className="stack-section" id="tech">
        <div className="wrap">
          <div className="why-title"><span>MỞ NẮP CAPO</span><h2>Máy móc bên trong.</h2></div>
          <div className="stack-grid">
            <article><span>01</span><h3>React 19</h3><p>Giao diện phản hồi tức thì. Bạn gõ tới đâu, mã được nấu tới đó.</p></article>
            <article><span>02</span><h3>TypeScript</h3><p>Giữ dữ liệu ngay hàng thẳng lối, giảm những cú “ủa sao vậy ta”.</p></article>
            <article><span>03</span><h3>node-qrcode</h3><p>Bộ máy mã hóa trưởng thành, xuất PNG và SVG với sửa lỗi mức H.</p></article>
            <article><span>04</span><h3>VietQR · CRC16</h3><p>Payload chuyển khoản tạo tại máy theo cấu trúc VietQR/NAPAS, có số tiền tùy chọn.</p></article>
            <article><span>05</span><h3>Cloudflare Edge</h3><p>Trang tĩnh nhẹ tênh, phục vụ gần người dùng và không cần cơ sở dữ liệu.</p></article>
          </div>
          <p className="stack-footnote">Không blockchain. Không AI gắn cho sang. Chỉ dùng đúng món cần dùng.</p>
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
