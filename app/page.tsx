"use client";

export const dynamic = "force-static";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { artFrames, type ArtFrame, type ArtPoint, type ArtQuad } from "./art-frames";
import { extractReceiptTotal, splitBillEvenly } from "./bill-utils";

type Mode = "link" | "wifi" | "bank" | "bill" | "text" | "email";
type Bank = { bin: string; shortName: string; name: string; transferSupported?: number };
type QRStyle = "square" | "round" | "dots";
type QRPalette = { name: string; value: string; accent: string };
type ArtVisualProfile = { paletteIndex: 0 | 1 | 2 | 3; style: QRStyle };
type LayoutMode = "stamp" | "art";
type ArtCategory = "hai" | "hai-thu" | "hai-cong-so" | "hai-do-an" | "hai-doi-thuong" | "nghe" | "giai-tri" | "kinh-doanh" | "su-kien" | "nong-nghiep" | "hang-rong" | "phong-canh" | "du-lich" | "bac-trung" | "nam-bien" | "hoang-dao" | "con-giap" | "van-hoa-viet";
type FunMood = "context" | "cute" | "chaotic" | "vietnam" | "office" | "food" | "occasion";
type LibraryArt = { id: string; name: string; mood: string; category: ArtCategory; src: string; x: number; y: number; size: number; caption: string; rotation?: number };

const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX ?? "";
const publicAsset = (path: string) => `${assetPrefix}${path}`;

const customArtFrame: ArtFrame = {
  x: 50, y: 50, width: 45, height: 52, rotation: 0, skewX: 0, skewY: 0,
  quad: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
  qr: { x: 50, y: 40, size: 78 },
  copy: { x: 50, y: 90, width: 76, titleScale: 6.1, subtitleScale: 2.25, showSubtitle: false },
};

const palettes: QRPalette[] = [
  { name: "Đen", value: "#171717", accent: "#FFD338" },
  { name: "Đỏ đậm", value: "#9F1239", accent: "#FDA4AF" },
  { name: "Xanh lá đậm", value: "#075E54", accent: "#6EE7B7" },
  { name: "Tím đậm", value: "#4C1D95", accent: "#C4B5FD" },
];

const modes: { id: Mode; label: string; icon: string }[] = [
  { id: "link", label: "Đường dẫn", icon: "↗" },
  { id: "wifi", label: "Wi-Fi", icon: "⌁" },
  { id: "bank", label: "Ngân hàng", icon: "₫" },
  { id: "bill", label: "Chia bill", icon: "÷" },
  { id: "text", label: "Văn bản", icon: "✎" },
  { id: "email", label: "Email", icon: "@" },
];

const qrStyles: { id: QRStyle; name: string; note: string; caption: string }[] = [
  { id: "square", name: "Ô vuông tiêu chuẩn", note: "Tương phản rõ, dễ quét", caption: "MÃ QR TIÊU CHUẨN" },
  { id: "round", name: "Ô bo góc", note: "Mềm hơn nhưng vẫn rõ", caption: "MÃ QR BO GÓC" },
  { id: "dots", name: "Chấm tròn", note: "Trang trí phần dữ liệu", caption: "MÃ QR CHẤM TRÒN" },
];

const transferNotePresets = [
  "Gửi bạn phần chi phí hôm nay",
  "Mời bạn một ly cà phê vui vẻ",
  "Góp quỹ cho những ngày cuối tháng",
  "Cùng góp một bữa lẩu thật vui",
  "Gửi bạn một chút ngọt ngào",
  "Chuyển khoản nhẹ nhàng, niềm vui đầy",
  "Cùng chia sẻ bữa ăn ngon",
  "Bữa ngon hôm nay, kỷ niệm mai sau",
  "Mừng ngày vui trọn vẹn",
  "Chúc mừng tổ ấm mới",
  "Chúc bạn tuổi mới thật rực rỡ",
  "Gửi lời chúc cùng món quà nhỏ",
  "Góp quỹ vun đầy yêu thương",
  "Gửi phần chi phí tháng này",
  "Cảm ơn bạn đã cùng chuẩn bị",
  "Chuyển khoản bằng cả tấm lòng",
  "Món quà nhỏ, tình cảm lớn",
  "Khoản gửi đã đến, niềm vui ở lại",
  "Mời bạn nhận chút chân thành",
  "Một khoản nhỏ cho kế hoạch lớn",
  "Của ít lòng nhiều, chúc bạn vui",
  "Gửi trước một niềm vui",
  "Hôm nay xin được mời bạn",
  "Đã gửi đủ, cảm ơn bạn thật nhiều",
];

