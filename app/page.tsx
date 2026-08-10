"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

type Mode = "link" | "wifi" | "bank" | "text" | "email";
type Bank = { bin: string; shortName: string; name: string; transferSupported?: number };
type QRStyle = "square" | "round" | "dots";
type LayoutMode = "stamp" | "art";
type ArtCategory = "hai" | "nghe" | "giai-tri" | "kinh-doanh" | "su-kien" | "nong-nghiep" | "hang-rong" | "phong-canh" | "du-lich" | "bac-trung" | "nam-bien";
type LibraryArt = { id: string; name: string; mood: string; category: ArtCategory; src: string; x: number; y: number; size: number; caption: string };

const palettes = [
  { name: "Đen đá", value: "#171717", accent: "#FFD338" },
  { name: "Hồng bồng", value: "#9F1239", accent: "#FDA4AF" },
  { name: "Xanh lành", value: "#075E54", accent: "#6EE7B7" },
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
  { id: "square", name: "Vuông vức, quét cực", note: "Thẳng hàng, rõ ràng", caption: "VUÔNG VỨC, QUÉT CỰC" },
  { id: "round", name: "Bo tròn, quét giòn", note: "Mềm mắt, bắt nét", caption: "BO TRÒN, QUÉT GIÒN" },
  { id: "dots", name: "Chấm bi, quét đi", note: "Nhỏ xinh, quét nhanh", caption: "CHẤM BI, QUÉT ĐI" },
];

