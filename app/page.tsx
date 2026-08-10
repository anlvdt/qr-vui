"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

type Mode = "link" | "wifi" | "text" | "email";

const palettes = [
  { name: "Đen đá", value: "#171717", accent: "#FFD338" },
  { name: "Ổi hồng", value: "#9F1239", accent: "#FDA4AF" },
  { name: "Rong biển", value: "#075E54", accent: "#6EE7B7" },
  { name: "Tím lịm", value: "#4C1D95", accent: "#C4B5FD" },
];

const modes: { id: Mode; label: string; icon: string }[] = [
  { id: "link", label: "Đường dẫn", icon: "↗" },
  { id: "wifi", label: "Wi-Fi", icon: "⌁" },
  { id: "text", label: "Lời nhắn", icon: "✎" },
  { id: "email", label: "Email", icon: "@" },
];

const escapeWifi = (value: string) => value.replace(/([\\;,\":])/g, "\\$1");

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("link");
  const [value, setValue] = useState("qr.denso-wave.com");
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiSecurity, setWifiSecurity] = useState("WPA");
  const [emailSubject, setEmailSubject] = useState("");
  const [palette, setPalette] = useState(palettes[0]);
  const [notice, setNotice] = useState("Mã đang khỏe như trâu");

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
    return value.trim();
  }, [mode, value, wifiName, wifiPassword, wifiSecurity, emailSubject]);

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
            <div className="privacy-line"><span>◉</span> Dữ liệu chỉ nằm trên máy bạn. Server không hóng chuyện.</div>
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
            <span>Sửa lỗi H · 30%</span><span>Viền an toàn · 4 ô</span><span>Mã tĩnh · Bền dai</span>
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

      <footer className="wrap">
        <div className="brand"><span className="brand-mark">QR!</span><span>QRồi Xong!</span></div>
        <p>Làm mã QR nghiêm túc, nói chuyện bớt nghiêm túc.</p>
        <a href="#top">Lên đầu trang ↑</a>
      </footer>
    </main>
  );
}