const artLibrary: LibraryArt[] = [
  { id: "meo", name: "Mèo điềm tĩnh", mood: "Hóm hỉnh", category: "hai", src: "/art-library/meo-mat-lanh.png", x: 55, y: 68, size: 39, caption: "MỜI BẠN QUÉT MÃ!", rotation: -2 },
  { id: "capy", name: "Capy tan ca", mood: "Hài nhẹ", category: "hai", src: "/art-library/capybara-tan-ca.png", x: 76, y: 37, size: 40, caption: "MỜI QUÉT MÃ, RỒI THƯ GIÃN" },
  { id: "ech", name: "Ếch trà đá", mood: "Dễ thương", category: "hai", src: "/art-library/ech-tra-da.png", x: 81, y: 35, size: 30, caption: "MỜI BẠN QUÉT VÀ DÙNG TRÀ" },
  { id: "cun", name: "Cún nón lá", mood: "Dễ thương", category: "hai", src: "/art-library/cun-non-la.png", x: 50, y: 73, size: 32, caption: "MỜI BẠN QUÉT MÃ!" },
  { id: "vit", name: "Vịt chạy đơn", mood: "Hóm hỉnh", category: "hai", src: "/art-library/vit-chay-don.png", x: 78, y: 57, size: 30, caption: "MỜI QUÉT MÃ ĐỂ NHẬN ĐƠN" },
  { id: "noi", name: "Nồi cơm chào hàng", mood: "Hài nhẹ", category: "hai", src: "/art-library/noi-com-chao-hang.png", x: 81, y: 57, size: 38, caption: "MỜI QUÉT MÃ, CƠM ĐÃ SẴN" },
  { id: "bac-si", name: "Bác sĩ tận tâm", mood: "Y tế", category: "nghe", src: "/art-library/nganh-nghe/bac-si.png", x: 75, y: 58, size: 40, caption: "MỜI QUÉT MÃ, CHÚC AN KHANG" },
  { id: "giao-vien", name: "Cô giáo vui tính", mood: "Giáo dục", category: "nghe", src: "/art-library/nganh-nghe/giao-vien.png", x: 70, y: 43, size: 45, caption: "MỜI QUÉT MÃ ĐỂ VÀO BÀI" },
  { id: "tho-toc", name: "Thợ tóc có gu", mood: "Làm đẹp", category: "nghe", src: "/art-library/nganh-nghe/tho-toc.png", x: 76, y: 55, size: 42, caption: "MỜI QUÉT MÃ, CHỌN KIỂU ĐẸP" },
  { id: "pha-che", name: "Pha chế tỉnh táo", mood: "Đồ uống", category: "nghe", src: "/art-library/nganh-nghe/pha-che.png", x: 76, y: 55, size: 36, caption: "MỜI QUÉT MÃ, THƯỞNG THỨC" },
  { id: "giao-hang", name: "Người giao hàng thân thiện", mood: "Vận chuyển", category: "nghe", src: "/art-library/nganh-nghe/giao-hang.png", x: 67, y: 65, size: 34, caption: "MỜI QUÉT MÃ ĐỂ NHẬN HÀNG" },
  { id: "van-phong", name: "Văn phòng sáng cửa", mood: "Công sở", category: "nghe", src: "/art-library/nganh-nghe/van-phong.png", x: 70, y: 42, size: 43, caption: "MỜI QUÉT MÃ, XỬ LÝ NHANH" },
  { id: "rap-chieu", name: "Rạp chiếu mở màn", mood: "Điện ảnh", category: "giai-tri", src: "/art-library/giai-tri/rap-chieu.png", x: 66, y: 49, size: 50, caption: "MỜI QUÉT VÉ VÀ THƯỞNG PHIM" },
  { id: "ca-si", name: "Ca sĩ lên mic", mood: "Âm nhạc", category: "giai-tri", src: "/art-library/giai-tri/ca-si.png", x: 68, y: 54, size: 47, caption: "MỜI BẠN QUÉT MÃ, LÊN NHẠC" },
  { id: "bap-rang", name: "Bắp rang mời vé", mood: "Điện ảnh", category: "giai-tri", src: "/art-library/giai-tri/bap-rang-bo.png", x: 70, y: 52, size: 45, caption: "MỜI BẠN DÙNG BẮP, XEM PHIM" },
  { id: "tro-choi", name: "Thùng game tuổi thơ", mood: "Trò chơi", category: "giai-tri", src: "/art-library/giai-tri/tro-choi.png", x: 61, y: 40, size: 40, caption: "MỜI BẠN QUÉT MÃ VÀO TRÒ CHƠI" },
  { id: "dien-nhac", name: "DJ bật nhịp", mood: "Âm nhạc", category: "giai-tri", src: "/art-library/giai-tri/dien-nhac.png", x: 72, y: 50, size: 39, caption: "MỜI QUÉT MÃ, CÙNG HÒA NHỊP" },
  { id: "san-khau", name: "Sân khấu sáng đèn", mood: "Biểu diễn", category: "giai-tri", src: "/art-library/giai-tri/san-khau.png", x: 70, y: 50, size: 45, caption: "MỜI QUÉT VÉ, CÙNG CHUNG VUI" },
  { id: "banh-mi", name: "Bánh mì nóng giòn", mood: "Ẩm thực", category: "kinh-doanh", src: "/art-library/kinh-doanh/banh-mi.png", x: 69, y: 67, size: 40, caption: "MỜI QUÉT MÃ, CHỌN BÁNH NGON" },
  { id: "quan-mi", name: "Tô mì biết mời", mood: "Ẩm thực", category: "kinh-doanh", src: "/art-library/kinh-doanh/quan-mi.png", x: 73, y: 54, size: 39, caption: "MỜI BẠN DÙNG MÌ NÓNG" },
  { id: "tiem-hoa", name: "Tiệm hoa nở rộ", mood: "Bán lẻ", category: "kinh-doanh", src: "/art-library/kinh-doanh/tiem-hoa.png", x: 72, y: 72, size: 36, caption: "MỜI QUÉT MÃ, GỬI HOA TƯƠI" },
  { id: "thoi-trang", name: "Tiệm đồ có gu", mood: "Thời trang", category: "kinh-doanh", src: "/art-library/kinh-doanh/thoi-trang.png", x: 70, y: 73, size: 36, caption: "MỜI QUÉT MÃ, CHỌN TRANG PHỤC" },
  { id: "sua-xe", name: "Thợ máy chắc tay", mood: "Dịch vụ", category: "kinh-doanh", src: "/art-library/kinh-doanh/sua-xe.png", x: 70, y: 70, size: 43, caption: "MỜI QUÉT MÃ, ĐẶT LỊCH SỬA XE" },
  { id: "cho-que", name: "Sạp chợ tươi vui", mood: "Bán lẻ", category: "kinh-doanh", src: "/art-library/kinh-doanh/cho-que.png", x: 71, y: 69, size: 35, caption: "MỜI BẠN QUÉT MÃ, GHÉ SẠP" },
  { id: "dam-cuoi", name: "Ngày vui có đôi", mood: "Cưới hỏi", category: "su-kien", src: "/art-library/su-kien/dam-cuoi.png", x: 68, y: 71, size: 38, caption: "MỜI BẠN QUÉT MÃ, CHUNG VUI" },
  { id: "sinh-nhat", name: "Bánh sinh nhật", mood: "Tiệc vui", category: "su-kien", src: "/art-library/su-kien/sinh-nhat.png", x: 74, y: 69, size: 38, caption: "MỜI QUÉT MÃ, CÙNG THỔI NẾN" },
  { id: "tot-nghiep", name: "Tân khoa rạng rỡ", mood: "Tốt nghiệp", category: "su-kien", src: "/art-library/su-kien/tot-nghiep.png", x: 70, y: 69, size: 39, caption: "MỜI QUÉT MÃ, XEM THÀNH QUẢ" },
  { id: "du-lich", name: "Xách ba lô lên", mood: "Du lịch", category: "su-kien", src: "/art-library/su-kien/du-lich.png", x: 70, y: 68, size: 41, caption: "MỜI QUÉT MÃ, CÙNG KHỞI HÀNH" },
  { id: "chay-bo", name: "Chạy là có hội", mood: "Thể thao", category: "su-kien", src: "/art-library/su-kien/chay-bo.png", x: 72, y: 69, size: 40, caption: "MỜI QUÉT MÃ, CÙNG CHẠY VUI" },
  { id: "thien-nguyen", name: "Góp vui góp sức", mood: "Cộng đồng", category: "su-kien", src: "/art-library/su-kien/thien-nguyen.png", x: 71, y: 73, size: 38, caption: "MỜI QUÉT MÃ, GÓP NIỀM VUI" },
  { id: "le-an-hoi", name: "Lễ ăn hỏi rộn ràng", mood: "Cưới hỏi", category: "su-kien", src: "/art-library/su-kien/le-an-hoi.png", x: 72, y: 68, size: 50, caption: "MỜI BẠN QUÉT MÃ, TRAO DUYÊN" },
  { id: "thoi-noi", name: "Thôi nôi bé yêu", mood: "Gia đình", category: "su-kien", src: "/art-library/su-kien/thoi-noi.png", x: 74, y: 66, size: 48, caption: "MỜI QUÉT MÃ, CHÚC BÉ VUI" },
  { id: "tan-gia", name: "Tân gia có tổ ấm", mood: "Nhà mới", category: "su-kien", src: "/art-library/su-kien/tan-gia.png", x: 72, y: 67, size: 52, caption: "MỜI QUÉT MÃ, MỪNG NHÀ MỚI" },
  { id: "ky-niem-cuoi", name: "Kỷ niệm ngày cưới", mood: "Ngày đôi mình", category: "su-kien", src: "/art-library/su-kien/ky-niem-cuoi.png", x: 71, y: 69, size: 52, caption: "MỜI QUÉT MÃ, MỪNG HẠNH PHÚC" },
  { id: "tat-nien", name: "Tất niên sum vầy", mood: "Tiệc cuối năm", category: "su-kien", src: "/art-library/su-kien/tat-nien.png", x: 71, y: 67, size: 54, caption: "MỜI QUÉT MÃ, CÙNG NHẬP TIỆC" },
  { id: "lien-hoan-ban-be", name: "Liên hoan bạn bè", mood: "Gặp gỡ", category: "su-kien", src: "/art-library/su-kien/lien-hoan-ban-be.png", x: 69, y: 71, size: 54, caption: "MỜI QUÉT MÃ, CÙNG CHUNG VUI" },
  { id: "lua-gao", name: "Mùa lúa chín", mood: "Trồng trọt", category: "nong-nghiep", src: "/art-library/nong-nghiep/lua-gao.png", x: 74, y: 64, size: 44, caption: "MỜI QUÉT MÃ, GẶT NIỀM VUI" },
  { id: "ca-phe", name: "Vườn cà phê", mood: "Nông sản", category: "nong-nghiep", src: "/art-library/nong-nghiep/ca-phe.png", x: 73, y: 64, size: 44, caption: "MỜI BẠN QUÉT MÃ, THĂM VƯỜN" },
  { id: "vuon-trai-cay", name: "Vườn trái ngọt", mood: "Nhà vườn", category: "nong-nghiep", src: "/art-library/nong-nghiep/vuon-trai-cay.png", x: 73, y: 64, size: 44, caption: "MỜI QUÉT MÃ, CHỌN TRÁI NGỌT" },
  { id: "danh-ca", name: "Chuyến cá đầy khoang", mood: "Thủy sản", category: "nong-nghiep", src: "/art-library/nong-nghiep/danh-ca.png", x: 76, y: 69, size: 40, caption: "MỜI BẠN QUÉT MÃ, CHỌN CÁ TƯƠI" },
  { id: "dam-sen", name: "Đầm sen sáng sớm", mood: "Trồng hoa", category: "nong-nghiep", src: "/art-library/nong-nghiep/dam-sen.png", x: 73, y: 69, size: 42, caption: "MỜI BẠN QUÉT MÃ, NGẮM SEN" },
  { id: "bo-sua", name: "Trang trại bò sữa", mood: "Chăn nuôi", category: "nong-nghiep", src: "/art-library/nong-nghiep/bo-sua.png", x: 69, y: 71, size: 43, caption: "MỜI BẠN QUÉT MÃ, THĂM TRẠI" },
  { id: "ganh-hang", name: "Gánh hàng rong", mood: "Phố quen", category: "hang-rong", src: "/art-library/hang-rong/ganh-hang.png", x: 58, y: 69, size: 38, caption: "MỜI BẠN QUÉT MÃ, GHÉ GÁNH" },
  { id: "tra-da", name: "Trà đá vỉa hè", mood: "Giải khát", category: "hang-rong", src: "/art-library/hang-rong/tra-da.png", x: 42, y: 70, size: 38, caption: "MỜI QUÉT MÃ, DÙNG LY TRÀ MÁT" },
  { id: "xe-hoa", name: "Xe hoa đầu phố", mood: "Hoa tươi", category: "hang-rong", src: "/art-library/hang-rong/xe-hoa.png", x: 42, y: 69, size: 36, caption: "MỜI BẠN QUÉT MÃ, CHỌN HOA" },
  { id: "xe-trai-cay", name: "Xe trái cây", mood: "Hoa quả", category: "hang-rong", src: "/art-library/hang-rong/xe-trai-cay.png", x: 53, y: 73, size: 35, caption: "MỜI QUÉT MÃ, CHỌN TRÁI TƯƠI" },
  { id: "bap-nuong", name: "Bắp nướng thơm lừng", mood: "Ăn vặt", category: "hang-rong", src: "/art-library/hang-rong/bap-nuong.png", x: 39, y: 75, size: 36, caption: "MỜI BẠN QUÉT MÃ, DÙNG BẮP NÓNG" },
  { id: "xe-mi", name: "Xe mì ven đường", mood: "Món nóng", category: "hang-rong", src: "/art-library/hang-rong/xe-mi.png", x: 37, y: 74, size: 37, caption: "MỜI BẠN QUÉT MÃ, DÙNG MÌ" },
  { id: "ruong-bac-thang", name: "Ruộng bậc thang", mood: "Miền núi", category: "phong-canh", src: "/art-library/phong-canh/ruong-bac-thang.png", x: 53, y: 65, size: 42, caption: "MỜI QUÉT MÃ, NGẮM NÚI ĐỒI" },
  { id: "bien-xanh", name: "Biển xanh cát trắng", mood: "Miền biển", category: "phong-canh", src: "/art-library/phong-canh/bien-xanh.png", x: 43, y: 65, size: 36, caption: "MỜI BẠN QUÉT MÃ, RA BIỂN" },
  { id: "song-nui", name: "Sông giữa núi", mood: "Non nước", category: "phong-canh", src: "/art-library/phong-canh/song-nui.png", x: 53, y: 69, size: 35, caption: "MỜI QUÉT MÃ, NGẮM NON NƯỚC" },
  { id: "doi-thong", name: "Đồi thông sương sớm", mood: "Cao nguyên", category: "phong-canh", src: "/art-library/phong-canh/doi-thong.png", x: 53, y: 65, size: 40, caption: "MỜI QUÉT MÃ, GHÉ ĐỒI THÔNG" },
  { id: "ho-sen", name: "Hồ sen bình minh", mood: "Đồng quê", category: "phong-canh", src: "/art-library/phong-canh/ho-sen.png", x: 59, y: 69, size: 35, caption: "MỜI BẠN QUÉT MÃ, NGẮM SEN" },
  { id: "deo-nui", name: "Đèo cao lộng gió", mood: "Đường núi", category: "phong-canh", src: "/art-library/phong-canh/deo-nui.png", x: 43, y: 68, size: 34, caption: "MỜI QUÉT MÃ, KHÁM PHÁ ĐÈO CAO" },
  { id: "trekking", name: "Đi bộ đường dài", mood: "Khám phá", category: "du-lich", src: "/art-library/du-lich/trekking.png", x: 69, y: 52, size: 42, caption: "MỜI QUÉT BẢN ĐỒ, CÙNG KHÁM PHÁ" },
  { id: "gia-dinh-bien", name: "Cả nhà đi biển", mood: "Nghỉ dưỡng", category: "du-lich", src: "/art-library/du-lich/gia-dinh-bien.png", x: 73, y: 65, size: 40, caption: "MỜI CẢ NHÀ CÙNG QUÉT MÃ" },
  { id: "dap-xe", name: "Đạp xe ngắm lúa", mood: "Trải nghiệm", category: "du-lich", src: "/art-library/du-lich/dap-xe.png", x: 70, y: 69, size: 40, caption: "MỜI QUÉT MÃ, CÙNG ĐẠP XE" },
  { id: "cam-trai", name: "Cắm trại rừng thông", mood: "Ngoài trời", category: "du-lich", src: "/art-library/du-lich/cam-trai.png", x: 71, y: 49, size: 47, caption: "MỜI QUÉT MÃ, CÙNG CẮM TRẠI" },
  { id: "du-thuyen", name: "Thuyền trôi non nước", mood: "Đường sông", category: "du-lich", src: "/art-library/du-lich/du-thuyen.png", x: 54, y: 73, size: 36, caption: "MỜI QUÉT MÃ, CÙNG LÊN THUYỀN" },
  { id: "check-in", name: "Hội bạn check-in", mood: "Kỷ niệm", category: "du-lich", src: "/art-library/du-lich/check-in.png", x: 68, y: 42, size: 45, caption: "MỜI QUÉT MÃ, LƯU KỶ NIỆM" },
  { id: "ha-noi", name: "Hà Nội · Hồ Gươm", mood: "Thủ đô", category: "bac-trung", src: "/art-library/mien-bac-trung/ha-noi.png", x: 75, y: 76, size: 36, caption: "MỜI QUÉT MÃ, GHÉ HỒ GƯƠM" },
  { id: "quang-ninh", name: "Quảng Ninh · Hạ Long", mood: "Vịnh biển", category: "bac-trung", src: "/art-library/mien-bac-trung/quang-ninh.png", x: 75, y: 76, size: 36, caption: "MỜI QUÉT MÃ, NGẮM HẠ LONG" },
  { id: "ninh-binh", name: "Ninh Bình · Tràng An", mood: "Non nước", category: "bac-trung", src: "/art-library/mien-bac-trung/ninh-binh.png", x: 75, y: 76, size: 36, caption: "MỜI QUÉT MÃ, KHÁM PHÁ TRÀNG AN" },
  { id: "ha-giang", name: "Hà Giang · Đường đèo", mood: "Cực Bắc", category: "bac-trung", src: "/art-library/mien-bac-trung/ha-giang.png", x: 74, y: 74, size: 36, caption: "MỜI QUÉT MÃ, GHÉ HÀ GIANG" },
  { id: "lao-cai", name: "Lào Cai · Sa Pa", mood: "Ruộng núi", category: "bac-trung", src: "/art-library/mien-bac-trung/lao-cai.png", x: 74, y: 74, size: 36, caption: "MỜI QUÉT MÃ, KHÁM PHÁ SA PA" },
  { id: "hue", name: "Huế · Kinh thành", mood: "Di sản", category: "bac-trung", src: "/art-library/mien-bac-trung/hue.png", x: 75, y: 74, size: 36, caption: "MỜI QUÉT MÃ, GHÉ KINH THÀNH" },
  { id: "tp-hcm", name: "TP.HCM · Chợ Bến Thành", mood: "Đô thị", category: "nam-bien", src: "/art-library/mien-nam-bien/tp-hcm.png", x: 36, y: 72, size: 36, caption: "MỜI QUÉT MÃ, GHÉ BẾN THÀNH" },
  { id: "da-nang", name: "Đà Nẵng · Cầu Rồng", mood: "Sông biển", category: "nam-bien", src: "/art-library/mien-nam-bien/da-nang.png", x: 33, y: 72, size: 36, caption: "MỜI QUÉT MÃ, NGẮM CẦU RỒNG" },
  { id: "hoi-an", name: "Quảng Nam · Hội An", mood: "Phố cổ", category: "nam-bien", src: "/art-library/mien-nam-bien/hoi-an.png", x: 32, y: 72, size: 36, caption: "MỜI QUÉT MÃ, DẠO PHỐ CỔ" },
  { id: "da-lat", name: "Lâm Đồng · Đà Lạt", mood: "Cao nguyên", category: "nam-bien", src: "/art-library/mien-nam-bien/da-lat.png", x: 35, y: 75, size: 35, caption: "MỜI QUÉT MÃ, GHÉ ĐÀ LẠT" },
  { id: "can-tho", name: "Cần Thơ · Chợ nổi", mood: "Miền sông", category: "nam-bien", src: "/art-library/mien-nam-bien/can-tho.png", x: 75, y: 68, size: 36, caption: "MỜI QUÉT MÃ, GHÉ CHỢ NỔI" },
  { id: "phu-quoc", name: "Kiên Giang · Phú Quốc", mood: "Đảo ngọc", category: "nam-bien", src: "/art-library/mien-nam-bien/phu-quoc.png", x: 75, y: 75, size: 35, caption: "MỜI QUÉT MÃ, GHÉ PHÚ QUỐC" },
  { id: "meo-sep", name: "Mèo sếp thân thiện", mood: "Hài duyên", category: "hai-thu", src: "/art-library/hai-thu/meo-sep.png", x: 74, y: 61, size: 38, caption: "SẾP MỜI BẠN QUÉT MÃ" },
  { id: "capy-tron-bao-thuc", name: "Capy ngủ nướng", mood: "Thư thả", category: "hai-thu", src: "/art-library/hai-thu/capy-tron-bao-thuc.png", x: 50, y: 66, size: 34, caption: "MỜI QUÉT MÃ, CHÚC NGÀY AN NHIÊN" },
  { id: "vit-dieu-phoi", name: "Vịt điều phối giao thông", mood: "Nghiêm mà vui", category: "hai-thu", src: "/art-library/hai-thu/vit-dieu-phoi.png", x: 75, y: 42, size: 38, caption: "XIN MỜI DỪNG CHÂN QUÉT MÃ" },
  { id: "cho-bao-ve", name: "Bảo vệ nghỉ giữa ca", mood: "Thư giãn", category: "hai-thu", src: "/art-library/hai-thu/cho-bao-ve.png", x: 74, y: 44, size: 36, caption: "MỜI BẠN QUÉT MÃ NHẸ NHÀNG" },
  { id: "ech-karaoke", name: "Ếch say mê ca hát", mood: "Đam mê ca hát", category: "hai-thu", src: "/art-library/hai-thu/ech-karaoke.png", x: 77, y: 44, size: 36, caption: "MỜI QUÉT MÃ, CÙNG CA HÁT" },
  { id: "ga-influencer", name: "Gà tạo dáng mạng", mood: "Tự tin tỏa sáng", category: "hai-thu", src: "/art-library/hai-thu/ga-influencer.png", x: 70, y: 43, size: 42, caption: "MỜI QUÉT MÃ, CÙNG TỎA SÁNG" },
  { id: "ca-phe-cuu-roi", name: "Cà phê tiếp sức cả phòng", mood: "Năng lượng mới", category: "hai-cong-so", src: "/art-library/hai-cong-so/ca-phe-cuu-roi.png", x: 75, y: 44, size: 44, caption: "MỜI QUÉT MÃ, DÙNG CÀ PHÊ" },
  { id: "hop-robot", name: "Cuộc họp công nghệ", mood: "Họp từ xa", category: "hai-cong-so", src: "/art-library/hai-cong-so/hop-robot.png", x: 76, y: 43, size: 36, caption: "MỜI QUÉT MÃ, CÙNG KẾT NỐI" },
  { id: "vat-may-in", name: "Máy in cần trợ giúp", mood: "Chuyện văn phòng", category: "hai-cong-so", src: "/art-library/hai-cong-so/vat-may-in.png", x: 77, y: 57, size: 40, caption: "MỜI QUÉT MÃ, XỬ LÝ THUẬN LỢI" },
  { id: "hop-om-goi", name: "Họp nghiêm túc thật êm", mood: "Tinh thần mềm", category: "hai-cong-so", src: "/art-library/hai-cong-so/hop-om-goi.png", x: 52, y: 25, size: 34, caption: "MỜI QUÉT MÃ, CÙNG TRAO ĐỔI" },
  { id: "lam-viec-o-nha", name: "Làm việc tại nhà", mood: "Làm xa rất gần", category: "hai-cong-so", src: "/art-library/hai-cong-so/lam-viec-o-nha.png", x: 70, y: 57, size: 40, caption: "MỜI QUÉT MÃ, KẾT NỐI TỪ XA" },
  { id: "vi-rong", name: "Kế hoạch đầu tháng", mood: "Tài chính vui", category: "hai-cong-so", src: "/art-library/hai-cong-so/vi-rong.png", x: 76, y: 52, size: 40, caption: "MỜI QUÉT MÃ, CHI TIÊU HỢP LÝ" },
  { id: "banh-mi-dao-dien", name: "Bánh mì đạo diễn", mood: "Chỉ đạo giòn tan", category: "hai-do-an", src: "/art-library/hai-do-an/banh-mi-dao-dien.png", x: 75, y: 58, size: 44, caption: "MỜI BẠN QUÉT MÃ, THÊM MỘT CẢNH" },
  { id: "mi-yoga", name: "Tô mì tập yoga", mood: "Dẻo hơn sợi mì", category: "hai-do-an", src: "/art-library/hai-do-an/mi-yoga.png", x: 74, y: 62, size: 38, caption: "MỜI QUÉT MÃ, THƯ GIÃN NHẸ NHÀNG" },
  { id: "ca-phe-mat-mo", name: "Cà phê đánh thức ngày mới", mood: "Tỉnh táo", category: "hai-do-an", src: "/art-library/hai-do-an/ca-phe-mat-mo.png", x: 75, y: 56, size: 40, caption: "MỜI QUÉT MÃ, CHÀO NGÀY TỈNH TÁO" },
  { id: "sau-rieng-diva", name: "Sầu riêng lên thảm đỏ", mood: "Hương vị riêng", category: "hai-do-an", src: "/art-library/hai-do-an/sau-rieng-diva.png", x: 75, y: 56, size: 40, caption: "MỜI QUÉT MÃ, THƯỞNG SẦU RIÊNG" },
  { id: "nuoc-mam-sieu-nhan", name: "Nước mắm siêu nhân", mood: "Đậm đà", category: "hai-do-an", src: "/art-library/hai-do-an/nuoc-mam-sieu-nhan.png", x: 73, y: 58, size: 40, caption: "MỜI QUÉT MÃ, THƯỞNG VỊ ĐẬM ĐÀ" },
  { id: "noi-com-het-hon", name: "Nồi cơm bất ngờ", mood: "Cơm vừa chín", category: "hai-do-an", src: "/art-library/hai-do-an/noi-com-het-hon.png", x: 76, y: 57, size: 38, caption: "MỜI QUÉT MÃ, CƠM ĐÃ SẴN" },
  { id: "san-wifi", name: "Tìm Wi‑Fi trên cao", mood: "Kết nối hy vọng", category: "hai-doi-thuong", src: "/art-library/hai-doi-thuong/san-wifi.png", x: 73, y: 53, size: 42, caption: "MỜI QUÉT MÃ, KẾT NỐI WI-FI" },
  { id: "mua-to", name: "Mưa to vẫn bình thản", mood: "Ngày mưa", category: "hai-doi-thuong", src: "/art-library/hai-doi-thuong/mua-to.png", x: 73, y: 64, size: 36, caption: "MỜI QUÉT MÃ, CHÚC NGÀY AN LÀNH" },
  { id: "nui-quan-ao", name: "Núi quần áo biết đi", mood: "Việc nhà vui", category: "hai-doi-thuong", src: "/art-library/hai-doi-thuong/nui-quan-ao.png", x: 73, y: 60, size: 40, caption: "MỜI QUÉT MÃ, MỌI VIỆC GỌN GÀNG" },
  { id: "giu-phong-bi", name: "Phong bì trao bằng cả tim", mood: "Ngày vui", category: "hai-doi-thuong", src: "/art-library/hai-doi-thuong/giu-phong-bi.png", x: 73, y: 59, size: 44, caption: "MỜI QUÉT MÃ, GỬI LỜI CHÚC" },
  { id: "soi-cong-to", name: "Theo dõi công tơ thật kỹ", mood: "Chuyện trong nhà", category: "hai-doi-thuong", src: "/art-library/hai-doi-thuong/soi-cong-to.png", x: 71, y: 63, size: 40, caption: "MỜI QUÉT MÃ, XEM THÔNG TIN" },
  { id: "selfie-dai-gia-dinh", name: "Selfie đại gia đình", mood: "Sum vầy", category: "hai-doi-thuong", src: "/art-library/hai-doi-thuong/selfie-dai-gia-dinh.png", x: 76, y: 50, size: 47, caption: "MỜI CẢ NHÀ CÙNG QUÉT MÃ" },
  { id: "bach-duong", name: "Bạch Dương", mood: "Nhiệt thành", category: "hoang-dao", src: "/art-library/hoang-dao/bach-duong.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, TỎA SÁNG" },
  { id: "kim-nguu", name: "Kim Ngưu", mood: "Vững vàng", category: "hoang-dao", src: "/art-library/hoang-dao/kim-nguu.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, AN NHIÊN" },
  { id: "song-tu", name: "Song Tử", mood: "Linh hoạt", category: "hoang-dao", src: "/art-library/hoang-dao/song-tu.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, KẾT NỐI" },
  { id: "cu-giai", name: "Cự Giải", mood: "Ấm áp", category: "hoang-dao", src: "/art-library/hoang-dao/cu-giai.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, CHUNG VUI" },
  { id: "su-tu", name: "Sư Tử", mood: "Rạng rỡ", category: "hoang-dao", src: "/art-library/hoang-dao/su-tu.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, TỎA SÁNG" },
  { id: "xu-nu", name: "Xử Nữ", mood: "Tinh tế", category: "hoang-dao", src: "/art-library/hoang-dao/xu-nu.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, THẬT TINH TẾ" },
  { id: "thien-binh", name: "Thiên Bình", mood: "Hài hòa", category: "hoang-dao", src: "/art-library/hoang-dao/thien-binh.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, GIỮ HÀI HÒA" },
  { id: "bo-cap", name: "Bọ Cạp", mood: "Sâu sắc", category: "hoang-dao", src: "/art-library/hoang-dao/bo-cap.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, KHÁM PHÁ" },
  { id: "nhan-ma", name: "Nhân Mã", mood: "Tự do", category: "hoang-dao", src: "/art-library/hoang-dao/nhan-ma.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, CÙNG KHỞI HÀNH" },
  { id: "ma-ket", name: "Ma Kết", mood: "Bền bỉ", category: "hoang-dao", src: "/art-library/hoang-dao/ma-ket.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, VỮNG BƯỚC" },
  { id: "bao-binh", name: "Bảo Bình", mood: "Sáng tạo", category: "hoang-dao", src: "/art-library/hoang-dao/bao-binh.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, KHƠI Ý TƯỞNG" },
  { id: "song-ngu", name: "Song Ngư", mood: "Mộng mơ", category: "hoang-dao", src: "/art-library/hoang-dao/song-ngu.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, THẢ HỒN VUI" },
  { id: "ty-chuot", name: "Tý · Chuột", mood: "Nhanh trí", category: "con-giap", src: "/art-library/con-giap/ty-chuot.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, ĐÓN MAY MẮN" },
  { id: "suu-trau", name: "Sửu · Trâu", mood: "Chăm chỉ", category: "con-giap", src: "/art-library/con-giap/suu-trau.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, GẶT THÀNH CÔNG" },
  { id: "dan-ho", name: "Dần · Hổ", mood: "Mạnh mẽ", category: "con-giap", src: "/art-library/con-giap/dan-ho.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, THÊM KHÍ THẾ" },
  { id: "mao-meo", name: "Mão · Mèo", mood: "Duyên dáng", category: "con-giap", src: "/art-library/con-giap/mao-meo.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, ĐÓN NIỀM VUI" },
  { id: "thin-rong", name: "Thìn · Rồng", mood: "Cát tường", category: "con-giap", src: "/art-library/con-giap/thin-rong.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, ĐÓN CÁT TƯỜNG" },
  { id: "ty-ran", name: "Tỵ · Rắn", mood: "Khéo léo", category: "con-giap", src: "/art-library/con-giap/ty-ran.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, MỌI VIỆC HANH THÔNG" },
  { id: "ngo-ngua", name: "Ngọ · Ngựa", mood: "Phóng khoáng", category: "con-giap", src: "/art-library/con-giap/ngo-ngua.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, CÙNG TIẾN BƯỚC" },
  { id: "mui-de", name: "Mùi · Dê", mood: "Ôn hòa", category: "con-giap", src: "/art-library/con-giap/mui-de.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, CHÚC AN LÀNH" },
  { id: "than-khi", name: "Thân · Khỉ", mood: "Lanh lợi", category: "con-giap", src: "/art-library/con-giap/than-khi.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, CÙNG KHÁM PHÁ" },
  { id: "dau-ga", name: "Dậu · Gà", mood: "Đúng giờ", category: "con-giap", src: "/art-library/con-giap/dau-ga.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, ĐÓN BÌNH MINH" },
  { id: "tuat-cho", name: "Tuất · Chó", mood: "Chân thành", category: "con-giap", src: "/art-library/con-giap/tuat-cho.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, GỬI NIỀM TIN" },
  { id: "hoi-heo", name: "Hợi · Heo", mood: "Sung túc", category: "con-giap", src: "/art-library/con-giap/hoi-heo.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, ĐÓN SUNG TÚC" },
  { id: "hoa-sen-viet", name: "Hoa sen Việt", mood: "Thanh nhã", category: "van-hoa-viet", src: "/art-library/van-hoa-viet/hoa-sen.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, NGẮM HOA SEN" },
  { id: "trong-dong", name: "Trống đồng", mood: "Cội nguồn", category: "van-hoa-viet", src: "/art-library/van-hoa-viet/trong-dong.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, GÌN GIỮ CỘI NGUỒN" },
  { id: "non-la-viet", name: "Nón lá", mood: "Duyên Việt", category: "van-hoa-viet", src: "/art-library/van-hoa-viet/non-la.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, NGẮM NÉT VIỆT" },
  { id: "ao-dai-viet", name: "Áo dài", mood: "Thanh lịch", category: "van-hoa-viet", src: "/art-library/van-hoa-viet/ao-dai.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, TÔN NÉT DUYÊN" },
  { id: "chim-lac", name: "Chim Lạc", mood: "Di sản", category: "van-hoa-viet", src: "/art-library/van-hoa-viet/chim-lac.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, NỐI DÒNG DI SẢN" },
  { id: "tre-viet", name: "Tre Việt", mood: "Kiên cường", category: "van-hoa-viet", src: "/art-library/van-hoa-viet/tre-viet.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, VỮNG NHƯ TRE" },
  { id: "ca-chep", name: "Cá chép", mood: "Thăng tiến", category: "van-hoa-viet", src: "/art-library/van-hoa-viet/ca-chep.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, VƯỢT VŨ MÔN" },
  { id: "den-long-hoi-an", name: "Đèn lồng Hội An", mood: "Phố hội", category: "van-hoa-viet", src: "/art-library/van-hoa-viet/den-long-hoi-an.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, DẠO PHỐ HỘI" },
  { id: "banh-chung", name: "Bánh chưng", mood: "Tết sum vầy", category: "van-hoa-viet", src: "/art-library/van-hoa-viet/banh-chung.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, ĐÓN TẾT SUM VẦY" },
  { id: "mai-vang", name: "Mai vàng", mood: "Tết phương Nam", category: "van-hoa-viet", src: "/art-library/van-hoa-viet/mai-vang.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, ĐÓN XUÂN VÀNG" },
  { id: "hoa-dao", name: "Hoa đào", mood: "Tết phương Bắc", category: "van-hoa-viet", src: "/art-library/van-hoa-viet/hoa-dao.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, ĐÓN XUÂN HỒNG" },
  { id: "gom-bat-trang", name: "Gốm Bát Tràng", mood: "Làng nghề", category: "van-hoa-viet", src: "/art-library/van-hoa-viet/gom-bat-trang.svg", x: 69.5, y: 66.7, size: 52, caption: "MỜI BẠN QUÉT MÃ, NGẮM GỐM VIỆT" },
];

