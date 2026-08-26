type ArtFrameGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  skewX?: number;
  skewY?: number;
};

export type ArtPoint = { x: number; y: number };
export type ArtQuad = [ArtPoint, ArtPoint, ArtPoint, ArtPoint];

export type ArtFrame = ArtFrameGeometry & {
  quad: ArtQuad;
  qr: { x: number; y: number; size: number };
  copy: { x: number; y: number; width: number; titleScale: number; subtitleScale: number; showSubtitle: boolean };
};

// Khung trắng trong từng tranh được đo riêng theo phần trăm khổ ảnh.
// QR, tiêu đề và mô tả cùng dùng một phép biến đổi nên luôn đi theo khung.
const rawArtFrames: Record<string, ArtFrameGeometry> = {
  meo: { x: 55.4, y: 68.8, width: 49.4, height: 41.6, rotation: -3.5 },
  capy: { x: 73.6, y: 38.8, width: 38.4, height: 49, rotation: 0 },
  ech: { x: 75.9, y: 33.1, width: 29.3, height: 39.9, rotation: 0.5 },
  cun: { x: 51.4, y: 61.5, width: 26.8, height: 25.6, rotation: -2 },
  vit: { x: 86, y: 55, width: 18, height: 18, rotation: 0 },
  noi: { x: 72.1, y: 49.9, width: 35.9, height: 50.5, rotation: 3.5 },
  "bac-si": { x: 71.8, y: 58.6, width: 35.1, height: 48.6, rotation: 0 },
  "giao-vien": { x: 67.5, y: 43.3, width: 48.9, height: 48.8, rotation: -0.5 },
  "tho-toc": { x: 69.5, y: 54.2, width: 40.6, height: 72.4, rotation: 3.8 },
  "pha-che": { x: 72.2, y: 48.7, width: 42.7, height: 42.6, rotation: 0.8 },
  "giao-hang": { x: 66.6, y: 58.8, width: 36.4, height: 37.5, rotation: 0 },
  "van-phong": { x: 69.2, y: 39.7, width: 50.8, height: 45.6, rotation: 0 },
  "rap-chieu": { x: 64.2, y: 48.4, width: 45.7, height: 58.2, rotation: 0.2 },
  "ca-si": { x: 67.1, y: 55.2, width: 48.7, height: 60.5, rotation: 0.8 },
  "bap-rang": { x: 67.4, y: 50.8, width: 51.8, height: 53.3, rotation: -6 },
  "tro-choi": { x: 62.1, y: 42.1, width: 39.8, height: 34, rotation: 4.5 },
  "dien-nhac": { x: 61.6, y: 45.5, width: 42.1, height: 43.8, rotation: 0 },
  "san-khau": { x: 61.9, y: 43, width: 49.2, height: 44.1, rotation: 0 },
  "banh-mi": { x: 71.1, y: 65.7, width: 42.9, height: 42.9, rotation: -0.5 },
  "quan-mi": { x: 70.9, y: 53.3, width: 41.4, height: 45.1, rotation: 0 },
  "tiem-hoa": { x: 66.9, y: 69.8, width: 36.4, height: 35.4, rotation: -0.8 },
  "thoi-trang": { x: 66.6, y: 54.9, width: 38.2, height: 48, rotation: 0.5 },
  "sua-xe": { x: 66.2, y: 63.2, width: 45.7, height: 49.9, rotation: -0.5 },
  "cho-que": { x: 62.6, y: 57.8, width: 34.1, height: 44.4, rotation: 0.5 },
  "dam-cuoi": { x: 66, y: 71.5, width: 45.8, height: 42.1, rotation: -0.8 },
  "sinh-nhat": { x: 69.3, y: 68.2, width: 36.2, height: 46.2, rotation: 0 },
  "tot-nghiep": { x: 64.5, y: 68.7, width: 46.6, height: 46.7, rotation: 0 },
  "du-lich": { x: 69.5, y: 59.6, width: 44.5, height: 50.5, rotation: -1 },
  "chay-bo": { x: 65.4, y: 62.8, width: 48, height: 47.1, rotation: -1.5 },
  "thien-nguyen": { x: 64.4, y: 64.8, width: 45.8, height: 45.1, rotation: -1.5 },
  "le-an-hoi": { x: 71.7, y: 67.4, width: 49.8, height: 54.8, rotation: 0.5 },
  "thoi-noi": { x: 74, y: 65.6, width: 43.5, height: 49.8, rotation: 0 },
  "tan-gia": { x: 72, y: 66.8, width: 49.8, height: 54.5, rotation: 0 },
  "ky-niem-cuoi": { x: 71, y: 68.8, width: 50.5, height: 50, rotation: -0.5 },
  "tat-nien": { x: 70.5, y: 67.5, width: 52.5, height: 57, rotation: 0 },
  "lien-hoan-ban-be": { x: 69.5, y: 70.5, width: 54, height: 46, rotation: 0 },
  "lua-gao": { x: 72.2, y: 62.8, width: 41.7, height: 51, rotation: 0.8 },
  "ca-phe": { x: 72.7, y: 64.3, width: 41.3, height: 51.5, rotation: 1 },
  "vuon-trai-cay": { x: 69, y: 64.5, width: 47.1, height: 51.4, rotation: -1 },
  "danh-ca": { x: 76.4, y: 61, width: 36.7, height: 48.8, rotation: 0 },
  "dam-sen": { x: 70.1, y: 61.7, width: 45.8, height: 49.9, rotation: 0 },
  "bo-sua": { x: 63, y: 64.2, width: 56.9, height: 48.8, rotation: -0.2 },
  "ganh-hang": { x: 57.4, y: 66.1, width: 40.2, height: 43.4, rotation: 0 },
  "tra-da": { x: 40.1, y: 70.3, width: 47.5, height: 35.8, rotation: 0 },
  "xe-hoa": { x: 40.6, y: 67.2, width: 37.3, height: 39.1, rotation: 0 },
  "xe-trai-cay": { x: 53, y: 69.5, width: 40.7, height: 30.2, rotation: -2.8 },
  "bap-nuong": { x: 39.1, y: 71.8, width: 50.3, height: 33.4, rotation: 3.8 },
  "xe-mi": { x: 34.4, y: 60.6, width: 45.4, height: 45.8, rotation: 0 },
  "ruong-bac-thang": { x: 51.8, y: 62.9, width: 45.6, height: 40.9, rotation: -0.8 },
  "bien-xanh": { x: 39.5, y: 62.8, width: 35.8, height: 39.1, rotation: 0 },
  "song-nui": { x: 51.8, y: 67.6, width: 36.3, height: 36.1, rotation: 1 },
  "doi-thong": { x: 51.6, y: 55.7, width: 33.6, height: 33.1, rotation: 0 },
  "ho-sen": { x: 56.7, y: 56, width: 35.2, height: 36.4, rotation: 0 },
  "deo-nui": { x: 39.3, y: 57, width: 36.2, height: 36.2, rotation: -1.2 },
  trekking: { x: 65.5, y: 52.5, width: 42.5, height: 43.2, rotation: 0 },
  "gia-dinh-bien": { x: 71.3, y: 63.4, width: 44.9, height: 45.6, rotation: 0 },
  "dap-xe": { x: 66.4, y: 66.8, width: 44.9, height: 45.6, rotation: 0 },
  "cam-trai": { x: 69.2, y: 40.9, width: 39.7, height: 43.8, rotation: 0 },
  "du-thuyen": { x: 52.2, y: 66.2, width: 40.9, height: 35.5, rotation: -0.5 },
  "check-in": { x: 70.7, y: 38.1, width: 41.3, height: 47.4, rotation: -0.5 },
  "ha-noi": { x: 74.4, y: 75.1, width: 38.8, height: 35.8, rotation: -3.5 },
  "quang-ninh": { x: 74, y: 75.5, width: 37.5, height: 35.8, rotation: -2.5 },
  "ninh-binh": { x: 73.5, y: 75.9, width: 37.9, height: 36.7, rotation: -3.2 },
  "ha-giang": { x: 74.3, y: 70.1, width: 38.7, height: 40.3, rotation: -2.8 },
  "lao-cai": { x: 73.9, y: 70, width: 37.8, height: 39.3, rotation: -2.8 },
  hue: { x: 73.4, y: 70.2, width: 37.7, height: 39.7, rotation: -2.8 },
  "tp-hcm": { x: 35.6, y: 73.2, width: 41.4, height: 35.6, rotation: 0 },
  "da-nang": { x: 29.2, y: 74.3, width: 40.1, height: 34.7, rotation: 0 },
  "hoi-an": { x: 26.6, y: 73.8, width: 37.1, height: 36.4, rotation: 0 },
  "da-lat": { x: 34, y: 70, width: 36.9, height: 36.7, rotation: 0 },
  "can-tho": { x: 72.5, y: 66.4, width: 38.4, height: 41.4, rotation: 0 },
  "phu-quoc": { x: 67.1, y: 68.3, width: 37.5, height: 38.6, rotation: 0 },
  "meo-sep": { x: 73, y: 59.7, width: 38.5, height: 39.5, rotation: -3.5 },
  "capy-tron-bao-thuc": { x: 48.7, y: 65.5, width: 34.8, height: 34.7, rotation: -1.2 },
  "vit-dieu-phoi": { x: 70.4, y: 40.3, width: 41.9, height: 40.1, rotation: 0 },
  "cho-bao-ve": { x: 70.7, y: 41.1, width: 39, height: 36.4, rotation: 0 },
  "ech-karaoke": { x: 76.4, y: 40.6, width: 33.1, height: 34.1, rotation: 0.8 },
  "ga-influencer": { x: 65.3, y: 39.5, width: 45.4, height: 49, rotation: -3.8 },
  "ca-phe-cuu-roi": { x: 75, y: 43.3, width: 44.3, height: 51.1, rotation: -1 },
  "hop-robot": { x: 74.7, y: 42.2, width: 41.4, height: 36.7, rotation: 0 },
  "vat-may-in": { x: 76.3, y: 55.5, width: 38.8, height: 48.4, rotation: 0 },
  "hop-om-goi": { x: 50.6, y: 24.1, width: 66.5, height: 45.8, rotation: -0.8 },
  "lam-viec-o-nha": { x: 66.7, y: 52.7, width: 46, height: 45.8, rotation: 0 },
  "vi-rong": { x: 73.2, y: 49.5, width: 44.5, height: 48, rotation: 0 },
  "banh-mi-dao-dien": { x: 73.7, y: 50.9, width: 37.7, height: 41.6, rotation: 2 },
  "mi-yoga": { x: 74.5, y: 60.9, width: 38.8, height: 42.7, rotation: 0 },
  "ca-phe-mat-mo": { x: 70.9, y: 55.6, width: 44.3, height: 48.2, rotation: 0 },
  "sau-rieng-diva": { x: 74.6, y: 53, width: 39.3, height: 46, rotation: 0 },
  "nuoc-mam-sieu-nhan": { x: 67.5, y: 52.2, width: 40.6, height: 45.8, rotation: 0 },
  "noi-com-het-hon": { x: 75.9, y: 53.8, width: 39.7, height: 46.6, rotation: 0 },
  "san-wifi": { x: 70, y: 52.7, width: 44.9, height: 48.8, rotation: 0 },
  "mua-to": { x: 72, y: 63.6, width: 39.3, height: 37.3, rotation: 0 },
  "nui-quan-ao": { x: 70.6, y: 60.9, width: 44.9, height: 47.5, rotation: 0 },
  "giu-phong-bi": { x: 71.3, y: 55.7, width: 40.6, height: 52.9, rotation: 0 },
  "soi-cong-to": { x: 68.2, y: 60.6, width: 45.6, height: 47.9, rotation: 0 },
  "selfie-dai-gia-dinh": { x: 74, y: 48.5, width: 35, height: 57.3, rotation: 0.5 },
  "bach-duong": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "kim-nguu": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "song-tu": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "cu-giai": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "su-tu": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "xu-nu": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "thien-binh": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "bo-cap": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "nhan-ma": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "ma-ket": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "bao-binh": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "song-ngu": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "ty-chuot": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "suu-trau": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "dan-ho": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "mao-meo": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "thin-rong": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "ty-ran": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "ngo-ngua": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "mui-de": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "than-khi": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "dau-ga": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "tuat-cho": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "hoi-heo": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "hoa-sen-viet": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "trong-dong": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "non-la-viet": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "ao-dai-viet": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "chim-lac": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "tre-viet": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "ca-chep": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "den-long-hoi-an": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "banh-chung": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "mai-vang": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "hoa-dao": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
  "gom-bat-trang": { x: 69.5, y: 66.7, width: 51.5, height: 52, rotation: 0 },
};