const artLibrary: LibraryArt[] = [
  { id: "meo", name: "Mèo mặt lạnh", mood: "Bựa vừa", category: "hai", src: "/art-library/meo-mat-lanh.png", x: 55, y: 68, size: 39, caption: "QUÉT ĐI, NHÌN GÌ" },
  { id: "capy", name: "Capy tan ca", mood: "Hài nhẹ", category: "hai", src: "/art-library/capybara-tan-ca.png", x: 76, y: 37, size: 40, caption: "QUÉT XONG RỒI NGHỈ" },
  { id: "ech", name: "Ếch trà đá", mood: "Dễ thương", category: "hai", src: "/art-library/ech-tra-da.png", x: 81, y: 35, size: 35, caption: "TRÀ ĐÁ CÓ MÃ" },
  { id: "cun", name: "Cún nón lá", mood: "Dễ thương", category: "hai", src: "/art-library/cun-non-la.png", x: 50, y: 73, size: 32, caption: "QUÉT NHẸ TAY NHA" },
  { id: "vit", name: "Vịt chạy đơn", mood: "Bựa vừa", category: "hai", src: "/art-library/vit-chay-don.png", x: 78, y: 57, size: 30, caption: "ĐƠN TỚI, QUÉT THÔI" },
  { id: "noi", name: "Nồi cơm chào hàng", mood: "Hài nhẹ", category: "hai", src: "/art-library/noi-com-chao-hang.png", x: 81, y: 57, size: 38, caption: "CƠM CHÍN, MÃ XONG" },
  { id: "bac-si", name: "Bác sĩ tận tâm", mood: "Y tế", category: "nghe", src: "/art-library/nganh-nghe/bac-si.png", x: 75, y: 58, size: 40, caption: "QUÉT NHẸ, KHỎE RE" },
  { id: "giao-vien", name: "Cô giáo vui tính", mood: "Giáo dục", category: "nghe", src: "/art-library/nganh-nghe/giao-vien.png", x: 70, y: 43, size: 45, caption: "QUÉT MÃ, VÀO BÀI" },
  { id: "tho-toc", name: "Thợ tóc có gu", mood: "Làm đẹp", category: "nghe", src: "/art-library/nganh-nghe/tho-toc.png", x: 76, y: 55, size: 42, caption: "QUÉT MÃ, ĐỔI KIỂU" },
  { id: "pha-che", name: "Pha chế tỉnh táo", mood: "Đồ uống", category: "nghe", src: "/art-library/nganh-nghe/pha-che.png", x: 76, y: 55, size: 36, caption: "QUÉT XONG, UỐNG NGON" },
  { id: "giao-hang", name: "Anh ship có mặt", mood: "Vận chuyển", category: "nghe", src: "/art-library/nganh-nghe/giao-hang.png", x: 67, y: 65, size: 34, caption: "HÀNG TỚI, QUÉT THÔI" },
  { id: "van-phong", name: "Văn phòng sáng cửa", mood: "Công sở", category: "nghe", src: "/art-library/nganh-nghe/van-phong.png", x: 70, y: 42, size: 43, caption: "QUÉT GỌN, LÀM NHANH" },
  { id: "rap-chieu", name: "Rạp chiếu mở màn", mood: "Điện ảnh", category: "giai-tri", src: "/art-library/giai-tri/rap-chieu.png", x: 66, y: 49, size: 50, caption: "QUÉT VÉ, VÀO PHIM" },
  { id: "ca-si", name: "Ca sĩ lên mic", mood: "Âm nhạc", category: "giai-tri", src: "/art-library/giai-tri/ca-si.png", x: 68, y: 54, size: 47, caption: "QUÉT MÃ, LÊN NHẠC" },
  { id: "bap-rang", name: "Bắp rang mời vé", mood: "Điện ảnh", category: "giai-tri", src: "/art-library/giai-tri/bap-rang-bo.png", x: 70, y: 52, size: 45, caption: "CÓ BẮP, CÓ PHIM" },
  { id: "tro-choi", name: "Thùng game tuổi thơ", mood: "Trò chơi", category: "giai-tri", src: "/art-library/giai-tri/tro-choi.png", x: 61, y: 40, size: 40, caption: "QUÉT MÃ, VÀO GAME" },
  { id: "dien-nhac", name: "DJ bật nhịp", mood: "Âm nhạc", category: "giai-tri", src: "/art-library/giai-tri/dien-nhac.png", x: 72, y: 50, size: 39, caption: "QUÉT XONG, QUẨY LUÔN" },
  { id: "san-khau", name: "Sân khấu sáng đèn", mood: "Biểu diễn", category: "giai-tri", src: "/art-library/giai-tri/san-khau.png", x: 70, y: 50, size: 45, caption: "QUÉT VÉ, VÀO VUI" },
  { id: "banh-mi", name: "Bánh mì nóng giòn", mood: "Ẩm thực", category: "kinh-doanh", src: "/art-library/kinh-doanh/banh-mi.png", x: 69, y: 67, size: 40, caption: "QUÉT MÃ, MUA BÁNH" },
  { id: "quan-mi", name: "Tô mì biết mời", mood: "Ẩm thực", category: "kinh-doanh", src: "/art-library/kinh-doanh/quan-mi.png", x: 73, y: 54, size: 39, caption: "MÌ NÓNG, MÃ GỌN" },
  { id: "tiem-hoa", name: "Tiệm hoa nở rộ", mood: "Bán lẻ", category: "kinh-doanh", src: "/art-library/kinh-doanh/tiem-hoa.png", x: 72, y: 72, size: 36, caption: "QUÉT MÃ, GỬI HOA" },
  { id: "thoi-trang", name: "Tiệm đồ có gu", mood: "Thời trang", category: "kinh-doanh", src: "/art-library/kinh-doanh/thoi-trang.png", x: 70, y: 73, size: 36, caption: "QUÉT MÃ, LÊN ĐỒ" },
  { id: "sua-xe", name: "Thợ máy chắc tay", mood: "Dịch vụ", category: "kinh-doanh", src: "/art-library/kinh-doanh/sua-xe.png", x: 70, y: 70, size: 43, caption: "QUÉT MÃ, SỬA NGAY" },
  { id: "cho-que", name: "Sạp chợ tươi vui", mood: "Bán lẻ", category: "kinh-doanh", src: "/art-library/kinh-doanh/cho-que.png", x: 71, y: 69, size: 35, caption: "CHỢ VUI, MÃ TỚI" },
  { id: "dam-cuoi", name: "Ngày vui có đôi", mood: "Cưới hỏi", category: "su-kien", src: "/art-library/su-kien/dam-cuoi.png", x: 68, y: 71, size: 38, caption: "QUÉT MÃ, CHUNG VUI" },
  { id: "sinh-nhat", name: "Bánh sinh nhật", mood: "Tiệc vui", category: "su-kien", src: "/art-library/su-kien/sinh-nhat.png", x: 74, y: 69, size: 38, caption: "QUÉT MÃ, THỔI NẾN" },
  { id: "tot-nghiep", name: "Tân khoa rạng rỡ", mood: "Tốt nghiệp", category: "su-kien", src: "/art-library/su-kien/tot-nghiep.png", x: 70, y: 69, size: 39, caption: "QUÉT MÃ, XEM THÀNH QUẢ" },
  { id: "du-lich", name: "Xách ba lô lên", mood: "Du lịch", category: "su-kien", src: "/art-library/su-kien/du-lich.png", x: 70, y: 68, size: 41, caption: "QUÉT MÃ, LÊN ĐƯỜNG" },
  { id: "chay-bo", name: "Chạy là có hội", mood: "Thể thao", category: "su-kien", src: "/art-library/su-kien/chay-bo.png", x: 72, y: 69, size: 40, caption: "QUÉT MÃ, CHẠY THÔI" },
  { id: "thien-nguyen", name: "Góp vui góp sức", mood: "Cộng đồng", category: "su-kien", src: "/art-library/su-kien/thien-nguyen.png", x: 71, y: 73, size: 38, caption: "QUÉT MÃ, GÓP NIỀM VUI" },
  { id: "lua-gao", name: "Mùa lúa chín", mood: "Trồng trọt", category: "nong-nghiep", src: "/art-library/nong-nghiep/lua-gao.png", x: 74, y: 64, size: 44, caption: "QUÉT MÃ, GẶT NIỀM VUI" },
  { id: "ca-phe", name: "Vườn cà phê", mood: "Nông sản", category: "nong-nghiep", src: "/art-library/nong-nghiep/ca-phe.png", x: 73, y: 64, size: 44, caption: "CÀ PHÊ THƠM, MÃ GỌN" },
  { id: "vuon-trai-cay", name: "Vườn trái ngọt", mood: "Nhà vườn", category: "nong-nghiep", src: "/art-library/nong-nghiep/vuon-trai-cay.png", x: 73, y: 64, size: 44, caption: "TRÁI TƯƠI, MÃ TỚI" },
  { id: "danh-ca", name: "Chuyến cá đầy khoang", mood: "Thủy sản", category: "nong-nghiep", src: "/art-library/nong-nghiep/danh-ca.png", x: 76, y: 69, size: 40, caption: "CÁ TƯƠI, QUÉT THÔI" },
  { id: "dam-sen", name: "Đầm sen sáng sớm", mood: "Trồng hoa", category: "nong-nghiep", src: "/art-library/nong-nghiep/dam-sen.png", x: 73, y: 69, size: 42, caption: "SEN NỞ, MÃ CHỜ" },
  { id: "bo-sua", name: "Trang trại bò sữa", mood: "Chăn nuôi", category: "nong-nghiep", src: "/art-library/nong-nghiep/bo-sua.png", x: 69, y: 71, size: 43, caption: "SỮA NGON, MÃ GỌN" },
  { id: "ganh-hang", name: "Gánh hàng rong", mood: "Phố quen", category: "hang-rong", src: "/art-library/hang-rong/ganh-hang.png", x: 58, y: 69, size: 38, caption: "GÁNH NHẸ, QUÉT NHANH" },
  { id: "tra-da", name: "Trà đá vỉa hè", mood: "Giải khát", category: "hang-rong", src: "/art-library/hang-rong/tra-da.png", x: 42, y: 70, size: 38, caption: "TRÀ MÁT, MÃ NÉT" },
  { id: "xe-hoa", name: "Xe hoa đầu phố", mood: "Hoa tươi", category: "hang-rong", src: "/art-library/hang-rong/xe-hoa.png", x: 42, y: 69, size: 36, caption: "HOA XINH, MÃ XỊN" },
  { id: "xe-trai-cay", name: "Xe trái cây", mood: "Hoa quả", category: "hang-rong", src: "/art-library/hang-rong/xe-trai-cay.png", x: 53, y: 73, size: 35, caption: "TRÁI TƯƠI, QUÉT THÔI" },
  { id: "bap-nuong", name: "Bắp nướng thơm lừng", mood: "Ăn vặt", category: "hang-rong", src: "/art-library/hang-rong/bap-nuong.png", x: 39, y: 75, size: 36, caption: "BẮP NÓNG, MÃ XONG" },
  { id: "xe-mi", name: "Xe mì ven đường", mood: "Món nóng", category: "hang-rong", src: "/art-library/hang-rong/xe-mi.png", x: 37, y: 74, size: 37, caption: "MÌ NGON, MÃ GỌN" },
  { id: "ruong-bac-thang", name: "Ruộng bậc thang", mood: "Miền núi", category: "phong-canh", src: "/art-library/phong-canh/ruong-bac-thang.png", x: 53, y: 65, size: 42, caption: "NÚI ĐỒI, QUÉT THÔI" },
  { id: "bien-xanh", name: "Biển xanh cát trắng", mood: "Miền biển", category: "phong-canh", src: "/art-library/phong-canh/bien-xanh.png", x: 43, y: 65, size: 36, caption: "BIỂN XANH, MÃ LÀNH" },
  { id: "song-nui", name: "Sông giữa núi", mood: "Non nước", category: "phong-canh", src: "/art-library/phong-canh/song-nui.png", x: 53, y: 69, size: 35, caption: "NON NƯỚC, MÃ THÔNG" },
  { id: "doi-thong", name: "Đồi thông sương sớm", mood: "Cao nguyên", category: "phong-canh", src: "/art-library/phong-canh/doi-thong.png", x: 53, y: 65, size: 40, caption: "THÔNG REO, MÃ THEO" },
  { id: "ho-sen", name: "Hồ sen bình minh", mood: "Đồng quê", category: "phong-canh", src: "/art-library/phong-canh/ho-sen.png", x: 59, y: 69, size: 35, caption: "SEN HỒNG, MÃ THÔNG" },
  { id: "deo-nui", name: "Đèo cao lộng gió", mood: "Đường núi", category: "phong-canh", src: "/art-library/phong-canh/deo-nui.png", x: 43, y: 68, size: 34, caption: "QUA ĐÈO, QUÉT THEO" },
  { id: "trekking", name: "Đi bộ đường dài", mood: "Khám phá", category: "du-lich", src: "/art-library/du-lich/trekking.png", x: 69, y: 52, size: 42, caption: "QUÉT BẢN ĐỒ, ĐI THÔI" },
  { id: "gia-dinh-bien", name: "Cả nhà đi biển", mood: "Nghỉ dưỡng", category: "du-lich", src: "/art-library/du-lich/gia-dinh-bien.png", x: 73, y: 65, size: 40, caption: "CẢ NHÀ, CÙNG QUÉT" },
  { id: "dap-xe", name: "Đạp xe ngắm lúa", mood: "Trải nghiệm", category: "du-lich", src: "/art-library/du-lich/dap-xe.png", x: 70, y: 69, size: 40, caption: "ĐẠP XE, QUÉT NHẸ" },
  { id: "cam-trai", name: "Cắm trại rừng thông", mood: "Ngoài trời", category: "du-lich", src: "/art-library/du-lich/cam-trai.png", x: 71, y: 49, size: 47, caption: "DỰNG LỀU, DỰNG MÃ" },
  { id: "du-thuyen", name: "Thuyền trôi non nước", mood: "Đường sông", category: "du-lich", src: "/art-library/du-lich/du-thuyen.png", x: 54, y: 73, size: 36, caption: "LÊN THUYỀN, QUÉT LIỀN" },
  { id: "check-in", name: "Hội bạn check-in", mood: "Kỷ niệm", category: "du-lich", src: "/art-library/du-lich/check-in.png", x: 68, y: 42, size: 45, caption: "QUÉT MÃ, LƯU KỶ NIỆM" },
  { id: "ha-noi", name: "Hà Nội · Hồ Gươm", mood: "Thủ đô", category: "bac-trung", src: "/art-library/mien-bac-trung/ha-noi.png", x: 75, y: 76, size: 36, caption: "HÀ NỘI, QUÉT RỒI ĐI" },
  { id: "quang-ninh", name: "Quảng Ninh · Hạ Long", mood: "Vịnh biển", category: "bac-trung", src: "/art-library/mien-bac-trung/quang-ninh.png", x: 75, y: 76, size: 36, caption: "VỊNH XANH, MÃ LÀNH" },
  { id: "ninh-binh", name: "Ninh Bình · Tràng An", mood: "Non nước", category: "bac-trung", src: "/art-library/mien-bac-trung/ninh-binh.png", x: 75, y: 76, size: 36, caption: "TRÀNG AN, QUÉT NHANH" },
  { id: "ha-giang", name: "Hà Giang · Đường đèo", mood: "Cực Bắc", category: "bac-trung", src: "/art-library/mien-bac-trung/ha-giang.png", x: 74, y: 74, size: 36, caption: "HÀ GIANG, MÃ SẴN SÀNG" },
  { id: "lao-cai", name: "Lào Cai · Sa Pa", mood: "Ruộng núi", category: "bac-trung", src: "/art-library/mien-bac-trung/lao-cai.png", x: 74, y: 74, size: 36, caption: "SA PA, QUÉT LÀ RA" },
  { id: "hue", name: "Huế · Kinh thành", mood: "Di sản", category: "bac-trung", src: "/art-library/mien-bac-trung/hue.png", x: 75, y: 74, size: 36, caption: "HUẾ THƯƠNG, MÃ VƯƠNG" },
  { id: "tp-hcm", name: "TP.HCM · Chợ Bến Thành", mood: "Đô thị", category: "nam-bien", src: "/art-library/mien-nam-bien/tp-hcm.png", x: 36, y: 72, size: 36, caption: "SÀI GÒN, QUÉT GỌN" },
  { id: "da-nang", name: "Đà Nẵng · Cầu Rồng", mood: "Sông biển", category: "nam-bien", src: "/art-library/mien-nam-bien/da-nang.png", x: 33, y: 72, size: 36, caption: "ĐÀ NẴNG, QUÉT THẲNG" },
  { id: "hoi-an", name: "Quảng Nam · Hội An", mood: "Phố cổ", category: "nam-bien", src: "/art-library/mien-nam-bien/hoi-an.png", x: 32, y: 72, size: 36, caption: "HỘI AN, MÃ SẴN" },
  { id: "da-lat", name: "Lâm Đồng · Đà Lạt", mood: "Cao nguyên", category: "nam-bien", src: "/art-library/mien-nam-bien/da-lat.png", x: 35, y: 75, size: 35, caption: "ĐÀ LẠT, QUÉT PHÁT" },
  { id: "can-tho", name: "Cần Thơ · Chợ nổi", mood: "Miền sông", category: "nam-bien", src: "/art-library/mien-nam-bien/can-tho.png", x: 75, y: 68, size: 36, caption: "CẦN THƠ, MÃ ĐỢI" },
  { id: "phu-quoc", name: "Kiên Giang · Phú Quốc", mood: "Đảo ngọc", category: "nam-bien", src: "/art-library/mien-nam-bien/phu-quoc.png", x: 75, y: 75, size: 35, caption: "ĐẢO XANH, MÃ LÀNH" },
];