const artCategories: { id: ArtCategory; label: string; icon: string }[] = [
  { id: "hai", label: "Hài hước", icon: "☺" },
  { id: "hai-thu", label: "Thú cưng vui nhộn", icon: "☻" },
  { id: "hai-cong-so", label: "Công sở dí dỏm", icon: "⌘" },
  { id: "hai-do-an", label: "Ẩm thực vui nhộn", icon: "♨" },
  { id: "hai-doi-thuong", label: "Đời thường vui vẻ", icon: "※" },
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
  { id: "hoang-dao", label: "Cung hoàng đạo", icon: "✦" },
  { id: "con-giap", label: "12 con giáp Việt", icon: "◆" },
  { id: "van-hoa-viet", label: "Văn hóa Việt", icon: "❋" },
];

const funMoods: { id: Exclude<FunMood, "context">; label: string; icon: string; artIds: string[] }[] = [
  { id: "cute", label: "Dễ thương", icon: "♡", artIds: ["ech", "cun", "capy-tron-bao-thuc", "cho-bao-ve", "mao-meo", "thoi-noi", "selfie-dai-gia-dinh", "gia-dinh-bien", "hoa-sen-viet", "xe-hoa", "tiem-hoa", "hoi-heo"] },
  { id: "chaotic", label: "Hài lầy", icon: "☻", artIds: ["capy", "meo-sep", "vit-dieu-phoi", "ech-karaoke", "ga-influencer", "vat-may-in", "hop-om-goi", "mi-yoga", "sau-rieng-diva", "nuoc-mam-sieu-nhan", "noi-com-het-hon", "mua-to"] },
  { id: "vietnam", label: "Việt Nam", icon: "❋", artIds: ["non-la-viet", "ao-dai-viet", "trong-dong", "banh-chung", "ha-noi", "hue", "hoi-an", "tp-hcm", "can-tho", "ganh-hang", "tra-da", "ruong-bac-thang"] },
  { id: "office", label: "Công sở", icon: "⌘", artIds: ["meo-sep", "ca-phe-cuu-roi", "hop-robot", "vat-may-in", "hop-om-goi", "lam-viec-o-nha", "vi-rong", "van-phong", "giao-hang", "vit", "ca-phe-mat-mo", "soi-cong-to"] },
  { id: "food", label: "Ăn uống", icon: "♨", artIds: ["banh-mi", "quan-mi", "ca-phe", "tra-da", "bap-nuong", "xe-mi", "banh-mi-dao-dien", "mi-yoga", "ca-phe-mat-mo", "sau-rieng-diva", "nuoc-mam-sieu-nhan", "noi-com-het-hon"] },
  { id: "occasion", label: "Dịp vui", icon: "★", artIds: ["dam-cuoi", "sinh-nhat", "tot-nghiep", "le-an-hoi", "thoi-noi", "tan-gia", "ky-niem-cuoi", "tat-nien", "lien-hoan-ban-be", "giu-phong-bi", "selfie-dai-gia-dinh", "mai-vang"] },
];

const contextArtIds: Record<Mode, string[]> = {
  link: ["capy", "meo-sep", "ga-influencer", "check-in", "tro-choi", "san-khau", "non-la-viet", "tp-hcm", "hoa-sen-viet", "ech"],
  wifi: ["san-wifi", "capy", "ech", "lam-viec-o-nha", "hop-robot", "ca-phe-cuu-roi", "meo-sep", "tra-da", "mua-to", "cun"],
  bank: ["vi-rong", "giu-phong-bi", "meo-sep", "ca-phe-cuu-roi", "nuoc-mam-sieu-nhan", "banh-mi-dao-dien", "sinh-nhat", "tan-gia", "banh-chung", "thin-rong"],
  bill: ["lien-hoan-ban-be", "mi-yoga", "noi-com-het-hon", "banh-mi-dao-dien", "ca-phe-mat-mo", "nuoc-mam-sieu-nhan", "tra-da", "bap-nuong", "selfie-dai-gia-dinh", "vi-rong"],
  text: ["meo", "capy", "cun", "meo-sep", "vit-dieu-phoi", "ao-dai-viet", "trong-dong", "sinh-nhat", "check-in", "hoa-sen-viet"],
  email: ["meo-sep", "ca-phe-cuu-roi", "hop-robot", "vat-may-in", "van-phong", "giao-vien", "ga-influencer", "hop-om-goi", "lam-viec-o-nha", "capy"],
};

