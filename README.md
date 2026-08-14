# QR Vui

QR Vui là công cụ tạo mã QR trực tiếp trong trình duyệt. Bạn có thể tạo mã cho liên kết, Wi-Fi, VietQR, văn bản hoặc email; sau đó tùy biến màu sắc, kiểu ô mã, minh họa và tải xuống PNG/SVG.

## Điểm chính

- 96 mẫu minh họa theo chủ đề, kèm khả năng tải ảnh riêng.
- VietQR có số tiền và nội dung chuyển khoản.
- Mã được tạo tại thiết bị; nội dung QR không được gửi tới máy chủ.
- Mức sửa lỗi QR H, viền trắng 4 ô và kiểm tra độ tương phản trước khi tải.
- Kiểm tra khả năng mã hóa QR trước khi hiển thị hoặc tải tệp, tránh xuất mã không hợp lệ.

## Phát triển

Yêu cầu Node.js 22.13 trở lên.

```bash
npm install
npm run dev
```

## Kiểm tra

```bash
npm run lint
npm test
```

`npm test` sẽ tạo bản dựng và xác nhận trang vẫn được render phía máy chủ, cùng các quy tắc an toàn quan trọng cho mã QR.

## Triển khai

Dự án được cấu hình cho OpenAI Sites qua `.openai/hosting.json` và xuất Cloudflare Worker-compatible ESM.