const artCategories: { id: ArtCategory; label: string; icon: string }[] = [
  { id: "hai", label: "Tấu hài", icon: "☺" },
  { id: "nghe", label: "Ngành nghề", icon: "✦" },
  { id: "giai-tri", label: "Phim & vui", icon: "▶" },
  { id: "kinh-doanh", label: "Bán & ăn", icon: "₫" },
  { id: "su-kien", label: "Dịp đặc biệt", icon: "★" },
  { id: "nong-nghiep", label: "Nông nghiệp", icon: "♧" },
  { id: "hang-rong", label: "Hàng rong", icon: "☕" },
  { id: "phong-canh", label: "Phong cảnh", icon: "⌁" },
  { id: "du-lich", label: "Du lịch", icon: "↗" },
  { id: "bac-trung", label: "Bắc & Trung", icon: "△" },
  { id: "nam-bien", label: "Nam & Biển", icon: "◉" },
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

function colorLuminance(hex: string) {
  const values = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255).map((value) => value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4));
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

function contrastOnWhite(hex: string) {
  const dark = colorLuminance(hex);
  return 1.05 / (dark + 0.05);
}

function drawImageContained(context: CanvasRenderingContext2D, image: HTMLImageElement, size: number) {
  const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, size, size);
  context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
}

function drawLegacyWorkshopDoodle(context: CanvasRenderingContext2D, size: number, accent: string) {
  context.fillStyle = "#f4eedf";
  context.fillRect(0, 0, size, size);
  context.strokeStyle = "#17221f";
  context.lineWidth = size * 0.009;
  context.lineCap = "round";
  context.lineJoin = "round";

  context.fillStyle = "#fff";
  context.beginPath();
  context.moveTo(size * 0.34, size * 0.12);
  context.lineTo(size * 0.92, size * 0.09);
  context.lineTo(size * 0.9, size * 0.72);
  context.lineTo(size * 0.35, size * 0.76);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = accent;
  context.beginPath();
  context.moveTo(size * 0.08, size * 0.57);
  context.lineTo(size * 0.16, size * 0.45);
  context.lineTo(size * 0.22, size * 0.57);
  context.lineTo(size * 0.29, size * 0.47);
  context.lineTo(size * 0.33, size * 0.62);
  context.lineTo(size * 0.27, size * 0.73);
  context.lineTo(size * 0.31, size * 0.92);
  context.lineTo(size * 0.2, size * 0.82);
  context.lineTo(size * 0.12, size * 0.91);
  context.lineTo(size * 0.14, size * 0.72);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "#17221f";
  context.beginPath();
  context.arc(size * 0.16, size * 0.59, size * 0.035, 0, Math.PI * 2);
  context.arc(size * 0.25, size * 0.59, size * 0.035, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.moveTo(size * 0.2, size * 0.63);
  context.lineTo(size * 0.18, size * 0.66);
  context.lineTo(size * 0.22, size * 0.66);
  context.closePath();
  context.fill();

  context.font = `700 ${size * 0.035}px Arial, sans-serif`;
  context.textAlign = "left";
  context.fillText("TRANH CỦA BẠN", size * 0.49, size * 0.83);
  context.font = `500 ${size * 0.02}px Arial, sans-serif`;
  context.fillText("Tải ảnh lên · Đặt mã vào · Xuất tranh ra", size * 0.49, size * 0.87);
}

function drawWorkshopDoodle(context: CanvasRenderingContext2D, size: number, accent: string) {
  context.fillStyle = "#f4eedf";
  context.fillRect(0, 0, size, size);
  context.strokeStyle = "rgba(23,34,31,.12)";
  context.lineWidth = 1;
  for (let offset = 0; offset < size; offset += size / 18) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset, size);
    context.moveTo(0, offset);
    context.lineTo(size, offset);
    context.stroke();
  }
  context.fillStyle = accent;
  context.fillRect(size * 0.12, size * 0.18, size * 0.76, size * 0.58);
  context.fillStyle = "#fff";
  context.fillRect(size * 0.2, size * 0.26, size * 0.6, size * 0.42);
  context.fillStyle = "#17221f";
  context.textAlign = "center";
  context.font = `800 ${size * 0.038}px Arial, sans-serif`;
  context.fillText("CHỌN TRANH HOẶC NẠP ẢNH", size / 2, size * 0.46);
  context.font = `600 ${size * 0.022}px Arial, sans-serif`;
  context.fillText("Mã sẽ tự tìm một chỗ đẹp", size / 2, size * 0.52);
}

