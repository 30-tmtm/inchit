import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ChevronLeft, Plus, X, Info,
  Activity, Hand, MessageCircle, Users, Brain,
  ChevronDown, ChevronUp, Check,
} from "lucide-react";
import { COLOR, FONT, RADIUS } from "../tokens";
import type { Child } from "../contexts/ChildContext";
import { useChild } from "../contexts/ChildContext";
import { KDST_ITEMS, KDST_RANGES, KdstRangeKey, getKdstRange } from "../data/kdst";
import { getAgeAtTimestamp } from "../utils/seoulDate";

// ── 날짜 헬퍼 (EventDetailModal 패턴 통일) ────────────────────
type DateState = { year: number; month: number; day: number };
const DOW_KR = ["일", "월", "화", "수", "목", "금", "토"];

function dateStrToDState(str: string): DateState {
  const [y, m, d] = str.split("-").map(Number);
  return { year: y, month: m, day: d };
}
function dStateToDateStr(d: DateState): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}
function dStateToLabel(d: DateState): string {
  const dow = new Date(d.year, d.month - 1, d.day).getDay();
  return `${d.year}. ${d.month}. ${d.day}.(${DOW_KR[dow]})`;
}
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function firstDOW(y: number, m: number)    { return new Date(y, m - 1, 1).getDay(); }

