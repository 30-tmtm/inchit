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

// ?? ?좎쭨 ?ы띁 (EventDetailModal ?⑦꽩 ?듭씪) ????????????????????
type DateState = { year: number; month: number; day: number };
const DOW_KR = ["??, "??, "??, "??, "紐?, "湲?, "??];

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

// ?? InlineCalendar (EventDetailModal ?⑦꽩 怨듭쑀) ???????????????
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
          {cy}??{cm}??
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
        {["??, "??, "??, "??, "紐?, "湲?, "??].map((d, i) => (
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

// ?? DateTimeChip ??????????????????????????????????????????????
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


// ChildProvider 諛뽰뿉 ?덉쑝誘濡?localStorage?먯꽌 吏곸젒 ?쎄린
// getActiveChild ??useChild()濡??泥대맖 (?섎떒 而댄룷?뚰듃?먯꽌 ?ъ슜)

// 媛쒕컻 誘몃━蹂닿린 ?뚮옒洹?(true: ?섑뵆 ?곗씠?? false: ???곗씠??
const SHOW_MOCK = false;

// ?? ????뺤쓽 ???????????????????????????????????????????????
type GrowthType = "weight" | "height" | "head";

type GrowthRecord = {
  id: string;
  date: string;       // "YYYY-MM-DD"
  ageMonths: number;
  weight?: number;
  height?: number;
  head?: number;
};

// ?? 痢≪젙 ??낅퀎 ?곸닔 ?????????????????????????????????????????
const TYPE_COLOR: Record<GrowthType, string> = {
  weight: "#EA7D70",
  height: "#7D8BE0",
  head:   "#BCC07B",
};

const TYPE_LABEL: Record<GrowthType, string> = {
  weight: "紐몃Т寃?,
  height: "??,
  head:   "癒몃━?섎젅",
};

const TYPE_UNIT: Record<GrowthType, string> = {
  weight: "kg",
  height: "cm",
  head:   "cm",
};

// 諛깅텇??湲곗????됱긽 (?먯꽑 援щ퀎)
const PCTILE = {
  p10: { color: "#B0B8C1", label: "10%",     dash: "2,4"  as string },
  p50: { color: "#F6C933", label: "50% ?됯퇏", dash: "8,4"  as string },
  p90: { color: "#E05252", label: "90%",      dash: "5,3"  as string },
};

// ?? WHO ?깆옣 湲곗?移?(李멸퀬?? ?⑥븘 湲곗? 洹쇱궗移? ?????????????????
// 異쒖쿂: WHO Growth Standards 쨌 2017 ?뚯븘泥?냼???깆옣?꾪몴 (李멸퀬 紐⑹쟻)
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

// ?좏삎 蹂닿컙
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

// ?? K-DST 媛쒖썡 援щ텇 (DB ?뚯씪 湲곗?) ??????????????????????????????
// 4~5, 6~7, 8~9, 10~11, 12~13, 14~15, 16~17, 18~19, 20~21, 22~23,
// 24~26, 27~29, 30~32, 33~35, 36~41, 42~47, 48~53, 54~59, 60~65, 66~71
// KDST_RANGES, KDST_ITEMS, KdstRangeKey, getKdstRange ??src/app/data/kdst.ts ?먯꽌 import

// ?? K-DST ?몄무 ?ъ씤????ぉ ?곗씠??(20媛??곕졊 洹몃９) ???????????????
// 5媛??곸뿭(?洹쇱쑁쨌?뚭렐?≤룹뼵?는룹씤吏쨌?ы쉶?? 횞 4??ぉ 援ъ꽦
// 諛쒕떖 湲곗?? K-DST 泥닿퀎瑜?湲곕컲?쇰줈, 遺紐④? ?쇱긽?먯꽌 ?먯뿰?ㅻ읇寃?
// 愿李고븷 ???덈룄濡?移쒓렐?섍퀬 媛먯꽦?곸씤 ?쒗쁽?쇰줈 ?ш뎄?깊뻽?듬땲??

const KDST_DOMAINS = [
  { domain: "?洹쇱쑁 ?대룞", icon: Activity,      color: "#4A90D9" },
  { domain: "?뚭렐???대룞", icon: Hand,          color: "#7B68EE" },
  { domain: "?몄뼱",       icon: MessageCircle,  color: "#20B2AA" },
  { domain: "?몄?",       icon: Brain,          color: "#DA70D6" },
  { domain: "?ы쉶??,     icon: Users,          color: "#FF8C69" },
] as const;

// KdstRangeKey, KDST_ITEMS ??src/app/data/kdst.ts ?먯꽌 import??

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

// K-DST 泥댄겕 ?꾩씠??
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
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{
          fontFamily: FONT.base, fontSize: 14,
          fontWeight: checked ? 400 : 500,
          color: checked ? COLOR.textMuted : COLOR.textPrimary,
          textDecoration: checked ? "line-through" : "none",
          letterSpacing: "-0.2px",
        }}>
          {label}
        </span>
        {ageLabel && (
          <span style={{
            fontSize: 11, fontWeight: 500,
            color: COLOR.textMuted,
            letterSpacing: "-0.1px", flexShrink: 0,
          }}>
            {ageLabel}
          </span>
        )}
      </div>
    </button>
  );
}

// K-DST ?꾨찓??移대뱶
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

// ?? ?꾩씠 ?쒓린蹂?諛쒕떖 ?뺣낫 (Baby Calendar DB 湲곕컲) ?????????????
interface BabyInfo {
  feed?: string;
  develop: string;
  care: string;
  play: string;
}

function getBabyInfo(months: number): BabyInfo {
  if (months <= 0) return {
    develop: "?좎깮?꾨뒗 ?섎（ ?遺遺꾩쓣 ?먮㈃??蹂대궡?? ?뚮━? 鍮쏆뿉 諛섏쓳?섍퀬, ?꾨쭏 紐⑹냼由щ? ?몄떇?댁슂.",
    care: "?섏쑀??諛곌퀬???좏샇(鍮④린, ?멸린 ????留욎떠 8~12??沅뚯옣?댁슂. ?ㅻ궡 ?⑤룄 22~23째C, ?듬룄 50~60%瑜??좎??섏꽭??",
    play: "20~30cm 嫄곕━?먯꽌 紐⑹젚 紐⑥뼇 蹂댁뿬二쇨린. 遺?쒕윭??留먯냼由щ줈 ?먯＜ 留?嫄멸린.",
  };
  if (months === 1) return {
    feed: "紐⑥쑀?섏쑀 8~12??/ 遺꾩쑀 50~100ml, 8~12??,
    develop: "?붾떎由щ? ?먯＜ 援щ?由щŉ 洹쇱쑁??諛쒕떖?댁슂. 紐⑹? ?꾩쭅 媛?????놁뼱?? ?뚮━? 鍮쏆뿉 諛섏쓳?섍퀬 ?꾨쭏 紐⑹냼由щ? 援щ퀎?댁슂.",
    care: "紐⑹쓣 ??諛⑺뼢?쇰줈留?湲곗슱?닿굅??癒몃━媛 ?쒖そ?쇰줈 湲곗슱硫??꾨Ц媛 ?곷떞???꾩슂?댁슂. ?곸븘 ?고넻(?앺썑 2~4二??쒖옉)? ?앺썑 3~6媛쒖썡???먯뿰 ?몄쟾?쇱슂.",
    play: "紐⑹젚 紐⑥뼇 蹂댁뿬二쇨린(20~30cm 嫄곕━). 遺?쒕윭??留먯냼由щ줈 ?먯＜ 留?嫄멸린. ?롫뱶由ш린 ?곗뒿(Tummy time).",
  };
  if (months === 2) return {
    feed: "紐⑥쑀?섏쑀 / 遺꾩쑀 100~200ml, 4~10??,
    develop: "泥섏쓬?쇰줈 怨좉컻瑜?議곌툑 媛?꾧린 ?쒖옉?댁슂. ?뚮━??諛섏쓳??怨좉컻瑜??뚮━怨?誘몄냼 吏볤린 ?쒖옉?댁슂. ?덉쑝濡??щЪ??醫뉗쓣 ???덉뼱??",
    care: "?앺썑 6~8二??먮뜑?낆뒪(?깆옣 湲됰벑湲?濡??섏쑀?됱씠 湲됱쬆?섍굅??蹂댁콈??寃쎌슦媛 ?덉뼱?? ?곸젅???ㅽ궓??留덉궗吏 ?????꾩씠???뺤꽌 諛쒕떖怨?硫댁뿭??媛뺥솕???꾩????쇱슂.",
    play: "?ㅼ뼇???뚮━ ?몃옉???붾뱾?댁＜湲? 嫄곗슱濡??쇨뎬 蹂닿린 ??? ?롫뱶由ш린 ?곗뒿(Tummy time).",
  };
  if (months === 3) return {
    feed: "紐⑥쑀?섏쑀 / 遺꾩쑀 100~200ml, 4~10??,
    develop: "諛쒖쑁??媛쒖씤李④? ?먮뱶?ъ????쒓린?덉슂. '??, '??, '?? ??諛쒖꽦???쒖옉?섍퀬, 而щ윭 ?몄떇??諛쒕떖?댁슂. ?껋쓬?뚮━媛 ?띾??댁졇??",
    care: "?섎㈃ 猷⑦떞???먯감 留뚮뱾?닿????쒓린?덉슂. 而щ윭 紐⑤퉴???묐갚+而щ윭 ?쇳빀?쇰줈 ?꾪솚?섏꽭?? ?좎쿇??怨좉????덇뎄??3媛쒖썡 ??諛쒓껄??以묒슂?댁슂.",
    play: "?뺢킅쨌?몃옉쨌珥덈줉쨌?뚮옉 ?됱쓽 紐⑤퉴 蹂댁뿬二쇨린. ?ㅼ뼇??珥됯컧 ?λ궃媛??쒓났?섍린. ?숉솕梨??쎌뼱二쇨린. ?롫뱶由ш린 ?곗뒿.",
  };
  if (months === 4) return {
    feed: "紐⑥쑀?섏쑀 / 遺꾩쑀 100~200ml, 4~10??,
    develop: "紐⑹쓣 ?꾩쟾??媛?????덇퀬, 臾쇨굔???먯쑝濡??≪쑝???댁슂. ?덇낵 ?먯쓽 ?묒쓳???쒖옉?섍퀬, ?껋쓬?뚮━媛 ???띾??댁졇??",
    care: "諛⑹쨷 ?섏쑀瑜?以꾩뿬?섍????곗뒿???쒖옉?댁슂. 2李??곸쑀??嫄닿컯寃吏??앺썑 4~6媛쒖썡 ????諛쏆쑝?몄슂. ?섎㈃ 援먯쑁???쒖옉?????덈뒗 ?쒓린?덉슂.",
    play: "?ㅼ뼇??紐⑥뼇怨?珥됯컧??怨??쒓났?섍린. ?꾩씠???대쫫???먯＜ 遺덈윭二쇨린. ?꾩씠 留덉궗吏. ?↔린쨌?밴린湲??곗뒿.",
  };
  if (months === 5) return {
    feed: "紐⑥쑀?섏쑀 / 遺꾩쑀 160~200ml, 4~6??,
    develop: "?ㅼ쭛湲곕? ?욌뮘濡??쒕룄?댁슂. 嫄곗슱 ???먯떊?먭쾶 諛섏쓳?섍퀬, ?대쫫??諛섏쓳?섍린 ?쒖옉?댁슂. ?댁쑀??以鍮꾨? ?쒖옉???쒓린?덉슂.",
    care: "?숈긽쨌?붿긽쨌?대Ъ吏??쇳궡 ???덉쟾?ш퀬瑜??덈갑?섏꽭?? ?섎㈃?댄뻾???섑??????덉뼱?? ?댁쑀??以鍮?(6媛쒖썡遺??沅뚯옣).",
    play: "?곸옄? 怨듭쓣 ?쒖슜????곸쁺?띿꽦 ??? 源뚭퓤 ??? ?ㅼ뼇???쒖젙怨?紐⑹냼由щ줈 ?숉솕梨??쎌뼱二쇨린.",
  };
  if (months === 6) return {
    feed: "?댁쑀???쒖옉! ?쒖꽌: 誘몄쓬 ??梨꾩냼 ???⑤갚吏? 泥섏쓬?먮뒗 1~2 ?ㅽ뫜?? 嫄곕? ???댁씪 ?ㅼ떆 ?쒕룄?댁슂.",
    develop: "?쇱옄 ?됯린瑜??쒖옉?댁슂. ???由쇱씠 ?섑??섍퀬 ?먰븯??寃껋쓣 ?ν빐 ?먯쓣 六쀬뼱?? ?뚯젅(諛? 留? ????諛섎났?댁슂.",
    care: "6媛쒖썡遺??諛⑹쨷 ?섏쑀瑜??먯감 以꾩씠??寃껋씠 醫뗭븘?? ?댁쑀?앹쓣 ??쾶 ?쒖옉?섎㈃ 泥좊텇 寃고븤 ?꾪뿕???덉쑝??瑗????쒓린???쒖옉?섏꽭??",
    play: "?댁쑀???ㅽ뫜 ?≪븘蹂닿린. 源뚭퓤 ??? ?쒓퍚 ?닿퀬 ?リ린. ?ㅼ뼇??紐⑥뼇 ?먯깋?섍린.",
  };
  if (months === 7) return {
    feed: "?댁쑀???섎（ 2?? 1??70~100ml. 紐⑥쑀/遺꾩쑀 蹂묓뻾. 7媛쒖썡 ?щ즺: ?쨌?밴렐쨌?쒓툑移샕룸떖嫄 ?몃Ⅸ?먃룸떗怨좉린쨌?먮? ??",
    develop: "?먯뿉 ?↔퀬 ?됯린媛 ?덉젙?곸쑝濡??쇱슂. ?몄뼱 誘쇨컧?깆씠 ?믪븘吏怨?湲곗뼲?μ씠 ?쒕컻?댁졇?? ??꽑 ?щ엺??寃쎄퀎?섍린 ?쒖옉?댁슂.",
    care: "遺꾨━遺덉븞???섑??섍린 ?쒖옉?댁슂. ?댁쑀??嫄곕? ???ㅼ뼇??留쎛룹삩?꽷룹쭏媛먯쓣 ?쒕룄?대낫?몄슂. 泥좊텇 蹂댁땐(遺됱? 怨좉린, ??媛?댁궡 ?????꾩슂?댁슂.",
    play: "怨?援대━湲???? ?앹뾽 ?λ궃媛? ?쇨뎬 留뚯?湲곕줈 ?좎껜 ?몄뼱 ?듯엳湲? ?낃린 ?뚮━ 援щ텇 ???",
  };
  if (months === 8) return {
    feed: "?댁쑀??2?? 1??80~100ml. 以묎린 ?댁쑀?앹쑝濡??щ즺 ?ㅼ뼇?? 紐⑥쑀/遺꾩쑀 蹂묓뻾.",
    develop: "諛곕???蹂듬?濡??대룞)媛 ?쒕컻?댁?怨??쇱옄 ?됯린媛 ?덉젙?곸씠?먯슂. ?꾩?? 寃吏濡??묒? 臾쇨굔??吏묒쑝???쒕룄?댁슂.",
    care: "???由쇱씠 理쒓퀬議곕줈 ?섑??????덉뼱?? ?덉젙???좎갑 愿怨꾧? 以묒슂?댁슂. ?대룞???쒕컻?댁?誘濡?諛붾떏 ?덉쟾???뺤씤?섏꽭??",
    play: "?④릿 ?λ궃媛?李얘린 ??? ?먮컮???먮뱶由ш린(吏앹쭨轅?. ?ㅼ뼇???ъ쭏??怨?援대━湲?",
  };
  if (months === 9) return {
    feed: "?댁쑀??2~3?? 1??100~120ml. ?묎굅?몃뱶(?쇨묵 怨쇱씪쨌遺?쒕윭??梨꾩냼) ?쒕룄.",
    develop: "?↔퀬 ?쒓린瑜??쒕룄?섍퀬, ?먭???吏묎린(pincer grasp)媛 諛쒕떖?댁슂. '留섎쭏', '鍮좊튌' ???섎? ?덈뒗 ?뱀븣?닿? ?쒖옉?쇱슂.",
    care: "臾몄?諛㈑룹꽌?띿옣쨌怨꾨떒 ???덉쟾?ш퀬??二쇱쓽?섏꽭?? 蹂湲??좉툑?μ튂? ??? 媛援?紐⑥꽌由щ? ?뺤씤?섏꽭??",
    play: "臾쇨굔 ?ｊ퀬 鍮쇨린 諛섎났. 怨?援대━湲?二쇨퀬諛쏄린. 洹몃┝梨??섏씠吏 ?섍린湲?",
  };
  if (months === 10) return {
    feed: "?댁쑀??3?? ?↔린 醫뗭? ?묎굅?몃뱶 議곌컖?쇰줈 ?쒓났?댁슂.",
    develop: "?↔퀬 ?쒖꽌 ?대룞?섍린(cruising)瑜??쒖옉?댁슂. '諛붿씠諛붿씠' ?먯씤?щ? ?댄빐?섍퀬 媛꾨떒??吏?쒕? ?곕씪??",
    care: "遺꾨━遺덉븞??媛뺥븯寃??섑??????덉뼱?? 媛꾩떇? ?쇨묵 怨쇱씪 ???먯뿰?앺뭹?쇰줈 ?쒖옉?댁슂.",
    play: "釉붾줉 ?볤린쨌臾대꼫?⑤━湲? ?먯씤???곕씪?섍린. ?몃옒??留욎떠 紐??붾뱾湲?",
  };
  if (months === 11) return {
    feed: "?댁쑀??3??+ 媛꾩떇 1~2?? ?고븳 諛Β룸Т瑜?諛섏갔?쇰줈 ?좎븘???꾪솚 以鍮?",
    develop: "?쇱옄 ?쒕젮怨??쒕룄?댁슂. 而듭쑝濡?臾?留덉떆湲곕? ?곗뒿?섍퀬, ?쒕몢 ?⑥뼱瑜??댄빐?댁슂.",
    care: "????轅? ?덈? 湲덉??덉슂. ?앹슦?좊뒗 ???댄썑遺???쒖옉?댁슂. ?뚯옍移?以鍮꾨? ?쒖옉?대킄??",
    play: "?⑷린???λ궃媛??ｊ퀬 鍮쇨린. 醫낆씠 李?린 ??? ?뚯븙??留욎떠 ?먮펹移섍린.",
  };
  if (months === 12) return {
    feed: "?앹슦??400~500ml/???쒖옉 媛?? ?몃겮 ?앹궗 + 媛꾩떇 2???⑦꽩?쇰줈 ?꾪솚. 遺꾩쑀 ?딄린 以鍮?",
    develop: "?쇱옄 泥?嫄몄쓬留덈? ?쇰뒗 ?쒓린?덉슂! '?꾨쭏', '?꾨튌' ???쒕몢 ?⑥뼱媛 ?쒖옉?쇱슂. 而??ъ슜???쒕룄?댁슂.",
    care: "1???곸쑀??嫄닿컯寃吏꾩쓣 ?딆? 留덉꽭?? 12~15媛쒖썡???댁쑀?앪넂?좎븘?앹쑝濡??④퀎?곸쑝濡??꾪솚?댁슂.",
    play: "怨?李④린. 釉붾줉 ?볤린. 紐⑤옒쨌臾????",
  };
  if (months <= 14) return {
    feed: "?몃겮 ?앹궗 + 媛꾩떇 2?? ?앹슦??400ml/??",
    develop: "嫄룰린 ?곗뒿 以묒씠?먯슂. 怨꾨떒??湲곗뼱 ?ㅻⅤ湲??쒖옉?섍퀬, ?숈꽌瑜?利먭꺼?? ?댄쐶媛 10~20媛쒕줈 ?섏뼱?섏슂.",
    care: "?꾪뿕臾쇱? ???우? ?딅뒗 怨녹뿉 蹂닿??섏꽭?? ????린 ?듦????쒖옉?댁슂.",
    play: "?숈꽌쨌?щ젅????? 臾?遺볤린 ??? 怨?二쇨퀬諛쏄린.",
  };
  if (months <= 16) return {
    feed: "?몃겮 + 媛꾩떇. ?몄떇???쒖옉?????덉뼱?? ?ㅼ뼇??留쏄낵 吏덇컧??寃쏀뿕?쒖폒 二쇱꽭??",
    develop: "嫄룰린媛 ?덉젙?곸씠?먯슂. ?댄쐶媛 5~20媛쒕줈 ?섍퀬, 媛꾨떒??吏?쒕? ?곕? ???덉뼱??",
    care: "洹쒖튃?곸씤 梨??쎄린 猷⑦떞???쒖옉?대낫?몄슂. ?쇨????섎㈃ 猷⑦떞??以묒슂???쒓린?덉슂.",
    play: "?쇱쫹. 釉붾줉. ??븷????명삎?먭쾶 諛?癒뱀씠湲?. 怨?援대━湲?",
  };
  if (months <= 18) return {
    feed: "?몃겮 + 媛꾩떇 2?? ?앹슦??500ml/???댄븯.",
    develop: "?곌린瑜??쒕룄?섍퀬 ?댄쐶媛 20~50媛쒕줈 ?섏뼱?? ???⑥뼱 議고빀???쒖옉?섎뒗 ?쒓린?덉슂.",
    care: "?먯븘媛 媛뺥빐吏???쒓린?덉슂. ?쇨???洹쒖튃??以묒슂?섍퀬, 醫뚯젅????媛먯젙???몄젙?댁＜?몄슂.",
    play: "??븷????뺤옣. 釉붾줉쨌?볤린 ??? 紐⑤옒 ??? 洹몃┝梨?",
  };
  if (months <= 20) return {
    feed: "?몃겮 + 媛꾩떇. ?앹궗 ?쒓컙怨?洹쒖튃???뺥빐二쇱꽭??",
    develop: "?곌린媛 媛?ν빐?? ???⑥뼱 議고빀???쒕컻?댁?怨? 臾쇨굔???대쫫??媛由ы궗 ???덉뼱??",
    care: "?먭린 二쇱옣??媛뺥빐?몄슂. '?닿쾬 vs ?寃? ?좏깮沅뚯쓣 二쇱뼱 ?먯쑉?깆쓣 吏?먰빐二쇱꽭??",
    play: "?명삎쨌?먮룞李???븷??? 紐⑤옒쨌臾???? 洹몃┝梨? ?뚯븙??留욎떠 異ㅼ텛湲?",
  };
  if (months <= 24) return {
    feed: "?몃겮 ?앹궗 + 媛꾩떇 1~2?? ?앹궗 ?낅┰?ъ씠 ?앷꺼??",
    develop: "?щ━湲곗? ?먰봽媛 媛?ν빐?? ???⑥뼱 ?댁긽??臾몄옣??援ъ궗?섍퀬 ?곸긽 ??대? ?쒖옉?댁슂.",
    care: "?붿옣???덈젴??蹂멸꺽?곸쑝濡??쒖옉?????덉뼱?? ?먯븘議댁쨷媛먯쓣 ?ㅼ썙二쇰뒗 移?갔???④낵?곸씠?먯슂.",
    play: "?곸긽 ????뚭퓠, ?섏궗 ???. 洹몃┝ 洹몃━湲? ?뚯븙 ??? 釉붾줉 援ъ“臾?",
  };
  if (months <= 30) return {
    feed: "?몃겮 + 媛꾩떇. ?ㅼ뼇???앺뭹援곗쓣 洹좏삎 ?덇쾶 ?쒓났?댁슂.",
    develop: "怨꾨떒???쇱옄 ?ㅻⅤ?대━怨??댄쐶媛 50媛??댁긽?쇰줈 ?섏뼱?? 移쒓뎄? ?④퍡 ??대? 利먭꺼??",
    care: "?먮옒 愿怨꾧? 以묒슂?댁????쒓린?덉슂. 媛먯젙 ?쒗쁽???꾩?二쇱꽭?? 洹쒖튃?곸씤 ?쇱쇅 ?쒕룞???꾩슂?댁슂.",
    play: "??븷??? 留뚮뱾湲? ?쇱쫹. ?쇱쇅 ?좎껜 ?쒕룞.",
  };
  return {
    feed: "?몃겮 + 媛꾩떇. ?ㅼ뒪濡??잕??승룻룷?щ? ?ъ슜?댁슂. ?앹궗 ?덉젅??媛瑜댁퀜以????덉뼱??",
    develop: "??諛??먯쟾嫄곕? ?怨? 媛꾨떒??臾몄옣?쇰줈 ?섏궗?뚰넻?댁슂. ?곸긽?μ씠 ?띾??댁?怨???븷洹뱀쓣 利먭꺼??",
    care: "?대┛?댁쭛쨌?좎튂???곸쓳??以鍮꾪빐?? ?낅┰?ъ쓣 議댁쨷?섎㈃???쇨???洹쒖튃???좎??섏꽭??",
    play: "??븷洹? 洹몃┝ 洹몃━湲? 釉붾줉 援ъ“臾? ?댁빞湲?留뚮뱾湲?",
  };
}

// ?? SVG 李⑦듃 ?곸닔 ????????????????????????????????????????????
const X_PX = 18;          // 1媛쒖썡???쎌?
const CHART_PH = 200;     // ?뚮’ ?믪씠 (怨좎젙)
const CHART_PAD = { top: 20, right: 24, bottom: 40, left: 44 };
const CHART_CH = CHART_PH + CHART_PAD.top + CHART_PAD.bottom; // 260px
const CHART_VISIBLE_H = 185; // ?ㅽ겕濡?而⑦뀒?대꼫?먯꽌 蹂댁씠???믪씠

// ??낅퀎 怨좎젙 Y 踰붿쐞
const TYPE_Y: Record<GrowthType, { min: number; max: number; ticks: number[] }> = {
  weight: { min: 0,  max: 21,  ticks: [3, 6, 9, 12, 15, 18, 21] },
  height: { min: 45, max: 115, ticks: [50, 60, 70, 80, 90, 100, 110] },
  head:   { min: 29, max: 55,  ticks: [32, 36, 40, 44, 48, 52] },
};

interface ChartProps {
  type: GrowthType;
  records: GrowthRecord[];
  xMax: number;   // X異?理쒕? 媛쒖썡 ??(理쒖냼 36, ?꾩씠 ?섏씠???곕씪 ?뺤옣)
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

  // 肄섑뀗痢?SVG ?대? 醫뚰몴 (Y異??⑤꼸 ?쒖쇅, x=0???뚮’ ?곸뿭 ?쒖옉)
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
      {/* ?? 怨좎젙 Y異??⑤꼸 ?? */}
      <svg
        width={CHART_PAD.left}
        height={CH}
        style={{ display: "block", flexShrink: 0, backgroundColor: COLOR.bgCard }}
      >
        {/* Y異??⑥쐞 */}
        <text x={CHART_PAD.left - 5} y={CHART_PAD.top - 10} textAnchor="end"
          fontSize={8} fill={COLOR.textMuted} fontFamily="Pretendard Variable, Pretendard, sans-serif">
          ({TYPE_UNIT[type]})
        </text>
        {/* Y?덇툑 ?쇰꺼 + 媛濡?洹몃━??stub */}
        {yCfg.ticks.map(v => (
          <g key={v}>
            <line
              x1={0} y1={toY(v)} x2={CHART_PAD.left} y2={toY(v)}
              stroke={COLOR.borderMid} strokeWidth={0.7} strokeDasharray="4,3"
            />
            <text x={CHART_PAD.left - 5} y={toY(v)} textAnchor="end" dominantBaseline="middle"
              fontSize={8} fill={COLOR.textMuted} fontFamily="Pretendard Variable, Pretendard, sans-serif">
              {v}
            </text>
          </g>
        ))}
        {/* Y異??몃줈??*/}
        <line
          x1={CHART_PAD.left} y1={CHART_PAD.top}
          x2={CHART_PAD.left} y2={CHART_PAD.top + PH}
          stroke={COLOR.borderMid} strokeWidth={0.8}
        />
      </svg>

      {/* ?? ?섑룊 ?ㅽ겕濡?肄섑뀗痢??? */}
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

          {/* 諛곌꼍 */}
          <rect x={0} y={CHART_PAD.top} width={PW} height={PH} fill="#fff" rx={4} />

          {/* 媛濡??먯꽑 洹몃━??*/}
          {yCfg.ticks.map(v => (
            <line key={v}
              x1={0} y1={toY(v)} x2={PW} y2={toY(v)}
              stroke={COLOR.borderMid} strokeWidth={0.7} strokeDasharray="4,3"
            />
          ))}

          {/* ?몃줈 ?먯꽑 洹몃━??*/}
          {xTicks.map(m => (
            <line key={m}
              x1={toX(m)} y1={CHART_PAD.top} x2={toX(m)} y2={CHART_PAD.top + PH}
              stroke={COLOR.borderMid} strokeWidth={0.7} strokeDasharray="4,3"
            />
          ))}

          {/* 36m 寃쎄퀎??*/}
          {xMax > 36 && (
            <g>
              <line
                x1={toX(36)} y1={CHART_PAD.top} x2={toX(36)} y2={CHART_PAD.top + PH}
                stroke={COLOR.borderInactive} strokeWidth={1} strokeDasharray="5,3"
              />
              <text x={toX(36) + 4} y={CHART_PAD.top + 10}
                fontSize={7} fill={COLOR.textDisabled} fontFamily="Pretendard Variable, Pretendard, sans-serif">
                36m??
              </text>
            </g>
          )}

          {/* WHO 湲곗???(0~36m) */}
          <g clipPath={`url(#${clipId})`}>
            <polyline points={refPts(ref.p10)} fill="none"
              stroke={PCTILE.p10.color} strokeWidth={1.2} strokeDasharray={PCTILE.p10.dash} />
            <polyline points={refPts(ref.p50)} fill="none"
              stroke={PCTILE.p50.color} strokeWidth={1.5} strokeDasharray={PCTILE.p50.dash} />
            <polyline points={refPts(ref.p90)} fill="none"
              stroke={PCTILE.p90.color} strokeWidth={1.2} strokeDasharray={PCTILE.p90.dash} />
          </g>

          {/* ?ъ슜???곗씠??*/}
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

          {/* X異?*/}
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
                fontSize={8} fill={COLOR.textMuted} fontFamily="Pretendard Variable, Pretendard, sans-serif">
                {m}
              </text>
            </g>
          ))}
          {/* (媛쒖썡) ?덉씠釉?*/}
          <text x={PW} y={CHART_PAD.top + PH + 26} textAnchor="end"
            fontSize={8} fill={COLOR.textMuted} fontFamily="Pretendard Variable, Pretendard, sans-serif">
            (媛쒖썡)
          </text>
        </svg>
      </div>
    </div>
  );
}