type ArtboardOptions = {
  image: HTMLImageElement | null;
  x: number;
  y: number;
  size: number;
  rotation: number;
  paper: boolean;
  caption: string;
  subcaption: string;
};

function drawArtboard(context: CanvasRenderingContext2D, canvasSize: number, payload: string, ink: string, accent: string, style: QRStyle, options: ArtboardOptions) {
  if (options.image) drawImageContained(context, options.image, canvasSize);
  else drawWorkshopDoodle(context, canvasSize, accent);

  const qrSize = canvasSize * Math.max(options.size, 30) / 100;
  const angle = options.rotation * Math.PI / 180;
  const safeHalf = qrSize / 2 * (Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle)));
  const qrX = Math.max(safeHalf, Math.min(canvasSize - safeHalf, canvasSize * options.x / 100));
  const qrY = Math.max(safeHalf, Math.min(canvasSize - safeHalf, canvasSize * options.y / 100));
  context.save();
  context.translate(qrX, qrY);
  context.rotate(angle);
  if (options.paper) {
    context.shadowColor = "rgba(23,34,31,.28)";
    context.shadowBlur = canvasSize * 0.018;
    context.shadowOffsetX = canvasSize * 0.012;
    context.shadowOffsetY = canvasSize * 0.016;
    context.fillStyle = "#fff";
    context.fillRect(-qrSize * 0.54, -qrSize * 0.54, qrSize * 1.08, qrSize * 1.08);
    context.shadowColor = "transparent";
  }
  drawQR(context, payload, ink, style, -qrSize / 2, -qrSize / 2, qrSize);
  context.restore();

  if (options.caption.trim()) {
    context.textAlign = "center";
    context.fillStyle = "#17221f";
    context.font = `800 ${canvasSize * 0.038}px Arial, sans-serif`;
    context.fillText(options.caption.trim().toUpperCase(), canvasSize / 2, canvasSize * 0.91);
    context.font = `600 ${canvasSize * 0.023}px Arial, sans-serif`;
    context.fillText(options.subcaption.trim(), canvasSize / 2, canvasSize * 0.95);
  }
}

