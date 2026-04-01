import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Plus, X, Trash2 } from "lucide-react";
import { COLOR, FONT, RADIUS } from "../tokens";
import type { Child } from "../contexts/ChildContext";

// ChildProvider 밖에 있으므로 localStorage에서 직접 읽기
function getActiveChild(): Child | null {
  try {
    const raw = localStorage.getItem("inchit_children");
    if (!raw) return null;
    const list: Child[] = JSON.parse(raw);
    return list[0] ?? null;
  } catch { return null; }
}

// 개발 미리보기 플래그
// true  → 샘플 데이터 표시 (디자인 검토용)
// false → 실제 localStorage 데이터
const SHOW_MOCK = true;

// PALETTE_25에서 선택한 측정 타입별 컬러
const TYPE_COLOR: Record<GrowthType, string> = {
  weight: "#EA7D70",  // 코랄
  height: "#7D8BE0",  // 퍼플 블루
  head:   "#BCC07B",  // 세이지 그린
};

const TYPE_LABEL: Record<GrowthType, string> = {
  weight: "몸무게",
  height: "키",
  head:   "머리둘레",
};

const TYPE_UNIT: Record<GrowthType, string> = {
  weight: "kg",
  height: "cm",
  head:   "cm",
};

type GrowthType = "weight" | "height" | "head";

type GrowthRecord = {
  id: string;
  date: string;       // "YYYY-MM-DD"
  ageMonths: number;
  weight?: number;
  height?: number;
  head?: number;
};

// ── WHO 성장 기준치 (참고용, 남아 기준 근사치) ─────────────────
// 출처: WHO Growth Standards & 2017 소아청소년 성장도표 (참고 목적)
const WHO: Record<GrowthType, {
  p25: [number, number][];
  p50: [number, number][];
  p75: [number, number][];
}> = {
  weight: {
    p25: [[0,2.9],[3,5.8],[6,7.4],[9,8.7],[12,9.7],[18,11.1],[24,12.1],[36,14.2]],
    p50: [[0,3.3],[3,6.4],[6,7.9],[9,9.2],[12,10.3],[18,11.9],[24,13.0],[36,15.3]],
    p75: [[0,3.7],[3,7.0],[6,8.6],[9,9.9],[12,11.1],[18,12.8],[24,14.1],[36,16.7]],
  },
  height: {
    p25: [[0,48],[3,59],[6,65],[9,70],[12,74],[18,80],[24,85],[36,94]],
    p50: [[0,50],[3,61],[6,68],[9,72],[12,76],[18,82],[24,88],[36,96]],
    p75: [[0,52],[3,63],[6,70],[9,75],[12,78],[18,85],[24,90],[36,98]],
  },
  head: {
    p25: [[0,33],[3,39],[6,42],[9,44],[12,45],[18,47],[24,48],[36,50]],
    p50: [[0,34.5],[3,40.5],[6,43.3],[9,45.0],[12,46.5],[18,48.0],[24,49.2],[36,50.5]],
    p75: [[0,35.5],[3,41.5],[6,44.3],[9,46.0],[12,47.6],[18,49.0],[24,50.3],[36,51.4]],
  },
};

const MOCK_RECORDS: GrowthRecord[] = [
  { id: "g1", date: "2025-04-15", ageMonths: 8,  weight: 8.5,  height: 70.5, head: 44.5 },
  { id: "g2", date: "2025-07-10", ageMonths: 11, weight: 9.8,  height: 74.0, head: 46.0 },
  { id: "g3", date: "2025-10-05", ageMonths: 14, weight: 10.8, height: 78.0, head: 47.2 },
  { id: "g4", date: "2026-01-20", ageMonths: 17, weight: 11.5, height: 81.5, head: 48.0 },
  { id: "g5", date: "2026-03-30", ageMonths: 19, weight: 12.0, height: 83.0, head: 48.5 },
];

// localStorage helpers
const storageKey = (childId: string) => `inchit_growth_${childId}`;

