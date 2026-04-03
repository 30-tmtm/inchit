import { useState } from "react";
import { getSeoulTodayParts } from "../utils/seoulDate";

// ─── 아이 정보 (추후 프로필에서 가져올 예정) ─────────────
const CHILD_BIRTH = new Date(2024, 7, 18); // 2024-08-18
const CHILD_NAME = "아이";
const seoulToday = getSeoulTodayParts();
const APP_TODAY = new Date(seoulToday.year, seoulToday.month - 1, seoulToday.day);

// ─── 헬퍼 ─────────────────────────────────────────────
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

// ─── 데이터 타입 ──────────────────────────────────────
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

// ─── 국가 예방접종 / 건강검진 데이터 ─────────────────
const VAC_GROUPS: VacGroup[] = [
  {
    id: "vac-12-23",
    type: "vaccine",
    rangeLabel: "12~23개월",
    startMonth: 12,
    endMonth: 23,
    items: [
      { id: "hepa1",    label: "A형간염(HepA 1차)" },
      { id: "hepa2",    label: "A형간염(HepA 2차)" },
      { id: "je-d1",   label: "일본뇌염 사백신 1차" },
      { id: "je-d2",   label: "일본뇌염 사백신 2차" },
      { id: "je-l1",   label: "일본뇌염 생백신 1차" },
    ],
  },
  {
    id: "vac-15-18",
    type: "vaccine",
    rangeLabel: "15~18개월",
    startMonth: 15,
    endMonth: 18,
    items: [
      { id: "dtap4", label: "DTaP(디프테리아·파상풍·백일해) 4차" },
      { id: "mmr2",  label: "MMR(홍역·유행성이하선염·풍진) 2차" },
      { id: "var2",  label: "수두(VAR) 2차" },
    ],
  },
  {
    id: "check-4",
    type: "checkup",
    rangeLabel: "18~24개월",
    startMonth: 18,
    endMonth: 24,
    items: [{ id: "chk4", label: "4차 영유아 건강검진" }],
  },
  {
    id: "check-5",
    type: "checkup",
    rangeLabel: "30~36개월",
    startMonth: 30,
    endMonth: 36,
    items: [{ id: "chk5", label: "5차 영유아 건강검진" }],
  },
  {
    id: "check-6",
    type: "checkup",
    rangeLabel: "42~48개월",
    startMonth: 42,
    endMonth: 48,
    items: [{ id: "chk6", label: "6차 영유아 건강검진" }],
  },
  {
    id: "vac-48-72",
    type: "vaccine",
    rangeLabel: "48~72개월",
    startMonth: 48,
    endMonth: 72,
    items: [
      { id: "dtap5",    label: "DTaP 5차" },
      { id: "ipv4",     label: "폴리오(IPV) 4차" },
      { id: "je-d3-4",  label: "일본뇌염 사백신 3·4차" },
    ],
  },
];

// ─── 상태 계산 ────────────────────────────────────────
type Status = "done" | "active" | "upcoming";

function getStatus(startMonth: number, endMonth: number, ageMonths: number): Status {
  if (ageMonths > endMonth) return "done";
  if (ageMonths >= startMonth) return "active";
  return "upcoming";
}

const STATUS_LABEL: Record<Status, string> = {
  done:     "기간 지남",
  active:   "진행 중",
  upcoming: "예정",
};
const STATUS_COLOR: Record<Status, { bg: string; text: string; dot: string }> = {
  done:     { bg: "#F5F1EA", text: "#B0A294", dot: "#D5C8BA" },
  active:   { bg: "#FFF1CF", text: "#A86A00", dot: "#E3A72E" },
  upcoming: { bg: "#FFF7E6", text: "#C28B1D", dot: "#E5BB66" },
};

// ─── 메인 컴포넌트 ─────────────────────────────────────
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
      {/* ── 배너 (항상 표시) ── */}
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
          {/* 방패+체크 아이콘 */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5L2.5 4V8C2.5 11.3 5 13.6 8 14.5C11 13.6 13.5 11.3 13.5 8V4L8 1.5Z" stroke="#B77900" strokeWidth="1.3" fill="rgba(242,182,62,0.14)" strokeLinejoin="round"/>
            <path d="M5.5 8L7 9.5L10.5 6" stroke="#B77900" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span
            style={{
              fontFamily: "'Nanum Square', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: "#6F4B00",
            }}
          >
            예방접종 / 건강검진
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
                  fontFamily: "'Nanum Square', sans-serif",
                  fontWeight: 700,
                  fontSize: 10,
                  color: "#FFFFFF",
                  lineHeight: "14px",
                }}
              >
                진행 중 {activeCount}
              </span>
            </div>
          )}
        </div>
        {/* 화살표 */}
        <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
          <path d="M1 1L7 7L13 1" stroke="#B98B24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* ── 상세 시트 ── */}
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

          {/* 시트 본체 */}
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
            {/* 핸들 */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#D9D9D9" }} />
            </div>

            {/* 헤더 */}
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
                  fontFamily: "'Nanum Square', sans-serif",
                  fontWeight: 800,
                  fontSize: 17,
                  color: "#1C1C1E",
                }}
              >
                예방접종 · 건강검진 로드맵
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

            {/* 리스트 */}
            <div
              className="panel-scroll"
              style={{ flex: 1, overflowY: "auto", padding: "0 20px 32px 20px" }}
            >
              {/* 예방접종 섹션 */}
              <SectionTitle label="예방접종" icon="💉" />
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

              {/* 건강검진 섹션 */}
              <SectionTitle label="건강검진" icon="🏥" />
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

              {/* 하단 면책 */}
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
                    fontFamily: "'Nanum Square', sans-serif",
                    fontSize: 10,
                    color: "#B39D7A",
                    lineHeight: "16px",
                  }}
                >
                  이 일정은 국가 예방접종 권고 기준을 바탕으로 제공되는 참고용 안내입니다. 보다 정확한 일정은 의료기관 또는 예방접종 도우미를 통해 한 번 더 확인해주세요.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── 섹션 타이틀 ──────────────────────────────────────
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
          fontFamily: "'Nanum Square', sans-serif",
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

// ─── 그룹 카드 ────────────────────────────────────────
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
      {/* 카드 헤더 */}
      <div
        style={{
          padding: "12px 14px 10px 14px",
          borderBottom: "1px solid #F3F3F3",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontFamily: "'Nanum Square', sans-serif",
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
            {/* 진행률 */}
            {doneCount > 0 && (
              <span
                style={{
                  fontFamily: "'Nanum Square', sans-serif",
                  fontSize: 10,
                  color: "#AAAAAA",
                }}
              >
                {doneCount}/{group.items.length} 완료
              </span>
            )}
            {/* 상태 뱃지 */}
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
                  fontFamily: "'Nanum Square', sans-serif",
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

        {/* 날짜 범위 */}
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
              fontFamily: "'Nanum Square', sans-serif",
              fontSize: 11,
              color: "#AAAAAA",
            }}
          >
            {fmtDate(startDate)} ~ {fmtDate(endDate)}
          </span>
          {group.type === "vaccine" && (
            <span
              style={{
                fontFamily: "'Nanum Square', sans-serif",
                fontSize: 11,
                color: "#C4C4C4",
              }}
            >
              ({group.rangeLabel})
            </span>
          )}
        </div>
      </div>

      {/* 아이템 목록 */}
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
              {/* 체크박스 */}
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
              {/* 레이블 */}
              <span
                style={{
                  fontFamily: "'Nanum Square', sans-serif",
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