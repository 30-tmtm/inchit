/**
 * ─────────────────────────────────────────────
 *  inchit Design Tokens  v1.1
 *  폰트: Pretendard Variable (토스 스타일)
 *  컬러: Toss-inspired gray system
 * ─────────────────────────────────────────────
 */

// ── Brand ──────────────────────────────────────
export const COLOR = {
  // 브랜드
  primary:        "#191919",  // Toss-style deep black
  accent:         "#C1DBE8",  // Pastel Blue  — 버튼, 하이라이트
  accentPressed:  "#A8C8D8",  // Pastel Blue pressed
  accentBg:       "rgba(193,219,232,0.10)",
  accentBg20:     "rgba(193,219,232,0.20)",

  // 탭바
  tabActive:   "#191919",
  tabInactive: "#B0B8C1",   // Toss blue-gray inactive
  tabActiveBg: "rgba(25,25,25,0.08)",

  // 배경
  bgApp:    "#F2F4F6",  // Toss 시그니처 연회색 (블루틴트)
  bgCard:   "#FFFFFF",
  bgPanel:  "#F8F9FA",
  bgInput:  "#F2F4F6",
  bgOuter:  "#FFFFFF",

  // 텍스트 — Toss gray system
  textPrimary:     "#191919",  // Toss deep black
  textSecondary:   "#6B7280",  // medium gray
  textMuted:       "#8B95A1",  // blue-gray muted
  textDisabled:    "#B0B8C1",  // light blue-gray
  textPlaceholder: "#B0B8C1",
  textOnDark:      "#FFFFFF",
  textOnAccent:    "#191919",

  // 구분선 / 테두리 — Toss border system
  border:        "#E5E8EB",  // Toss standard border
  borderLight:   "#F2F4F6",  // 아이템 구분선
  borderMid:     "#D1D6DB",
  borderInput:   "#D1D6DB",
  borderAccent:  "#C1DBE8",
  borderInactive:"#CDD1D6",

  // 캘린더 전용
  calHoliday:  "#E05252",
  calSaturday: "#5B7FBF",
  calToday:    "#191919",
  calSelected: "#C1DBE8",
  calDimmed:   "#B0B8C1",

  // 이벤트 카테고리
  catHealth:   "#3D6AB5",
  catDaycare:  "#2E8049",
  catFamily:   "#C05030",
  catActivity: "#6D3DB0",

  // 이벤트 팔레트
  paletteColors: [
    "#3D6AB5", "#2E8049", "#C05030", "#6D3DB0",
    "#E05252", "#9B6B3A", "#F6C933", "#60C6C0",
    "#43302E",
  ] as string[],

  // FAB / 다크 버튼
  fab: "#191919",

  // 시스템
  danger:   "#E05252",
  success:  "#2E8049",
  warning:  "#F6C933",
  info:     "#3D6AB5",
} as const;

// ── Typography ─────────────────────────────────
export const FONT = {
  base: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

// ── Border Radius ──────────────────────────────
export const RADIUS = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  pill: 999,
} as const;

// ── Shadow ────────────────────────────────────
export const SHADOW = {
  card:   "0 1px 4px rgba(0,0,0,0.04)",
  modal:  "0 4px 24px rgba(0,0,0,0.10)",
  tabBar: "0 -1px 0 #E5E8EB",
  fab:    "0 4px 16px rgba(25,25,25,0.25)",
} as const;

// ── Spacing ───────────────────────────────────
export const SPACE = {
  pagePadding:   20,
  cardPadding:   18,
  sectionGap:    14,
  itemGap:        8,
  tabBarHeight:  60,
  appBarHeight:  56,
} as const;