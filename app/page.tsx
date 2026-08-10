"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { artFrames } from "./art-frames";

type Mode = "link" | "wifi" | "bank" | "text" | "email";
type Bank = { bin: string; shortName: string; name: string; transferSupported?: number };
type QRStyle = "square" | "round" | "dots";
type LayoutMode = "stamp" | "art";
type ArtCategory = "hai" | "hai-thu" | "hai-cong-so" | "hai-do-an" | "hai-doi-thuong" | "nghe" | "giai-tri" | "kinh-doanh" | "su-kien" | "nong-nghiep" | "hang-rong" | "phong-canh" | "du-lich" | "bac-trung" | "nam-bien";
type LibraryArt = { id: string; name: string; mood: string; category: ArtCategory; src: string; x: number; y: number; size: number; caption: string; rotation?: number };

const palettes = [
  { name: "Đen", value: "#171717", accent: "#FFD338" },
  { name: "Đỏ đậm", value: "#9F1239", accent: "#FDA4AF" },
  { name: "Xanh lá đậm", value: "#075E54", accent: "#6EE7B7" },
  { name: "Tím đậm", value: "#4C1D95", accent: "#C4B5FD" },
];

const modes: { id: Mode; label: string; icon: string }[] = [
  { id: "link", label: "Đường dẫn", icon: "↗" },
  { id: "wifi", label: "Wi-Fi", icon: "⌁" },
  { id: "bank", label: "Ngân hàng", icon: "₫" },
  { id: "text", label: "Văn bản", icon: "✎" },
  { id: "email", label: "Email", icon: "@" },
];

const qrStyles: { id: QRStyle; name: string; note: string; caption: string }[] = [
  { id: "square", name: "Ô vuông tiêu chuẩn", note: "Tương phản rõ, dễ quét", caption: "MÃ QR TIÊU CHUẨN" },
  { id: "round", name: "Ô bo góc", note: "Mềm hơn nhưng vẫn rõ", caption: "MÃ QR BO GÓC" },
  { id: "dots", name: "Chấm tròn", note: "Trang trí phần dữ liệu", caption: "MÃ QR CHẤM TRÒN" },
];