// ── InlineCalendar (EventDetailModal 패턴 공유) ───────────────
function InlineCalendar({ selected, onChange }: {
  selected: DateState;
  onChange: (d: DateState) => void;
}) {
  const [cy, setCy] = useState(selected.year);
  const [cm, setCm] = useState(selected.month);

  function prev() { if (cm === 1) { setCy(y => y - 1); setCm(12); } else setCm(m => m - 1); }
  function next() { if (cm === 12) { setCy(y => y + 1); setCm(1);  } else setCm(m => m + 1); }

  const firstDay = firstDOW(cy, cm);
  const total = daysInMonth(cy, cm);
  const cells: { day: number; cur: boolean }[] = [];
  const prevTotal = daysInMonth(cy, cm === 1 ? 12 : cm - 1);
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevTotal - i, cur: false });
  for (let d = 1; d <= total; d++) cells.push({ day: d, cur: true });
  const fill = Math.ceil(cells.length / 7) * 7 - cells.length;
  for (let d = 1; d <= fill; d++) cells.push({ day: d, cur: false });

  const isSel = (d: number, cur: boolean) =>
    cur && d === selected.day && cy === selected.year && cm === selected.month;

  return (
    <div style={{ padding: "12px 16px 16px", backgroundColor: COLOR.bgCard, fontFamily: FONT.base }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
          {cy}년 {cm}월
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {[prev, next].map((fn, i) => (
            <button key={i} onClick={fn} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                {i === 0
                  ? <path d="M6 1L1 6L6 11" stroke={COLOR.textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  : <path d="M1 1L6 6L1 11" stroke={COLOR.textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
              </svg>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div key={d} style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}>
            <span style={{ fontSize: 11, color: i === 0 ? COLOR.calHoliday : i === 6 ? COLOR.calSaturday : COLOR.textMuted }}>
              {d}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px 0" }}>
        {cells.map((cell, idx) => {
          const col = idx % 7;
          const sel = isSel(cell.day, cell.cur);
          return (
            <div key={idx} onClick={() => { if (cell.cur) onChange({ year: cy, month: cm, day: cell.day }); }}
              style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "3px 0", cursor: cell.cur ? "pointer" : "default" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: sel ? COLOR.primary : "transparent" }}>
                <span style={{ fontSize: 13, fontWeight: sel ? 700 : 400,
                  color: sel ? COLOR.textOnDark : !cell.cur ? COLOR.textDisabled : col === 0 ? COLOR.calHoliday : col === 6 ? COLOR.calSaturday : COLOR.textPrimary }}>
                  {cell.day}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── DateTimeChip ──────────────────────────────────────────────
function DateTimeChip({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center",
      padding: "5px 10px", borderRadius: RADIUS.sm, border: "none",
      backgroundColor: isActive ? COLOR.primary : COLOR.bgApp,
      cursor: "pointer", fontFamily: FONT.base, fontSize: 14,
      fontWeight: isActive ? 600 : 400,
      color: isActive ? COLOR.textOnDark : COLOR.textPrimary,
      letterSpacing: "-0.3px", transition: "background-color 0.15s, color 0.15s",
      WebkitTapHighlightColor: "transparent",
    }}>
      {label}
    </button>
  );
}


// ChildProvider 밖에 있으므로 localStorage에서 직접 읽기
// getActiveChild → useChild()로 대체됨 (하단 컴포넌트에서 사용)

// 개발 미리보기 플래그 (true: 샘플 데이터, false: 실 데이터)
const SHOW_MOCK = true;

// ── 타입 정의 ───────────────────────────────────────────────
type GrowthType = "weight" | "height" | "head";

type GrowthRecord = {
  id: string;
  date: string;       // "YYYY-MM-DD"
  ageMonths: number;
  weight?: number;
  height?: number;
  head?: number;
};

// ── 측정 타입별 상수 ─────────────────────────────────────────
const TYPE_COLOR: Record<GrowthType, string> = {
  weight: "#EA7D70",
  height: "#7D8BE0",
  head:   "#BCC07B",
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

// 백분위 기준선 색상 (점선 구별)
const PCTILE = {
  p10: { color: "#B0B8C1", label: "10%",     dash: "2,4"  as string },
  p50: { color: "#F6C933", label: "50% 평균", dash: "8,4"  as string },
  p90: { color: "#E05252", label: "90%",      dash: "5,3"  as string },
};

// ── WHO 성장 기준치 (참고용, 남아 기준 근사치) ─────────────────
// 출처: WHO Growth Standards · 2017 소아청소년 성장도표 (참고 목적)
const WHO: Record<GrowthType, {
  p10: [number, number][];
  p50: [number, number][];
  p90: [number, number][];
}> = {
  weight: {
    p10: [[0,2.8],[3,5.4],[6,7.1],[9,8.2],[12,9.1],[18,10.4],[24,11.3],[36,13.3]],
    p50: [[0,3.3],[3,6.4],[6,7.9],[9,9.2],[12,10.3],[18,11.9],[24,13.0],[36,15.3]],
    p90: [[0,3.9],[3,7.3],[6,8.9],[9,10.3],[12,11.5],[18,13.2],[24,14.5],[36,17.1]],
  },
  height: {
    p10: [[0,47],[3,58],[6,64],[9,68],[12,72],[18,78],[24,83],[36,91]],
    p50: [[0,50],[3,61],[6,68],[9,72],[12,76],[18,82],[24,88],[36,96]],
    p90: [[0,53],[3,64],[6,71],[9,76],[12,79],[18,86],[24,91],[36,99]],
  },
  head: {
    p10: [[0,32.5],[3,38.5],[6,41.5],[9,43.5],[12,44.8],[18,46.5],[24,47.5],[36,49.5]],
    p50: [[0,34.5],[3,40.5],[6,43.3],[9,45.0],[12,46.5],[18,48.0],[24,49.2],[36,50.5]],
    p90: [[0,36.5],[3,42.5],[6,45.3],[9,47.0],[12,48.5],[18,49.8],[24,51.2],[36,52.3]],
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
      return v0 + ((month - m0) / (m1 - m0)) * (v1 - v0);
    }
  }
  return data[data.length - 1][1];
}

function getVal(r: GrowthRecord, t: GrowthType): number | undefined {
  return t === "weight" ? r.weight : t === "height" ? r.height : r.head;
}

// ── K-DST 개월 구분 (DB 파일 기준) ──────────────────────────────
// 4~5, 6~7, 8~9, 10~11, 12~13, 14~15, 16~17, 18~19, 20~21, 22~23,
// 24~26, 27~29, 30~32, 33~35, 36~41, 42~47, 48~53, 54~59, 60~65, 66~71
// KDST_RANGES, KDST_ITEMS, KdstRangeKey, getKdstRange → src/app/data/kdst.ts 에서 import

// ── K-DST 인칫 포인트 항목 데이터 (20개 연령 그룹) ───────────────
// 5개 영역(대근육·소근육·언어·인지·사회성) × 4항목 구성
// 발달 기준은 K-DST 체계를 기반으로, 부모가 일상에서 자연스럽게
// 관찰할 수 있도록 친근하고 감성적인 표현으로 재구성했습니다.

const KDST_DOMAINS = [
  { domain: "대근육 운동", icon: Activity,      color: "#4A90D9" },
  { domain: "소근육 운동", icon: Hand,          color: "#7B68EE" },
  { domain: "언어",       icon: MessageCircle,  color: "#20B2AA" },
  { domain: "인지",       icon: Brain,          color: "#DA70D6" },
  { domain: "사회성",     icon: Users,          color: "#FF8C69" },
] as const;

// KdstRangeKey, KDST_ITEMS → src/app/data/kdst.ts 에서 import됨

function makeKdstGroups(key: KdstRangeKey) {
  const items = KDST_ITEMS[key];
  return KDST_DOMAINS.map((d, i) => ({ ...d, items: items[i] }));
}

type KdstGroup = ReturnType<typeof makeKdstGroups>[0];

function getKdstGroups(months: number): KdstGroup[] {
  const range = getKdstRange(months);
  const key = `${range.start}-${range.end}` as KdstRangeKey;
  return makeKdstGroups(key);
}

// K-DST 체크 아이템
function KdstCheckItem({ label, checked, onToggle, isLast, checkedAt, dob }: {
  label: string; checked: boolean; onToggle: () => void; isLast: boolean;
  checkedAt?: string; dob?: string;
}) {
  const ageLabel = (checked && checkedAt && dob)
    ? getAgeAtTimestamp(dob, checkedAt)
    : null;
  return (
    <button onClick={onToggle} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 12,
      padding: "12px 16px", background: "none", border: "none",
      borderBottom: isLast ? "none" : `1px solid ${COLOR.borderLight}`,
      cursor: "pointer", textAlign: "left", WebkitTapHighlightColor: "transparent",
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        border: checked ? "none" : `2px solid ${COLOR.borderInactive}`,
        backgroundColor: checked ? COLOR.textPrimary : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s ease",
      }}>
        {checked && (
          <svg width="11" height="8" viewBox="0 0 12 9" fill="none">
            <path d="M1 4L4.5 7.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontFamily: FONT.base, fontSize: 14,
          fontWeight: checked ? 400 : 500,
          color: checked ? COLOR.textMuted : COLOR.textPrimary,
          textDecoration: checked ? "line-through" : "none",
          letterSpacing: "-0.2px", display: "block",
        }}>
          {label}
        </span>
        {ageLabel && (
          <span style={{
            fontSize: 11, fontWeight: 500,
            color: COLOR.info,
            letterSpacing: "-0.1px", marginTop: 1, display: "block",
          }}>
            {ageLabel}
          </span>
        )}
      </div>
    </button>
  );
}

// K-DST 도메인 카드
function KdstDomainCard({ group, checkedItems, onToggle, getCheckedAt, dob }: {
  group: KdstGroup; checkedItems: Set<string>; onToggle: (key: string) => void;
  getCheckedAt?: (key: string) => string | undefined; dob?: string;
}) {
  const [open, setOpen] = useState(true);
  const doneCount = group.items.filter(item => checkedItems.has(`${group.domain}::${item}`)).length;
  const allDone = doneCount === group.items.length;
  const Icon = group.icon;
  return (
    <div style={{ backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg, overflow: "hidden" }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: "100%", display: "flex", alignItems: "center", padding: "14px 16px",
        background: "none", border: "none", cursor: "pointer",
        borderBottom: open ? `1px solid ${COLOR.borderLight}` : "none",
        WebkitTapHighlightColor: "transparent", gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          backgroundColor: `${group.color}18`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={16} color={group.color} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <span style={{ fontFamily: FONT.base, fontWeight: 700, fontSize: 14, color: COLOR.textPrimary }}>
            {group.domain}
          </span>
        </div>
        <span style={{
          fontSize: 12, fontWeight: allDone ? 700 : 500,
          color: allDone ? "#fff" : COLOR.textMuted,
          backgroundColor: allDone ? group.color : "transparent",
          borderRadius: RADIUS.pill,
          padding: allDone ? "2px 9px" : "0",
          marginRight: 4,
          transition: "all 0.25s ease",
          letterSpacing: "-0.2px",
        }}>
          {doneCount}/{group.items.length}
        </span>
        {open
          ? <ChevronUp size={15} color={COLOR.textMuted} strokeWidth={2} />
          : <ChevronDown size={15} color={COLOR.textMuted} strokeWidth={2} />}
      </button>
      {open && (
        <div>
          {group.items.map((item, i) => {
            const key = `${group.domain}::${item}`;
            return (
              <KdstCheckItem key={key} label={item}
                checked={checkedItems.has(key)} onToggle={() => onToggle(key)}
                isLast={i === group.items.length - 1}
                checkedAt={getCheckedAt?.(key)} dob={dob}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 아이 시기별 발달 정보 (Baby Calendar DB 기반) ─────────────
interface BabyInfo {
  feed?: string;
  develop: string;
  care: string;
  play: string;
}

function getBabyInfo(months: number): BabyInfo {
  if (months <= 0) return {
    develop: "신생아는 하루 대부분을 자면서 보내요. 소리와 빛에 반응하고, 엄마 목소리를 인식해요.",
    care: "수유는 배고픔 신호(빨기, 울기 전)에 맞춰 8~12회 권장해요. 실내 온도 22~23°C, 습도 50~60%를 유지하세요.",
    play: "20~30cm 거리에서 목젖 모양 보여주기. 부드러운 말소리로 자주 말 걸기.",
  };
  if (months === 1) return {
    feed: "모유수유 8~12회 / 분유 50~100ml, 8~12회",
    develop: "팔다리를 자주 구부리며 근육이 발달해요. 목은 아직 가눌 수 없어요. 소리와 빛에 반응하고 엄마 목소리를 구별해요.",
    care: "목을 한 방향으로만 기울이거나 머리가 한쪽으로 기울면 전문가 상담이 필요해요. 영아 산통(생후 2~4주 시작)은 생후 3~6개월에 자연 호전돼요.",
    play: "목젖 모양 보여주기(20~30cm 거리). 부드러운 말소리로 자주 말 걸기. 엎드리기 연습(Tummy time).",
  };
  if (months === 2) return {
    feed: "모유수유 / 분유 100~200ml, 4~10회",
    develop: "처음으로 고개를 조금 가누기 시작해요. 소리에 반응해 고개를 돌리고 미소 짓기 시작해요. 눈으로 사물을 좇을 수 있어요.",
    care: "생후 6~8주 원더윅스(성장 급등기)로 수유량이 급증하거나 보채는 경우가 있어요. 적절한 스킨십(마사지 등)이 아이의 정서 발달과 면역력 강화에 도움이 돼요.",
    play: "다양한 소리 딸랑이 흔들어주기. 거울로 얼굴 보기 놀이. 엎드리기 연습(Tummy time).",
  };
  if (months === 3) return {
    feed: "모유수유 / 분유 100~200ml, 4~10회",
    develop: "발육의 개인차가 두드러지는 시기예요. '아', '우', '에' 등 발성이 시작되고, 컬러 인식이 발달해요. 웃음소리가 풍부해져요.",
    care: "수면 루틴을 점차 만들어가는 시기예요. 컬러 모빌을 흑백+컬러 혼합으로 전환하세요. 선천성 고관절 탈구는 3개월 내 발견이 중요해요.",
    play: "형광·노랑·초록·파랑 색의 모빌 보여주기. 다양한 촉감 장난감 제공하기. 동화책 읽어주기. 엎드리기 연습.",
  };
  if (months === 4) return {
    feed: "모유수유 / 분유 100~200ml, 4~10회",
    develop: "목을 완전히 가눌 수 있고, 물건을 손으로 잡으려 해요. 눈과 손의 협응이 시작되고, 웃음소리가 더 풍부해져요.",
    care: "방중 수유를 줄여나가는 연습을 시작해요. 2차 영유아 건강검진(생후 4~6개월 내)을 받으세요. 수면 교육을 시작할 수 있는 시기예요.",
    play: "다양한 모양과 촉감의 공 제공하기. 아이의 이름을 자주 불러주기. 아이 마사지. 잡기·당기기 연습.",
  };
  if (months === 5) return {
    feed: "모유수유 / 분유 160~200ml, 4~6회",
    develop: "뒤집기를 앞뒤로 시도해요. 거울 속 자신에게 반응하고, 이름에 반응하기 시작해요. 이유식 준비를 시작할 시기예요.",
    care: "낙상·화상·이물질 삼킴 등 안전사고를 예방하세요. 수면퇴행이 나타날 수 있어요. 이유식 준비 (6개월부터 권장).",
    play: "상자와 공을 활용한 대상영속성 놀이. 까꿍 놀이. 다양한 표정과 목소리로 동화책 읽어주기.",
  };
  if (months === 6) return {
    feed: "이유식 시작! 순서: 미음 → 채소 → 단백질. 처음에는 1~2 스푼씩, 거부 시 내일 다시 시도해요.",
    develop: "혼자 앉기를 시작해요. 낯가림이 나타나고 원하는 것을 향해 손을 뻗어요. 음절(바, 마, 다)을 반복해요.",
    care: "6개월부터 방중 수유를 점차 줄이는 것이 좋아요. 이유식을 늦게 시작하면 철분 결핍 위험이 있으니 꼭 이 시기에 시작하세요.",
    play: "이유식 스푼 잡아보기. 까꿍 놀이. 뚜껑 열고 닫기. 다양한 모양 탐색하기.",
  };
  if (months === 7) return {
    feed: "이유식 하루 2회, 1회 70~100ml. 모유/분유 병행. 7개월 재료: 쌀·당근·시금치·달걀 노른자·닭고기·두부 등.",
    develop: "손에 잡고 앉기가 안정적으로 돼요. 언어 민감성이 높아지고 기억력이 활발해져요. 낯선 사람을 경계하기 시작해요.",
    care: "분리불안이 나타나기 시작해요. 이유식 거부 시 다양한 맛·온도·질감을 시도해보세요. 철분 보충(붉은 고기, 닭 가슴살 등)이 필요해요.",
    play: "공 굴리기 놀이. 팝업 장난감. 얼굴 만지기로 신체 언어 익히기. 악기 소리 구분 놀이.",
  };
  if (months === 8) return {
    feed: "이유식 2회, 1회 80~100ml. 중기 이유식으로 재료 다양화. 모유/분유 병행.",
    develop: "배밀이(복부로 이동)가 활발해지고 혼자 앉기가 안정적이에요. 엄지와 검지로 작은 물건을 집으려 시도해요.",
    care: "낯가림이 최고조로 나타날 수 있어요. 안정적 애착 관계가 중요해요. 이동이 활발해지므로 바닥 안전을 확인하세요.",
    play: "숨긴 장난감 찾기 놀이. 손바닥 두드리기(짝짜꿍). 다양한 재질의 공 굴리기.",
  };
  if (months === 9) return {
    feed: "이유식 2~3회, 1회 100~120ml. 핑거푸드(으깬 과일·부드러운 채소) 시도.",
    develop: "잡고 서기를 시도하고, 손가락 집기(pincer grasp)가 발달해요. '맘마', '빠빠' 등 의미 있는 옹알이가 시작돼요.",
    care: "문지방·서랍장·계단 등 안전사고에 주의하세요. 변기 잠금장치와 낮은 가구 모서리를 확인하세요.",
    play: "물건 넣고 빼기 반복. 공 굴리기 주고받기. 그림책 페이지 넘기기.",
  };
  if (months === 10) return {
    feed: "이유식 3회. 잡기 좋은 핑거푸드 조각으로 제공해요.",
    develop: "잡고 서서 이동하기(cruising)를 시작해요. '바이바이' 손인사를 이해하고 간단한 지시를 따라요.",
    care: "분리불안이 강하게 나타날 수 있어요. 간식은 으깬 과일 등 자연식품으로 시작해요.",
    play: "블록 쌓기·무너뜨리기. 손인사 따라하기. 노래에 맞춰 몸 흔들기.",
  };
  if (months === 11) return {
    feed: "이유식 3회 + 간식 1~2회. 연한 밥·무른 반찬으로 유아식 전환 준비.",
    develop: "혼자 서려고 시도해요. 컵으로 물 마시기를 연습하고, 한두 단어를 이해해요.",
    care: "돌 전 꿀은 절대 금지예요. 생우유는 돌 이후부터 시작해요. 돌잔치 준비를 시작해봐요!",
    play: "용기에 장난감 넣고 빼기. 종이 찢기 놀이. 음악에 맞춰 손뼉치기.",
  };
  if (months === 12) return {
    feed: "생우유 400~500ml/일 시작 가능. 세끼 식사 + 간식 2회 패턴으로 전환. 분유 끊기 준비.",
    develop: "혼자 첫 걸음마를 떼는 시기예요! '엄마', '아빠' 등 한두 단어가 시작돼요. 컵 사용을 시도해요.",
    care: "1세 영유아 건강검진을 잊지 마세요. 12~15개월에 이유식→유아식으로 단계적으로 전환해요.",
    play: "공 차기. 블록 쌓기. 모래·물 놀이.",
  };
  if (months <= 14) return {
    feed: "세끼 식사 + 간식 2회. 생우유 400ml/일.",
    develop: "걷기 연습 중이에요. 계단을 기어 오르기 시작하고, 낙서를 즐겨요. 어휘가 10~20개로 늘어나요.",
    care: "위험물은 손 닿지 않는 곳에 보관하세요. 이 닦기 습관을 시작해요.",
    play: "낙서·크레용 놀이. 물 붓기 놀이. 공 주고받기.",
  };
  if (months <= 16) return {
    feed: "세끼 + 간식. 편식이 시작될 수 있어요. 다양한 맛과 질감을 경험시켜 주세요.",
    develop: "걷기가 안정적이에요. 어휘가 5~20개로 늘고, 간단한 지시를 따를 수 있어요.",
    care: "규칙적인 책 읽기 루틴을 시작해보세요. 일관된 수면 루틴이 중요한 시기예요.",
    play: "퍼즐. 블록. 역할놀이(인형에게 밥 먹이기). 공 굴리기.",
  };
  if (months <= 18) return {
    feed: "세끼 + 간식 2회. 생우유 500ml/일 이하.",
    develop: "뛰기를 시도하고 어휘가 20~50개로 늘어요. 두 단어 조합이 시작되는 시기예요.",
    care: "자아가 강해지는 시기예요. 일관된 규칙이 중요하고, 좌절할 때 감정을 인정해주세요.",
    play: "역할놀이 확장. 블록·쌓기 놀이. 모래 놀이. 그림책.",
  };
  if (months <= 20) return {
    feed: "세끼 + 간식. 식사 시간과 규칙을 정해주세요.",
    develop: "뛰기가 가능해요. 두 단어 조합이 활발해지고, 물건의 이름을 가리킬 수 있어요.",
    care: "자기 주장이 강해져요. '이것 vs 저것' 선택권을 주어 자율성을 지원해주세요.",
    play: "인형·자동차 역할놀이. 모래·물 놀이. 그림책. 음악에 맞춰 춤추기.",
  };
  if (months <= 24) return {
    feed: "세끼 식사 + 간식 1~2회. 식사 독립심이 생겨요.",
    develop: "달리기와 점프가 가능해요. 세 단어 이상의 문장을 구사하고 상상 놀이를 시작해요.",
    care: "화장실 훈련을 본격적으로 시작할 수 있어요. 자아존중감을 키워주는 칭찬이 효과적이에요.",
    play: "상상 놀이(소꿉, 의사 놀이). 그림 그리기. 음악 놀이. 블록 구조물.",
  };
  if (months <= 30) return {
    feed: "세끼 + 간식. 다양한 식품군을 균형 있게 제공해요.",
    develop: "계단을 혼자 오르내리고 어휘가 50개 이상으로 늘어요. 친구와 함께 놀이를 즐겨요.",
    care: "또래 관계가 중요해지는 시기예요. 감정 표현을 도와주세요. 규칙적인 야외 활동이 필요해요.",
    play: "역할놀이. 만들기. 퍼즐. 야외 신체 활동.",
  };
  return {
    feed: "세끼 + 간식. 스스로 숟가락·포크를 사용해요. 식사 예절을 가르쳐줄 수 있어요.",
    develop: "세 발 자전거를 타고, 간단한 문장으로 의사소통해요. 상상력이 풍부해지고 역할극을 즐겨요.",
    care: "어린이집·유치원 적응을 준비해요. 독립심을 존중하면서 일관된 규칙을 유지하세요.",
    play: "역할극. 그림 그리기. 블록 구조물. 이야기 만들기.",
  };
}

// ── SVG 차트 상수 ────────────────────────────────────────────
const X_PX = 18;          // 1개월당 픽셀
const CHART_PH = 200;     // 플롯 높이 (고정)
const CHART_PAD = { top: 20, right: 24, bottom: 40, left: 44 };
const CHART_CH = CHART_PH + CHART_PAD.top + CHART_PAD.bottom; // 260px
const CHART_VISIBLE_H = 185; // 스크롤 컨테이너에서 보이는 높이

// 타입별 고정 Y 범위
const TYPE_Y: Record<GrowthType, { min: number; max: number; ticks: number[] }> = {
  weight: { min: 0,  max: 21,  ticks: [3, 6, 9, 12, 15, 18, 21] },
  height: { min: 45, max: 115, ticks: [50, 60, 70, 80, 90, 100, 110] },
  head:   { min: 29, max: 55,  ticks: [32, 36, 40, 44, 48, 52] },
};

interface ChartProps {
  type: GrowthType;
  records: GrowthRecord[];
  xMax: number;   // X축 최대 개월 수 (최소 36, 아이 나이에 따라 확장)
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

function GrowthChart({ type, records, xMax, scrollRef }: ChartProps) {
  const color = TYPE_COLOR[type];
  const ref = WHO[type];
  const yCfg = TYPE_Y[type];

  const PW = xMax * X_PX;
  const PH = CHART_PH;
  const CH = CHART_CH;
  const contentW = PW + CHART_PAD.right;
  const clipId = `chart-clip-${type}`;

  // 콘텐츠 SVG 내부 좌표 (Y축 패널 제외, x=0이 플롯 영역 시작)
  function toX(m: number) { return m * X_PX; }
  function toY(v: number) {
    return CHART_PAD.top + PH * (1 - (v - yCfg.min) / (yCfg.max - yCfg.min));
  }

  const whoMonths = Array.from({ length: 37 }, (_, i) => i);
  function refPts(data: [number, number][]) {
    return whoMonths
      .map(m => `${toX(m)},${toY(interpolate(data, m))}`)
      .join(" ");
  }

  const userPoints = records
    .filter(r => getVal(r, type) !== undefined)
    .sort((a, b) => a.ageMonths - b.ageMonths);

  const userLinePts = userPoints
    .map(r => `${toX(r.ageMonths)},${toY(getVal(r, type)!)}`)
    .join(" ");

  const xTicks = Array.from({ length: Math.floor(xMax / 3) + 1 }, (_, i) => i * 3);

  return (
    <div style={{ display: "flex", alignItems: "stretch" }}>
      {/* ── 고정 Y축 패널 ── */}
      <svg
        width={CHART_PAD.left}
        height={CH}
        style={{ display: "block", flexShrink: 0, backgroundColor: COLOR.bgCard }}
      >
        {/* Y축 단위 */}
        <text x={CHART_PAD.left - 5} y={CHART_PAD.top - 10} textAnchor="end"
          fontSize={8} fill={COLOR.textMuted} fontFamily="sans-serif">
          ({TYPE_UNIT[type]})
        </text>
        {/* Y눈금 라벨 + 가로 그리드 stub */}
        {yCfg.ticks.map(v => (
          <g key={v}>
            <line
              x1={0} y1={toY(v)} x2={CHART_PAD.left} y2={toY(v)}
              stroke={COLOR.borderMid} strokeWidth={0.7} strokeDasharray="4,3"
            />
            <text x={CHART_PAD.left - 5} y={toY(v)} textAnchor="end" dominantBaseline="middle"
              fontSize={8} fill={COLOR.textMuted} fontFamily="sans-serif">
              {v}
            </text>
          </g>
        ))}
        {/* Y축 세로선 */}
        <line
          x1={CHART_PAD.left} y1={CHART_PAD.top}
          x2={CHART_PAD.left} y2={CHART_PAD.top + PH}
          stroke={COLOR.borderMid} strokeWidth={0.8}
        />
      </svg>

      {/* ── 수평 스크롤 콘텐츠 ── */}
      <div
        ref={scrollRef}
        className="chart-scroll"
        style={{ flex: 1, overflowX: "auto", overflowY: "hidden" } as React.CSSProperties}
      >
        <svg width={contentW} height={CH} style={{ display: "block" }}>
          <defs>
            <clipPath id={clipId}>
              <rect x={0} y={CHART_PAD.top} width={PW} height={PH} />
            </clipPath>
          </defs>

          {/* 배경 */}
          <rect x={0} y={CHART_PAD.top} width={PW} height={PH} fill="#fff" rx={4} />

          {/* 가로 점선 그리드 */}
          {yCfg.ticks.map(v => (
            <line key={v}
              x1={0} y1={toY(v)} x2={PW} y2={toY(v)}
              stroke={COLOR.borderMid} strokeWidth={0.7} strokeDasharray="4,3"
            />
          ))}

          {/* 세로 점선 그리드 */}
          {xTicks.map(m => (
            <line key={m}
              x1={toX(m)} y1={CHART_PAD.top} x2={toX(m)} y2={CHART_PAD.top + PH}
              stroke={COLOR.borderMid} strokeWidth={0.7} strokeDasharray="4,3"
            />
          ))}

          {/* 36m 경계선 */}
          {xMax > 36 && (
            <g>
              <line
                x1={toX(36)} y1={CHART_PAD.top} x2={toX(36)} y2={CHART_PAD.top + PH}
                stroke={COLOR.borderInactive} strokeWidth={1} strokeDasharray="5,3"
              />
              <text x={toX(36) + 4} y={CHART_PAD.top + 10}
                fontSize={7} fill={COLOR.textDisabled} fontFamily="sans-serif">
                36m↑
              </text>
            </g>
          )}

          {/* WHO 기준선 (0~36m) */}
          <g clipPath={`url(#${clipId})`}>
            <polyline points={refPts(ref.p10)} fill="none"
              stroke={PCTILE.p10.color} strokeWidth={1.2} strokeDasharray={PCTILE.p10.dash} />
            <polyline points={refPts(ref.p50)} fill="none"
              stroke={PCTILE.p50.color} strokeWidth={1.5} strokeDasharray={PCTILE.p50.dash} />
            <polyline points={refPts(ref.p90)} fill="none"
              stroke={PCTILE.p90.color} strokeWidth={1.2} strokeDasharray={PCTILE.p90.dash} />
          </g>

          {/* 사용자 데이터 */}
          <g clipPath={`url(#${clipId})`}>
            {userPoints.length > 1 && (
              <polyline points={userLinePts} fill="none"
                stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            )}
            {userPoints.map(r => {
              const v = getVal(r, type)!;
              return (
                <circle key={r.id} cx={toX(r.ageMonths)} cy={toY(v)} r={4.5}
                  fill={color} stroke="#fff" strokeWidth={2} />
              );
            })}
          </g>

          {/* X축 */}
          <line
            x1={0} y1={CHART_PAD.top + PH}
            x2={PW} y2={CHART_PAD.top + PH}
            stroke={COLOR.borderMid} strokeWidth={0.8}
          />
          {xTicks.map(m => (
            <g key={m}>
              <line
                x1={toX(m)} y1={CHART_PAD.top + PH}
                x2={toX(m)} y2={CHART_PAD.top + PH + 4}
                stroke={COLOR.borderMid} strokeWidth={0.8}
              />
              <text x={toX(m)} y={CHART_PAD.top + PH + 13} textAnchor="middle"
                fontSize={8} fill={COLOR.textMuted} fontFamily="sans-serif">
                {m}
              </text>
            </g>
          ))}
          {/* (개월) 레이블 */}
          <text x={PW} y={CHART_PAD.top + PH + 26} textAnchor="end"
            fontSize={8} fill={COLOR.textMuted} fontFamily="sans-serif">
            (개월)
          </text>
        </svg>
      </div>
    </div>
  );
}

// ── 범례 ─────────────────────────────────────────────────────
function ChartLegend({ color }: { color: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 4px 0", flexWrap: "wrap", justifyContent: "flex-end",
    }}>
      {/* 기록 범례 */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <div style={{ width: 10, height: 2, backgroundColor: color, borderRadius: 1 }} />
          <div style={{
            width: 6, height: 6, backgroundColor: color, borderRadius: "50%",
            border: "1px solid white", boxShadow: `0 0 0 1px ${color}`,
          }} />
        </div>
        <span style={{ fontSize: 10, color: COLOR.textMuted, fontFamily: FONT.base }}>기록</span>
      </div>

      {/* 백분위 범례 */}
      {([
        { key: "p90", meta: PCTILE.p90 },
        { key: "p50", meta: PCTILE.p50 },
        { key: "p10", meta: PCTILE.p10 },
      ] as const).map(({ key, meta }) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="18" height="10" style={{ flexShrink: 0 }}>
            <line x1="0" y1="5" x2="18" y2="5"
              stroke={meta.color} strokeWidth="1.5" strokeDasharray={meta.dash} />
          </svg>
          <span style={{ fontSize: 10, color: COLOR.textMuted, fontFamily: FONT.base }}>{meta.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── 발달 정보 카드 ────────────────────────────────────────────
function BabyInfoCard({ months }: { months: number }) {
  const info = getBabyInfo(months);

  const sections: { icon: string; title: string; content: string }[] = [
    ...(info.feed ? [{ icon: "🍼", title: "수유 · 이유식 가이드", content: info.feed }] : []),
    { icon: "🌱", title: "발달 포인트", content: info.develop },
    { icon: "💡", title: "육아 팁",     content: info.care },
    { icon: "🎮", title: "놀이 방법",   content: info.play },
  ];

  return (
    <div style={{ backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg, overflow: "hidden" }}>
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: `1px solid ${COLOR.borderLight}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
          지금 이 시기의 아이는
        </span>
        <span style={{ fontSize: 11, color: COLOR.textMuted, letterSpacing: "-0.1px" }}>
          {months}개월 기준
        </span>
      </div>

      {sections.map((s, i) => (
        <div key={i} style={{
          padding: "14px 16px",
          borderBottom: i < sections.length - 1 ? `1px solid ${COLOR.borderLight}` : "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 14 }}>{s.icon}</span>
            <span style={{
              fontSize: 12, fontWeight: 700, color: COLOR.textSecondary,
              letterSpacing: "-0.2px",
            }}>{s.title}</span>
          </div>
          <p style={{
            margin: 0, fontSize: 13, color: COLOR.textPrimary,
            lineHeight: 1.65, letterSpacing: "-0.2px",
          }}>
            {s.content}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export function GrowthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedChild, toggleKdstItem, isKdstChecked, getKdstCheckedAt } = useChild();

  // 세그먼트 뷰: 성장 그래프 / 인칫 포인트
  type GrowthView = "graph" | "inchit";
  const initialView: GrowthView =
    (location.state as { tab?: string })?.tab === "inchit" ? "inchit" : "graph";
  const [growthView, setGrowthView] = useState<GrowthView>(initialView);

  const [activeType, setActiveType] = useState<GrowthType>("weight");
  const [records, setRecords] = useState<GrowthRecord[]>(() => {
    if (SHOW_MOCK) return MOCK_RECORDS;
    return selectedChild ? loadRecords(selectedChild.id) : [];
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  // K-DST 상태 (ChildContext 기반)
  const childId = selectedChild?.id ?? "unknown";
  const [inchitPopup, setInchitPopup] = useState<{ emoji: string; title: string; body: string } | null>(null);
  const kdstGroups = getKdstGroups(selectedChild?.months ?? 19);
  const totalKdst = kdstGroups.reduce((a, g) => a + g.items.length, 0);
  const kdstDone = selectedChild?.kdst.done ?? 0;
  const kdstProgress = totalKdst > 0 ? kdstDone / totalKdst : 0;

  const toggleKdst = async (key: string) => {
    const isAdding = !isKdstChecked(childId, key);
    await toggleKdstItem(childId, key);
    if (isAdding) {
      const newSize = kdstDone + 1;
      const half = Math.ceil(totalKdst / 2);
      if (newSize === 1) {
        setInchitPopup({ emoji: "🌱", title: "첫 인칫 포인트를 기록했어요!", body: `${selectedChild?.name ?? "아이"}의 성장을 함께 기록해요.` });
      } else if (newSize === half) {
        setInchitPopup({ emoji: "🌟", title: "절반을 달성했어요!", body: "꾸준한 관찰이 아이 성장의 가장 큰 힘이에요." });
      } else if (newSize === totalKdst) {
        setInchitPopup({ emoji: "🎉", title: "인칫 포인트 완성!", body: `당신의 사랑과 노력 덕분에\n아이는 오늘도 성장하고 있어요. ✨` });
      }
    }
  };

  const todayDState = (() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  })();
  const [inputDateState, setInputDateState] = useState<DateState>(todayDState);
  const [showDateCal, setShowDateCal] = useState(false);
  const [inputWeight, setInputWeight] = useState("");
  const [inputHeight, setInputHeight] = useState("");
  const [inputHead, setInputHead] = useState("");

  const childMonths = selectedChild?.months ?? 19;
  const color = TYPE_COLOR[activeType];

  // X축 최대 개월: 36 또는 아이 나이+6 중 큰 값 (3의 배수로 올림)
  const xMax = useMemo(() => {
    const raw = Math.max(36, childMonths + 6);
    return Math.ceil(raw / 3) * 3;
  }, [childMonths]);

  // 차트 스크롤 컨테이너 ref
  const chartScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = chartScrollRef.current;
    if (!el) return;
    // 현재 아이 개월 수 위치로 가로 스크롤 (콘텐츠 SVG는 x=0이 0개월 기준)
    const targetX = childMonths * X_PX;
    el.scrollLeft = Math.max(0, targetX - el.clientWidth * 0.65);
  }, [activeType, childMonths]);

  // 탭별 최신 기록값 (탭 칩에 표시)
  function getLatestValue(type: GrowthType): number | undefined {
    const pts = records
      .filter(r => getVal(r, type) !== undefined)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (!pts.length) return undefined;
    return getVal(pts[0], type);
  }

  // 최근 변화 계산
  const recentChange = useMemo(() => {
    const pts = records
      .filter(r => getVal(r, activeType) !== undefined)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (pts.length < 2) return null;

    const last = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const lastVal = getVal(last, activeType)!;
    const prevVal = getVal(prev, activeType)!;
    const diff = +(lastVal - prevVal).toFixed(1);
    const days = Math.round(
      (new Date(last.date).getTime() - new Date(prev.date).getTime()) / 86400000
    );
    return { diff, days };
  }, [records, activeType]);

  // 최근 변화 JSX 렌더
  function renderChangeNode(): React.ReactNode {
    const hasAny = records.some(r => getVal(r, activeType) !== undefined);
    if (!hasAny) return null;
    if (!recentChange) return (
      <span style={{ fontSize: 14, color: COLOR.textSecondary, letterSpacing: "-0.2px" }}>
        첫 기록이에요! 앞으로 꾸준히 기록해봐요. 📈
      </span>
    );
    const { diff, days } = recentChange;
    const unit = TYPE_UNIT[activeType];
    const abs = Math.abs(diff).toFixed(1);
    const up = diff >= 0;
    let verb = "";
    if (activeType === "weight") verb = up ? "늘었어요!" : "줄었어요.";
    else if (activeType === "height") verb = up ? "자랐어요!" : "줄었어요.";
    else verb = up ? "커졌어요!" : "줄었어요.";

    return (
      <span style={{ fontSize: 14, color: COLOR.textSecondary, letterSpacing: "-0.2px", lineHeight: 1.5 }}>
        최근{" "}
        <strong style={{ color, fontWeight: 700 }}>{days}일</strong>
        {" "}동안 {TYPE_LABEL[activeType]}가{" "}
        <strong style={{ color, fontWeight: 700 }}>{abs}{unit}</strong>
        {" "}{verb}
      </span>
    );
  }

  function calcAgeMonths(ds: DateState): number {
    if (!selectedChild) return 0;
    const { year: y, month: m, day: d } = ds;
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

    const dateStr = dStateToDateStr(inputDateState);
    const newRecord: GrowthRecord = {
      id: `g_${Date.now()}`,
      date: dateStr,
      ageMonths: calcAgeMonths(inputDateState),
      ...(w  ? { weight: w }  : {}),
      ...(h  ? { height: h }  : {}),
      ...(hc ? { head: hc }   : {}),
    };

    const updated = [...records, newRecord].sort((a, b) => a.date.localeCompare(b.date));
    setRecords(updated);
    if (selectedChild && !SHOW_MOCK) saveRecords(selectedChild.id, updated);

    setInputWeight(""); setInputHeight(""); setInputHead("");
    setInputDateState(todayDState);
    setShowDateCal(false);
    setSheetOpen(false);
  }

  const hasTypeRecords = records.some(r => getVal(r, activeType) !== undefined);
  const changeNode = renderChangeNode();

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
          backgroundColor: COLOR.bgCard, flexShrink: 0,
          borderBottom: `1px solid ${COLOR.border}`,
        }}>
          <div style={{
            display: "flex", alignItems: "center",
            height: 56, padding: "0 8px 0 4px",
          }}>
            <button onClick={() => navigate(-1)} style={{
              background: "none", border: "none", cursor: "pointer", padding: 11,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <ChevronLeft size={22} color={COLOR.textPrimary} strokeWidth={2} />
            </button>
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "stretch",
              height: "100%",
            }}>
              {(["graph", "inchit"] as GrowthView[]).map(v => {
                const isActive = growthView === v;
                return (
                  <button
                    key={v}
                    onClick={() => setGrowthView(v)}
                    style={{
                      flex: 1,
                      height: "100%",
                      background: "none",
                      border: "none",
                      borderBottom: isActive ? `3px solid ${COLOR.textPrimary}` : "3px solid transparent",
                      cursor: "pointer",
                      fontFamily: FONT.base,
                      fontSize: 16,
                      fontWeight: isActive ? 700 : 600,
                      color: isActive ? COLOR.textPrimary : COLOR.textMuted,
                      letterSpacing: "-0.3px",
                      WebkitTapHighlightColor: "transparent",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {v === "graph" ? "성장 그래프" : "인칫 포인트"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 스크롤 영역 ── */}
        <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 20px 40px" }}>

          {growthView === "graph" && (<>

          {/* 측정 타입 탭 — 최신값 표시형 칩 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(["weight", "height", "head"] as GrowthType[]).map(t => {
              const isActive = activeType === t;
              const latestVal = getLatestValue(t);
              return (
                <button key={t} onClick={() => setActiveType(t)} style={{
                  flex: 1, padding: "10px 4px",
                  borderRadius: RADIUS.md,
                  border: `1.5px solid ${isActive ? TYPE_COLOR[t] : COLOR.border}`,
                  backgroundColor: isActive ? TYPE_COLOR[t] : COLOR.bgCard,
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  transition: "all 0.15s ease",
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700, fontFamily: FONT.base,
                    color: isActive ? "#fff" : TYPE_COLOR[t],
                    letterSpacing: "-0.3px", lineHeight: 1.1,
                  }}>
                    {TYPE_LABEL[t]}
                  </span>
                  <span style={{
                    fontSize: 11, fontFamily: FONT.base,
                    color: isActive ? "rgba(255,255,255,0.85)" : COLOR.textMuted,
                    letterSpacing: "-0.1px",
                  }}>
                    {latestVal !== undefined ? `${latestVal.toFixed(1)} ${TYPE_UNIT[t]}` : "—"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 차트 카드 */}
          <div style={{
            backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg,
            padding: "14px 12px 14px", marginBottom: 12,
            overflow: "hidden",
          }}>
            {!hasTypeRecords ? (
              <div style={{
                height: 140, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <span style={{ fontSize: 32 }}>📏</span>
                <span style={{ fontSize: 13, color: COLOR.textMuted }}>아직 기록이 없어요</span>
              </div>
            ) : (
              <GrowthChart type={activeType} records={records} xMax={xMax} scrollRef={chartScrollRef} />
            )}

            <ChartLegend color={color} />

            {changeNode && (
              <div style={{
                marginTop: 10, padding: "9px 4px 0",
                borderTop: `1px solid ${COLOR.borderLight}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                {changeNode}
                <button onClick={() => setInfoVisible(true)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "0 0 0 10px", flexShrink: 0,
                  display: "flex", alignItems: "center",
                  WebkitTapHighlightColor: "transparent",
                }}>
                  <Info size={16} color={COLOR.textMuted} />
                </button>
              </div>
            )}
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

          {/* 지금 이 시기의 아이는 */}
          <BabyInfoCard months={childMonths} />

          </>)} {/* growthView === "graph" END */}

          {/* ─── 인칫 포인트 탭 ─── */}
          {growthView === "inchit" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* 진행 카드 */}
              <div style={{
                backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg,
                padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 12, color: COLOR.textMuted, display: "block", marginBottom: 2 }}>
                      {(() => { const r = getKdstRange(selectedChild?.months ?? 0); return `${r.start}~${r.end}개월의 인칫 포인트`; })()}
                    </span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: COLOR.textPrimary }}>
                      {kdstDone}
                      <span style={{ fontSize: 14, fontWeight: 400, color: COLOR.textMuted }}> / {totalKdst}</span>
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.textPrimary, marginBottom: 2 }}>
                    {Math.round(kdstProgress * 100)}%
                  </span>
                </div>
                <div style={{ height: 5, backgroundColor: COLOR.bgApp, borderRadius: RADIUS.pill, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${kdstProgress * 100}%`,
                    backgroundColor: COLOR.textPrimary, borderRadius: RADIUS.pill,
                    transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
                  }} />
                </div>
                {kdstDone === totalKdst && totalKdst > 0 && (
                  <span style={{
                    fontSize: 11,
                    color: COLOR.success,
                    marginTop: 7, display: "block",
                    fontWeight: 700,
                  }}>
                    🎉 이번 인칫 포인트를 모두 완료했어요!
                  </span>
                )}
              </div>

              {kdstGroups.map(group => (
                <KdstDomainCard
                  key={group.domain}
                  group={group}
                  checkedItems={new Set(group.items.map(item => `${group.domain}::${item}`).filter(key => isKdstChecked(childId, key)))}
                  onToggle={toggleKdst}
                  getCheckedAt={(key) => getKdstCheckedAt(childId, key)}
                  dob={selectedChild?.dob}
                />
              ))}

              <div style={{ padding: "4px 0 8px" }}>
                <span style={{ fontSize: 11, color: COLOR.textDisabled, lineHeight: "17px", display: "block" }}>
                  본 체크리스트는 K-DST 기준 참고용이며, 진단을 대체하지 않습니다. 발달에는 개인차가 있습니다.
                </span>
              </div>
            </div>
          )}

        </div>

        {/* ── 기록 추가 바텀 시트 ── */}
        {sheetOpen && (
          <>
            <div onClick={() => { setSheetOpen(false); setShowDateCal(false); }} style={{
              position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 40,
            }} />
            <div style={{
              position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
              width: "100%", maxWidth: 390, backgroundColor: COLOR.bgCard,
              borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`,
              zIndex: 50, boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
              overflowY: "auto", maxHeight: "90dvh",
            }}>
              <div style={{ padding: "20px 24px 40px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: COLOR.border, margin: "0 auto 20px" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
                    성장 기록 추가
                  </span>
                  <button onClick={() => { setSheetOpen(false); setShowDateCal(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <X size={20} color={COLOR.textMuted} />
                  </button>
                </div>

                {/* 날짜 — InlineCalendar 패턴 */}
                <div style={{
                  backgroundColor: COLOR.bgCard,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${COLOR.borderLight}`,
                  marginBottom: 16, overflow: "hidden",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px",
                  }}>
                    <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>측정일</span>
                    <DateTimeChip
                      label={dStateToLabel(inputDateState)}
                      isActive={showDateCal}
                      onClick={() => setShowDateCal(s => !s)}
                    />
                  </div>
                  {showDateCal && (
                    <>
                      <div style={{ height: 1, backgroundColor: COLOR.borderLight }} />
                      <InlineCalendar
                        selected={inputDateState}
                        onChange={d => { setInputDateState(d); setShowDateCal(false); }}
                      />
                    </>
                  )}
                </div>

                {/* 측정값 3개 */}
                <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                  {([
                    { type: "weight" as GrowthType, label: "몸무게", unit: "kg",  val: inputWeight, set: setInputWeight },
                    { type: "height" as GrowthType, label: "키",      unit: "cm",  val: inputHeight, set: setInputHeight },
                    { type: "head"   as GrowthType, label: "머리둘레", unit: "cm", val: inputHead,   set: setInputHead   },
                  ]).map(({ type, label, unit, val, set }) => (
                    <div key={type} style={{ flex: 1 }}>
                      <label style={{
                        fontSize: 11, fontWeight: 600, color: TYPE_COLOR[type],
                        display: "block", marginBottom: 6, letterSpacing: "-0.1px",
                      }}>
                        {label}
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="number" inputMode="decimal" step="0.1"
                          value={val} onChange={e => set(e.target.value)}
                          placeholder="0.0"
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

                <button onClick={handleSave} style={{
                  width: "100%", height: 52, borderRadius: RADIUS.md,
                  backgroundColor: COLOR.textPrimary, border: "none", cursor: "pointer",
                  fontFamily: FONT.base, fontSize: 16, fontWeight: 700, color: "#fff",
                  letterSpacing: "-0.3px", WebkitTapHighlightColor: "transparent",
                }}>
                  저장
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── 백분위 안내 모달 ── */}
        {infoVisible && (
          <>
            <div onClick={() => setInfoVisible(false)} style={{
              position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 40,
            }} />
            <div style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(320px, 88vw)",
              backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg,
              padding: "24px", zIndex: 50,
              boxShadow: "0 4px 40px rgba(0,0,0,0.15)",
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 14,
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
                  백분위 기준선 안내
                </span>
                <button onClick={() => setInfoVisible(false)} style={{
                  background: "none", border: "none", cursor: "pointer", padding: "0 0 0 8px",
                }}>
                  <X size={18} color={COLOR.textMuted} />
                </button>
              </div>
              <p style={{
                margin: 0, fontSize: 13, color: COLOR.textPrimary,
                lineHeight: 1.7, letterSpacing: "-0.2px",
              }}>
                백분위 기준선은 WHO Growth Standard, 2017 소아청소년 성장도표를 참고하였습니다. 정확한 성장 평가는 소아과 전문의와 상담하세요.
                <br /><br />
                수치는 참고일 뿐이에요. 
                <br />
                중요한 건 우리 아이의 꾸준한 성장입니다.
              </p>
            </div>
          </>
        )}

        {/* ── 인칫 포인트 달성 팝업 ── */}
        {inchitPopup && (
          <>
            <div onClick={() => setInchitPopup(null)} style={{
              position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 80,
            }} />
            <div style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: COLOR.bgCard, borderRadius: RADIUS.xl,
              padding: "32px 28px 24px", zIndex: 90, width: 300,
              textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{inchitPopup.emoji}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLOR.textPrimary, marginBottom: 8, letterSpacing: "-0.3px" }}>
                {inchitPopup.title}
              </div>
              <div style={{ fontSize: 13, color: COLOR.textSecondary, lineHeight: 1.6, marginBottom: 20, whiteSpace: "pre-line" }}>
                {inchitPopup.body}
              </div>
              <button onClick={() => setInchitPopup(null)} style={{
                width: "100%", height: 44, borderRadius: RADIUS.pill,
                backgroundColor: COLOR.textPrimary, border: "none",
                fontFamily: FONT.base, fontSize: 14, fontWeight: 700,
                color: "#fff", cursor: "pointer", letterSpacing: "-0.2px",
                WebkitTapHighlightColor: "transparent",
              }}>
                확인
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