type LayoutOverride = {
  quad?: ArtQuad;
  qr?: Partial<ArtFrame["qr"]>;
  copy?: Partial<ArtFrame["copy"]>;
};

const flatQuad: ArtQuad = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 },
];

// Các mẫu có tỷ lệ hoặc diện tích bảng đặc biệt được tinh chỉnh riêng.
const layoutOverrides: Record<string, LayoutOverride> = {
  meo: {
    quad: [{ x: 0.01, y: 0.05 }, { x: 0.98, y: 0 }, { x: 1, y: 0.96 }, { x: 0.03, y: 1 }],
    qr: { y: 41, size: 82 }, copy: { y: 92, width: 72, titleScale: 6.5, showSubtitle: false },
  },
  cun: {
    quad: [{ x: 0.02, y: 0.03 }, { x: 0.98, y: 0 }, { x: 1, y: 0.98 }, { x: 0, y: 1 }],
    qr: { y: 40, size: 78 }, copy: { y: 90, width: 78, titleScale: 6.2, showSubtitle: false },
  },
  ech: { qr: { y: 39, size: 80 }, copy: { y: 90, width: 76, titleScale: 6.1, showSubtitle: false } },
  vit: { qr: { y: 40, size: 76 }, copy: { y: 89, width: 78, titleScale: 6.1, showSubtitle: false } },
  "rap-chieu": { qr: { y: 36, size: 76 }, copy: { y: 81, titleScale: 5.1 } },
  "tra-da": { qr: { x: 33, y: 50, size: 82 }, copy: { x: 73, y: 49, width: 38, titleScale: 7, showSubtitle: false } },
  "xe-trai-cay": { qr: { x: 34, y: 50, size: 80 }, copy: { x: 74, y: 49, width: 36, titleScale: 6.8, showSubtitle: false } },
  "bap-nuong": { qr: { x: 32, y: 50, size: 82 }, copy: { x: 72, y: 49, width: 40, titleScale: 6.7, showSubtitle: false } },
  "ninh-binh": { qr: { y: 40, size: 76 }, copy: { y: 90, width: 76, titleScale: 6.1, showSubtitle: false } },
  "ha-noi": { qr: { y: 40, size: 76 }, copy: { y: 90, width: 76, titleScale: 6.1, showSubtitle: false } },
  "quang-ninh": { qr: { y: 40, size: 76 }, copy: { y: 90, width: 76, titleScale: 6.1, showSubtitle: false } },
  "hop-om-goi": { qr: { x: 70, y: 50, size: 76 }, copy: { x: 25, y: 49, width: 36, titleScale: 6.8, showSubtitle: false } },
  "selfie-dai-gia-dinh": { qr: { y: 35, size: 78 }, copy: { y: 81, titleScale: 5, subtitleScale: 2.2 } },
};

function buildLayout(id: string, frame: ArtFrameGeometry): ArtFrame {
  const ratio = frame.width / frame.height;
  const portrait = ratio < 0.88;
  const landscape = ratio > 1.22;
  const base: ArtFrame = {
    ...frame,
    quad: flatQuad.map((point) => ({ ...point })) as ArtQuad,
    qr: { x: landscape ? 33 : 50, y: landscape ? 50 : 40, size: portrait ? 82 : landscape ? 82 : 78 },
    copy: {
      x: landscape ? 73 : 50,
      y: landscape ? 49 : 90,
      width: landscape ? 38 : 76,
      titleScale: landscape ? 7.2 : 6.1,
      subtitleScale: 2.25,
      showSubtitle: false,
    },
  };
  const override = layoutOverrides[id];
  return {
    ...base,
    quad: override?.quad ?? base.quad,
    qr: { ...base.qr, ...override?.qr },
    copy: { ...base.copy, ...override?.copy },
  };
}

export const artFrames: Record<string, ArtFrame> = Object.fromEntries(
  Object.entries(rawArtFrames).map(([id, frame]) => [id, buildLayout(id, frame)]),
);