const funnyCaptions: Partial<Record<string, string>> = {
  meo: "QUÉT ĐI. MÈO ĐANG GIÁM SÁT.",
  capy: "QUÉT XONG RỒI TAN CA!",
  ech: "QUÉT XONG, TRÀ ĐÁ ĐANG CHỜ.",
  cun: "CÚN DUYỆT. MỜI QUÉT!",
  vit: "QUÉT NHANH, VỊT CÒN CHẠY ĐƠN.",
  noi: "QUÉT ĐI. CƠM CHÍN RỒI!",
  "meo-sep": "MÈO SẾP DUYỆT. QUÉT THÔI!",
  "capy-tron-bao-thuc": "QUÉT NHẸ. CAPY CHƯA TỈNH.",
  "vit-dieu-phoi": "VỊT RA HIỆU: QUÉT Ở ĐÂY!",
  "cho-bao-ve": "BẢO VỆ NGHỈ CA. QR VẪN TRỰC.",
  "ech-karaoke": "QUÉT XONG ẾCH HÁT TIẾP!",
  "ga-influencer": "QUÉT ĐI, GÀ ĐANG LÊN HÌNH.",
  "ca-phe-cuu-roi": "QUÉT TRƯỚC. TỈNH SAU ☕",
  "hop-robot": "ROBOT VÀO HỌP. BẠN QUÉT MÃ.",
  "vat-may-in": "MÁY IN KẸT. QR THÌ KHÔNG.",
  "hop-om-goi": "HỌP CĂNG? ÔM GỐI RỒI QUÉT.",
  "lam-viec-o-nha": "CAM TẮT. QR VẪN BẬT.",
  "vi-rong": "ĐẦU THÁNG VÍ CÒN THỞ 😌",
  "banh-mi-dao-dien": "BÁNH MÌ HÔ: QUÉT! CẮT!",
  "mi-yoga": "MÌ DẺO RỒI. BẠN QUÉT ĐI.",
  "ca-phe-mat-mo": "QUÉT XONG MỚI ĐƯỢC NGÁP.",
  "sau-rieng-diva": "DIVA LÊN SÓNG. QUÉT NÀO!",
  "nuoc-mam-sieu-nhan": "SIÊU NHÂN MẮM ĐÃ TỚI!",
  "noi-com-het-hon": "NỒI CƠM GIẬT MÌNH. QUÉT ĐI!",
  "san-wifi": "SÓNG Ở ĐÂU? QUÉT Ở ĐÂY!",
  "mua-to": "MƯA TO. QR VẪN BÌNH TĨNH.",
  "nui-quan-ao": "NÚI ĐỒ CAO. TINH THẦN CAO HƠN.",
  "giu-phong-bi": "PHONG BÌ ĐÃ SẴN. TIM CŨNG VẬY.",
  "soi-cong-to": "CÔNG TƠ CHẠY. MẮT CŨNG CHẠY.",
  "selfie-dai-gia-dinh": "ĐỦ MẶT RỒI. THIẾU MỖI LƯỢT QUÉT!",
};

const funRollArtIds: Record<Mode, string[]> = {
  link: ["ga-influencer", "meo-sep", "capy", "vit-dieu-phoi", "hop-robot", "ech-karaoke", "vat-may-in", "meo", "san-wifi", "banh-mi-dao-dien"],
  wifi: ["san-wifi", "capy", "meo-sep", "hop-robot", "ca-phe-cuu-roi", "mua-to", "vat-may-in", "ech", "cun", "lam-viec-o-nha"],
  bank: ["vi-rong", "giu-phong-bi", "meo-sep", "nuoc-mam-sieu-nhan", "banh-mi-dao-dien", "ca-phe-cuu-roi", "noi-com-het-hon", "vit-dieu-phoi", "capy", "sau-rieng-diva"],
  bill: ["mi-yoga", "noi-com-het-hon", "banh-mi-dao-dien", "ca-phe-mat-mo", "nuoc-mam-sieu-nhan", "sau-rieng-diva", "vi-rong", "selfie-dai-gia-dinh", "capy", "giu-phong-bi"],
  text: ["meo", "capy", "vit-dieu-phoi", "meo-sep", "ga-influencer", "ech-karaoke", "nui-quan-ao", "mua-to", "cun", "noi"],
  email: ["meo-sep", "vat-may-in", "ca-phe-cuu-roi", "hop-robot", "hop-om-goi", "lam-viec-o-nha", "ga-influencer", "capy", "vit-dieu-phoi", "ca-phe-mat-mo"],
};

const categoryVisualProfiles: Record<ArtCategory, ArtVisualProfile> = {
  hai: { paletteIndex: 3, style: "dots" },
  "hai-thu": { paletteIndex: 3, style: "dots" },
  "hai-cong-so": { paletteIndex: 3, style: "round" },
  "hai-do-an": { paletteIndex: 1, style: "round" },
  "hai-doi-thuong": { paletteIndex: 2, style: "round" },
  nghe: { paletteIndex: 0, style: "round" },
  "giai-tri": { paletteIndex: 3, style: "dots" },
  "kinh-doanh": { paletteIndex: 1, style: "round" },
  "su-kien": { paletteIndex: 1, style: "round" },
  "nong-nghiep": { paletteIndex: 2, style: "round" },
  "hang-rong": { paletteIndex: 2, style: "round" },
  "phong-canh": { paletteIndex: 2, style: "round" },
  "du-lich": { paletteIndex: 2, style: "round" },
  "bac-trung": { paletteIndex: 1, style: "square" },
  "nam-bien": { paletteIndex: 2, style: "round" },
  "hoang-dao": { paletteIndex: 3, style: "dots" },
  "con-giap": { paletteIndex: 1, style: "round" },
  "van-hoa-viet": { paletteIndex: 1, style: "square" },
};

const artVisualProfiles: Partial<Record<string, ArtVisualProfile>> = {
  meo: { paletteIndex: 3, style: "dots" },
  capy: { paletteIndex: 0, style: "round" },
  ech: { paletteIndex: 2, style: "dots" },
  cun: { paletteIndex: 3, style: "round" },
  vit: { paletteIndex: 0, style: "round" },
  noi: { paletteIndex: 1, style: "round" },
  "meo-sep": { paletteIndex: 3, style: "round" },
  "capy-tron-bao-thuc": { paletteIndex: 0, style: "round" },
  "vit-dieu-phoi": { paletteIndex: 0, style: "square" },
  "cho-bao-ve": { paletteIndex: 2, style: "round" },
  "ech-karaoke": { paletteIndex: 3, style: "dots" },
  "ga-influencer": { paletteIndex: 3, style: "dots" },
  "ca-phe-cuu-roi": { paletteIndex: 1, style: "round" },
  "hop-robot": { paletteIndex: 3, style: "square" },
  "vat-may-in": { paletteIndex: 0, style: "square" },
  "hop-om-goi": { paletteIndex: 3, style: "round" },
  "lam-viec-o-nha": { paletteIndex: 2, style: "round" },
  "vi-rong": { paletteIndex: 2, style: "square" },
  "banh-mi-dao-dien": { paletteIndex: 1, style: "round" },
  "mi-yoga": { paletteIndex: 1, style: "round" },
  "ca-phe-mat-mo": { paletteIndex: 1, style: "round" },
  "sau-rieng-diva": { paletteIndex: 2, style: "dots" },
  "nuoc-mam-sieu-nhan": { paletteIndex: 1, style: "square" },
  "noi-com-het-hon": { paletteIndex: 1, style: "round" },
  "san-wifi": { paletteIndex: 3, style: "round" },
  "mua-to": { paletteIndex: 2, style: "round" },
  "nui-quan-ao": { paletteIndex: 3, style: "dots" },
  "giu-phong-bi": { paletteIndex: 1, style: "round" },
  "soi-cong-to": { paletteIndex: 0, style: "square" },
  "selfie-dai-gia-dinh": { paletteIndex: 1, style: "round" },
  "banh-chung": { paletteIndex: 2, style: "square" },
  "hoa-sen-viet": { paletteIndex: 1, style: "round" },
  "non-la-viet": { paletteIndex: 2, style: "round" },
  "trong-dong": { paletteIndex: 0, style: "square" },
};

function getArtVisualProfile(item: LibraryArt) {
  return artVisualProfiles[item.id] ?? categoryVisualProfiles[item.category];
}

function getProfilePalette(profile: ArtVisualProfile) {
  const candidate = palettes[profile.paletteIndex] ?? palettes[0];
  return contrastOnWhite(candidate.value) >= 4.5 ? candidate : palettes[0];
}

function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  if (delta === 0) return { hue: 0, saturation: 0, lightness };
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  return { hue, saturation, lightness };
}

function rgbToHex(red: number, green: number, blue: number) {
  const channel = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0").toUpperCase();
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

function mixRgb(color: [number, number, number], target: [number, number, number], amount: number): [number, number, number] {
  return color.map((channel, index) => channel * (1 - amount) + target[index] * amount) as [number, number, number];
}

function safeArtInk(color: [number, number, number]) {
  let candidate = color;
  for (let step = 0; step <= 12; step += 1) {
    const value = rgbToHex(candidate[0], candidate[1], candidate[2]);
    if (contrastOnWhite(value) >= 4.5) return value;
    candidate = mixRgb(color, [0, 0, 0], (step + 1) / 13);
  }
  return palettes[0].value;
}

function getImageMatchedPalette(image: HTMLImageElement, profile: ArtVisualProfile) {
  const fallback = getProfilePalette(profile);
  try {
    const sample = document.createElement("canvas");
    sample.width = 40;
    sample.height = 40;
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (!context) return fallback;
    context.clearRect(0, 0, sample.width, sample.height);
    context.drawImage(image, 0, 0, sample.width, sample.height);
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    const hueBins = Array.from({ length: 24 }, () => ({ weight: 0, red: 0, green: 0, blue: 0 }));
    let colorWeight = 0;
    let neutralWeight = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const alpha = pixels[index + 3] / 255;
      if (alpha < 0.2) continue;
      const { hue, saturation, lightness } = rgbToHsl(pixels[index], pixels[index + 1], pixels[index + 2]);
      if (lightness > 0.94) continue;
      const visibility = alpha * (1.15 - Math.abs(lightness - 0.5));
      neutralWeight += visibility * (1 - saturation);
      if (saturation < 0.18) continue;
      const weight = visibility * saturation * saturation;
      const bin = Math.round(hue / 15) % hueBins.length;
      hueBins[bin].weight += weight;
      hueBins[bin].red += pixels[index] * weight;
      hueBins[bin].green += pixels[index + 1] * weight;
      hueBins[bin].blue += pixels[index + 2] * weight;
      colorWeight += weight;
    }
    if (colorWeight < 4 || colorWeight < neutralWeight * 0.45) return palettes[0];
    const dominant = hueBins.reduce((best, item) => item.weight > best.weight ? item : best, hueBins[0]);
    if (dominant.weight <= 0) return fallback;
    const artColor: [number, number, number] = [
      dominant.red / dominant.weight,
      dominant.green / dominant.weight,
      dominant.blue / dominant.weight,
    ];
    const value = safeArtInk(artColor);
    const accentRgb = mixRgb(artColor, [255, 255, 255], 0.62);
    return { name: "Theo tranh", value, accent: rgbToHex(accentRgb[0], accentRgb[1], accentRgb[2]) };
  } catch {
    return fallback;
  }
}

function playfulArtNotice(item: LibraryArt) {
  const special: Partial<Record<string, string>> = {
    capy: "Capy duyệt. Hôm nay được phép thong thả 😌",
    "meo-sep": "Mèo sếp duyệt. Không cần họp thêm.",
    "vit-dieu-phoi": "Vịt đã phân luồng QR. Mời đi thẳng 🦆",
    "ga-influencer": "Gà lên hình. QR cũng có góc đẹp.",
    "vat-may-in": "Máy in đang suy nghĩ. QR thì xong rồi.",
    "mi-yoga": "Tô mì đã giãn cơ. QR cũng sẵn sàng.",
    "sau-rieng-diva": "Diva sầu riêng đã bước lên thảm đỏ.",
    "nuoc-mam-sieu-nhan": "Siêu nhân nước mắm đã vào vị trí.",
    "noi-com-het-hon": "Nồi cơm hết hồn, QR vẫn bình tĩnh.",
    "san-wifi": "Bắt được Wi‑Fi rồi. Vui lên thôi 📶",
    "nui-quan-ao": "Núi đồ chưa gấp. QR đã gọn rồi.",
  };
  return special[item.id];
}

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

function drawBrandLogo(context: CanvasRenderingContext2D, logo: HTMLImageElement | null, centerX: number, centerY: number, qrSize: number, scale: number) {
  if (!logo) return;
  const badgeSize = qrSize * Math.max(8, Math.min(18, scale)) / 100;
  const padding = badgeSize * 0.14;
  context.save();
  context.fillStyle = "#FFFFFF";
  context.strokeStyle = "rgba(23,34,31,.28)";
  context.lineWidth = Math.max(1.5, badgeSize * 0.018);
  context.beginPath();
  context.roundRect(centerX - badgeSize / 2, centerY - badgeSize / 2, badgeSize, badgeSize, badgeSize * 0.18);
  context.fill();
  context.stroke();
  const available = badgeSize - padding * 2;
  const ratio = Math.min(available / logo.naturalWidth, available / logo.naturalHeight);
  const width = logo.naturalWidth * ratio;
  const height = logo.naturalHeight * ratio;
  context.drawImage(logo, centerX - width / 2, centerY - height / 2, width, height);
  context.restore();
}

function renderPreview(canvas: HTMLCanvasElement, payload: string, color: string, style: QRStyle, logo: HTMLImageElement | null, logoScale: number) {
  const scale = window.devicePixelRatio || 1;
  const size = 336;
  canvas.width = size * scale;
  canvas.height = size * scale;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.scale(scale, scale);
  drawQR(context, payload, color, style, 0, 0, size);
  drawBrandLogo(context, logo, size / 2, size / 2, size, logoScale);
}

function canvasFontFamily() {
  if (typeof window === "undefined") return 'var(--font-display), Arial, sans-serif';
  return window.getComputedStyle(document.body).fontFamily || 'var(--font-display), Arial, sans-serif';
}

function downloadStyledPNG(payload: string, color: string, accent: string, style: QRStyle, caption: string, filename: string, logo: HTMLImageElement | null, logoScale: number) {
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
  drawBrandLogo(context, logo, 700, 700, 1252, logoScale);
  context.fillStyle = "#171717";
  context.fillRect(110, 1370, 1180, 104);
  context.fillStyle = "#FFFFFF";
  context.font = `700 38px ${canvasFontFamily()}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(caption, 700, 1422);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${filename}.png`;
  link.click();
}