// ?? 踰붾? ?????????????????????????????????????????????????????
function ChartLegend({ color }: { color: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 4px 0", flexWrap: "wrap", justifyContent: "flex-end",
    }}>
      {/* 湲곕줉 踰붾? */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <div style={{ width: 10, height: 2, backgroundColor: color, borderRadius: 1 }} />
          <div style={{
            width: 6, height: 6, backgroundColor: color, borderRadius: "50%",
            border: "1px solid white", boxShadow: `0 0 0 1px ${color}`,
          }} />
        </div>
        <span style={{ fontSize: 10, color: COLOR.textMuted, fontFamily: FONT.base }}>湲곕줉</span>
      </div>

      {/* 諛깅텇??踰붾? */}
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

// ?? 諛쒕떖 ?뺣낫 移대뱶 ????????????????????????????????????????????
function BabyInfoCard({ months }: { months: number }) {
  const info = getBabyInfo(months);

  const sections: { icon: string; title: string; content: string }[] = [
    ...(info.feed ? [{ icon: "?띁", title: "?섏쑀 쨌 ?댁쑀??媛?대뱶", content: info.feed }] : []),
    { icon: "?뙮", title: "諛쒕떖 ?ъ씤??, content: info.develop },
    { icon: "?뮕", title: "?≪븘 ??,     content: info.care },
    { icon: "?렜", title: "???諛⑸쾿",   content: info.play },
  ];

  return (
    <div style={{ backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg, overflow: "hidden" }}>
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: `1px solid ${COLOR.borderLight}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
          吏湲????쒓린???꾩씠??
        </span>
        <span style={{ fontSize: 11, color: COLOR.textMuted, letterSpacing: "-0.1px" }}>
          {months}媛쒖썡 湲곗?
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

// ?? 硫붿씤 而댄룷?뚰듃 ?????????????????????????????????????????????
export function GrowthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedChild, toggleKdstItem, isKdstChecked, getKdstCheckedAt } = useChild();

  // ?멸렇癒쇳듃 酉? ?깆옣 洹몃옒??/ ?몄무 ?ъ씤??
  type GrowthView = "graph" | "inchit";
  const initialView: GrowthView =
    (location.state as { tab?: string })?.tab === "inchit" ? "inchit" : "graph";
  const [growthView, setGrowthView] = useState<GrowthView>(initialView);

  const [activeType, setActiveType] = useState<GrowthType>("weight");
  const [records, setRecords] = useState<GrowthRecord[]>(() => {
    return selectedChild ? loadRecords(selectedChild.id) : [];
  });

  // ?먮? ?꾪솚 ???대떦 ?먮? 湲곕줉 濡쒕뱶
  useEffect(() => {
    if (selectedChild) {
      setRecords(loadRecords(selectedChild.id));
    }
  }, [selectedChild?.id]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  // K-DST ?곹깭 (ChildContext 湲곕컲)
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
        setInchitPopup({ emoji: "?뙮", title: "泥??몄무 ?ъ씤?몃? 湲곕줉?덉뼱??", body: `${selectedChild?.name ?? "?꾩씠"}???깆옣???④퍡 湲곕줉?댁슂.` });
      } else if (newSize === half) {
        setInchitPopup({ emoji: "?뙚", title: "?덈컲???ъ꽦?덉뼱??", body: "袁몄???愿李곗씠 ?꾩씠 ?깆옣??媛?????섏씠?먯슂." });
      } else if (newSize === totalKdst) {
        setInchitPopup({ emoji: "?럦", title: "?몄무 ?ъ씤???꾩꽦!", body: `?뱀떊???щ옉怨??몃젰 ?뺣텇??n?꾩씠???ㅻ뒛???깆옣?섍퀬 ?덉뼱?? ?? });
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

  // X異?理쒕? 媛쒖썡: 36 ?먮뒗 ?꾩씠 ?섏씠+6 以???媛?(3??諛곗닔濡??щ┝)
  const xMax = useMemo(() => {
    const raw = Math.max(36, childMonths + 6);
    return Math.ceil(raw / 3) * 3;
  }, [childMonths]);

  // 李⑦듃 ?ㅽ겕濡?而⑦뀒?대꼫 ref
  const chartScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = chartScrollRef.current;
    if (!el) return;
    // ?꾩옱 ?꾩씠 媛쒖썡 ???꾩튂濡?媛濡??ㅽ겕濡?(肄섑뀗痢?SVG??x=0??0媛쒖썡 湲곗?)
    const targetX = childMonths * X_PX;
    el.scrollLeft = Math.max(0, targetX - el.clientWidth * 0.65);
  }, [activeType, childMonths]);

  // ??퀎 理쒖떊 湲곕줉媛?(??移⑹뿉 ?쒖떆)
  function getLatestValue(type: GrowthType): number | undefined {
    const pts = records
      .filter(r => getVal(r, type) !== undefined)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (!pts.length) return undefined;
    return getVal(pts[0], type);
  }

  // 理쒓렐 蹂??怨꾩궛
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

  // 理쒓렐 蹂??JSX ?뚮뜑
  function renderChangeNode(): React.ReactNode {
    const hasAny = records.some(r => getVal(r, activeType) !== undefined);
    if (!hasAny) return null;
    if (!recentChange) return (
      <span style={{ fontSize: 14, color: COLOR.textSecondary, letterSpacing: "-0.2px" }}>
        泥?湲곕줉?댁뿉?? ?욎쑝濡?袁몄???湲곕줉?대킄?? ?뱢
      </span>
    );
    const { diff, days } = recentChange;
    const unit = TYPE_UNIT[activeType];
    const abs = Math.abs(diff).toFixed(1);
    const up = diff >= 0;
    let verb = "";
    if (activeType === "weight") verb = up ? "?섏뿀?댁슂!" : "以꾩뿀?댁슂.";
    else if (activeType === "height") verb = up ? "?먮옄?댁슂!" : "以꾩뿀?댁슂.";
    else verb = up ? "而ㅼ죱?댁슂!" : "以꾩뿀?댁슂.";

    return (
      <span style={{ fontSize: 14, color: COLOR.textSecondary, letterSpacing: "-0.2px", lineHeight: 1.5 }}>
        理쒓렐{" "}
        <strong style={{ color, fontWeight: 700 }}>{days}??/strong>
        {" "}?숈븞 {TYPE_LABEL[activeType]}媛{" "}
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
    if (selectedChild) saveRecords(selectedChild.id, updated);

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
        {/* ?? ?깅컮 ?? */}
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
                    {v === "graph" ? "?깆옣 洹몃옒?? : "?몄무 ?ъ씤??}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ?? ?ㅽ겕濡??곸뿭 ?? */}
        <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 20px 40px" }}>

          {growthView === "graph" && (<>

          {/* 痢≪젙 ???????理쒖떊媛??쒖떆??移?*/}
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
                    {latestVal !== undefined ? `${latestVal.toFixed(1)} ${TYPE_UNIT[t]}` : "??}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 李⑦듃 移대뱶 */}
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
                <span style={{ fontSize: 32 }}>?뱩</span>
                <span style={{ fontSize: 13, color: COLOR.textMuted }}>?꾩쭅 湲곕줉???놁뼱??/span>
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

          {/* + 湲곕줉 異붽? 踰꾪듉 */}
          <button onClick={() => setSheetOpen(true)} style={{
            width: "100%", height: 50, borderRadius: RADIUS.md,
            backgroundColor: color, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontFamily: FONT.base, fontSize: 15, fontWeight: 700, color: "#fff",
            letterSpacing: "-0.2px", marginBottom: 20,
            WebkitTapHighlightColor: "transparent",
          }}>
            <Plus size={18} strokeWidth={2.5} />
            湲곕줉 異붽?
          </button>

          {/* 吏湲????쒓린???꾩씠??*/}
          <BabyInfoCard months={childMonths} />

          </>)} {/* growthView === "graph" END */}

          {/* ??? ?몄무 ?ъ씤??????? */}
          {growthView === "inchit" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* 吏꾪뻾 移대뱶 */}
              <div style={{
                backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg,
                padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 12, color: COLOR.textMuted, display: "block", marginBottom: 2 }}>
                      {(() => { const r = getKdstRange(selectedChild?.months ?? 0); return `${r.start}~${r.end}媛쒖썡???몄무 ?ъ씤??; })()}
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
                    ?럦 ?대쾲 ?몄무 ?ъ씤?몃? 紐⑤몢 ?꾨즺?덉뼱??
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
                  蹂?泥댄겕由ъ뒪?몃뒗 K-DST 湲곗? 李멸퀬?⑹씠硫? 吏꾨떒???泥댄븯吏 ?딆뒿?덈떎. 諛쒕떖?먮뒗 媛쒖씤李④? ?덉뒿?덈떎.
                </span>
              </div>
            </div>
          )}

        </div>

        {/* ?? 湲곕줉 異붽? 諛뷀? ?쒗듃 ?? */}
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
                    ?깆옣 湲곕줉 異붽?
                  </span>
                  <button onClick={() => { setSheetOpen(false); setShowDateCal(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <X size={20} color={COLOR.textMuted} />
                  </button>
                </div>

                {/* ?좎쭨 ??InlineCalendar ?⑦꽩 */}
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
                    <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>痢≪젙??/span>
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

                {/* 痢≪젙媛?3媛?*/}
                <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                  {([
                    { type: "weight" as GrowthType, label: "紐몃Т寃?, unit: "kg",  val: inputWeight, set: setInputWeight },
                    { type: "height" as GrowthType, label: "??,      unit: "cm",  val: inputHeight, set: setInputHeight },
                    { type: "head"   as GrowthType, label: "癒몃━?섎젅", unit: "cm", val: inputHead,   set: setInputHead   },
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
                  ???
                </button>
              </div>
            </div>
          </>
        )}

        {/* ?? 諛깅텇???덈궡 紐⑤떖 ?? */}
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
                  諛깅텇??湲곗????덈궡
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
                諛깅텇??湲곗??좎? WHO Growth Standard, 2017 ?뚯븘泥?냼???깆옣?꾪몴瑜?李멸퀬?섏??듬땲?? ?뺥솗???깆옣 ?됯????뚯븘怨??꾨Ц?섏? ?곷떞?섏꽭??
                <br /><br />
                ?섏튂??李멸퀬??肉먯씠?먯슂. 
                <br />
                以묒슂??嫄??곕━ ?꾩씠??袁몄????깆옣?낅땲??
              </p>
            </div>
          </>
        )}

        {/* ?? ?몄무 ?ъ씤???ъ꽦 ?앹뾽 ?? */}
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
                ?뺤씤
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