const artLibrary: LibraryArt[] = [
  { id: "meo", name: "Mèo mặt lạnh", mood: "Bựa vừa", category: "hai", src: "/art-library/meo-mat-lanh.png", x: 55, y: 68, size: 39, caption: "QUÉT ĐI, NHÌN GÌ", rotation: -2 },
  { id: "capy", name: "Capy tan ca", mood: "Hài nhẹ", category: "hai", src: "/art-library/capybara-tan-ca.png", x: 76, y: 37, size: 40, caption: "QUÉT XONG RỒI NGHỈ" },
  { id: "ech", name: "Ếch trà đá", mood: "Dễ thương", category: "hai", src: "/art-library/ech-tra-da.png", x: 81, y: 35, size: 30, caption: "TRÀ ĐÁ CÓ MÃ" },
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
  { id: "cho-que", name: "Sạp chợ tươi vui", mood: "Bán lẻ", category: "kinh-doanh", src: "/art-library/kinh-doanh/cho-que.png", x: 71, y: 69, size: 35, caption: "QUÉT MÃ, GHÉ SẠP" },
  { id: "dam-cuoi", name: "Ngày vui có đôi", mood: "Cưới hỏi", category: "su-kien", src: "/art-library/su-kien/dam-cuoi.png", x: 68, y: 71, size: 38, caption: "QUÉT MÃ, CHUNG VUI" },
  { id: "sinh-nhat", name: "Bánh sinh nhật", mood: "Tiệc vui", category: "su-kien", src: "/art-library/su-kien/sinh-nhat.png", x: 74, y: 69, size: 38, caption: "QUÉT MÃ, THỔI NẾN" },
  { id: "tot-nghiep", name: "Tân khoa rạng rỡ", mood: "Tốt nghiệp", category: "su-kien", src: "/art-library/su-kien/tot-nghiep.png", x: 70, y: 69, size: 39, caption: "QUÉT MÃ, XEM THÀNH QUẢ" },
  { id: "du-lich", name: "Xách ba lô lên", mood: "Du lịch", category: "su-kien", src: "/art-library/su-kien/du-lich.png", x: 70, y: 68, size: 41, caption: "QUÉT MÃ, LÊN ĐƯỜNG" },
  { id: "chay-bo", name: "Chạy là có hội", mood: "Thể thao", category: "su-kien", src: "/art-library/su-kien/chay-bo.png", x: 72, y: 69, size: 40, caption: "QUÉT MÃ, CHẠY THÔI" },
  { id: "thien-nguyen", name: "Góp vui góp sức", mood: "Cộng đồng", category: "su-kien", src: "/art-library/su-kien/thien-nguyen.png", x: 71, y: 73, size: 38, caption: "QUÉT MÃ, GÓP NIỀM VUI" },
  { id: "lua-gao", name: "Mùa lúa chín", mood: "Trồng trọt", category: "nong-nghiep", src: "/art-library/nong-nghiep/lua-gao.png", x: 74, y: 64, size: 44, caption: "QUÉT MÃ, GẶT NIỀM VUI" },
  { id: "ca-phe", name: "Vườn cà phê", mood: "Nông sản", category: "nong-nghiep", src: "/art-library/nong-nghiep/ca-phe.png", x: 73, y: 64, size: 44, caption: "QUÉT MÃ, XEM VƯỜN" },
  { id: "vuon-trai-cay", name: "Vườn trái ngọt", mood: "Nhà vườn", category: "nong-nghiep", src: "/art-library/nong-nghiep/vuon-trai-cay.png", x: 73, y: 64, size: 44, caption: "QUÉT MÃ, CHỌN TRÁI" },
  { id: "danh-ca", name: "Chuyến cá đầy khoang", mood: "Thủy sản", category: "nong-nghiep", src: "/art-library/nong-nghiep/danh-ca.png", x: 76, y: 69, size: 40, caption: "CÁ TƯƠI, QUÉT THÔI" },
  { id: "dam-sen", name: "Đầm sen sáng sớm", mood: "Trồng hoa", category: "nong-nghiep", src: "/art-library/nong-nghiep/dam-sen.png", x: 73, y: 69, size: 42, caption: "QUÉT MÃ, NGẮM SEN" },
  { id: "bo-sua", name: "Trang trại bò sữa", mood: "Chăn nuôi", category: "nong-nghiep", src: "/art-library/nong-nghiep/bo-sua.png", x: 69, y: 71, size: 43, caption: "QUÉT MÃ, THĂM TRẠI" },
  { id: "ganh-hang", name: "Gánh hàng rong", mood: "Phố quen", category: "hang-rong", src: "/art-library/hang-rong/ganh-hang.png", x: 58, y: 69, size: 38, caption: "GÁNH NHẸ, QUÉT NHANH" },
  { id: "tra-da", name: "Trà đá vỉa hè", mood: "Giải khát", category: "hang-rong", src: "/art-library/hang-rong/tra-da.png", x: 42, y: 70, size: 38, caption: "QUÉT MÃ, GỌI TRÀ" },
  { id: "xe-hoa", name: "Xe hoa đầu phố", mood: "Hoa tươi", category: "hang-rong", src: "/art-library/hang-rong/xe-hoa.png", x: 42, y: 69, size: 36, caption: "QUÉT MÃ, CHỌN HOA" },
  { id: "xe-trai-cay", name: "Xe trái cây", mood: "Hoa quả", category: "hang-rong", src: "/art-library/hang-rong/xe-trai-cay.png", x: 53, y: 73, size: 35, caption: "TRÁI TƯƠI, QUÉT THÔI" },
  { id: "bap-nuong", name: "Bắp nướng thơm lừng", mood: "Ăn vặt", category: "hang-rong", src: "/art-library/hang-rong/bap-nuong.png", x: 39, y: 75, size: 36, caption: "BẮP NÓNG, MÃ XONG" },
  { id: "xe-mi", name: "Xe mì ven đường", mood: "Món nóng", category: "hang-rong", src: "/art-library/hang-rong/xe-mi.png", x: 37, y: 74, size: 37, caption: "QUÉT MÃ, GỌI MÌ" },
  { id: "ruong-bac-thang", name: "Ruộng bậc thang", mood: "Miền núi", category: "phong-canh", src: "/art-library/phong-canh/ruong-bac-thang.png", x: 53, y: 65, size: 42, caption: "NÚI ĐỒI, QUÉT THÔI" },
  { id: "bien-xanh", name: "Biển xanh cát trắng", mood: "Miền biển", category: "phong-canh", src: "/art-library/phong-canh/bien-xanh.png", x: 43, y: 65, size: 36, caption: "QUÉT MÃ, RA BIỂN" },
  { id: "song-nui", name: "Sông giữa núi", mood: "Non nước", category: "phong-canh", src: "/art-library/phong-canh/song-nui.png", x: 53, y: 69, size: 35, caption: "QUÉT MÃ, XEM NON NƯỚC" },
  { id: "doi-thong", name: "Đồi thông sương sớm", mood: "Cao nguyên", category: "phong-canh", src: "/art-library/phong-canh/doi-thong.png", x: 53, y: 65, size: 40, caption: "QUÉT MÃ, LÊN ĐỒI THÔNG" },
  { id: "ho-sen", name: "Hồ sen bình minh", mood: "Đồng quê", category: "phong-canh", src: "/art-library/phong-canh/ho-sen.png", x: 59, y: 69, size: 35, caption: "QUÉT MÃ, NGẮM HỒ SEN" },
  { id: "deo-nui", name: "Đèo cao lộng gió", mood: "Đường núi", category: "phong-canh", src: "/art-library/phong-canh/deo-nui.png", x: 43, y: 68, size: 34, caption: "QUA ĐÈO, QUÉT THEO" },
  { id: "trekking", name: "Đi bộ đường dài", mood: "Khám phá", category: "du-lich", src: "/art-library/du-lich/trekking.png", x: 69, y: 52, size: 42, caption: "QUÉT BẢN ĐỒ, ĐI THÔI" },
  { id: "gia-dinh-bien", name: "Cả nhà đi biển", mood: "Nghỉ dưỡng", category: "du-lich", src: "/art-library/du-lich/gia-dinh-bien.png", x: 73, y: 65, size: 40, caption: "CẢ NHÀ, CÙNG QUÉT" },
  { id: "dap-xe", name: "Đạp xe ngắm lúa", mood: "Trải nghiệm", category: "du-lich", src: "/art-library/du-lich/dap-xe.png", x: 70, y: 69, size: 40, caption: "QUÉT MÃ, ĐẠP XE THÔI" },
  { id: "cam-trai", name: "Cắm trại rừng thông", mood: "Ngoài trời", category: "du-lich", src: "/art-library/du-lich/cam-trai.png", x: 71, y: 49, size: 47, caption: "QUÉT MÃ, DỰNG LỀU" },
  { id: "du-thuyen", name: "Thuyền trôi non nước", mood: "Đường sông", category: "du-lich", src: "/art-library/du-lich/du-thuyen.png", x: 54, y: 73, size: 36, caption: "LÊN THUYỀN, QUÉT LIỀN" },
  { id: "check-in", name: "Hội bạn check-in", mood: "Kỷ niệm", category: "du-lich", src: "/art-library/du-lich/check-in.png", x: 68, y: 42, size: 45, caption: "QUÉT MÃ, LƯU KỶ NIỆM" },
  { id: "ha-noi", name: "Hà Nội · Hồ Gươm", mood: "Thủ đô", category: "bac-trung", src: "/art-library/mien-bac-trung/ha-noi.png", x: 75, y: 76, size: 36, caption: "QUÉT MÃ, GHÉ HỒ GƯƠM" },
  { id: "quang-ninh", name: "Quảng Ninh · Hạ Long", mood: "Vịnh biển", category: "bac-trung", src: "/art-library/mien-bac-trung/quang-ninh.png", x: 75, y: 76, size: 36, caption: "QUÉT MÃ, NGẮM HẠ LONG" },
  { id: "ninh-binh", name: "Ninh Bình · Tràng An", mood: "Non nước", category: "bac-trung", src: "/art-library/mien-bac-trung/ninh-binh.png", x: 75, y: 76, size: 36, caption: "QUÉT MÃ, ĐI TRÀNG AN" },
  { id: "ha-giang", name: "Hà Giang · Đường đèo", mood: "Cực Bắc", category: "bac-trung", src: "/art-library/mien-bac-trung/ha-giang.png", x: 74, y: 74, size: 36, caption: "QUÉT MÃ, LÊN HÀ GIANG" },
  { id: "lao-cai", name: "Lào Cai · Sa Pa", mood: "Ruộng núi", category: "bac-trung", src: "/art-library/mien-bac-trung/lao-cai.png", x: 74, y: 74, size: 36, caption: "QUÉT MÃ, ĐI SA PA" },
  { id: "hue", name: "Huế · Kinh thành", mood: "Di sản", category: "bac-trung", src: "/art-library/mien-bac-trung/hue.png", x: 75, y: 74, size: 36, caption: "QUÉT MÃ, GHÉ KINH THÀNH" },
  { id: "tp-hcm", name: "TP.HCM · Chợ Bến Thành", mood: "Đô thị", category: "nam-bien", src: "/art-library/mien-nam-bien/tp-hcm.png", x: 36, y: 72, size: 36, caption: "QUÉT MÃ, GHÉ BẾN THÀNH" },
  { id: "da-nang", name: "Đà Nẵng · Cầu Rồng", mood: "Sông biển", category: "nam-bien", src: "/art-library/mien-nam-bien/da-nang.png", x: 33, y: 72, size: 36, caption: "QUÉT MÃ, NGẮM CẦU RỒNG" },
  { id: "hoi-an", name: "Quảng Nam · Hội An", mood: "Phố cổ", category: "nam-bien", src: "/art-library/mien-nam-bien/hoi-an.png", x: 32, y: 72, size: 36, caption: "QUÉT MÃ, DẠO PHỐ CỔ" },
  { id: "da-lat", name: "Lâm Đồng · Đà Lạt", mood: "Cao nguyên", category: "nam-bien", src: "/art-library/mien-nam-bien/da-lat.png", x: 35, y: 75, size: 35, caption: "QUÉT MÃ, ĐI ĐÀ LẠT" },
  { id: "can-tho", name: "Cần Thơ · Chợ nổi", mood: "Miền sông", category: "nam-bien", src: "/art-library/mien-nam-bien/can-tho.png", x: 75, y: 68, size: 36, caption: "QUÉT MÃ, GHÉ CHỢ NỔI" },
  { id: "phu-quoc", name: "Kiên Giang · Phú Quốc", mood: "Đảo ngọc", category: "nam-bien", src: "/art-library/mien-nam-bien/phu-quoc.png", x: 75, y: 75, size: 35, caption: "QUÉT MÃ, RA PHÚ QUỐC" },
  { id: "meo-sep", name: "Mèo sếp ra chỉ thị", mood: "Lầy cấp cao", category: "hai-thu", src: "/art-library/hai-thu/meo-sep.png", x: 74, y: 61, size: 38, caption: "SẾP BẢO QUÉT ĐI" },
  { id: "capy-tron-bao-thuc", name: "Capy giả điếc", mood: "Lười có nghề", category: "hai-thu", src: "/art-library/hai-thu/capy-tron-bao-thuc.png", x: 50, y: 66, size: 34, caption: "BÁO THỨC KỆ, MÃ QUÉT LẸ" },
  { id: "vit-dieu-phoi", name: "Vịt điều phối giao thông", mood: "Nghiêm mà sai", category: "hai-thu", src: "/art-library/hai-thu/vit-dieu-phoi.png", x: 75, y: 42, size: 38, caption: "DỪNG LẠI, QUÉT CÁI" },
  { id: "cho-bao-ve", name: "Bảo vệ ngủ có ca", mood: "Hết pin", category: "hai-thu", src: "/art-library/hai-thu/cho-bao-ve.png", x: 74, y: 44, size: 36, caption: "QUÉT NHẸ, ĐỪNG GỌI" },
  { id: "ech-karaoke", name: "Ếch hát bằng cả đời", mood: "Hát bất chấp", category: "hai-thu", src: "/art-library/hai-thu/ech-karaoke.png", x: 77, y: 44, size: 36, caption: "QUÉT XONG, HÁT TIẾP" },
  { id: "ga-influencer", name: "Gà tạo dáng mạng", mood: "Tự tin vô hạn", category: "hai-thu", src: "/art-library/hai-thu/ga-influencer.png", x: 70, y: 43, size: 42, caption: "THẢ TIM SAU, QUÉT TRƯỚC" },
  { id: "ca-phe-cuu-roi", name: "Cà phê gánh cả phòng", mood: "Sáng chưa tỉnh", category: "hai-cong-so", src: "/art-library/hai-cong-so/ca-phe-cuu-roi.png", x: 75, y: 44, size: 44, caption: "CÀ PHÊ TỚI, MÃ LÊN" },
  { id: "hop-robot", name: "Họp bằng đầu hộp", mood: "Bật cam cho có", category: "hai-cong-so", src: "/art-library/hai-cong-so/hop-robot.png", x: 76, y: 43, size: 36, caption: "CAM BẬT, NÃO TẮT" },
  { id: "vat-may-in", name: "Vật lộn máy in", mood: "Kẻ thù văn phòng", category: "hai-cong-so", src: "/art-library/hai-cong-so/vat-may-in.png", x: 77, y: 57, size: 40, caption: "MÁY KẸT, MÃ KHÔNG" },
  { id: "hop-om-goi", name: "Họp nghiêm túc ôm gối", mood: "Tinh thần mềm", category: "hai-cong-so", src: "/art-library/hai-cong-so/hop-om-goi.png", x: 52, y: 25, size: 34, caption: "HỌP DÀI, QUÉT NGAY" },
  { id: "lam-viec-o-nha", name: "Áo sơ mi, quần ngủ", mood: "Làm xa rất gần", category: "hai-cong-so", src: "/art-library/hai-cong-so/lam-viec-o-nha.png", x: 70, y: 57, size: 40, caption: "TRÊN NGHIÊM, DƯỚI ÊM" },
  { id: "vi-rong", name: "Ví rỗng đầu tháng", mood: "Tài chính tâm linh", category: "hai-cong-so", src: "/art-library/hai-cong-so/vi-rong.png", x: 76, y: 52, size: 40, caption: "LƯƠNG ĐÂU, MÃ ĐÂY" },
  { id: "banh-mi-dao-dien", name: "Bánh mì đạo diễn", mood: "Chỉ đạo giòn tan", category: "hai-do-an", src: "/art-library/hai-do-an/banh-mi-dao-dien.png", x: 75, y: 58, size: 44, caption: "CẮT! QUÉT LẠI!" },
  { id: "mi-yoga", name: "Tô mì tập yoga", mood: "Dẻo hơn sợi mì", category: "hai-do-an", src: "/art-library/hai-do-an/mi-yoga.png", x: 74, y: 62, size: 38, caption: "HÍT VÀO, QUÉT RA" },
  { id: "ca-phe-mat-mo", name: "Cà phê mở mắt hộ", mood: "Tỉnh quá mức", category: "hai-do-an", src: "/art-library/hai-do-an/ca-phe-mat-mo.png", x: 75, y: 56, size: 40, caption: "MẮT MỞ, MÃ RÕ" },
  { id: "sau-rieng-diva", name: "Sầu riêng lên thảm đỏ", mood: "Thơm tùy người", category: "hai-do-an", src: "/art-library/hai-do-an/sau-rieng-diva.png", x: 75, y: 56, size: 40, caption: "SẦU RIÊNG, MÃ CHUNG" },
  { id: "nuoc-mam-sieu-nhan", name: "Nước mắm siêu nhân", mood: "Đậm đà cứu thế", category: "hai-do-an", src: "/art-library/hai-do-an/nuoc-mam-sieu-nhan.png", x: 73, y: 58, size: 40, caption: "ĐẬM ĐÀ, QUÉT RA" },
  { id: "noi-com-het-hon", name: "Nồi cơm hết hồn", mood: "Cơm vừa bật", category: "hai-do-an", src: "/art-library/hai-do-an/noi-com-het-hon.png", x: 76, y: 57, size: 38, caption: "CƠM CHÍN, MÃ TỈNH" },
  { id: "san-wifi", name: "Săn Wi‑Fi trên cao", mood: "Một vạch hy vọng", category: "hai-doi-thuong", src: "/art-library/hai-doi-thuong/san-wifi.png", x: 73, y: 53, size: 42, caption: "SÓNG ĐÂU, MÃ ĐÂY" },
  { id: "mua-to", name: "Mưa to vẫn bình thản", mood: "Đường về gian nan", category: "hai-doi-thuong", src: "/art-library/hai-doi-thuong/mua-to.png", x: 73, y: 64, size: 36, caption: "MƯA RƠI, QUÉT THÔI" },
  { id: "nui-quan-ao", name: "Núi quần áo biết đi", mood: "Giặt không kịp", category: "hai-doi-thuong", src: "/art-library/hai-doi-thuong/nui-quan-ao.png", x: 73, y: 60, size: 40, caption: "ĐỒ CHẤT, MÃ CHUẨN" },
  { id: "giu-phong-bi", name: "Giữ phong bì bằng cả tim", mood: "Đi tiệc chiến lược", category: "hai-doi-thuong", src: "/art-library/hai-doi-thuong/giu-phong-bi.png", x: 73, y: 59, size: 44, caption: "MỪNG SAU, QUÉT TRƯỚC" },
  { id: "soi-cong-to", name: "Soi công tơ như thám tử", mood: "Điện chạy nhanh", category: "hai-doi-thuong", src: "/art-library/hai-doi-thuong/soi-cong-to.png", x: 71, y: 63, size: 40, caption: "SỐ QUAY, MÃ ĐỨNG" },
  { id: "selfie-dai-gia-dinh", name: "Selfie đủ cả họ", mood: "Chen mới vui", category: "hai-doi-thuong", src: "/art-library/hai-doi-thuong/selfie-dai-gia-dinh.png", x: 76, y: 50, size: 47, caption: "CẢ NHÀ, CÙNG QUÉT" },
];

