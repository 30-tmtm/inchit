import { useState } from "react";
import { FONT } from "../tokens";
import { getSeoulTodayParts } from "../utils/seoulDate";

// ??? ?꾩씠 ?뺣낫 (異뷀썑 ?꾨줈?꾩뿉??媛?몄삱 ?덉젙) ?????????????
const CHILD_BIRTH = new Date(2024, 7, 18); // 2024-08-18
const CHILD_NAME = "?꾩씠";
const seoulToday = getSeoulTodayParts();
const APP_TODAY = new Date(seoulToday.year, seoulToday.month - 1, seoulToday.day);

// ??? ?ы띁 ?????????????????????????????????????????????
function getAgeMonths(birth: Date, now: Date): number {
  let months = (now.getFullYear() - birth.getFullYear()) * 12
    + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
}

function birthPlusMonths(birth: Date, m: number): Date {
  const d = new Date(birth);
  d.setMonth(d.getMonth() + m);
  return d;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// ??? ?곗씠???????????????????????????????????????????
interface VacItem {
  id: string;
  label: string;
}
interface VacGroup {
  id: string;
  type: "vaccine" | "checkup";
  rangeLabel: string;
  startMonth: number;
  endMonth: number;
  items: VacItem[];
}

// ??? 援?? ?덈갑?묒쥌 / 嫄닿컯寃吏??곗씠???????????????????
const VAC_GROUPS: VacGroup[] = [
  {
    id: "vac-12-23",
    type: "vaccine",
    rangeLabel: "12~23媛쒖썡",
    startMonth: 12,
    endMonth: 23,
    items: [
      { id: "hepa1",    label: "A?뺢컙??HepA 1李?" },
      { id: "hepa2",    label: "A?뺢컙??HepA 2李?" },
      { id: "je-d1",   label: "?쇰낯?뚯뿼 ?щ갚??1李? },
      { id: "je-d2",   label: "?쇰낯?뚯뿼 ?щ갚??2李? },
      { id: "je-l1",   label: "?쇰낯?뚯뿼 ?앸갚??1李? },
    ],
  },
  {
    id: "vac-15-18",
    type: "vaccine",
    rangeLabel: "15~18媛쒖썡",
    startMonth: 15,
    endMonth: 18,
    items: [
      { id: "dtap4", label: "DTaP(?뷀봽?뚮━?꽷룻뙆?곹뭾쨌諛깆씪?? 4李? },
      { id: "mmr2",  label: "MMR(?띿뿭쨌?좏뻾?깆씠?섏꽑?셋룻뭾吏? 2李? },
      { id: "var2",  label: "?섎몢(VAR) 2李? },
    ],
  },
  {
    id: "check-4",
    type: "checkup",
    rangeLabel: "18~24媛쒖썡",
    startMonth: 18,
    endMonth: 24,
    items: [{ id: "chk4", label: "4李??곸쑀??嫄닿컯寃吏? }],
  },
  {
    id: "check-5",
    type: "checkup",
    rangeLabel: "30~36媛쒖썡",
    startMonth: 30,
    endMonth: 36,
    items: [{ id: "chk5", label: "5李??곸쑀??嫄닿컯寃吏? }],
  },
  {
    id: "check-6",
    type: "checkup",
    rangeLabel: "42~48媛쒖썡",
    startMonth: 42,
    endMonth: 48,
    items: [{ id: "chk6", label: "6李??곸쑀??嫄닿컯寃吏? }],
  },
  {
    id: "vac-48-72",
    type: "vaccine",
    rangeLabel: "48~72媛쒖썡",
    startMonth: 48,
    endMonth: 72,
    items: [
      { id: "dtap5",    label: "DTaP 5李? },
      { id: "ipv4",     label: "?대━??IPV) 4李? },
      { id: "je-d3-4",  label: "?쇰낯?뚯뿼 ?щ갚??3쨌4李? },
    ],
  },
];

// ??? ?곹깭 怨꾩궛 ????????????????????????????????????????
type Status = "done" | "active" | "upcoming";

function getStatus(startMonth: number, endMonth: number, ageMonths: number): Status {
  if (ageMonths > endMonth) return "done";
  if (ageMonths >= startMonth) return "active";
  return "upcoming";
}

const STATUS_LABEL: Record<Status, string> = {
  done:     "湲곌컙 吏??,
  active:   "吏꾪뻾 以?,
  upcoming: "?덉젙",
};
const STATUS_COLOR: Record<Status, { bg: string; text: string; dot: string }> = {
  done:     { bg: "#F5F1EA", text: "#B0A294", dot: "#D5C8BA" },
  active:   { bg: "#FFF1CF", text: "#A86A00", dot: "#E3A72E" },
  upcoming: { bg: "#FFF7E6", text: "#C28B1D", dot: "#E5BB66" },
};

// ??? 硫붿씤 而댄룷?뚰듃 ?????????????????????????????????????
export function VaccinationPanel() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const ageMonths = getAgeMonths(CHILD_BIRTH, APP_TODAY);
  const activeCount = VAC_GROUPS.filter(
    (g) => getStatus(g.startMonth, g.endMonth, ageMonths) === "active"
  ).length;

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      {/* ?? 諛곕꼫 (??긽 ?쒖떆) ?? */}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "11px 20px",
          background: "linear-gradient(90deg, #FFF8E9 0%, #FFF1D2 100%)",
          border: "none",
          borderBottom: "1px solid #F2E4B8",
          cursor: "pointer",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* 諛⑺뙣+泥댄겕 ?꾩씠肄?*/}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5L2.5 4V8C2.5 11.3 5 13.6 8 14.5C11 13.6 13.5 11.3 13.5 8V4L8 1.5Z" stroke="#B77900" strokeWidth="1.3" fill="rgba(242,182,62,0.14)" strokeLinejoin="round"/>
            <path d="M5.5 8L7 9.5L10.5 6" stroke="#B77900" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span
            style={{
              fontFamily: FONT.base,
              fontWeight: 700,
              fontSize: 13,
              color: "#6F4B00",
            }}
          >
            ?덈갑?묒쥌 / 嫄닿컯寃吏?
          </span>
          {activeCount > 0 && (
            <div
              style={{
                backgroundColor: "#E3A72E",
                borderRadius: 10,
                padding: "2px 7px",
                display: "inline-flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: FONT.base,
                  fontWeight: 700,
                  fontSize: 10,
                  color: "#FFFFFF",
                  lineHeight: "14px",
                }}
              >
                吏꾪뻾 以?{activeCount}
              </span>
            </div>
          )}
        </div>
        {/* ?붿궡??*/}
        <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
          <path d="M1 1L7 7L13 1" stroke="#B98B24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* ?? ?곸꽭 ?쒗듃 ?? */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          {/* dim */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.32)",
            }}
          />

          {/* ?쒗듃 蹂몄껜 */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 390,
              margin: "0 auto",
              backgroundColor: "#FFFFFF",
              borderRadius: "20px 20px 0 0",
              maxHeight: "82dvh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* ?몃뱾 */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#D9D9D9" }} />
            </div>

            {/* ?ㅻ뜑 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 20px 10px 20px",
              }}
            >
              <span
                style={{
                  fontFamily: FONT.base,
                  fontWeight: 800,
                  fontSize: 17,
                  color: "#1C1C1E",
                }}
              >
                ?덈갑?묒쥌 쨌 嫄닿컯寃吏?濡쒕뱶留?
              </span>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5L15 15M15 5L5 15" stroke="#AAAAAA" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* 由ъ뒪??*/}
            <div
              className="panel-scroll"
              style={{ flex: 1, overflowY: "auto", padding: "0 20px 32px 20px" }}
            >
              {/* ?덈갑?묒쥌 ?뱀뀡 */}
              <SectionTitle label="?덈갑?묒쥌" icon="?뭺" />
              {VAC_GROUPS.filter((g) => g.type === "vaccine").map((group) => {
                const status = getStatus(group.startMonth, group.endMonth, ageMonths);
                const startDate = birthPlusMonths(CHILD_BIRTH, group.startMonth);
                const endDate = birthPlusMonths(CHILD_BIRTH, group.endMonth);
                return (
                  <GroupCard
                    key={group.id}
                    group={group}
                    status={status}
                    startDate={startDate}
                    endDate={endDate}
                    checked={checked}
                    onToggle={toggle}
                  />
                );
              })}

              {/* 嫄닿컯寃吏??뱀뀡 */}
              <SectionTitle label="嫄닿컯寃吏? icon="?룯" />
              {VAC_GROUPS.filter((g) => g.type === "checkup").map((group) => {
                const status = getStatus(group.startMonth, group.endMonth, ageMonths);
                const startDate = birthPlusMonths(CHILD_BIRTH, group.startMonth);
                const endDate = birthPlusMonths(CHILD_BIRTH, group.endMonth);
                return (
                  <GroupCard
                    key={group.id}
                    group={group}
                    status={status}
                    startDate={startDate}
                    endDate={endDate}
                    checked={checked}
                    onToggle={toggle}
                  />
                );
              })}

              {/* ?섎떒 硫댁콉 */}
              <div
                style={{
                  marginTop: 20,
                  padding: "10px 12px",
                  backgroundColor: "#FFF8EA",
                  borderRadius: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT.base,
                    fontSize: 10,
                    color: "#B39D7A",
                    lineHeight: "16px",
                  }}
                >
                  ???쇱젙? 援?? ?덈갑?묒쥌 沅뚭퀬 湲곗???諛뷀깢?쇰줈 ?쒓났?섎뒗 李멸퀬???덈궡?낅땲?? 蹂대떎 ?뺥솗???쇱젙? ?섎즺湲곌? ?먮뒗 ?덈갑?묒쥌 ?꾩슦誘몃? ?듯빐 ??踰????뺤씤?댁＜?몄슂.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ??? ?뱀뀡 ??댄? ??????????????????????????????????????
function SectionTitle({ label, icon }: { label: string; icon: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 10,
        marginTop: 4,
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span
        style={{
          fontFamily: FONT.base,
          fontWeight: 800,
          fontSize: 14,
          color: "#1C1C1E",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ??? 洹몃９ 移대뱶 ????????????????????????????????????????
function GroupCard({
  group,
  status,
  startDate,
  endDate,
  checked,
  onToggle,
}: {
  group: VacGroup;
  status: Status;
  startDate: Date;
  endDate: Date;
  checked: Set<string>;
  onToggle: (id: string) => void;
}) {
  const sc = STATUS_COLOR[status];
  const isDone = status === "done";
  const doneCount = group.items.filter((i) => checked.has(i.id)).length;

  return (
    <div
      style={{
        marginBottom: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        overflow: "hidden",
        opacity: isDone ? 0.72 : 1,
      }}
    >
      {/* 移대뱶 ?ㅻ뜑 */}
      <div
        style={{
          padding: "12px 14px 10px 14px",
          borderBottom: "1px solid #F3F3F3",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontFamily: FONT.base,
              fontWeight: 700,
              fontSize: 13,
              color: isDone ? "#AAAAAA" : "#2A2A2A",
            }}
          >
            {group.type === "checkup" ? group.items[0].label : group.rangeLabel}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {/* 吏꾪뻾瑜?*/}
            {doneCount > 0 && (
              <span
                style={{
                  fontFamily: FONT.base,
                  fontSize: 10,
                  color: "#AAAAAA",
                }}
              >
                {doneCount}/{group.items.length} ?꾨즺
              </span>
            )}
            {/* ?곹깭 諭껋? */}
            <div
              style={{
                backgroundColor: sc.bg,
                borderRadius: 6,
                padding: "2px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: FONT.base,
                  fontWeight: 700,
                  fontSize: 10,
                  color: sc.text,
                  lineHeight: "16px",
                }}
              >
                {STATUS_LABEL[status]}
              </span>
            </div>
          </div>
        </div>

        {/* ?좎쭨 踰붿쐞 */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: sc.dot,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: FONT.base,
              fontSize: 11,
              color: "#AAAAAA",
            }}
          >
            {fmtDate(startDate)} ~ {fmtDate(endDate)}
          </span>
          {group.type === "vaccine" && (
            <span
              style={{
                fontFamily: FONT.base,
                fontSize: 11,
                color: "#C4C4C4",
              }}
            >
              ({group.rangeLabel})
            </span>
          )}
        </div>
      </div>

      {/* ?꾩씠??紐⑸줉 */}
      <div style={{ padding: "6px 0" }}>
        {group.items.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {/* 泥댄겕諛뺤뒪 */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  border: isChecked ? "none" : `2px solid ${isDone ? "#DDDDDD" : "#D0D0D0"}`,
                  backgroundColor: isChecked ? "#E3A72E" : "transparent",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
              >
                {isChecked && (
                  <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                    <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              {/* ?덉씠釉?*/}
              <span
                style={{
                  fontFamily: FONT.base,
                  fontSize: 13,
                  color: isChecked ? "#AAAAAA" : isDone ? "#BBBBBB" : "#2A2A2A",
                  textDecoration: isChecked ? "line-through" : "none",
                  lineHeight: "18px",
                  flex: 1,
                  transition: "color 0.15s ease",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