function renderArtPreview(canvas: HTMLCanvasElement, payload: string, ink: string, accent: string, style: QRStyle, options: ArtboardOptions) {
  const size = 900;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return;
  drawArtboard(context, size, payload, ink, accent, style, options);
}

function downloadArtPNG(payload: string, ink: string, accent: string, style: QRStyle, options: ArtboardOptions, filename: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1800;
  canvas.height = 1800;
  const context = canvas.getContext("2d");
  if (!context) return;
  drawArtboard(context, 1800, payload, ink, accent, style, options);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${filename}-tranh.png`;
  link.click();
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const artCanvasRef = useRef<HTMLCanvasElement>(null);
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
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("stamp");
  const [artImage, setArtImage] = useState<HTMLImageElement | null>(null);
  const [selectedArt, setSelectedArt] = useState(artLibrary[0].id);
  const [artCategory, setArtCategory] = useState<ArtCategory>("hai");
  const [artX, setArtX] = useState(65);
  const [artY, setArtY] = useState(38);
  const [artSize, setArtSize] = useState(45);
  const [artRotation, setArtRotation] = useState(0);
  const [artPaper, setArtPaper] = useState(true);
  const [artCaption, setArtCaption] = useState("QUÉT ĐI, NGẠI GÌ");
  const [artSubcaption, setArtSubcaption] = useState("Mã riêng của bạn · Nét riêng của bạn");
  const [notice, setNotice] = useState("Mã lên nét, quét là kết");

  const chooseLibraryArt = (item: LibraryArt) => {
    const image = new Image();
    image.onload = () => {
      setArtImage(image);
      setSelectedArt(item.id);
      setArtCategory(item.category);
      setArtX(item.x);
      setArtY(item.y);
      setArtSize(item.size);
      setArtRotation(0);
      setArtPaper(false);
      setArtCaption(item.caption);
      setArtSubcaption("Mã riêng của bạn · Nét riêng của bạn");
      setLayoutMode("art");
      setNotice(`${item.name} đã vào khay, mã tự tìm ngay chỗ đẹp`);
    };
    image.src = item.src;
  };

  useEffect(() => {
    chooseLibraryArt(artLibrary[0]);
  }, []);

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
  }, [payload, mode, value, bankAccount, bankAmount]);

  const colorIsSafe = contrastOnWhite(palette.value) >= 4.5;

  const artOptions: ArtboardOptions = {
    image: artImage,
    x: artX,
    y: artY,
    size: artSize,
    rotation: artRotation,
    paper: artPaper,
    caption: artCaption,
    subcaption: artSubcaption,
  };

  const visibleArt = artLibrary.filter((item) => item.category === artCategory);

  useEffect(() => {
    if (!inputIsValid || !colorIsSafe) return;
    try {
      if (layoutMode === "art" && artCanvasRef.current) renderArtPreview(artCanvasRef.current, payload, palette.value, palette.accent, qrStyle, artOptions);
      else if (canvasRef.current) renderPreview(canvasRef.current, payload, palette.value, qrStyle);
    } catch {
      setNotice("Chữ dài lắm lời, bớt đi bạn ơi");
    }
  }, [payload, palette, qrStyle, inputIsValid, colorIsSafe, layoutMode, artImage, artX, artY, artSize, artRotation, artPaper, artCaption, artSubcaption]);

  useEffect(() => {
    setNotice(
      !colorIsSafe
        ? "Mực còn nhạt màu, quét dễ lao đao"
        : !payload
        ? "Chưa có đầu vào, mã biết làm sao"
        : !inputIsValid
          ? "Chưa đúng chưa êm, xem lại rồi thêm"
          : payload.length > 500
            ? "Chữ dài lê thê, quét xa dễ chê"
            : "Mã lên nét, quét là kết",
    );
  }, [payload, inputIsValid, colorIsSafe]);

  const uploadArtwork = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice("Tệp này chưa phải ảnh, chọn lại cho lành");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotice("Ảnh nặng quá tay, chọn dưới 10 MB ngay");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        setArtImage(image);
        setSelectedArt("custom");
        setLayoutMode("art");
        setArtPaper(true);
        setNotice("Tranh đã vào khay, đặt mã cho hay");
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const download = async (format: "png" | "svg") => {
    if (!inputIsValid || !colorIsSafe) return;
    const filename = `qroi-xong-${Date.now()}`;
    const selectedStyle = qrStyles.find((item) => item.id === qrStyle) ?? qrStyles[0];
    if (format === "png") {
      if (layoutMode === "art") downloadArtPNG(payload, palette.value, palette.accent, qrStyle, artOptions, filename);
      else downloadStyledPNG(payload, palette.value, palette.accent, qrStyle, selectedStyle.caption, filename);
    } else {
      const svg = styledSVG(payload, palette.value, palette.accent, qrStyle, selectedStyle.caption);
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    }
    setNotice(`${format.toUpperCase()} về máy gọn ghẽ — đem khoe lẹ làng ✨`);
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setValue("");
    setEmailSubject("");
  };

  return (
    <main>
      <div className="ticker" aria-hidden="true">ĐƯA CHỮ VÀO · DẬP MÃ RA · ĐƯA TRANH VÀO · ĐẶT MÃ LÊN · QUÉT MỘT PHÁT · XONG MỘT VIỆC</div>
      <nav className="nav wrap" aria-label="Điều hướng chính">
        <a className="brand" href="#top" aria-label="QRồi Xong - trang chủ">
          <span className="brand-mark">QR!</span>
          <span>QRồi Xong!</span>
        </a>
        <div className="nav-links"><a href="#top">Bàn máy</a><a href="#about">Lời xưởng</a><a href="#tech">Phiếu máy</a></div>
        <div className="nav-note"><span /> Xưởng đang mở cửa</div>
      </nav>

      <section className="hero wrap" id="top">
        <div className="hero-copy">
          <div className="eyebrow">XƯỞNG DẬP MÃ SỐ 01 · VIỆT NAM</div>
          <h1>Đưa tranh vào.<br /><em>Dập mã ra.</em></h1>
          <p>Tự đặt mã lên bất kỳ bức hình nào — gọn mắt, có duyên, quét vẫn chuẩn.</p>
          <small>Sửa lỗi H · Viền trắng 4 ô · Mắt mã luôn được giữ nguyên.</small>
        </div>
        <div className="doodle" aria-hidden="true">
          <span className="arrow">↳</span>
          <span className="doodle-copy">Vặn vừa tay.<br />Tải ngay về máy.</span>
        </div>
      </section>

      <section className="maker wrap" aria-label="Công cụ tạo mã QR">
        <div className="panel form-panel">
          <div className="panel-heading">
            <span className="step">01</span>
            <div><h2>Nạp nội dung</h2><p>Điền vừa đủ, máy dập vừa đẹp.</p></div>
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
                  <label>Mật khẩu<input type="password" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} placeholder="Điền cho kín, chẳng ai nhìn" /></label>
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
                    <input value={bankNote} onChange={(event) => setBankNote(event.target.value)} maxLength={50} placeholder="Ví dụ: TIEN CA PHE" />
                  </label>
                </div>
                <div className="bank-warning"><b>Nhắc cho kỹ, khỏi phí tiền:</b> Mã chỉ điền hộ, không chuyển tiền hộ. Tên đúng, tiền đủ, lời nhắn rõ rồi mới xác nhận.</div>
              </>
            ) : (
              <>
                <label>
                  {mode === "link" ? "Dán đường dẫn vào đây" : mode === "email" ? "Địa chỉ thư điện tử" : "Lời nhắn kín (hoặc chẳng kín)"}
                  {mode === "text" ? (
                    <textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ví dụ: Nhớ mua rau. Quên là đau." rows={4} />
                  ) : (
                    <input type={mode === "email" ? "email" : "text"} value={value} onChange={(e) => setValue(e.target.value)} placeholder={mode === "email" ? "hello@congty.vn" : "tenmien.vn/mon-ngon"} />
                  )}
                </label>
                {mode === "email" && <label>Tiêu đề (không bắt buộc)<input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Ví dụ: Em gửi file rồi ạ" /></label>}
              </>
            )}
            <div className="privacy-line"><span>◉</span> {mode === "bank" ? "Tài khoản với số tiền chỉ ghép liền trên máy." : "Dữ liệu nằm yên, máy chủ làm thinh."}</div>
          </div>

          <div className="palette-section">
            <div className="label-row"><span>Pha mực cho mã</span><span>Tương phản {contrastOnWhite(palette.value).toFixed(1)}:1 {colorIsSafe ? "· Đủ đậm ✓" : "· Còn nhạt ✕"}</span></div>
            <div className="palettes">
              {palettes.map((item) => (
                <button key={item.name} className={palette.name === item.name ? "palette active" : "palette"} onClick={() => setPalette(item)} aria-label={`Chọn màu ${item.name}`}>
                  <i style={{ background: item.value }} /><span>{item.name}</span>
                </button>
              ))}
              <label className="color-well">Mực<input type="color" value={palette.value} onChange={(event) => setPalette({ name: "Tự pha", value: event.target.value, accent: palette.accent })} /></label>
              <label className="color-well">Nền<input type="color" value={palette.accent} onChange={(event) => setPalette({ name: "Tự pha", value: palette.value, accent: event.target.value })} /></label>
            </div>
          </div>

          <div className="shape-section">
            <div className="label-row"><span>Chọn dáng cho đáng</span><span>Mắt mã vuông, đường quét thông ✓</span></div>
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
          <div className="tape">BẢN DẬP XEM TRƯỚC</div>
          <div className="layout-switch" role="group" aria-label="Kiểu xuất mã">
            <button className={layoutMode === "stamp" ? "active" : ""} onClick={() => setLayoutMode("stamp")}>Tem gọn</button>
            <button className={layoutMode === "art" ? "active" : ""} onClick={() => setLayoutMode("art")}>Dán vào tranh</button>
          </div>
          {layoutMode === "art" ? (
            <div className="art-stage">{inputIsValid && colorIsSafe ? <canvas ref={artCanvasRef} className="art-canvas" aria-label="Tranh ghép mã QR xem trước" /> : <div className="empty-qr"><span>?</span><p>Đủ chữ, đậm mực<br />tranh mới hiện hình</p></div>}</div>
          ) : (
            <div className={`qr-costume ${qrStyle}`}><div className="qr-shell">{inputIsValid && colorIsSafe ? <canvas ref={canvasRef} aria-label="Mã QR xem trước" /> : <div className="empty-qr"><span>?</span><p>Mã đang ngồi chờ<br />bạn cho chút chữ</p></div>}</div><div className="costume-caption">{(qrStyles.find((item) => item.id === qrStyle) ?? qrStyles[0]).caption}</div></div>
          )}
          <div className={`health ${inputIsValid && colorIsSafe ? "good" : "wait"}`}><span>●</span>{notice}</div>
          <div className="tech-badges">
            <span>Sửa lỗi H · Chịu va</span><span>Viền 4 ô · Dễ dò</span><span>{layoutMode === "art" ? artSize >= 36 ? "Cỡ lớn · Dễ quét" : "Cỡ vừa · Quét gần" : mode === "bank" ? "VietQR · CRC16" : "Mã tĩnh · Kín thinh"}</span>
          </div>
          {layoutMode === "art" && <div className="art-controls">
            <div className="library-head"><div><b>KỆ TRANH CÓ SẴN</b><span>Chọn chủ đề, mã tự vào đúng chỗ.</span></div><em>{artLibrary.length} mẫu gốc</em></div>
            <div className="category-tabs" role="tablist" aria-label="Chủ đề tranh">
              {artCategories.map((item) => <button key={item.id} role="tab" aria-selected={artCategory === item.id} className={artCategory === item.id ? "active" : ""} onClick={() => setArtCategory(item.id)}><b>{item.icon}</b>{item.label}<small>{artLibrary.filter((art) => art.category === item.id).length}</small></button>)}
            </div>
            <div className="art-library" aria-label="Kho tranh có sẵn">
              {visibleArt.map((item) => <button key={item.id} className={selectedArt === item.id ? "art-card active" : "art-card"} onClick={() => chooseLibraryArt(item)} aria-label={`Chọn tranh ${item.name}`}>
                <img src={item.src} alt="" /><span><b>{item.name}</b><small>{item.mood}</small></span>
              </button>)}
            </div>
            <p className="safe-note"><b>◎ Vùng mã đã căn sẵn:</b> nền sáng, không đè nhân vật, đủ khoảng trắng để máy dễ quét.</p>
            <div className="custom-divider"><span>HOẶC ẢNH RIÊNG CỦA BẠN</span></div>
            <label className={selectedArt === "custom" ? "upload-button selected" : "upload-button"}>+ Nạp ảnh riêng<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadArtwork} /></label>
            <p className="hint">JPG, PNG, WEBP · dưới 10 MB · ảnh chỉ nằm trên máy bạn</p>
            <details className="photo-guide">
              <summary>Ảnh nào dập mã sẽ đẹp? <span>Mở bí kíp ↓</span></summary>
              <div className="guide-body">
                <div className="guide-pictures" aria-hidden="true"><i className="good"><b>QR</b></i><i className="bad"><b>QR</b></i></div>
                <ul><li><b>Chừa một mảng trống 35–50%</b> để mã không che mặt người hay món đồ chính.</li><li><b>Ít chi tiết phía sau mã.</b> Ảnh càng rối, nên bật “lót giấy trắng”.</li><li><b>Ảnh vuông hoặc dọc, từ 800 px.</b> Tránh ảnh mờ, chụp quá tối hoặc cắt sát chủ thể.</li></ul>
              </div>
            </details>
            <div className="slider-grid">
              <label>Ngang <output>{artX}%</output><input type="range" min="15" max="85" value={artX} onChange={(e) => setArtX(Number(e.target.value))} /></label>
              <label>Dọc <output>{artY}%</output><input type="range" min="15" max="82" value={artY} onChange={(e) => setArtY(Number(e.target.value))} /></label>
              <label>Cỡ mã <output>{artSize}%</output><input type="range" min="30" max="68" value={artSize} onChange={(e) => setArtSize(Number(e.target.value))} /></label>
              <label>Xoay <output>{artRotation}°</output><input type="range" min="-15" max="15" value={artRotation} onChange={(e) => setArtRotation(Number(e.target.value))} /></label>
            </div>
            <label className="paper-check"><input type="checkbox" checked={artPaper} onChange={(e) => setArtPaper(e.target.checked)} /> Lót giấy trắng sau mã</label>
            <div className="caption-grid"><label>Câu trên<input value={artCaption} maxLength={36} onChange={(e) => setArtCaption(e.target.value)} /></label><label>Câu dưới<input value={artSubcaption} maxLength={54} onChange={(e) => setArtSubcaption(e.target.value)} /></label></div>
            {selectedArt === "custom" && <button className="text-button" onClick={() => chooseLibraryArt(artLibrary[0])}>Bỏ ảnh riêng, về kệ tranh ↺</button>}
          </div>}
          <div className="download-row">
            <button className="primary" disabled={!inputIsValid || !colorIsSafe} onClick={() => download("png")}>{layoutMode === "art" ? "Tải cả tranh PNG" : "Tải tem PNG"} <span>↓</span></button>
            <button className="secondary" disabled={!inputIsValid || !colorIsSafe} onClick={() => download("svg")}>SVG riêng mã</button>
          </div>
          <p className="scan-tip">Dặn thật lòng: quét thử trước khi đem in số lượng lớn.</p>
        </aside>
      </section>

      <section className="why wrap">
        <div className="why-title"><span>BIÊN BẢN KIỂM ĐỊNH</span><h2>Vui ngoài mặt. Chuẩn tận ruột.</h2></div>
        <div className="proof-grid">
          <article><b>4 ô</b><h3>Chừa bốn ô, máy dễ dò</h3><p>Khoảng trắng đủ bốn bề giúp máy bắt hình nhanh, quét xong khỏi giật mình.</p></article>
          <article><b>H</b><h3>Chịu xước, chịu va</h3><p>Sửa lỗi mức H giúp mã bền bỉ khi dính bẩn hoặc sứt mẻ đôi phần.</p></article>
          <article><b>□</b><h3>Mắt vuông, đường thông</h3><p>Trang trí phần dữ liệu nhưng giữ nguyên các ô định vị và vùng kỹ thuật.</p></article>
        </div>
      </section>

      <section className="about wrap" id="about">
        <div className="section-kicker">LỜI XƯỞNG · NÓI CHO TƯỜNG</div>
        <div className="about-grid">
          <div><h2>Mã không cần nhạt.<br />Tranh vẫn <em>quét đạt.</em></h2></div>
          <div className="about-copy">
            <p><b>QRồi Xong!</b> tách phần vui và phần chuẩn thành hai lớp. Bạn tha hồ đổi tranh, câu chữ, vị trí và kích thước; phần QR vẫn giữ vùng an toàn riêng.</p>
            <p>Không rút gọn đường dẫn. Không giữ lại nội dung. Không biến mã tĩnh thành chiếc vé thu tiền dài hạn. Mã ngân hàng được ghép ngay trên máy; ứng dụng ngân hàng mới là nơi kiểm tra và xác nhận.</p>
            <div className="about-sign">Làm cho chuẩn. Nói cho duyên. Quét phát liền. ↗</div>
          </div>
        </div>
      </section>

      <section className="stack-section" id="tech">
        <div className="wrap">
          <div className="why-title"><span>KÊ ĐỒ NGHỀ · NÓI GỌN GHẼ</span><h2>Máy chạy bằng gì?</h2></div>
          <div className="stack-grid">
            <article><span>01</span><h3>React 19</h3><p>Bạn vừa gõ xong, mã đã nấu xong.</p></article>
            <article><span>02</span><h3>TypeScript</h3><p>Dữ liệu ngay hàng, bớt lỗi lang thang.</p></article>
            <article><span>03</span><h3>node-qrcode</h3><p>Lõi tạo mã lâu năm, làm PNG lẫn SVG, sửa lỗi mức H.</p></article>
            <article><span>04</span><h3>VietQR · CRC16</h3><p>Chuỗi chuyển khoản ghép tại máy, có thể điền sẵn số tiền.</p></article>
            <article><span>05</span><h3>Cloudflare Edge</h3><p>Trang nhẹ, tải lẹ, chẳng cần kho dữ liệu cồng kềnh.</p></article>
          </div>
          <p className="stack-footnote">Không chuỗi khối cho kêu. Không trí tuệ nhân tạo cho sang. Cần gì, dùng nấy.</p>
        </div>
      </section>

      <footer className="wrap">
        <div className="brand"><span className="brand-mark">QR!</span><span>QRồi Xong!</span></div>
        <p>Làm mã cho chuẩn. Nói chữ cho duyên.</p>
        <a href="#top">Lên đầu trang ↑</a>
      </footer>
    </main>
  );
}