const artCategories: { id: ArtCategory; label: string; icon: string }[] = [
  { id: "hai", label: "Tấu hài", icon: "☺" },
  { id: "hai-thu", label: "Thú lầy", icon: "☻" },
  { id: "hai-cong-so", label: "Công sở lầy", icon: "⌘" },
  { id: "hai-do-an", label: "Đồ ăn thành tinh", icon: "♨" },
  { id: "hai-doi-thuong", label: "Đời thường lầy", icon: "※" },
  { id: "nghe", label: "Ngành nghề", icon: "✦" },
  { id: "giai-tri", label: "Phim ảnh & giải trí", icon: "▶" },
  { id: "kinh-doanh", label: "Kinh doanh & ẩm thực", icon: "₫" },
  { id: "su-kien", label: "Dịp đặc biệt", icon: "★" },
  { id: "nong-nghiep", label: "Nông nghiệp", icon: "♧" },
  { id: "hang-rong", label: "Hàng rong", icon: "☕" },
  { id: "phong-canh", label: "Phong cảnh", icon: "⌁" },
  { id: "du-lich", label: "Du lịch", icon: "↗" },
  { id: "bac-trung", label: "Miền Bắc & miền Trung", icon: "△" },
  { id: "nam-bien", label: "Miền Nam & biển đảo", icon: "◉" },
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

const escapeWifi = (value: string) => value.replace(/([\\;,":])/g, "\\$1");

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
  const initiationMethod = amount ? "12" : "11";
  let content = `0002010102${initiationMethod}38${pad2(consumer.length)}${consumer}5303704`;
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

function drawQR(context: CanvasRenderingContext2D, payload: string, color: string, style: QRStyle, x: number, y: number, outputSize: number, background: string | null = "#FFFFFF") {
  const qr = QRCode.create(payload, { errorCorrectionLevel: "H" });
  const modules = qr.modules as typeof qr.modules & { isReserved(row: number, column: number): number };
  const quiet = 4;
  const cell = outputSize / (modules.size + quiet * 2);
  if (background) {
    context.fillStyle = background;
    context.fillRect(x, y, outputSize, outputSize);
  }
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
  context.fillText("CHỌN TRANH HOẶC TẢI ẢNH", size / 2, size * 0.46);
  context.font = `600 ${size * 0.022}px Arial, sans-serif`;
  context.fillText("Mã sẽ tự tìm một chỗ đẹp", size / 2, size * 0.52);
}

function sampleLightSurface(context: CanvasRenderingContext2D, x: number, y: number, canvasSize: number) {
  const radius = Math.max(2, Math.round(canvasSize * 0.004));
  const startX = Math.max(0, Math.min(canvasSize - radius * 2, Math.round(x) - radius));
  const startY = Math.max(0, Math.min(canvasSize - radius * 2, Math.round(y) - radius));
  try {
    const pixels = context.getImageData(startX, startY, radius * 2, radius * 2).data;
    let red = 0;
    let green = 0;
    let blue = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      red += pixels[index];
      green += pixels[index + 1];
      blue += pixels[index + 2];
    }
    const count = pixels.length / 4;
    const channels = [red / count, green / count, blue / count];
    const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    if (luminance < 205) return "#FFFFFF";
    return `rgb(${channels.map((value) => Math.round(value)).join(",")})`;
  } catch {
    return "#FFFFFF";
  }
}

type ArtboardOptions = {
  image: HTMLImageElement | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  skewX: number;
  skewY: number;
  qrX: number;
  qrY: number;
  qrScale: number;
  copyX: number;
  copyY: number;
  copyWidth: number;
  titleScale: number;
  subtitleScale: number;
  showSubtitle: boolean;
  paper: boolean;
  caption: string;
  subcaption: string;
};

function drawArtboard(context: CanvasRenderingContext2D, canvasSize: number, payload: string, ink: string, accent: string, style: QRStyle, options: ArtboardOptions) {
  if (options.image) drawImageContained(context, options.image, canvasSize);
  else drawWorkshopDoodle(context, canvasSize, accent);

  const badgeWidth = canvasSize * Math.max(options.width, 18) / 100;
  const badgeHeight = canvasSize * Math.max(options.height, 18) / 100;
  const angle = options.rotation * Math.PI / 180;
  const skewX = Math.tan(options.skewX * Math.PI / 180);
  const skewY = Math.tan(options.skewY * Math.PI / 180);
  const caption = options.caption.trim().toUpperCase();
  const subcaption = options.showSubtitle ? options.subcaption.trim() : "";
  const localLeft = -badgeWidth / 2;
  const localRight = badgeWidth / 2;
  const localTop = -badgeHeight / 2;
  const localBottom = badgeHeight / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rotatedCorners = [
    [localLeft, localTop], [localRight, localTop], [localRight, localBottom], [localLeft, localBottom],
  ].map(([x, y]) => {
    const skewedX = x + skewX * y;
    const skewedY = skewY * x + y;
    return { x: skewedX * cos - skewedY * sin, y: skewedX * sin + skewedY * cos };
  });
  const minX = Math.min(...rotatedCorners.map((point) => point.x));
  const maxX = Math.max(...rotatedCorners.map((point) => point.x));
  const minY = Math.min(...rotatedCorners.map((point) => point.y));
  const maxY = Math.max(...rotatedCorners.map((point) => point.y));
  const clampCenter = (raw: number, min: number, max: number) => min <= max ? Math.max(min, Math.min(max, raw)) : canvasSize / 2;
  const qrX = clampCenter(canvasSize * options.x / 100, -minX, canvasSize - maxX);
  const qrY = clampCenter(canvasSize * options.y / 100, -minY, canvasSize - maxY);
  const embeddedSurface = options.paper ? "#FFFFFF" : sampleLightSurface(context, qrX, qrY, canvasSize);
  context.save();
  context.translate(qrX, qrY);
  context.rotate(angle);
  context.transform(1, skewY, skewX, 1, 0, 0);
  if (options.paper) {
    context.fillStyle = "#fff";
    context.shadowColor = "rgba(23,34,31,.28)";
    context.shadowBlur = canvasSize * 0.014;
    context.shadowOffsetX = canvasSize * 0.009;
    context.shadowOffsetY = canvasSize * 0.011;
    context.fillRect(localLeft, localTop, badgeWidth, badgeHeight);
    context.shadowColor = "transparent";
    context.strokeStyle = "rgba(23,34,31,.72)";
    context.lineWidth = Math.max(2, Math.min(badgeWidth, badgeHeight) * 0.012);
    context.strokeRect(localLeft, localTop, badgeWidth, badgeHeight);
  }
  const shortestSide = Math.min(badgeWidth, badgeHeight);
  const qrSize = shortestSide * Math.max(42, Math.min(84, options.qrScale)) / 100;
  const qrCenterX = localLeft + badgeWidth * options.qrX / 100;
  const qrCenterY = localTop + badgeHeight * options.qrY / 100;
  drawQR(context, payload, ink, style, qrCenterX - qrSize / 2, qrCenterY - qrSize / 2, qrSize, embeddedSurface);
  const copyCenterX = localLeft + badgeWidth * options.copyX / 100;
  const copyCenterY = localTop + badgeHeight * options.copyY / 100;
  const copyWidth = badgeWidth * options.copyWidth / 100;
  const captionFont = caption ? Math.min(badgeHeight * options.titleScale / 100, copyWidth / Math.max(8, caption.length * 0.58)) : 0;
  const subcaptionFont = subcaption ? Math.min(badgeHeight * options.subtitleScale / 100, copyWidth / Math.max(18, subcaption.length * 0.52)) : 0;
  const labelHeight = caption ? Math.max(captionFont * (subcaption ? 3.05 : 1.8), badgeHeight * 0.12) : 0;
  const labelTop = copyCenterY - labelHeight / 2;
  if (options.paper) {
    context.fillStyle = "#17221f";
    context.fillRect(copyCenterX - copyWidth / 2, labelTop, copyWidth, labelHeight);
    context.fillStyle = "#DFFF45";
    context.fillRect(copyCenterX - copyWidth / 2, labelTop, copyWidth, Math.max(2, badgeHeight * 0.012));
  }
  if (caption) {
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = options.paper ? "#fff" : "#17221f";
    context.font = `800 ${captionFont}px Arial, sans-serif`;
    context.fillText(caption, copyCenterX, copyCenterY - (subcaption ? labelHeight * 0.14 : 0), copyWidth);
    if (subcaption) {
      context.fillStyle = options.paper ? "#DFFF45" : "rgba(23,34,31,.72)";
      context.font = `600 ${subcaptionFont}px Arial, sans-serif`;
      context.fillText(subcaption, copyCenterX, copyCenterY + labelHeight * 0.24, copyWidth);
    }
  }
  context.restore();
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
  const [artWidth, setArtWidth] = useState(45);
  const [artHeight, setArtHeight] = useState(45);
  const [artRotation, setArtRotation] = useState(0);
  const [artSkewX, setArtSkewX] = useState(0);
  const [artSkewY, setArtSkewY] = useState(0);
  const [artQrX, setArtQrX] = useState(50);
  const [artQrY, setArtQrY] = useState(39);
  const [artQrScale, setArtQrScale] = useState(70);
  const [artCopyX, setArtCopyX] = useState(50);
  const [artCopyY, setArtCopyY] = useState(83);
  const [artCopyWidth, setArtCopyWidth] = useState(88);
  const [artTitleScale, setArtTitleScale] = useState(5.3);
  const [artSubtitleScale, setArtSubtitleScale] = useState(2.25);
  const [artShowSubtitle, setArtShowSubtitle] = useState(true);
  const [artPaper, setArtPaper] = useState(true);
  const [artCaption, setArtCaption] = useState("QUÉT ĐI, NGẠI GÌ");
  const [artSubcaption, setArtSubcaption] = useState("Mã riêng của bạn · Nét riêng của bạn");
  const [notice, setNotice] = useState("Mã QR đã sẵn sàng để tải xuống");

  const chooseLibraryArt = (item: LibraryArt) => {
    const image = new Image();
    image.onload = () => {
      const frame = artFrames[item.id] ?? {
        x: item.x, y: item.y, width: item.size, height: item.size, rotation: item.rotation ?? 0, skewX: 0, skewY: 0,
        qr: { x: 50, y: 39, size: 70 },
        copy: { x: 50, y: 83, width: 88, titleScale: 5.3, subtitleScale: 2.25, showSubtitle: true },
      };
      setArtImage(image);
      setSelectedArt(item.id);
      setArtCategory(item.category);
      setArtX(frame.x);
      setArtY(frame.y);
      setArtWidth(frame.width);
      setArtHeight(frame.height);
      setArtRotation(frame.rotation);
      setArtSkewX(frame.skewX ?? 0);
      setArtSkewY(frame.skewY ?? 0);
      setArtQrX(frame.qr.x);
      setArtQrY(frame.qr.y);
      setArtQrScale(frame.qr.size);
      setArtCopyX(frame.copy.x);
      setArtCopyY(frame.copy.y);
      setArtCopyWidth(frame.copy.width);
      setArtTitleScale(frame.copy.titleScale);
      setArtSubtitleScale(frame.copy.subtitleScale);
      setArtShowSubtitle(frame.copy.showSubtitle);
      setArtPaper(false);
      setArtCaption(item.caption);
      setArtSubcaption("Mã riêng của bạn · Nét riêng của bạn");
      setLayoutMode("art");
      setNotice(`Đã chọn ${item.name}. Mã QR đã được căn vào vùng an toàn.`);
    };
    image.onerror = () => setNotice(`Không thể tải mẫu ${item.name}. Hãy chọn mẫu khác.`);
    image.src = item.src;
  };

  useEffect(() => {
    chooseLibraryArt(artLibrary[0]);
  }, []);

  useEffect(() => {
    fetch("https://api.vietqr.io/v2/banks")
      .then((response) => {
        if (!response.ok) throw new Error("Không thể cập nhật danh sách ngân hàng");
        return response.json();
      })
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
      const passwordField = wifiSecurity === "nopass" ? "" : `P:${escapeWifi(wifiPassword)};`;
      return `WIFI:T:${wifiSecurity};S:${escapeWifi(wifiName)};${passwordField};`;
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

  const payloadBytes = useMemo(() => new TextEncoder().encode(payload).length, [payload]);

  const inputIsValid = useMemo(() => {
    if (!payload || payloadBytes > 1200) return false;
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
      const amountOk = !bankAmount || (/^[1-9]\d{0,12}$/.test(bankAmount) && Number(bankAmount) <= 9_999_999_999_999);
      return accountOk && amountOk;
    }
    return true;
  }, [payload, payloadBytes, mode, value, bankAccount, bankAmount]);

  const colorIsSafe = contrastOnWhite(palette.value) >= 4.5;

  const artOptions = useMemo<ArtboardOptions>(() => ({
    image: artImage,
    x: artX,
    y: artY,
    width: artWidth,
    height: artHeight,
    rotation: artRotation,
    skewX: artSkewX,
    skewY: artSkewY,
    qrX: artQrX,
    qrY: artQrY,
    qrScale: artQrScale,
    copyX: artCopyX,
    copyY: artCopyY,
    copyWidth: artCopyWidth,
    titleScale: artTitleScale,
    subtitleScale: artSubtitleScale,
    showSubtitle: artShowSubtitle,
    paper: artPaper,
    caption: artCaption,
    subcaption: artSubcaption,
  }), [artImage, artX, artY, artWidth, artHeight, artRotation, artSkewX, artSkewY, artQrX, artQrY, artQrScale, artCopyX, artCopyY, artCopyWidth, artTitleScale, artSubtitleScale, artShowSubtitle, artPaper, artCaption, artSubcaption]);

  const visibleArt = artLibrary.filter((item) => item.category === artCategory);

  useEffect(() => {
    if (!inputIsValid || !colorIsSafe) return;
    if (layoutMode === "art" && artCanvasRef.current) renderArtPreview(artCanvasRef.current, payload, palette.value, palette.accent, qrStyle, artOptions);
    else if (canvasRef.current) renderPreview(canvasRef.current, payload, palette.value, qrStyle);
  }, [payload, palette, qrStyle, inputIsValid, colorIsSafe, layoutMode, artOptions]);

  const displayNotice = !colorIsSafe
    ? "Màu mã QR chưa đủ tương phản với nền sáng"
    : !payload
      ? "Hãy nhập nội dung để tạo mã QR"
      : payloadBytes > 1200
        ? "Nội dung quá dài. Hãy rút gọn để mã dễ quét."
        : !inputIsValid
          ? "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại."
          : payloadBytes > 700
            ? "Nội dung khá dài; nên quét thử ở khoảng cách sử dụng thực tế."
            : notice;

  const uploadArtwork = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!supportedTypes.has(file.type)) {
      setNotice("Định dạng ảnh chưa được hỗ trợ. Hãy chọn tệp JPG, PNG hoặc WEBP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotice("Ảnh vượt quá 10 MB. Hãy chọn ảnh có dung lượng nhỏ hơn.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        setArtImage(image);
        setSelectedArt("custom");
        setLayoutMode("art");
        setArtX(50);
        setArtY(50);
        setArtWidth(45);
        setArtHeight(52);
        setArtRotation(0);
        setArtSkewX(0);
        setArtSkewY(0);
        setArtQrX(50);
        setArtQrY(38);
        setArtQrScale(70);
        setArtCopyX(50);
        setArtCopyY(83);
        setArtCopyWidth(88);
        setArtTitleScale(5.3);
        setArtSubtitleScale(2.25);
        setArtShowSubtitle(true);
        setArtPaper(true);
        setNotice("Ảnh đã được tải lên. Bạn có thể điều chỉnh vị trí mã QR.");
      };
      image.onerror = () => setNotice("Không thể đọc ảnh này. Hãy thử một ảnh JPG, PNG hoặc WEBP khác.");
      image.src = String(reader.result);
    };
    reader.onerror = () => setNotice("Không thể mở tệp ảnh. Hãy thử chọn lại.");
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
    setNotice(`Đã tải tệp ${format.toUpperCase()} xuống thiết bị.`);
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setValue("");
    setEmailSubject("");
  };

  return (
    <main>
      <div className="ticker" aria-hidden="true">LIÊN KẾT · WI-FI · VIETQR CÓ SỐ TIỀN · VĂN BẢN · EMAIL · 90 MẪU MINH HỌA</div>
      <nav className="nav wrap" aria-label="Điều hướng chính">
        <a className="brand" href="#top" aria-label="QRồi Xong - trang chủ">
          <span className="brand-mark">QR!</span>
          <span>QRồi Xong!</span>
        </a>
        <div className="nav-links"><a href="#top">Tạo mã QR</a><a href="#about">Giải pháp</a><a href="#tech">Công nghệ</a></div>
        <div className="nav-note"><span /> Xử lý tại trình duyệt</div>
      </nav>

      <section className="hero wrap" id="top">
        <div className="hero-copy">
          <div className="eyebrow">TẠO MÃ QR VUI HƠN · DỄ TÙY BIẾN · VẪN DỄ QUÉT</div>
          <h1>Mã QR không nhất thiết<br /><em>phải đơn điệu.</em></h1>
          <p>Phần lớn mã QR trông khô khan và khó tùy biến theo nội dung muốn chia sẻ. QRồi Xong giúp bạn biến mã QR thành một thiết kế vui vẻ, hài hước và phù hợp với bối cảnh.</p>
          <small>90 mẫu minh họa · Tải ảnh riêng · Tùy chỉnh vị trí và câu chữ · Hỗ trợ VietQR kèm số tiền.</small>
        </div>
        <div className="doodle" aria-hidden="true">
          <span className="arrow">↳</span>
          <span className="doodle-copy">Chọn một mẫu.<br />Tùy chỉnh. Tải xuống.</span>
        </div>
      </section>

      <section className="maker wrap" aria-label="Công cụ tạo mã QR">
        <div className="panel form-panel">
          <div className="panel-heading">
            <span className="step">01</span>
            <div><h2>Chọn nội dung cần mã hóa</h2><p>Hỗ trợ liên kết, Wi-Fi, VietQR, văn bản và email.</p></div>
          </div>

          <div className="mode-tabs" role="group" aria-label="Loại nội dung QR">
            {modes.map((item) => (
              <button key={item.id} type="button" aria-pressed={mode === item.id} className={mode === item.id ? "active" : ""} onClick={() => switchMode(item.id)}>
                <b>{item.icon}</b>{item.label}
              </button>
            ))}
          </div>

          <div className="fields">
            {mode === "wifi" ? (
              <>
                <label>Tên mạng Wi-Fi<input value={wifiName} onChange={(e) => setWifiName(e.target.value)} placeholder="Ví dụ: NhaNayCoWifi" /></label>
                <div className="two-fields">
                  <label>Mật khẩu<input type="password" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} placeholder="Nhập mật khẩu Wi-Fi" /></label>
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
                    <input inputMode="numeric" value={bankAmount} onChange={(event) => setBankAmount(event.target.value.replace(/\D/g, "").slice(0, 13))} placeholder="Ví dụ: 150000" />
                    {bankAmount && <small className="amount-readout">{Number(bankAmount).toLocaleString("vi-VN")} ₫</small>}
                  </label>
                  <label>Nội dung chuyển khoản
                    <input value={bankNote} onChange={(event) => setBankNote(event.target.value)} maxLength={50} placeholder="Ví dụ: TIEN CA PHE" />
                  </label>
                </div>
                <div className="bank-warning"><b>Lưu ý:</b> Mã chỉ điền sẵn thông tin chuyển khoản. Hãy kiểm tra người nhận, số tiền và nội dung trong ứng dụng ngân hàng trước khi xác nhận.</div>
              </>
            ) : (
              <>
                <label>
                  {mode === "link" ? "Đường dẫn" : mode === "email" ? "Địa chỉ email" : "Nội dung văn bản"}
                  {mode === "text" ? (
                    <textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Nhập nội dung bạn muốn lưu trong mã QR" rows={4} />
                  ) : (
                    <input type={mode === "email" ? "email" : "text"} value={value} onChange={(e) => setValue(e.target.value)} placeholder={mode === "email" ? "hello@congty.vn" : "tenmien.vn/mon-ngon"} />
                  )}
                </label>
                {mode === "email" && <label>Tiêu đề email (không bắt buộc)<input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Ví dụ: Yêu cầu báo giá" /></label>}
              </>
            )}
            <div className="privacy-line"><span>◉</span> {mode === "bank" ? "Thông tin VietQR được tạo trực tiếp trên thiết bị của bạn." : "Nội dung được xử lý trực tiếp trong trình duyệt và không gửi lên máy chủ."}</div>
          </div>

          <div className="palette-section">
            <div className="label-row"><span>Chọn màu mã QR</span><span>Độ tương phản {contrastOnWhite(palette.value).toFixed(1)}:1 {colorIsSafe ? "· Đạt ✓" : "· Chưa đạt ✕"}</span></div>
            <div className="palettes">
              {palettes.map((item) => (
                <button key={item.name} type="button" aria-pressed={palette.name === item.name} className={palette.name === item.name ? "palette active" : "palette"} onClick={() => setPalette(item)} aria-label={`Chọn màu ${item.name}`}>
                  <i style={{ background: item.value }} /><span>{item.name}</span>
                </button>
              ))}
              <label className="color-well">Màu QR<input type="color" value={palette.value} onChange={(event) => setPalette({ name: "Tùy chọn", value: event.target.value, accent: palette.accent })} /></label>
              <label className="color-well">Màu nền<input type="color" value={palette.accent} onChange={(event) => setPalette({ name: "Tùy chọn", value: palette.value, accent: event.target.value })} /></label>
            </div>
          </div>

          <div className="shape-section">
            <div className="label-row"><span>Chọn kiểu ô QR</span><span>Ba ô định vị luôn được giữ nguyên ✓</span></div>
            <div className="shape-options">
              {qrStyles.map((item) => (
                <button key={item.id} type="button" aria-pressed={qrStyle === item.id} className={qrStyle === item.id ? `shape-option active ${item.id}` : `shape-option ${item.id}`} onClick={() => setQrStyle(item.id)}>
                  <i aria-hidden="true"><span /><span /><span /><span /></i>
                  <b>{item.name}</b><small>{item.note}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="panel preview-panel" style={{ "--accent": palette.accent } as React.CSSProperties}>
          <div className="tape">XEM TRƯỚC</div>
          <div className="layout-switch" role="group" aria-label="Kiểu xuất mã">
            <button type="button" aria-pressed={layoutMode === "stamp"} className={layoutMode === "stamp" ? "active" : ""} onClick={() => setLayoutMode("stamp")}>Chỉ mã QR</button>
            <button type="button" aria-pressed={layoutMode === "art"} className={layoutMode === "art" ? "active" : ""} onClick={() => setLayoutMode("art")}>Mã QR trong tranh</button>
          </div>
          {layoutMode === "art" ? (
            <div className="art-stage">{inputIsValid && colorIsSafe ? <canvas ref={artCanvasRef} className="art-canvas" aria-label="Tranh ghép mã QR xem trước" /> : <div className="empty-qr"><span>?</span><p>Nhập nội dung hợp lệ<br />để xem trước thiết kế</p></div>}</div>
          ) : (
            <div className={`qr-costume ${qrStyle}`}><div className="qr-shell">{inputIsValid && colorIsSafe ? <canvas ref={canvasRef} aria-label="Mã QR xem trước" /> : <div className="empty-qr"><span>?</span><p>Nhập nội dung hợp lệ<br />để tạo mã QR</p></div>}</div><div className="costume-caption">{(qrStyles.find((item) => item.id === qrStyle) ?? qrStyles[0]).caption}</div></div>
          )}
          <div className={`health ${inputIsValid && colorIsSafe ? "good" : "wait"}`} role="status" aria-live="polite"><span>●</span>{displayNotice}</div>
          <div className="tech-badges">
            <span>Sửa lỗi mức H</span><span>Viền trắng 4 ô</span><span>{layoutMode === "art" ? Math.min(artWidth, artHeight) * artQrScale / 100 >= 18 ? "Kích thước tốt" : "Nên quét ở khoảng cách gần" : mode === "bank" ? "VietQR · CRC16" : "QR tĩnh · Không chuyển hướng"}</span>
          </div>
          {layoutMode === "art" && <div className="art-controls">
            <div className="library-head"><div><b>THƯ VIỆN MINH HỌA</b><span>Chọn chủ đề và mẫu phù hợp với mục đích sử dụng.</span></div><em>{artLibrary.length} mẫu</em></div>
            <div className="category-tabs" role="group" aria-label="Chủ đề tranh">
              {artCategories.map((item) => <button key={item.id} type="button" aria-pressed={artCategory === item.id} className={artCategory === item.id ? "active" : ""} onClick={() => setArtCategory(item.id)}><b>{item.icon}</b>{item.label}<small>{artLibrary.filter((art) => art.category === item.id).length}</small></button>)}
            </div>
            <div className="art-library" aria-label="Kho tranh có sẵn">
              {visibleArt.map((item) => <button key={item.id} type="button" aria-pressed={selectedArt === item.id} className={selectedArt === item.id ? "art-card active" : "art-card"} onClick={() => chooseLibraryArt(item)} aria-label={`Chọn tranh ${item.name}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt="" /><span><b>{item.name}</b><small>{item.mood}</small></span>
              </button>)}
            </div>
            <p className="safe-note"><b>◎ Bản đồ bố cục riêng cho từng mẫu:</b> khung ngang tự dùng bố cục hai cột để QR lớn và cân đối; khung dọc giữ chữ bên dưới.</p>
            <div className="custom-divider"><span>HOẶC SỬ DỤNG ẢNH CỦA BẠN</span></div>
            <label className={selectedArt === "custom" ? "upload-button selected" : "upload-button"}>+ Tải ảnh lên<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadArtwork} /></label>
            <p className="hint">JPG, PNG, WEBP · dưới 10 MB · ảnh chỉ nằm trên máy bạn</p>
            <details className="photo-guide">
              <summary>Cách chọn ảnh phù hợp <span>Xem hướng dẫn ↓</span></summary>
              <div className="guide-body">
                <div className="guide-pictures" aria-hidden="true"><i className="good"><b>QR</b></i><i className="bad"><b>QR</b></i></div>
                <ul><li><b>Chừa một mảng trống 35–50%</b> để mã không che mặt người hay món đồ chính.</li><li><b>Ít chi tiết phía sau mã.</b> Nếu ảnh nhiều chi tiết, hãy bật “Thêm nền và bóng đổ”.</li><li><b>Ảnh vuông hoặc dọc, từ 800 px.</b> Tránh ảnh mờ, chụp quá tối hoặc cắt sát chủ thể.</li></ul>
              </div>
            </details>
            <div className="caption-grid"><label>Tiêu đề<input value={artCaption} maxLength={36} onChange={(e) => setArtCaption(e.target.value)} /></label><label>Dòng mô tả<input value={artSubcaption} maxLength={54} onChange={(e) => setArtSubcaption(e.target.value)} /></label></div>
            <details className="layout-editor" key={selectedArt}>
              <summary><span>Tinh chỉnh bố cục</span><small>Vị trí, kích thước và độ nghiêng</small></summary>
              <div className="control-title"><b>Khung đặt mã</b><span>Khớp với mặt bảng trong tranh</span></div>
              <div className="slider-grid">
                <label>Vị trí ngang <output>{artX}%</output><input type="range" min="8" max="92" step="0.5" value={artX} onChange={(e) => setArtX(Number(e.target.value))} /></label>
                <label>Vị trí dọc <output>{artY}%</output><input type="range" min="8" max="92" step="0.5" value={artY} onChange={(e) => setArtY(Number(e.target.value))} /></label>
                <label>Chiều rộng <output>{artWidth}%</output><input type="range" min="16" max="72" step="0.5" value={artWidth} onChange={(e) => setArtWidth(Number(e.target.value))} /></label>
                <label>Chiều cao <output>{artHeight}%</output><input type="range" min="16" max="78" step="0.5" value={artHeight} onChange={(e) => setArtHeight(Number(e.target.value))} /></label>
                <label>Góc xoay <output>{artRotation}°</output><input type="range" min="-18" max="18" step="0.5" value={artRotation} onChange={(e) => setArtRotation(Number(e.target.value))} /></label>
                <label>Nghiêng ngang <output>{artSkewX}°</output><input type="range" min="-8" max="8" step="0.5" value={artSkewX} onChange={(e) => setArtSkewX(Number(e.target.value))} /></label>
                <label>Nghiêng dọc <output>{artSkewY}°</output><input type="range" min="-8" max="8" step="0.5" value={artSkewY} onChange={(e) => setArtSkewY(Number(e.target.value))} /></label>
              </div>
              <div className="control-title"><b>Mã QR và câu chữ</b><span>Điều chỉnh độc lập trong khung</span></div>
              <div className="slider-grid">
                <label>QR theo chiều ngang <output>{artQrX}%</output><input type="range" min="18" max="82" step="0.5" value={artQrX} onChange={(e) => setArtQrX(Number(e.target.value))} /></label>
                <label>QR theo chiều dọc <output>{artQrY}%</output><input type="range" min="18" max="70" step="0.5" value={artQrY} onChange={(e) => setArtQrY(Number(e.target.value))} /></label>
                <label>Kích thước QR <output>{artQrScale}%</output><input type="range" min="42" max="84" step="0.5" value={artQrScale} onChange={(e) => setArtQrScale(Number(e.target.value))} /></label>
                <label>Chữ theo chiều ngang <output>{artCopyX}%</output><input type="range" min="18" max="82" step="0.5" value={artCopyX} onChange={(e) => setArtCopyX(Number(e.target.value))} /></label>
                <label>Chữ theo chiều dọc <output>{artCopyY}%</output><input type="range" min="65" max="94" step="0.5" value={artCopyY} onChange={(e) => setArtCopyY(Number(e.target.value))} /></label>
                <label>Kích thước tiêu đề <output>{artTitleScale}%</output><input type="range" min="3" max="8" step="0.1" value={artTitleScale} onChange={(e) => setArtTitleScale(Number(e.target.value))} /></label>
              </div>
              <label className="paper-check"><input type="checkbox" checked={artPaper} onChange={(e) => setArtPaper(e.target.checked)} /> Thêm nền và bóng đổ phía sau mã</label>
              <label className="paper-check"><input type="checkbox" checked={artShowSubtitle} onChange={(e) => setArtShowSubtitle(e.target.checked)} /> Hiện dòng mô tả nhỏ</label>
            </details>
            {selectedArt === "custom" && <button type="button" className="text-button" onClick={() => chooseLibraryArt(artLibrary[0])}>Bỏ ảnh đã tải lên và trở lại thư viện ↺</button>}
          </div>}
          <div className="download-row">
            <button type="button" className="primary" disabled={!inputIsValid || !colorIsSafe} onClick={() => download("png")}>{layoutMode === "art" ? "Tải thiết kế PNG" : "Tải mã QR PNG"} <span>↓</span></button>
            <button type="button" className="secondary" disabled={!inputIsValid || !colorIsSafe} onClick={() => download("svg")}>Tải mã QR SVG</button>
          </div>
          <p className="scan-tip">Hãy quét thử bằng ít nhất một điện thoại trước khi in số lượng lớn.</p>
        </aside>
      </section>

      <section className="why wrap">
        <div className="why-title"><span>VẤN ĐỀ</span><h2>Mã QR thường đúng chức năng nhưng thiếu cảm xúc.</h2></div>
        <div className="proof-grid">
          <article><b>01</b><h3>Đơn điệu và khó tạo ấn tượng</h3><p>Phần lớn công cụ chỉ tạo một ô mã đen trắng giống nhau, khó thể hiện cá tính hoặc khiến người nhận muốn quét.</p></article>
          <article><b>02</b><h3>Khó phù hợp với từng bối cảnh</h3><p>Một mã dùng cho quán ăn, đám cưới, du lịch hay chuyển khoản thường vẫn có cùng hình thức khô khan.</p></article>
          <article><b>03</b><h3>Trang trí có thể làm mã khó quét</h3><p>QRồi Xong đặt mã trên vùng tương phản riêng, giữ viền an toàn và vùng định vị để hình ảnh vui hơn mà mã vẫn rõ.</p></article>
        </div>
      </section>

      <section className="about wrap" id="about">
        <div className="section-kicker">GIẢI PHÁP</div>
        <div className="about-grid">
          <div><h2>Một mã QR vui vẻ,<br />hài hước và <em>dễ quét.</em></h2></div>
          <div className="about-copy">
            <p><b>QRồi Xong</b> cung cấp 90 mẫu minh họa theo nghề nghiệp, món ăn, đời sống, du lịch và các tình huống hài hước. Bạn cũng có thể tải ảnh riêng, thay câu chữ và căn QR theo bố cục mong muốn.</p>
            <p>Phần minh họa và phần kỹ thuật được xử lý riêng. Vùng QR luôn có nền tương phản, viền an toàn và các ô định vị nguyên vẹn; vì vậy thiết kế có thể vui hơn mà không bỏ qua khả năng quét.</p>
            <div className="about-sign">Tạo nội dung → Chọn thiết kế → Quét thử → Tải xuống ↗</div>
          </div>
        </div>
      </section>

      <section className="stack-section" id="tech">
        <div className="wrap">
          <div className="why-title"><span>CÔNG NGHỆ</span><h2>Những thành phần chính</h2></div>
          <div className="stack-grid">
            <article><span>01</span><h3>React 19</h3><p>Cập nhật bản xem trước ngay khi nội dung hoặc thiết kế thay đổi.</p></article>
            <article><span>02</span><h3>TypeScript</h3><p>Kiểm soát kiểu dữ liệu và giảm lỗi trong quá trình tạo mã.</p></article>
            <article><span>03</span><h3>node-qrcode</h3><p>Tạo PNG và SVG với sửa lỗi mức H và viền trắng tiêu chuẩn.</p></article>
            <article><span>04</span><h3>VietQR · CRC16</h3><p>Tạo nội dung chuyển khoản, hỗ trợ điền sẵn số tiền và lời nhắn.</p></article>
            <article><span>05</span><h3>Cloudflare Edge</h3><p>Phân phối trang nhanh mà không cần lưu nội dung QR của người dùng.</p></article>
          </div>
          <p className="stack-footnote">Mỗi công nghệ được sử dụng cho một chức năng cụ thể của sản phẩm.</p>
        </div>
      </section>

      <footer className="wrap">
        <div className="brand"><span className="brand-mark">QR!</span><span>QRồi Xong!</span></div>
        <p>Tạo mã QR dễ sử dụng, dễ tùy biến và dễ quét.</p>
        <a href="#top">Quay lại đầu trang ↑</a>
      </footer>
    </main>
  );
}