function loadRecords(childId: string): GrowthRecord[] {
  try {
    const raw = localStorage.getItem(storageKey(childId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveRecords(childId: string, records: GrowthRecord[]) {
  localStorage.setItem(storageKey(childId), JSON.stringify(records));
}

// 선형 보간
function interpolate(data: [number, number][], month: number): number {
  if (month <= data[0][0]) return data[0][1];
  if (month >= data[data.length - 1][0]) return data[data.length - 1][1];
  for (let i = 0; i < data.length - 1; i++) {
    const [m0, v0] = data[i];
    const [m1, v1] = data[i + 1];
    if (month >= m0 && month <= m1) {
      const t = (month - m0) / (m1 - m0);
      return v0 + t * (v1 - v0);
    }
  }
  return data[data.length - 1][1];
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${y}. ${parseInt(m)}. ${parseInt(d)}.`;
}

function formatValue(type: GrowthType, value: number): string {
  return type === "weight" ? value.toFixed(1) : value.toFixed(1);
}

// ── SVG 차트 ──────────────────────────────────────────────────
const CW = 320, CH = 190;
const PAD = { top: 16, right: 16, bottom: 36, left: 44 };
const PW = CW - PAD.left - PAD.right;
const PH = CH - PAD.top - PAD.bottom;

interface ChartProps {
  type: GrowthType;
  records: GrowthRecord[];
  childMonths: number;
}

function GrowthChart({ type, records, childMonths }: ChartProps) {
  const color = TYPE_COLOR[type];
  const ref = WHO[type];
  const xMin = Math.max(0, childMonths - 13);
  const xMax = Math.min(36, childMonths + 4);
  const months = Array.from({ length: xMax - xMin + 1 }, (_, i) => xMin + i);

  const yPad = type === "weight" ? 1.5 : type === "height" ? 5 : 2;
  const userVals = records
    .map(r => (type === "weight" ? r.weight : type === "height" ? r.height : r.head))
    .filter((v): v is number => v !== undefined);

  const allVals = [
    ...months.map(m => interpolate(ref.p25, m)),
    ...months.map(m => interpolate(ref.p75, m)),
    ...userVals,
  ];
  const rawYMin = Math.min(...allVals) - yPad;
  const rawYMax = Math.max(...allVals) + yPad;

  function toX(m: number) { return PAD.left + ((m - xMin) / (xMax - xMin)) * PW; }
  function toY(v: number) { return PAD.top + PH - ((v - rawYMin) / (rawYMax - rawYMin)) * PH; }

  function refPts(data: [number, number][]) {
    return months.map(m => `${toX(m)},${toY(interpolate(data, m))}`).join(" ");
  }

  // 밴드 path (p25 → p75)
  const fwdPts = months.map(m => `${toX(m)},${toY(interpolate(ref.p25, m))}`).join(" L ");
  const bwdPts = [...months].reverse().map(m => `${toX(m)},${toY(interpolate(ref.p75, m))}`).join(" L ");
  const bandPath = `M ${fwdPts} L ${bwdPts} Z`;

  // 사용자 데이터
  const userPoints = records
    .filter(r => (type === "weight" ? r.weight : type === "height" ? r.height : r.head) !== undefined)
    .sort((a, b) => a.ageMonths - b.ageMonths);

  const userLinePts = userPoints
    .map(r => {
      const v = (type === "weight" ? r.weight : type === "height" ? r.height : r.head)!;
      return `${toX(r.ageMonths)},${toY(v)}`;
    })
    .join(" ");

  // Y축 눈금 (4개)
  const yStep = (rawYMax - rawYMin) / 4;
  const yTicks = Array.from({ length: 5 }, (_, i) => rawYMin + i * yStep);
  // X축 눈금 (3개월 간격)
  const xTicks = months.filter(m => m % 3 === 0);

  return (
    <svg viewBox={`0 0 ${CW} ${CH}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {/* 배경 */}
      <rect x={PAD.left} y={PAD.top} width={PW} height={PH}
        fill={COLOR.bgApp} rx={6} />

      {/* 가로 그리드 */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={toY(v)} x2={PAD.left + PW} y2={toY(v)}
            stroke={COLOR.borderLight} strokeWidth={0.8} />
          <text x={PAD.left - 5} y={toY(v)} textAnchor="end" dominantBaseline="middle"
            fontSize={8} fill={COLOR.textMuted} fontFamily="sans-serif">
            {type === "weight" ? v.toFixed(0) : v.toFixed(0)}
          </text>
        </g>
      ))}

      {/* 참고 밴드 (25th~75th) */}
      <path d={bandPath} fill={color} fillOpacity={0.10} />

      {/* 50th 백분위선 */}
      <polyline points={refPts(ref.p50)} fill="none"
        stroke={color} strokeWidth={1.2} strokeDasharray="5,3" strokeOpacity={0.45} />

      {/* 사용자 데이터 라인 */}
      {userPoints.length > 1 && (
        <polyline points={userLinePts} fill="none"
          stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* 사용자 데이터 도트 */}
      {userPoints.map(r => {
        const v = (type === "weight" ? r.weight : type === "height" ? r.height : r.head)!;
        return (
          <circle key={r.id} cx={toX(r.ageMonths)} cy={toY(v)} r={4.5}
            fill={color} stroke="#fff" strokeWidth={2} />
        );
      })}

      {/* X축 */}
      <line x1={PAD.left} y1={PAD.top + PH} x2={PAD.left + PW} y2={PAD.top + PH}
        stroke={COLOR.borderMid} strokeWidth={0.8} />
      {xTicks.map(m => (
        <g key={m}>
          <line x1={toX(m)} y1={PAD.top + PH} x2={toX(m)} y2={PAD.top + PH + 4}
            stroke={COLOR.borderMid} strokeWidth={0.8} />
          <text x={toX(m)} y={PAD.top + PH + 13} textAnchor="middle"
            fontSize={8} fill={COLOR.textMuted} fontFamily="sans-serif">
            {m}m
          </text>
        </g>
      ))}

      {/* Y축 레이블 */}
      <text x={PAD.left - 2} y={PAD.top - 5} textAnchor="middle"
        fontSize={8} fill={COLOR.textMuted} fontFamily="sans-serif">
        {TYPE_UNIT[type]}
      </text>
    </svg>
  );
}

// ── 범례 ────────────────────────────────────────────────────
function ChartLegend({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "6px 4px 0", justifyContent: "flex-end" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 12, height: 3, backgroundColor: color, opacity: 0.45,
          backgroundImage: `repeating-linear-gradient(to right, ${color} 0, ${color} 5px, transparent 5px, transparent 8px)`,
          backgroundSize: "8px 3px", backgroundRepeat: "repeat-x" }} />
        <span style={{ fontSize: 10, color: COLOR.textMuted, fontFamily: FONT.base }}>50th 기준선</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 12, height: 6, backgroundColor: color, opacity: 0.15, borderRadius: 2 }} />
        <span style={{ fontSize: 10, color: COLOR.textMuted, fontFamily: FONT.base }}>25~75th 범위</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 8, height: 8, backgroundColor: color, borderRadius: "50%",
          border: "1.5px solid white", boxShadow: `0 0 0 1px ${color}` }} />
        <span style={{ fontSize: 10, color: COLOR.textMuted, fontFamily: FONT.base }}>기록</span>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export function GrowthPage() {
  const navigate = useNavigate();
  const selectedChild = getActiveChild();

  const [activeType, setActiveType] = useState<GrowthType>("weight");
  const [records, setRecords] = useState<GrowthRecord[]>(() => {
    if (SHOW_MOCK) return MOCK_RECORDS;
    return selectedChild ? loadRecords(selectedChild.id) : [];
  });
  const [sheetOpen, setSheetOpen] = useState(false);

  // 입력 폼 상태
  const today = new Date().toISOString().split("T")[0];
  const [inputDate, setInputDate] = useState(today);
  const [inputWeight, setInputWeight] = useState("");
  const [inputHeight, setInputHeight] = useState("");
  const [inputHead, setInputHead] = useState("");

  const childMonths = selectedChild?.months ?? 19;
  const color = TYPE_COLOR[activeType];

  function calcAgeMonths(dateStr: string): number {
    if (!selectedChild) return 0;
    const [y, m, d] = dateStr.split("-").map(Number);
    const [by, bm, bd] = selectedChild.dob.split(".").map(Number);
    let months = (y - by) * 12 + (m - bm);
    if (d < bd) months -= 1;
    return Math.max(0, months);
  }

  function handleSave() {
    const w = inputWeight ? parseFloat(inputWeight) : undefined;
    const h = inputHeight ? parseFloat(inputHeight) : undefined;
    const hc = inputHead ? parseFloat(inputHead) : undefined;
    if (!w && !h && !hc) return;

    const newRecord: GrowthRecord = {
      id: `g_${Date.now()}`,
      date: inputDate,
      ageMonths: calcAgeMonths(inputDate),
      ...(w ? { weight: w } : {}),
      ...(h ? { height: h } : {}),
      ...(hc ? { head: hc } : {}),
    };

    const updated = [...records, newRecord].sort((a, b) => a.date.localeCompare(b.date));
    setRecords(updated);
    if (selectedChild && !SHOW_MOCK) saveRecords(selectedChild.id, updated);

    setInputWeight(""); setInputHeight(""); setInputHead("");
    setInputDate(today);
    setSheetOpen(false);
  }

  function handleDelete(id: string) {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    if (selectedChild && !SHOW_MOCK) saveRecords(selectedChild.id, updated);
  }

  const recentRecords = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [records]
  );

  return (
    <div style={{
      height: "100dvh", overflow: "hidden", display: "flex",
      justifyContent: "center", backgroundColor: COLOR.bgOuter,
    }}>
      <div style={{
        width: "100%", maxWidth: 390, height: "100dvh",
        backgroundColor: COLOR.bgApp, display: "flex",
        flexDirection: "column", overflow: "hidden", fontFamily: FONT.base,
      }}>
        {/* ── 앱바 ── */}
        <div style={{
          backgroundColor: COLOR.bgCard, display: "flex", alignItems: "center",
          justifyContent: "space-between", height: 56, padding: "0 8px", flexShrink: 0,
        }}>
          <button onClick={() => navigate(-1)} style={{
            background: "none", border: "none", cursor: "pointer", padding: 11,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ChevronLeft size={22} color={COLOR.textPrimary} strokeWidth={2} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
            성장 기록
          </span>
          <div style={{ width: 44 }} />
        </div>

        {/* ── 컨텐츠 스크롤 영역 ── */}
        <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 20px 32px" }}>

          {/* 측정 타입 탭 */}
          <div style={{
            display: "flex", backgroundColor: COLOR.bgCard,
            borderRadius: RADIUS.pill, padding: 3, gap: 2, marginBottom: 20,
          }}>
            {(["weight", "height", "head"] as GrowthType[]).map(t => {
              const isActive = activeType === t;
              return (
                <button key={t} onClick={() => setActiveType(t)} style={{
                  flex: 1, height: 36, borderRadius: RADIUS.pill, border: "none",
                  cursor: "pointer", fontFamily: FONT.base, fontSize: 13, fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? TYPE_COLOR[t] : "transparent",
                  color: isActive ? "#fff" : COLOR.textMuted,
                  transition: "all 0.18s ease",
                  WebkitTapHighlightColor: "transparent",
                }}>
                  {TYPE_LABEL[t]}
                </button>
              );
            })}
          </div>

          {/* 차트 카드 */}
          <div style={{ backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg, padding: "16px 12px 12px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 4px" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
                {TYPE_LABEL[activeType]} 성장 추이
              </span>
              <span style={{ fontSize: 11, color: COLOR.textMuted, letterSpacing: "-0.1px" }}>
                {childMonths}개월 기준
              </span>
            </div>

            {records.filter(r =>
              activeType === "weight" ? r.weight !== undefined :
              activeType === "height" ? r.height !== undefined : r.head !== undefined
            ).length === 0 ? (
              <div style={{ height: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 32 }}>📏</span>
                <span style={{ fontSize: 13, color: COLOR.textMuted }}>아직 기록이 없어요</span>
              </div>
            ) : (
              <GrowthChart type={activeType} records={records} childMonths={childMonths} />
            )}

            <ChartLegend color={color} />

            <div style={{ marginTop: 10, padding: "8px 4px 0", borderTop: `1px solid ${COLOR.borderLight}` }}>
              <span style={{ fontSize: 10, color: COLOR.textDisabled, letterSpacing: "-0.1px" }}>
                ※ 백분위 기준선은 WHO 성장 기준 참고값이며, 정확한 평가는 소아과 전문의와 상담하세요.
              </span>
            </div>
          </div>

          {/* + 기록 추가 버튼 */}
          <button onClick={() => setSheetOpen(true)} style={{
            width: "100%", height: 50, borderRadius: RADIUS.md,
            backgroundColor: color, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontFamily: FONT.base, fontSize: 15, fontWeight: 700, color: "#fff",
            letterSpacing: "-0.2px", marginBottom: 20,
            WebkitTapHighlightColor: "transparent",
          }}>
            <Plus size={18} strokeWidth={2.5} />
            기록 추가
          </button>

          {/* 기록 목록 */}
          {recentRecords.length > 0 && (
            <div style={{ backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${COLOR.borderLight}` }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
                  기록 목록
                </span>
              </div>
              {recentRecords.map((r, i) => (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
                  minHeight: 52, borderBottom: i < recentRecords.length - 1 ? `1px solid ${COLOR.borderLight}` : "none",
                }}>
                  {/* 날짜 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLOR.textPrimary, marginBottom: 3 }}>
                      {formatDate(r.date)}
                      <span style={{ fontSize: 11, fontWeight: 400, color: COLOR.textMuted, marginLeft: 6 }}>
                        {r.ageMonths}개월
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {r.weight !== undefined && (
                        <span style={{ fontSize: 12, color: TYPE_COLOR.weight, fontWeight: 600 }}>
                          {formatValue("weight", r.weight)} kg
                        </span>
                      )}
                      {r.height !== undefined && (
                        <span style={{ fontSize: 12, color: TYPE_COLOR.height, fontWeight: 600 }}>
                          {formatValue("height", r.height)} cm
                        </span>
                      )}
                      {r.head !== undefined && (
                        <span style={{ fontSize: 12, color: TYPE_COLOR.head, fontWeight: 600 }}>
                          머리 {formatValue("head", r.head)} cm
                        </span>
                      )}
                    </div>
                  </div>
                  {/* 삭제 */}
                  <button onClick={() => handleDelete(r.id)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: 8, display: "flex", alignItems: "center",
                    WebkitTapHighlightColor: "transparent",
                  }}>
                    <Trash2 size={15} color={COLOR.textDisabled} strokeWidth={1.8} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 기록 추가 바텀 시트 ── */}
        {sheetOpen && (
          <>
            {/* 오버레이 */}
            <div onClick={() => setSheetOpen(false)} style={{
              position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 40,
            }} />
            {/* 시트 */}
            <div style={{
              position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
              width: "100%", maxWidth: 390, backgroundColor: COLOR.bgCard,
              borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`,
              padding: "20px 24px 40px", zIndex: 50,
              boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
            }}>
              {/* 핸들 */}
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: COLOR.border, margin: "0 auto 20px" }} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
                  성장 기록 추가
                </span>
                <button onClick={() => setSheetOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <X size={20} color={COLOR.textMuted} />
                </button>
              </div>

              {/* 날짜 */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: COLOR.textSecondary, letterSpacing: "-0.2px", display: "block", marginBottom: 6 }}>
                  측정일
                </label>
                <input type="date" value={inputDate} onChange={e => setInputDate(e.target.value)}
                  style={{
                    width: "100%", height: 48, borderRadius: RADIUS.md, border: "none",
                    backgroundColor: COLOR.bgApp, padding: "0 14px", fontFamily: FONT.base,
                    fontSize: 14, color: COLOR.textPrimary, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {/* 측정값 3개 나란히 */}
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                {([
                  { type: "weight", label: "몸무게", unit: "kg", val: inputWeight, set: setInputWeight, step: "0.1", placeholder: "0.0" },
                  { type: "height", label: "키",     unit: "cm", val: inputHeight, set: setInputHeight, step: "0.1", placeholder: "0.0" },
                  { type: "head",   label: "머리둘레", unit: "cm", val: inputHead,   set: setInputHead,   step: "0.1", placeholder: "0.0" },
                ] as const).map(({ type, label, unit, val, set, step, placeholder }) => (
                  <div key={type} style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: TYPE_COLOR[type], display: "block", marginBottom: 6, letterSpacing: "-0.1px" }}>
                      {label}
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number" inputMode="decimal" step={step}
                        value={val} onChange={e => set(e.target.value)}
                        placeholder={placeholder}
                        style={{
                          width: "100%", height: 52, borderRadius: RADIUS.md, border: "none",
                          backgroundColor: COLOR.bgApp, paddingLeft: 10, paddingRight: 24,
                          fontFamily: FONT.base, fontSize: 15, fontWeight: 600,
                          color: TYPE_COLOR[type], outline: "none", boxSizing: "border-box",
                          WebkitAppearance: "none",
                        }}
                      />
                      <span style={{
                        position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                        fontSize: 10, color: COLOR.textMuted, fontFamily: FONT.base,
                      }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 저장 버튼 */}
              <button onClick={handleSave} style={{
                width: "100%", height: 52, borderRadius: RADIUS.md,
                backgroundColor: COLOR.textPrimary, border: "none", cursor: "pointer",
                fontFamily: FONT.base, fontSize: 16, fontWeight: 700, color: "#fff",
                letterSpacing: "-0.3px",
                WebkitTapHighlightColor: "transparent",
              }}>
                저장
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