function escapeSvgText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function styledSVG(payload: string, color: string, accent: string, style: QRStyle, caption: string, logoDataUrl: string, logoScale: number) {
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
  if (logoDataUrl) {
    const badgeSize = qrSize * Math.max(8, Math.min(18, logoScale)) / 100;
    const padding = badgeSize * 0.14;
    pieces.push(`<rect x="${700 - badgeSize / 2}" y="${700 - badgeSize / 2}" width="${badgeSize}" height="${badgeSize}" rx="${badgeSize * 0.18}" fill="#fff" stroke="#17221f" stroke-opacity=".28" stroke-width="${Math.max(1.5, badgeSize * 0.018)}"/>`);
    pieces.push(`<image href="${escapeSvgText(logoDataUrl)}" x="${700 - badgeSize / 2 + padding}" y="${700 - badgeSize / 2 + padding}" width="${badgeSize - padding * 2}" height="${badgeSize - padding * 2}" preserveAspectRatio="xMidYMid meet"/>`);
  }
  const safeCaption = escapeSvgText(caption);
  pieces.push(`<rect x="110" y="1370" width="1180" height="104" fill="#171717"/><text x="700" y="1434" fill="#fff" font-family="var(--font-display),Arial,sans-serif" font-size="38" font-weight="700" text-anchor="middle">${safeCaption}</text>`);
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

function HexColorInput({ label, value, onApply }: { label: string; value: string; onApply: (value: string) => void }) {
  const commit = (input: HTMLInputElement) => {
    const normalized = `#${input.value.replace(/#/g, "").slice(0, 6).toUpperCase()}`;
    if (/^#[0-9A-F]{6}$/.test(normalized)) onApply(normalized);
    else input.value = value.toUpperCase();
  };
  return <label className="brand-color-field"><span>{label}</span><div><input type="color" value={value} onChange={(event) => onApply(event.target.value.toUpperCase())} aria-label={`Chọn ${label.toLowerCase()}`} /><input key={value} defaultValue={value.toUpperCase()} onBlur={(event) => commit(event.currentTarget)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} maxLength={7} inputMode="text" spellCheck={false} aria-label={`Mã HEX ${label.toLowerCase()}`} /></div></label>;
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
  context.font = `800 ${size * 0.038}px ${canvasFontFamily()}`;
  context.fillText("CHỌN TRANH HOẶC TẢI ẢNH", size / 2, size * 0.46);
  context.font = `600 ${size * 0.022}px ${canvasFontFamily()}`;
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
  logo: HTMLImageElement | null;
  logoScale: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  skewX: number;
  skewY: number;
  quad: ArtQuad;
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

function drawPolygon(context: CanvasRenderingContext2D, points: ArtPoint[]) {
  context.beginPath();
  points.forEach((point, index) => index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y));
  context.closePath();
}

function badgeQuadPoints(quad: ArtQuad, width: number, height: number) {
  return quad.map((point) => ({ x: (point.x - 0.5) * width, y: (point.y - 0.5) * height })) as ArtQuad;
}

function bilinearPoint(quad: ArtQuad, u: number, v: number): ArtPoint {
  const [topLeft, topRight, bottomRight, bottomLeft] = quad;
  return {
    x: topLeft.x * (1 - u) * (1 - v) + topRight.x * u * (1 - v) + bottomRight.x * u * v + bottomLeft.x * (1 - u) * v,
    y: topLeft.y * (1 - u) * (1 - v) + topRight.y * u * (1 - v) + bottomRight.y * u * v + bottomLeft.y * (1 - u) * v,
  };
}

function drawProjectedQR(context: CanvasRenderingContext2D, payload: string, color: string, style: QRStyle, background: string, mapPoint: (x: number, y: number) => ArtPoint, x: number, y: number, size: number) {
  const qr = QRCode.create(payload, { errorCorrectionLevel: "H" });
  const modules = qr.modules as typeof qr.modules & { isReserved(row: number, column: number): number };
  const quiet = 4;
  const cells = modules.size + quiet * 2;
  const cell = size / cells;
  const fillMappedCell = (cellX: number, cellY: number, inset = 0) => {
    const overlap = cell * 0.012;
    const left = cellX + inset - overlap;
    const top = cellY + inset - overlap;
    const right = cellX + cell - inset + overlap;
    const bottom = cellY + cell - inset + overlap;
    drawPolygon(context, [mapPoint(left, top), mapPoint(right, top), mapPoint(right, bottom), mapPoint(left, bottom)]);
    context.fill();
  };

  context.fillStyle = background;
  drawPolygon(context, [mapPoint(x, y), mapPoint(x + size, y), mapPoint(x + size, y + size), mapPoint(x, y + size)]);
  context.fill();
  context.fillStyle = color;
  for (let row = 0; row < modules.size; row++) {
    for (let column = 0; column < modules.size; column++) {
      if (!modules.get(row, column)) continue;
      const moduleX = x + (column + quiet) * cell;
      const moduleY = y + (row + quiet) * cell;
      const protectedModule = Boolean(modules.isReserved(row, column));
      if (style === "dots" && !protectedModule) {
        const center = mapPoint(moduleX + cell / 2, moduleY + cell / 2);
        const edgeX = mapPoint(moduleX + cell * 0.96, moduleY + cell / 2);
        const edgeY = mapPoint(moduleX + cell / 2, moduleY + cell * 0.96);
        const radiusX = Math.hypot(edgeX.x - center.x, edgeX.y - center.y);
        const radiusY = Math.hypot(edgeY.x - center.x, edgeY.y - center.y);
        context.save();
        context.translate(center.x, center.y);
        context.rotate(Math.atan2(edgeX.y - center.y, edgeX.x - center.x));
        context.scale(1, radiusX ? radiusY / radiusX : 1);
        context.beginPath();
        context.arc(0, 0, radiusX, 0, Math.PI * 2);
        context.fill();
        context.restore();
      } else {
        fillMappedCell(moduleX, moduleY, style === "round" && !protectedModule ? cell * 0.035 : 0);
      }
    }
  }
}

function drawProjectedBrandLogo(context: CanvasRenderingContext2D, logo: HTMLImageElement | null, mapPoint: (x: number, y: number) => ArtPoint, centerX: number, centerY: number, qrSize: number, scale: number) {
  if (!logo) return;
  const badgeSize = qrSize * Math.max(8, Math.min(18, scale)) / 100;
  const half = badgeSize / 2;
  const corners = [mapPoint(centerX - half, centerY - half), mapPoint(centerX + half, centerY - half), mapPoint(centerX + half, centerY + half), mapPoint(centerX - half, centerY + half)];
  context.fillStyle = "#FFFFFF";
  drawPolygon(context, corners);
  context.fill();
  const padding = badgeSize * 0.14;
  const available = badgeSize - padding * 2;
  const ratio = Math.min(available / logo.naturalWidth, available / logo.naturalHeight);
  const width = logo.naturalWidth * ratio;
  const height = logo.naturalHeight * ratio;
  const center = mapPoint(centerX, centerY);
  const xUnit = mapPoint(centerX + 1, centerY);
  const yUnit = mapPoint(centerX, centerY + 1);
  context.save();
  context.transform(xUnit.x - center.x, xUnit.y - center.y, yUnit.x - center.x, yUnit.y - center.y, center.x, center.y);
  context.drawImage(logo, -width / 2, -height / 2, width, height);
  context.restore();
}

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
  const projectedQuad = badgeQuadPoints(options.quad, badgeWidth, badgeHeight);
  const mapPoint = (x: number, y: number) => bilinearPoint(projectedQuad, (x - localLeft) / badgeWidth, (y - localTop) / badgeHeight);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const transformedCorners = projectedQuad.map(({ x, y }) => {
    const skewedX = x + skewX * y;
    const skewedY = skewY * x + y;
    return { x: skewedX * cos - skewedY * sin, y: skewedX * sin + skewedY * cos };
  });
  const minX = Math.min(...transformedCorners.map((point) => point.x));
  const maxX = Math.max(...transformedCorners.map((point) => point.x));
  const minY = Math.min(...transformedCorners.map((point) => point.y));
  const maxY = Math.max(...transformedCorners.map((point) => point.y));
  const clampCenter = (raw: number, min: number, max: number) => min <= max ? Math.max(min, Math.min(max, raw)) : canvasSize / 2;
  const frameX = clampCenter(canvasSize * options.x / 100, -minX, canvasSize - maxX);
  const frameY = clampCenter(canvasSize * options.y / 100, -minY, canvasSize - maxY);
  const shortestSide = Math.min(badgeWidth, badgeHeight);
  const qrSize = shortestSide * Math.max(42, Math.min(84, options.qrScale)) / 100;
  const clampLocal = (raw: number, min: number, max: number) => Math.max(min, Math.min(max, raw));
  const qrCenterX = clampLocal(localLeft + badgeWidth * options.qrX / 100, localLeft + qrSize / 2, localRight - qrSize / 2);
  const qrCenterY = clampLocal(localTop + badgeHeight * options.qrY / 100, localTop + qrSize / 2, localBottom - qrSize / 2);
  const projectedQrCenter = mapPoint(qrCenterX, qrCenterY);
  const skewedCenterX = projectedQrCenter.x + skewX * projectedQrCenter.y;
  const skewedCenterY = skewY * projectedQrCenter.x + projectedQrCenter.y;
  const sampledX = frameX + skewedCenterX * cos - skewedCenterY * sin;
  const sampledY = frameY + skewedCenterX * sin + skewedCenterY * cos;
  const embeddedSurface = options.paper ? "#FFFFFF" : sampleLightSurface(context, sampledX, sampledY, canvasSize);
  context.save();
  context.translate(frameX, frameY);
  context.rotate(angle);
  context.transform(1, skewY, skewX, 1, 0, 0);
  if (options.paper) {
    context.fillStyle = "#fff";
    context.shadowColor = "rgba(23,34,31,.28)";
    context.shadowBlur = canvasSize * 0.014;
    context.shadowOffsetX = canvasSize * 0.009;
    context.shadowOffsetY = canvasSize * 0.011;
    drawPolygon(context, projectedQuad);
    context.fill();
    context.shadowColor = "transparent";
    context.strokeStyle = "rgba(23,34,31,.72)";
    context.lineWidth = Math.max(2, Math.min(badgeWidth, badgeHeight) * 0.012);
    drawPolygon(context, projectedQuad);
    context.stroke();
  }
  drawProjectedQR(context, payload, ink, style, embeddedSurface, mapPoint, qrCenterX - qrSize / 2, qrCenterY - qrSize / 2, qrSize);
  drawProjectedBrandLogo(context, options.logo, mapPoint, qrCenterX, qrCenterY, qrSize, options.logoScale);
  const copyWidth = Math.min(badgeWidth, badgeWidth * options.copyWidth / 100);
  const copyCenterX = clampLocal(localLeft + badgeWidth * options.copyX / 100, localLeft + copyWidth / 2, localRight - copyWidth / 2);
  const captionFont = caption ? Math.min(badgeHeight * options.titleScale / 100, copyWidth / Math.max(7, caption.length * 0.52)) : 0;
  const subcaptionFont = subcaption ? Math.min(badgeHeight * options.subtitleScale / 100, copyWidth / Math.max(18, subcaption.length * 0.52)) : 0;
  const labelHeight = caption ? Math.max(captionFont * (subcaption ? 3.05 : 2.15), badgeHeight * 0.13) : 0;
  const copyCenterY = clampLocal(localTop + badgeHeight * options.copyY / 100, localTop + labelHeight / 2, localBottom - labelHeight / 2);
  const labelTop = copyCenterY - labelHeight / 2;
  if (caption) {
    context.fillStyle = "#17221f";
    const labelCorners = [mapPoint(copyCenterX - copyWidth / 2, labelTop), mapPoint(copyCenterX + copyWidth / 2, labelTop), mapPoint(copyCenterX + copyWidth / 2, labelTop + labelHeight), mapPoint(copyCenterX - copyWidth / 2, labelTop + labelHeight)];
    drawPolygon(context, labelCorners);
    context.fill();
    context.fillStyle = "#DFFF45";
    const accentHeight = Math.max(2, badgeHeight * 0.012);
    drawPolygon(context, [mapPoint(copyCenterX - copyWidth / 2, labelTop), mapPoint(copyCenterX + copyWidth / 2, labelTop), mapPoint(copyCenterX + copyWidth / 2, labelTop + accentHeight), mapPoint(copyCenterX - copyWidth / 2, labelTop + accentHeight)]);
    context.fill();
    const textCenter = mapPoint(copyCenterX, copyCenterY);
    const textLeft = mapPoint(copyCenterX - copyWidth / 2, copyCenterY);
    const textRight = mapPoint(copyCenterX + copyWidth / 2, copyCenterY);
    const projectedCopyWidth = Math.hypot(textRight.x - textLeft.x, textRight.y - textLeft.y);
    context.save();
    context.translate(textCenter.x, textCenter.y);
    context.rotate(Math.atan2(textRight.y - textLeft.y, textRight.x - textLeft.x));
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#fff";
    context.font = `800 ${captionFont}px ${canvasFontFamily()}`;
    context.fillText(caption, 0, subcaption ? -labelHeight * 0.14 : 0, projectedCopyWidth * 0.9);
    if (subcaption) {
      context.fillStyle = "#DFFF45";
      context.font = `600 ${subcaptionFont}px ${canvasFontFamily()}`;
      context.fillText(subcaption, 0, labelHeight * 0.24, projectedCopyWidth * 0.9);
    }
    context.restore();
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
  const downloadResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const [billTotal, setBillTotal] = useState("");
  const [billPeople, setBillPeople] = useState("3");
  const [billNames, setBillNames] = useState("");
  const [billNote, setBillNote] = useState("CHIA BILL");
  const [billPayer, setBillPayer] = useState(0);
  const [billImage, setBillImage] = useState<string | null>(null);
  const [billOcrStatus, setBillOcrStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [billOcrProgress, setBillOcrProgress] = useState(0);
  const [billOcrMessage, setBillOcrMessage] = useState("Kéo-thả ảnh vào đây cũng được");
  const billFileRef = useRef<HTMLInputElement | null>(null);
  const billOcrRequestRef = useRef(0);
  const [palette, setPalette] = useState(palettes[0]);
  const [brandName, setBrandName] = useState("");
  const [brandLogo, setBrandLogo] = useState<HTMLImageElement | null>(null);
  const [brandLogoDataUrl, setBrandLogoDataUrl] = useState("");
  const [brandLogoName, setBrandLogoName] = useState("");
  const [brandLogoScale, setBrandLogoScale] = useState(14);
  const [qrStyle, setQrStyle] = useState<QRStyle>("round");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("stamp");
  const [artImage, setArtImage] = useState<HTMLImageElement | null>(null);
  const [selectedArt, setSelectedArt] = useState(artLibrary[0].id);
  const [artCategory, setArtCategory] = useState<ArtCategory>("hai");
  const [funMood, setFunMood] = useState<FunMood>("context");
  const [showAllArt, setShowAllArt] = useState(false);
  const [funRolls, setFunRolls] = useState(0);
  const funHistoryRef = useRef<string[]>([]);
  const [artX, setArtX] = useState(65);
  const [artY, setArtY] = useState(38);
  const [artWidth, setArtWidth] = useState(45);
  const [artHeight, setArtHeight] = useState(45);
  const [artRotation, setArtRotation] = useState(0);
  const [artSkewX, setArtSkewX] = useState(0);
  const [artSkewY, setArtSkewY] = useState(0);
  const [artQuad, setArtQuad] = useState<ArtQuad>(customArtFrame.quad);
  const [artQrX, setArtQrX] = useState(50);
  const [artQrY, setArtQrY] = useState(40);
  const [artQrScale, setArtQrScale] = useState(78);
  const [artCopyX, setArtCopyX] = useState(50);
  const [artCopyY, setArtCopyY] = useState(90);
  const [artCopyWidth, setArtCopyWidth] = useState(76);
  const [artTitleScale, setArtTitleScale] = useState(6.1);
  const [artSubtitleScale, setArtSubtitleScale] = useState(2.25);
  const [artShowSubtitle, setArtShowSubtitle] = useState(false);
  const [artPaper, setArtPaper] = useState(true);
  const [artCaption, setArtCaption] = useState("MỜI BẠN QUÉT MÃ!");
  const [artSubcaption, setArtSubcaption] = useState("");
  const [notice, setNotice] = useState("Mã QR đã sẵn sàng để tải xuống");
  const [artworkLoading, setArtworkLoading] = useState(false);
  const [downloadedFormat, setDownloadedFormat] = useState<"png" | "svg" | null>(null);

  const applyArtFrame = useCallback((frame: ArtFrame) => {
    setArtX(frame.x);
    setArtY(frame.y);
    setArtWidth(frame.width);
    setArtHeight(frame.height);
    setArtRotation(frame.rotation);
    setArtSkewX(frame.skewX ?? 0);
    setArtSkewY(frame.skewY ?? 0);
    setArtQuad(frame.quad);
    setArtQrX(frame.qr.x);
    setArtQrY(frame.qr.y);
    setArtQrScale(frame.qr.size);
    setArtCopyX(frame.copy.x);
    setArtCopyY(frame.copy.y);
    setArtCopyWidth(frame.copy.width);
    setArtTitleScale(frame.copy.titleScale);
    setArtSubtitleScale(frame.copy.subtitleScale);
    setArtShowSubtitle(frame.copy.showSubtitle);
  }, []);

  const chooseLibraryArt = useCallback((item: LibraryArt, readyNotice?: string, visualProfile = getArtVisualProfile(item)) => {
    const image = new Image();
    image.onload = () => {
      const frame = artFrames[item.id] ?? {
        x: item.x, y: item.y, width: item.size, height: item.size, rotation: item.rotation ?? 0, skewX: 0, skewY: 0,
        quad: customArtFrame.quad,
        qr: { x: 50, y: 40, size: 78 },
        copy: { x: 50, y: 90, width: 76, titleScale: 6.1, subtitleScale: 2.25, showSubtitle: false },
      };
      setPalette(getImageMatchedPalette(image, visualProfile));
      setQrStyle(visualProfile.style);
      setArtImage(image);
      setSelectedArt(item.id);
      setArtCategory(item.category);
      applyArtFrame(frame);
      setArtPaper(false);
      setArtCaption(funnyCaptions[item.id] ?? item.caption);
      setArtSubcaption("");
      setLayoutMode("art");
      setNotice(readyNotice ?? playfulArtNotice(item) ?? `Mẫu ${item.name} đã sẵn sàng.`);
    };
    image.onerror = () => setNotice(`Không thể tải mẫu ${item.name}. Hãy chọn mẫu khác.`);
    image.src = publicAsset(item.src);
  }, [applyArtFrame]);

  const resetArtLayout = () => {
    const frame = selectedArt === "custom" ? customArtFrame : artFrames[selectedArt];
    if (!frame) return;
    applyArtFrame(frame);
    setArtPaper(selectedArt === "custom");
    setNotice(selectedArt === "custom" ? "Đã đặt lại vùng QR cho ảnh của bạn." : "Đã khôi phục bố cục chuẩn của mẫu.");
  };

  useEffect(() => {
    chooseLibraryArt(artLibrary[0]);
  }, [chooseLibraryArt]);

  useEffect(() => () => {
    if (downloadResetRef.current) clearTimeout(downloadResetRef.current);
  }, []);

  useEffect(() => () => {
    if (billImage) URL.revokeObjectURL(billImage);
  }, [billImage]);

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

  const billPeopleCount = useMemo(() => Number(billPeople), [billPeople]);
  const billTotalNumber = useMemo(() => Number(billTotal), [billTotal]);
  const billIsValid = useMemo(() => (
    /^[1-9]\d{0,12}$/.test(billTotal)
    && billTotalNumber <= 9_999_999_999_999
    && Number.isInteger(billPeopleCount)
    && billPeopleCount >= 2
    && billPeopleCount <= 30
  ), [billPeopleCount, billTotal, billTotalNumber]);
  const billNamesList = useMemo(() => {
    const enteredNames = billNames.split(/[,;\n]+/).map((name) => name.trim()).filter(Boolean);
    return Array.from({ length: Math.max(0, billPeopleCount) }, (_, index) => enteredNames[index] || `Người ${index + 1}`);
  }, [billNames, billPeopleCount]);
  const billShares = useMemo(() => {
    if (!billIsValid) return [];
    return splitBillEvenly(billTotalNumber, billPeopleCount);
  }, [billIsValid, billPeopleCount, billTotalNumber]);
  const selectedBillPayer = Math.min(billPayer, Math.max(0, billPeopleCount - 1));
  const selectedBillShare = billShares[selectedBillPayer] ?? 0;
  const selectedBillName = billNamesList[selectedBillPayer] ?? `Người ${selectedBillPayer + 1}`;
  const billTotalFormatted = useMemo(() => billIsValid ? billTotalNumber.toLocaleString("vi-VN") : "", [billIsValid, billTotalNumber]);

  const handleBillImage = useCallback(async (file: File) => {
    const supportedType = ["image/jpeg", "image/png", "image/webp"].includes(file.type)
      || (!file.type && /\.(jpe?g|png|webp)$/i.test(file.name));
    if (!supportedType) {
      setBillOcrStatus("error");
      setBillOcrMessage("Định dạng chưa được hỗ trợ. Hãy chọn JPG, PNG hoặc WebP.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setBillOcrStatus("error");
      setBillOcrMessage("Ảnh lớn hơn 12 MB. Hãy chụp lại hoặc giảm kích thước ảnh.");
      return;
    }
    const requestId = ++billOcrRequestRef.current;
    const url = URL.createObjectURL(file);
    setBillImage(url);
    setBillOcrStatus("loading");
    setBillOcrProgress(0);
    setBillOcrMessage("Đang chuẩn bị bộ đọc hóa đơn…");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", undefined, {
        logger: (message) => {
          if (requestId !== billOcrRequestRef.current || message.status !== "recognizing text") return;
          const progress = Math.max(0, Math.min(100, Math.round((message.progress ?? 0) * 100)));
          setBillOcrProgress(progress);
          setBillOcrMessage(`Đang đọc chữ trên bill… ${progress}%`);
        },
      });
      const { data } = await worker.recognize(file).finally(() => worker.terminate());
      if (requestId !== billOcrRequestRef.current) return;
      const text = data.text || "";
      const found = extractReceiptTotal(text);
      if (found) {
        setBillTotal(found);
        setBillOcrStatus("done");
        setBillOcrProgress(100);
        setBillOcrMessage(`Đã điền ${Number(found).toLocaleString("vi-VN")} ₫ — hãy đối chiếu với ảnh.`);
        setNotice(`Đã nhận diện tổng bill ${Number(found).toLocaleString("vi-VN")} ₫ từ ảnh.`);
      } else {
        setBillOcrStatus("error");
        setBillOcrMessage("Chưa tìm thấy dòng tổng. Bạn có thể nhập tay ngay bên dưới.");
      }
    } catch {
      if (requestId !== billOcrRequestRef.current) return;
      setBillOcrStatus("error");
      setBillOcrMessage("Không đọc được ảnh này. Hãy thử ảnh rõ hơn hoặc nhập tổng bill.");
    }
  }, []);

  const clearBillImage = useCallback(() => {
    billOcrRequestRef.current += 1;
    setBillImage(null);
    setBillOcrStatus("idle");
    setBillOcrProgress(0);
    setBillOcrMessage("Kéo-thả ảnh vào đây cũng được");
    if (billFileRef.current) billFileRef.current.value = "";
  }, []);

  const copySelectedBillShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${selectedBillName}: ${selectedBillShare.toLocaleString("vi-VN")} ₫`);
      setNotice(`Xong. Tình bạn vẫn còn nguyên 😌 Đã sao chép phần của ${selectedBillName}.`);
    } catch {
      setNotice("Không thể sao chép. Hãy giữ và chọn nội dung thủ công.");
    }
  }, [selectedBillName, selectedBillShare]);

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
    if (mode === "bank" || mode === "bill") {
      if (!bankId || !bankAccount) return "";
      const amount = mode === "bill" ? String(selectedBillShare || "") : bankAmount;
      const note = mode === "bill" ? cleanTransferNote(`${billNote} ${selectedBillName}`) : cleanTransferNote(bankNote);
      return makeVietQRContent(bankId, bankAccount.trim().toUpperCase(), amount, note);
    }
    return value.trim();
  }, [mode, value, wifiName, wifiPassword, wifiSecurity, emailSubject, bankId, bankAccount, bankAmount, bankNote, billNote, selectedBillName, selectedBillShare]);

  const payloadBytes = useMemo(() => new TextEncoder().encode(payload).length, [payload]);

  const contentCanBeEncoded = useMemo(() => {
    if (!payload || payloadBytes > 1200) return false;
    try {
      QRCode.create(payload, { errorCorrectionLevel: "H" });
      return true;
    } catch {
      return false;
    }
  }, [payload, payloadBytes]);

  const inputIsValid = useMemo(() => {
    if (!payload || payloadBytes > 1200) return false;
    if (mode === "link") {
      try {
        if (!["http:", "https:"].includes(new URL(payload).protocol)) return false;
      } catch {
        return false;
      }
    }
    if (mode === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return false;
    if (mode === "bank" || mode === "bill") {
      const accountOk = /^[A-Za-z0-9]{6,19}$/.test(bankAccount.trim());
      const amount = mode === "bill" ? String(selectedBillShare || "") : bankAmount;
      const amountOk = mode === "bill"
        ? /^[1-9]\d{0,12}$/.test(amount) && Number(amount) <= 9_999_999_999_999
        : !bankAmount || (/^[1-9]\d{0,12}$/.test(bankAmount) && Number(bankAmount) <= 9_999_999_999_999);
      if (!accountOk || !amountOk) return false;
      if (mode === "bill" && !billIsValid) return false;
    }
    return contentCanBeEncoded;
  }, [payload, payloadBytes, mode, value, bankAccount, bankAmount, billIsValid, contentCanBeEncoded, selectedBillShare]);

  const colorIsSafe = contrastOnWhite(palette.value) >= 4.5;

  const artOptions = useMemo<ArtboardOptions>(() => ({
    image: artImage,
    logo: brandLogo,
    logoScale: brandLogoScale,
    x: artX,
    y: artY,
    width: artWidth,
    height: artHeight,
    rotation: artRotation,
    skewX: artSkewX,
    skewY: artSkewY,
    quad: artQuad,
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
  }), [artImage, brandLogo, brandLogoScale, artX, artY, artWidth, artHeight, artRotation, artSkewX, artSkewY, artQuad, artQrX, artQrY, artQrScale, artCopyX, artCopyY, artCopyWidth, artTitleScale, artSubtitleScale, artShowSubtitle, artPaper, artCaption, artSubcaption]);

  const moodArtIds = funMood === "context"
    ? contextArtIds[mode]
    : funMoods.find((item) => item.id === funMood)?.artIds ?? contextArtIds[mode];
  const visibleArt = showAllArt
    ? artLibrary.filter((item) => item.category === artCategory)
    : moodArtIds.map((id) => artLibrary.find((item) => item.id === id)).filter((item): item is LibraryArt => Boolean(item));
  const stampCaption = brandName.trim().toUpperCase() || (qrStyles.find((item) => item.id === qrStyle) ?? qrStyles[0]).caption;

  const makeItFun = useCallback(() => {
    const candidates = funRollArtIds[mode]
      .map((id) => artLibrary.find((item) => item.id === id))
      .filter((item): item is LibraryArt => Boolean(item));
    const recent = new Set([selectedArt, ...funHistoryRef.current]);
    const freshCandidates = candidates.filter((item) => !recent.has(item.id));
    const artPool = freshCandidates.length ? freshCandidates : candidates.filter((item) => item.id !== selectedArt);
    const nextArt = (artPool.length ? artPool : candidates)[Math.floor(Math.random() * (artPool.length || candidates.length))];
    const visualProfile = getArtVisualProfile(nextArt);
    const playful = playfulArtNotice(nextArt) ?? `${nextArt.name} vào sân. Hợp lý một cách khó hiểu 😎`;

    funHistoryRef.current = [nextArt.id, ...funHistoryRef.current.filter((id) => id !== nextArt.id)].slice(0, 4);
    setFunMood("context");
    setShowAllArt(false);
    setFunRolls((count) => count + 1);
    chooseLibraryArt(nextArt, playful, visualProfile);
  }, [mode, selectedArt, chooseLibraryArt]);

  useEffect(() => {
    if (!inputIsValid || !colorIsSafe) return;
    if (layoutMode === "art" && artCanvasRef.current) renderArtPreview(artCanvasRef.current, payload, palette.value, palette.accent, qrStyle, artOptions);
    else if (canvasRef.current) renderPreview(canvasRef.current, payload, palette.value, qrStyle, brandLogo, brandLogoScale);
  }, [payload, palette, qrStyle, inputIsValid, colorIsSafe, layoutMode, artOptions, brandLogo, brandLogoScale]);

  const displayNotice = !colorIsSafe
    ? "Màu mã QR chưa đủ tương phản với nền sáng"
    : !payload
      ? "Hãy nhập nội dung để tạo mã QR"
      : payloadBytes > 1200
        ? "Nội dung quá dài. Hãy rút gọn để mã dễ quét."
        : !contentCanBeEncoded
          ? "Nội dung này quá phức tạp để tạo mã QR dễ quét. Hãy rút gọn hoặc bỏ bớt ký tự đặc biệt."
        : !inputIsValid
          ? mode === "bill" && !billIsValid
            ? "Nhập tổng bill và từ 2 đến 30 người để chia tự động."
            : "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại."
          : payloadBytes > 700
            ? "Nội dung khá dài; nên quét thử ở khoảng cách sử dụng thực tế."
            : notice;

  const uploadArtwork = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setArtworkLoading(true);
    const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!supportedTypes.has(file.type)) {
      setArtworkLoading(false);
      setNotice("Định dạng ảnh chưa được hỗ trợ. Hãy chọn tệp JPG, PNG hoặc WEBP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setArtworkLoading(false);
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
        applyArtFrame(customArtFrame);
        setArtPaper(true);
        setArtCaption("MỜI BẠN QUÉT MÃ!");
        setArtSubcaption("");
        setArtworkLoading(false);
        setNotice("Ảnh đã được tải lên. Bạn có thể điều chỉnh vị trí mã QR.");
      };
      image.onerror = () => {
        setArtworkLoading(false);
        setNotice("Không thể đọc ảnh này. Hãy thử một ảnh JPG, PNG hoặc WEBP khác.");
      };
      image.src = String(reader.result);
    };
    reader.onerror = () => {
      setArtworkLoading(false);
      setNotice("Không thể mở tệp ảnh. Hãy thử chọn lại.");
    };
    reader.readAsDataURL(file);
  };

  const uploadBrandLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setNotice("Logo cần là tệp PNG, JPG hoặc WEBP.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setNotice("Logo vượt quá 3 MB. Hãy chọn tệp nhẹ hơn.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        setBrandLogo(image);
        setBrandLogoDataUrl(String(reader.result));
        setBrandLogoName(file.name);
        setNotice("Logo thương hiệu đã được đặt an toàn ở giữa mã QR.");
      };
      image.onerror = () => setNotice("Không thể đọc logo này. Hãy thử một tệp khác.");
      image.src = String(reader.result);
    };
    reader.onerror = () => setNotice("Không thể mở tệp logo. Hãy thử chọn lại.");
    reader.readAsDataURL(file);
  };

  const clearBrandLogo = () => {
    setBrandLogo(null);
    setBrandLogoDataUrl("");
    setBrandLogoName("");
    setNotice("Đã gỡ logo khỏi thiết kế.");
  };

  const download = (format: "png" | "svg") => {
    if (!inputIsValid || !colorIsSafe) return;
    const filename = `qr-vui${mode === "bill" ? `-chia-bill-${selectedBillPayer + 1}` : ""}-${Date.now()}`;
    if (format === "png") {
      if (layoutMode === "art") downloadArtPNG(payload, palette.value, palette.accent, qrStyle, artOptions, filename);
      else downloadStyledPNG(payload, palette.value, palette.accent, qrStyle, stampCaption, filename, brandLogo, brandLogoScale);
    } else {
      const svg = styledSVG(payload, palette.value, palette.accent, qrStyle, stampCaption, brandLogoDataUrl, brandLogoScale);
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.svg`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }
    setNotice(mode === "bill" ? `QR phần của ${selectedBillName} đã xuống máy. Tình bạn vẫn còn nguyên 😌` : "QR đã xuống máy. Đi khoe thôi ↗");
    setDownloadedFormat(format);
    if (downloadResetRef.current) clearTimeout(downloadResetRef.current);
    downloadResetRef.current = setTimeout(() => setDownloadedFormat(null), 2600);
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setValue("");
    setEmailSubject("");
    setDownloadedFormat(null);
  };

  const pasteFromClipboard = async () => {
    try {
      const clipboardValue = await navigator.clipboard.readText();
      if (!clipboardValue) {
        setNotice("Clipboard đang trống. Vui lòng sao chép nội dung trước.");
        return;
      }
      setValue(clipboardValue);
      setNotice("Đã dán nội dung từ clipboard.");
    } catch {
      setNotice("Không thể đọc clipboard. Hãy dán bằng Ctrl/Cmd + V.");
    }
  };

  return (
    <main>
      <div className="ticker" aria-hidden="true">LIÊN KẾT · WI-FI · VIETQR · CHIA BILL · VĂN BẢN · EMAIL · {artLibrary.length} MẪU MINH HỌA</div>
      <nav className="nav wrap" aria-label="Điều hướng chính">
        <a className="brand" href="#top" aria-label="QR Vui - trang chủ">
          <span className="brand-mark">QR!</span>
          <span>QR Vui</span>
        </a>
        <div className="nav-links"><a href="#top">Tạo mã QR</a><a href="#about">Giải pháp</a><a href="#tech">Công nghệ</a></div>
        <div className="nav-note"><span /> Xử lý tại trình duyệt</div>
      </nav>

      <section className="hero wrap" id="top">
        <div className="hero-copy">
          <div className="eyebrow">TẠO MÃ QR VUI HƠN · DỄ TÙY BIẾN · VẪN DỄ QUÉT</div>
          <h1>Mã QR không nhất thiết<br /><em>phải đơn điệu.</em></h1>
          <p>Phần lớn mã QR trông khô khan và khó tùy biến theo nội dung muốn chia sẻ. QR Vui giúp bạn biến mã QR thành một thiết kế vui vẻ, hài hước và phù hợp với bối cảnh.</p>
          <small>{artLibrary.length} mẫu minh họa · Tải ảnh riêng · Tự chia bill · Hỗ trợ VietQR kèm số tiền.</small>
          <div className="hero-flow" aria-label="Quy trình tạo mã QR gồm ba bước">
            <div><b>01</b><span><strong>Chọn nội dung</strong><small>Đường dẫn, Wi‑Fi, VietQR, chia bill hoặc văn bản.</small></span></div>
            <div><b>02</b><span><strong>Làm vui</strong><small>Bấm một lần để app tự phối tranh, màu và kiểu QR an toàn.</small></span></div>
            <div><b>03</b><span><strong>Tải thiết kế</strong><small>Xuất PNG hoặc SVG với vùng quét được bảo vệ.</small></span></div>
          </div>
        </div>
      </section>

      <section className="maker wrap" id="maker" aria-label="Công cụ tạo mã QR">
        <div className="panel form-panel">
          <div className="panel-heading">
            <span className="step">01</span>
            <div><h2>Chọn nội dung cần mã hóa</h2><p>Hỗ trợ liên kết, Wi-Fi, VietQR, chia bill, văn bản và email.</p></div>
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
            ) : mode === "bank" || mode === "bill" ? (
              <>
                <label>{mode === "bill" ? "Ngân hàng nhận tiền chia bill" : "Ngân hàng nhận"}
                  <select value={bankId} onChange={(event) => setBankId(event.target.value)}>
                    {banks.map((bank) => <option value={bank.bin} key={bank.bin}>{bank.shortName} · {bank.bin}</option>)}
                  </select>
                </label>
                <label>{mode === "bill" ? "Số tài khoản nhận tiền" : "Số tài khoản"}
                  <input value={bankAccount} onChange={(event) => setBankAccount(event.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 19))} placeholder="Nhập 6–19 chữ hoặc số" autoComplete="off" />
                </label>
                {mode === "bill" ? (
                  <>
                    <div className="bill-guide"><b>Tự chia bill như ảnh — chụp hoặc thả ảnh hóa đơn</b><span>Nhìn dòng “<b>Tổng thanh toán</b>” trên bill (như ảnh bạn gửi), app sẽ tự đọc tổng tiền. Bạn chỉ cần chọn số người, QR của từng người sẽ mang đúng phần tiền, phần lẻ chia đều cho người đầu.</span></div>
                    <div className={`bill-upload ${billOcrStatus}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file) handleBillImage(file); }}>
                      <input ref={billFileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) handleBillImage(file); event.currentTarget.value = ""; }} />
                      <button type="button" className="bill-upload-btn" onClick={() => billFileRef.current?.click()} aria-describedby="bill-upload-status">
                        <span className="bill-upload-icon">▣</span>
                        <span>
                          <b>{billImage ? "Đổi ảnh bill" : "Tải ảnh bill lên"}</b>
                          <small>JPG, PNG, WebP · tối đa 12 MB</small>
                        </span>
                      </button>
                      <div className="bill-upload-hint" id="bill-upload-status" role="status" aria-live="polite">
                        <span className={`ocr ${billOcrStatus}`}>{billOcrMessage}</span>
                        {billOcrStatus === "loading" && <progress max="100" value={billOcrProgress} aria-label="Tiến trình đọc ảnh bill" />}
                      </div>
                    </div>
                    {billImage && (
                      <div className="bill-preview">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={billImage} alt="Ảnh bill vừa tải" />
                        <div>
                          <b>Ảnh bill</b>
                          <span>Đối chiếu dòng “Tổng thanh toán” với số đã điền bên dưới.</span>
                          <button type="button" onClick={clearBillImage}>Xóa ảnh</button>
                        </div>
                      </div>
                    )}
                    <div className="bill-example">
                      <div className="bill-example-receipt">
                        <span>HÓA ĐƠN THANH TOÁN</span>
                        <i>Budweiser 330ml … 26.000</i>
                        <i>7up … 75.000 — Nước suối … 285.000</i>
                        <b>Tổng thanh toán: <u>{billTotalFormatted ? `${billTotalFormatted} ₫` : "—"}</u></b>
                      </div>
                      <small>Minh họa vị trí “Tổng thanh toán” trên bill giấy — app sẽ tự điền khi đọc được.</small>
                    </div>
                    <div className="two-fields bill-fields">
                      <label>Tổng bill <span className="req">*</span>
                        <input inputMode="numeric" value={billTotal} onChange={(event) => setBillTotal(event.target.value.replace(/\D/g, "").slice(0, 13))} placeholder="Ví dụ: 9661560" aria-invalid={Boolean(billTotal) && !/^[1-9]\d{0,12}$/.test(billTotal)} />
                        {billTotal && <small className="amount-readout">{billTotalNumber.toLocaleString("vi-VN")} ₫</small>}
                      </label>
                      <label>Số người
                        <input inputMode="numeric" value={billPeople} onChange={(event) => { const next = event.target.value.replace(/\D/g, "").slice(0, 2); setBillPeople(next); const count = Number(next); setBillPayer((current) => next && count >= 1 ? Math.min(current, count - 1) : 0); }} placeholder="Ví dụ: 3" />
                        <small className="bank-note-preview">Từ 2 đến 30 người</small>
                      </label>
                    </div>
                    <label>Tên từng người <small>(không bắt buộc, ngăn cách bằng dấu phẩy)</small>
                      <textarea value={billNames} onChange={(event) => setBillNames(event.target.value)} maxLength={300} rows={2} placeholder="Ví dụ: An, Bình, Chi — hoặc mỗi người một dòng" />
                    </label>
                    <label>Nội dung chuyển khoản
                      <input value={billNote} onChange={(event) => setBillNote(event.target.value)} maxLength={36} placeholder="Ví dụ: CHIA BILL" />
                    </label>
                    <div className="bill-summary" aria-live="polite">
                      <div><b>{billIsValid ? `Chia ${billTotalFormatted} ₫ cho ${billPeopleCount} người · mỗi người chạm để lấy QR` : "Nhập tổng bill và số người"}</b><span>{billIsValid ? `Tổng khớp: ${billShares.reduce((a,b)=>a+b,0).toLocaleString("vi-VN")} ₫ · phần lẻ ${billTotalNumber % billPeopleCount} ₫ chia cho ${Math.min(billTotalNumber % billPeopleCount, billPeopleCount)} người đầu` : "Bạn cũng có thể tải ảnh bill để tự điền tổng"}</span></div>
                      {billIsValid && <div className="bill-payers">{billShares.map((share, index) => <button type="button" key={`${billNamesList[index]}-${index}`} aria-pressed={selectedBillPayer === index} className={selectedBillPayer === index ? "active" : ""} onClick={() => setBillPayer(index)}><span><i>{index + 1}</i>{billNamesList[index]}</span><b>{share.toLocaleString("vi-VN")} ₫{index < (billTotalNumber % billPeopleCount) ? " · +1₫ lẻ" : ""}</b></button>)}</div>}
                      {billIsValid && <div className="bill-summary-foot"><span>Đang xem QR của <b>{selectedBillName}</b> — {selectedBillShare.toLocaleString("vi-VN")} ₫</span><button type="button" onClick={copySelectedBillShare}>Sao chép</button></div>}
                    </div>
                    <div className="bank-warning"><b>Kiểm tra trước khi chuyển:</b> QR điền sẵn phần của người đang chọn. Mỗi đồng lẻ (nếu có) được lần lượt cộng cho những người đầu danh sách để tổng khớp tuyệt đối.</div>
                  </>
                ) : (
                  <>
                    <div className="two-fields bank-fields">
                      <label>Số tiền (không bắt buộc)
                        <input inputMode="numeric" value={bankAmount} onChange={(event) => setBankAmount(event.target.value.replace(/\D/g, "").slice(0, 13))} placeholder="Ví dụ: 150000" />
                        {bankAmount && <small className="amount-readout">{Number(bankAmount).toLocaleString("vi-VN")} ₫</small>}
                      </label>
                      <label>Nội dung chuyển khoản
                        <input value={bankNote} onChange={(event) => setBankNote(event.target.value)} maxLength={50} placeholder="Ví dụ: TIEN CA PHE" />
                        {bankNote && <small className="bank-note-preview">Ngân hàng sẽ nhận: {cleanTransferNote(bankNote)}</small>}
                      </label>
                    </div>
                    <div className="transfer-presets">
                      <div className="preset-heading"><b>Lời nhắn chuyển khoản vui vẻ</b><button type="button" onClick={() => setBankNote(transferNotePresets[Math.floor(Math.random() * transferNotePresets.length)])}>Gợi ý cho tôi ↻</button></div>
                      <div className="preset-quick" aria-label="Gợi ý nội dung chuyển khoản">
                        {transferNotePresets.slice(0, 6).map((note) => <button type="button" key={note} aria-pressed={bankNote === note} className={bankNote === note ? "active" : ""} onClick={() => setBankNote(note)}>{note}</button>)}
                      </div>
                      <details className="preset-more">
                        <summary>Xem đủ {transferNotePresets.length} câu vui</summary>
                        <div>{transferNotePresets.slice(6).map((note) => <button type="button" key={note} aria-pressed={bankNote === note} className={bankNote === note ? "active" : ""} onClick={() => setBankNote(note)}>{note}</button>)}</div>
                      </details>
                    </div>
                    <div className="bank-warning"><b>Lưu ý:</b> Mã chỉ điền sẵn thông tin chuyển khoản. Hãy kiểm tra người nhận, số tiền và nội dung trong ứng dụng ngân hàng trước khi xác nhận.</div>
                  </>
                )}
              </>
            ) : (
              <>
                <label>
                  {mode === "link" ? "Đường dẫn" : mode === "email" ? "Địa chỉ email" : "Nội dung văn bản"}
                  {mode === "text" ? (
                    <textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Nhập nội dung bạn muốn lưu trong mã QR" rows={4} />
                  ) : (
                    <input type={mode === "email" ? "email" : "text"} value={value} onChange={(e) => setValue(e.target.value)} placeholder={mode === "email" ? "hello@congty.vn" : "tenmien.vn/mon-ngon"} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
                  )}
                </label>
                <div className="field-actions">
                  <button type="button" onClick={pasteFromClipboard}>Dán từ clipboard</button>
                  {value && <button type="button" onClick={() => setValue("")}>Xóa nội dung</button>}
                </div>
                {mode === "email" && <label>Tiêu đề email (không bắt buộc)<input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Ví dụ: Yêu cầu báo giá" /></label>}
              </>
            )}
            <div className="privacy-line"><span>◉</span> {mode === "bank" || mode === "bill" ? "Thông tin VietQR được tạo trực tiếp trên thiết bị của bạn." : "Nội dung được xử lý trực tiếp trong trình duyệt và không gửi lên máy chủ."}</div>
            {mode !== "bank" && mode !== "bill" && <div className={`content-meter ${payloadBytes > 700 ? "caution" : ""}`} aria-live="polite"><span>{payloadBytes} / 1.200 byte</span>{payloadBytes > 700 ? "Nội dung dài: hãy quét thử trước khi in." : "Khoảng trống còn rộng cho mã dễ quét."}</div>}
          </div>

          <button type="button" className="make-it-fun mobile-fun-cta" disabled={!inputIsValid} onClick={makeItFun}>
            <span aria-hidden="true">🎲</span><b>{funRolls ? "Làm vui thêm vòng nữa ↻" : "Làm vui cho tôi"}</b><small>App tự chọn tranh, màu và kiểu QR an toàn</small>
          </button>

          <details className="advanced-customizer">
            <summary><span><b>Tùy chỉnh thêm</b><small>Màu, thương hiệu, logo và kiểu ô QR</small></span><em>Tùy chọn</em></summary>
            <div className="advanced-customizer-body">
              <div className="palette-section">
                <div className="label-row"><span>Chọn màu mã QR</span><span>Độ tương phản {contrastOnWhite(palette.value).toFixed(1)}:1 {colorIsSafe ? "· Đạt ✓" : "· Chưa đạt ✕"}</span></div>
                <div className="palettes">
                  {palettes.map((item) => (
                    <button key={item.name} type="button" aria-pressed={palette.name === item.name} className={palette.name === item.name ? "palette active" : "palette"} onClick={() => setPalette(item)} aria-label={`Chọn màu ${item.name}`}>
                      <i style={{ background: item.value }} /><span>{item.name}</span>
                    </button>
                  ))}
                </div>
                <div className="brand-customizer">
                  <div className="brand-heading"><div><b>NHẬN DIỆN THƯƠNG HIỆU</b><span>Nhập đúng mã màu brand, thêm logo và tên hiển thị trên ấn phẩm.</span></div><em>Riêng tư · xử lý trên máy</em></div>
                  <div className="brand-color-grid">
                    <HexColorInput label="Màu mã QR" value={palette.value} onApply={(value) => setPalette({ name: "Tùy chọn", value, accent: palette.accent })} />
                    <HexColorInput label="Màu nền ấn phẩm" value={palette.accent} onApply={(accent) => setPalette({ name: "Tùy chọn", value: palette.value, accent })} />
                  </div>
                  <label className="brand-name-field">Tên thương hiệu hoặc thông điệp ngắn<input value={brandName} onChange={(event) => setBrandName(event.target.value.slice(0, 32))} placeholder="Ví dụ: CÀ PHÊ NHÀ MÌNH" /><small>{brandName.length}/32 · dùng trên ấn phẩm QR độc lập</small></label>
                  <div className={`brand-logo-control${brandLogo ? " has-logo" : ""}`}>
                    <label className="brand-logo-upload"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadBrandLogo} /><span>{brandLogo ? "Đổi logo" : "+ Tải logo lên"}</span><small>PNG nền trong suốt được khuyên dùng · tối đa 3 MB</small></label>
                    {brandLogo && <div className="brand-logo-summary">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={brandLogoDataUrl} alt="Logo thương hiệu vừa tải" />
                      <div><b>{brandLogoName}</b><button type="button" onClick={clearBrandLogo}>Gỡ logo</button></div>
                    </div>}
                  </div>
                  <label className="brand-art-upload"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadArtwork} disabled={artworkLoading} /><span>{artworkLoading ? "Đang chuẩn bị ấn phẩm…" : "+ Tải menu, poster hoặc bao bì"}</span><small>Ứng dụng sẽ chuyển sang chế độ “Mã QR trong tranh” để bạn đặt QR trực tiếp lên ấn phẩm.</small></label>
                  {brandLogo && <label className="brand-logo-size">Kích thước logo <output>{brandLogoScale}%</output><input type="range" min="8" max="18" step="1" value={brandLogoScale} onChange={(event) => setBrandLogoScale(Number(event.target.value))} /><small>Giới hạn 8–18% để giữ khả năng quét; logo luôn có nền trắng bảo vệ.</small></label>}
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
          </details>
        </div>

        <aside className="panel preview-panel" style={{ "--accent": palette.accent } as React.CSSProperties}>
          <div className="tape">XEM TRƯỚC</div>
          <button type="button" className="make-it-fun" disabled={!inputIsValid} onClick={makeItFun}>
            <span aria-hidden="true">🎲</span><b>{funRolls ? "Quay thêm vòng nữa ↻" : "Làm vui cho tôi"}</b><small>Đổi tranh, màu và kiểu QR an toàn</small>
          </button>
          <div className="layout-switch" role="group" aria-label="Kiểu xuất mã">
            <button type="button" aria-pressed={layoutMode === "stamp"} className={layoutMode === "stamp" ? "active" : ""} onClick={() => setLayoutMode("stamp")}>Chỉ mã QR</button>
            <button type="button" aria-pressed={layoutMode === "art"} className={layoutMode === "art" ? "active" : ""} onClick={() => setLayoutMode("art")}>Mã QR trong tranh</button>
          </div>
          {layoutMode === "art" ? (
            <div className="art-stage">{inputIsValid && colorIsSafe ? <canvas ref={artCanvasRef} className="art-canvas" role="img" aria-label="Tranh ghép mã QR xem trước" /> : <div className="empty-qr"><span>?</span><p>Nhập nội dung hợp lệ<br />để xem trước thiết kế</p></div>}</div>
          ) : (
            <div className={`qr-costume ${qrStyle}`}><div className="qr-shell">{inputIsValid && colorIsSafe ? <canvas ref={canvasRef} role="img" aria-label="Mã QR xem trước" /> : <div className="empty-qr"><span>?</span><p>Nhập nội dung hợp lệ<br />để tạo mã QR</p></div>}</div><div className="costume-caption">{mode === "bill" && billIsValid ? `QR PHẦN CỦA ${selectedBillName.toUpperCase()}` : stampCaption}</div></div>
          )}
          <div className={`health ${inputIsValid && colorIsSafe ? "good" : "wait"}`} role="status" aria-live="polite"><span>●</span>{displayNotice}</div>
          <details className="scan-details">
            <summary>Thông số bảo đảm khả năng quét</summary>
            <div className="tech-badges">
              <span>Sửa lỗi mức H</span><span>Viền trắng 4 ô</span>{brandLogo && <span>Logo an toàn {brandLogoScale}%</span>}<span>{layoutMode === "art" ? "Phối cảnh 4 góc" : mode === "bank" || mode === "bill" ? "VietQR · CRC16" : "QR tĩnh · Không chuyển hướng"}</span>
            </div>
          </details>
          <div className="download-row">
            <button type="button" className={downloadedFormat === "png" ? "primary downloaded" : "primary"} disabled={!inputIsValid || !colorIsSafe} onClick={() => download("png")}>{downloadedFormat === "png" ? "Đã tải PNG ✓" : mode === "bill" ? `Tải QR của ${selectedBillName}` : layoutMode === "art" ? "Tải thiết kế PNG" : "Tải mã QR PNG"} <span>↓</span></button>
            <button type="button" className={downloadedFormat === "svg" ? "secondary downloaded" : "secondary"} disabled={!inputIsValid || !colorIsSafe} onClick={() => download("svg")}>{downloadedFormat === "svg" ? "Đã tải SVG ✓" : "Tải mã QR SVG"}</button>
          </div>
          <p className="scan-tip">Hãy quét thử bằng ít nhất một điện thoại trước khi in số lượng lớn.</p>
          {layoutMode === "art" && inputIsValid && colorIsSafe && <details className="art-controls">
            <summary className="art-controls-summary"><span><b>Đổi tranh hoặc chỉnh thêm</b><small>Thư viện, ảnh riêng, câu chữ và bố cục</small></span><em>{artLibrary.length} mẫu</em></summary>
            <div className="art-controls-body">
            <div className="library-head"><div><b>THƯ VIỆN MINH HỌA</b><span>Chọn cảm giác trước, tinh chỉnh chủ đề sau nếu muốn.</span></div><em>{artLibrary.length} mẫu</em></div>
            <div className="fun-mood-tabs" role="group" aria-label="Cảm giác minh họa">
              <button type="button" aria-pressed={funMood === "context" && !showAllArt} className={funMood === "context" && !showAllArt ? "active context" : "context"} onClick={() => { setFunMood("context"); setShowAllArt(false); }}><b>✦</b>Hợp với QR này<small>{contextArtIds[mode].length}</small></button>
              {funMoods.map((item) => <button key={item.id} type="button" aria-pressed={funMood === item.id && !showAllArt} className={funMood === item.id && !showAllArt ? "active" : ""} onClick={() => { setFunMood(item.id); setShowAllArt(false); }}><b>{item.icon}</b>{item.label}<small>{item.artIds.length}</small></button>)}
            </div>
            <button type="button" className="all-art-toggle" aria-expanded={showAllArt} onClick={() => setShowAllArt((open) => !open)}>{showAllArt ? "Thu gọn về nhóm cảm giác ↑" : `Xem tất cả ${artLibrary.length} mẫu · 18 chủ đề ↓`}</button>
            {showAllArt && <div className="category-tabs" role="group" aria-label="Tất cả chủ đề tranh">
              {artCategories.map((item) => <button key={item.id} type="button" aria-pressed={artCategory === item.id} className={artCategory === item.id ? "active" : ""} onClick={() => setArtCategory(item.id)}><b>{item.icon}</b>{item.label}<small>{artLibrary.filter((art) => art.category === item.id).length}</small></button>)}
            </div>}
            <div className="art-library" aria-label="Kho tranh có sẵn">
              {visibleArt.map((item) => <button key={item.id} type="button" aria-pressed={selectedArt === item.id} className={selectedArt === item.id ? "art-card active" : "art-card"} onClick={() => chooseLibraryArt(item)} aria-label={`Chọn tranh ${item.name}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={publicAsset(item.src)} alt="" /><span><b>{item.name}</b><small>{item.mood}</small></span>
              </button>)}
            </div>
            <p className="safe-note"><b>◎ Bản đồ bố cục riêng cho từng mẫu:</b> khung ngang tự dùng bố cục hai cột để QR lớn và cân đối; khung dọc giữ chữ bên dưới.</p>
            <div className="custom-divider"><span>HOẶC SỬ DỤNG ẢNH CỦA BẠN</span></div>
            <label className={`upload-button${selectedArt === "custom" ? " selected" : ""}${artworkLoading ? " loading" : ""}`} aria-busy={artworkLoading}>{artworkLoading ? "Đang đọc ảnh…" : "+ Tải ảnh lên"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadArtwork} aria-describedby="upload-hint" disabled={artworkLoading} /></label>
            <p className="hint" id="upload-hint">{artworkLoading ? "Đang chuẩn bị bản xem trước…" : "JPG, PNG, WEBP · dưới 10 MB · ảnh chỉ nằm trên máy bạn"}</p>
            <details className="photo-guide">
              <summary>Cách chọn ảnh phù hợp <span>Xem hướng dẫn ↓</span></summary>
              <div className="guide-body">
                <div className="guide-pictures" aria-hidden="true"><i className="good"><b>QR</b></i><i className="bad"><b>QR</b></i></div>
                <ul><li><b>Chừa một mảng trống 35–50%</b> để mã không che mặt người hay món đồ chính.</li><li><b>Ít chi tiết phía sau mã.</b> Nếu ảnh nhiều chi tiết, hãy bật “Thêm nền và bóng đổ”.</li><li><b>Ảnh vuông hoặc dọc, từ 800 px.</b> Tránh ảnh mờ, chụp quá tối hoặc cắt sát chủ thể.</li></ul>
              </div>
            </details>
            <div className="caption-grid"><label>Tiêu đề<input value={artCaption} maxLength={36} onChange={(e) => setArtCaption(e.target.value)} /></label><label>Dòng mô tả<input value={artSubcaption} maxLength={54} onChange={(e) => setArtSubcaption(e.target.value)} /></label></div>
            <button type="button" className="text-button reset-layout" onClick={resetArtLayout}>Khôi phục bố cục chuẩn của {selectedArt === "custom" ? "ảnh" : "mẫu"} ↺</button>
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
            </div>
          </details>}
        </aside>
      </section>

      <section className="why wrap">
        <div className="why-title"><span>VẤN ĐỀ</span><h2>Mã QR thường đúng chức năng nhưng thiếu cảm xúc.</h2></div>
        <div className="proof-grid">
          <article><b>01</b><h3>Đơn điệu và khó tạo ấn tượng</h3><p>Phần lớn công cụ chỉ tạo một ô mã đen trắng giống nhau, khó thể hiện cá tính hoặc khiến người nhận muốn quét.</p></article>
          <article><b>02</b><h3>Khó phù hợp với từng bối cảnh</h3><p>Một mã dùng cho quán ăn, đám cưới, du lịch hay chuyển khoản thường vẫn có cùng hình thức khô khan.</p></article>
          <article><b>03</b><h3>Trang trí có thể làm mã khó quét</h3><p>QR Vui đặt mã trên vùng tương phản riêng, giữ viền an toàn và vùng định vị để hình ảnh vui hơn mà mã vẫn rõ.</p></article>
        </div>
      </section>

      <section className="about wrap" id="about">
        <div className="section-kicker">GIẢI PHÁP</div>
        <div className="about-grid">
          <div><h2>Một mã QR vui vẻ,<br />hài hước và <em>dễ quét.</em></h2></div>
          <div className="about-copy">
            <p><b>QR Vui</b> cung cấp {artLibrary.length} mẫu minh họa theo nghề nghiệp, món ăn, đời sống, sự kiện, du lịch, 12 cung hoàng đạo, 12 con giáp và những biểu tượng gần gũi trong văn hóa Việt. Bạn cũng có thể tải ảnh riêng, thay câu chữ và căn QR theo bố cục mong muốn.</p>
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
        <div className="brand"><span className="brand-mark">QR!</span><span>QR Vui</span></div>
        <p>Tạo mã QR dễ sử dụng, dễ tùy biến và dễ quét.</p>
        <a href="#top">Quay lại đầu trang ↑</a>
      </footer>
    </main>
  );
}
