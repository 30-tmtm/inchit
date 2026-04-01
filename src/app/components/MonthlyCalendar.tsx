import { useState } from "react";
import { getDayMeta, dayKey, CalEvent, EVENT_CATEGORY_LABEL } from "./CalendarData";
import {
  EventDetailModal,
  EventFormData,
  calEventToFormData,
  makeNewEventFormData,
} from "./EventDetailModal";
import { VaccinationPanel } from "./VaccinationPanel";
import { COLOR, FONT } from "../tokens";
// NOTE: 이 파일의 인라인 스타일 색상은 현재 하드코딩 상태입니다.
// 다음 리팩토링 시 COLOR.* 토큰으로 교체 예정.
// 예: "#43302E" → COLOR.primary, "#C1DBE8" → COLOR.accent 등

// ─── constants ───────────────────────────────
const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const KR_DAY = ["일", "월", "화", "수", "목", "금", "토"];

const TODAY = { year: 2026, month: 3, day: 27 };

// ─── helpers ─────────────────────────────────
function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function firstDOW(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}
function isToday(y: number, m: number, d: number) {
  return y === TODAY.year && m === TODAY.month && d === TODAY.day;
}
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
function truncate4(str: string) {
  return str.length > 4 ? str.slice(0, 4) + "…" : str;
}

interface CellDate {
  year: number;
  month: number;
  day: number;
  isCurrentMonth: boolean;
}

function buildCalendarDates(year: number, month: number): CellDate[] {
  const first = firstDOW(year, month);
  const total = daysInMonth(year, month);
  const prevTotal = daysInMonth(year, month === 1 ? 12 : month - 1);
  const cells: CellDate[] = [];

  for (let i = first - 1; i >= 0; i--) {
    const pm = month === 1 ? 12 : month - 1;
    const py = month === 1 ? year - 1 : year;
    cells.push({ year: py, month: pm, day: prevTotal - i, isCurrentMonth: false });
  }
  for (let d = 1; d <= total; d++) {
    cells.push({ year, month, day: d, isCurrentMonth: true });
  }
  const neededRows = Math.ceil(cells.length / 7);
  const totalCells = neededRows * 7;
  const needed = totalCells - cells.length;
  const nm = month === 12 ? 1 : month + 1;
  const ny = month === 12 ? year + 1 : year;
  for (let d = 1; d <= needed; d++) {
    cells.push({ year: ny, month: nm, day: d, isCurrentMonth: false });
  }
  return cells;
}

function textColor(col: number, isCurrentMonth: boolean, isHoliday: boolean) {
  if (!isCurrentMonth) return "#C4C4C4";
  if (isHoliday || col === 0) return "#E05252";
  if (col === 6) return "#5B7FBF";
  return "#2A2A2A";
}

// ─── EventTag ─────────────────────────────────

function EventTag({ event, compact }: { event: CalEvent; compact: boolean }) {
  if (compact) {
    return (
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: event.color,
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderLeft: `2.5px solid ${event.color}`,
        paddingLeft: 3,
        marginTop: 1,
        backgroundColor: `rgba(${hexToRgb(event.color)},0.08)`,
        borderRadius: "0 2px 2px 0",
        overflow: "hidden",
        height: 14,
      }}
    >
      <span
        style={{
          fontFamily: "'Nanum Square', sans-serif",
          fontSize: 9,
          color: "#2A2A2A",
          lineHeight: "14px",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {truncate4(event.title)}
      </span>
    </div>
  );
}

// ─── DateCell ────────────────────────────────

interface DateCellProps {
  cell: CellDate;
  colIndex: number;
  isSelected: boolean;
  compact: boolean;
  onClick: () => void;
}

function DateCell({ cell, colIndex, isSelected, compact, onClick }: DateCellProps) {
  const { year, month, day, isCurrentMonth } = cell;
  const meta = getDayMeta(year, month, day);
  const isHoliday = !!meta.isPublicHoliday;
  const todayCell = isToday(year, month, day);
  const color = textColor(colIndex, isCurrentMonth, isHoliday);
  const hasEvents = meta.events.length > 0 && isCurrentMonth;

  return (
    <div
      onClick={onClick}
      style={{
        borderTop: "none",
        padding: compact ? "6px 3px 4px 3px" : "10px 5px 8px 5px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        overflow: "hidden",
        backgroundColor:
          isSelected && !todayCell
            ? `rgba(${hexToRgb("#C1DBE8")},0.10)`
            : "transparent",
        transition: "background-color 0.15s ease",
        // Fill the grid row in non-compact mode
        ...(compact ? {} : { height: "100%" }),
      }}
    >
      {/* Date number bubble */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 26, flexShrink: 0 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            backgroundColor: todayCell ? "#1C1C1E" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isSelected && !todayCell ? `0 0 0 1.5px #C1DBE8` : "none",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Nanum Square', sans-serif",
              fontWeight: todayCell ? 700 : 400,
              fontSize: 13,
              color: todayCell ? "#FFFFFF" : color,
              lineHeight: 1,
            }}
          >
            {day}
          </span>
        </div>
      </div>

      {/* Compact: event dots */}
      {compact && hasEvents && (
        <div style={{ display: "flex", gap: 3, marginTop: 3, paddingLeft: 1 }}>
          {meta.events.slice(0, 3).map((ev) => (
            <EventTag key={ev.id} event={ev} compact />
          ))}
        </div>
      )}

      {/* Non-compact content */}
      {!compact && isCurrentMonth && (
        <>
          {/* Lunar label */}
          {meta.lunarLabel && (
            <span
              style={{
                fontFamily: "'Nanum Square', sans-serif",
                fontSize: 8,
                color: "#A0A0A0",
                marginTop: 1,
                lineHeight: "11px",
                flexShrink: 0,
              }}
            >
              {meta.lunarLabel}
            </span>
          )}

          {/* Holiday badge */}
          {meta.holidayName && (
            <div
              style={{
                marginTop: 2,
                backgroundColor: "#FFE5E5",
                borderRadius: 2,
                padding: "0 2px",
                maxWidth: "100%",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "'Nanum Square', sans-serif",
                  fontSize: 8,
                  color: "#E05252",
                  lineHeight: "13px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  display: "block",
                }}
              >
                {truncate4(meta.holidayName)}
              </span>
            </div>
          )}

          {/* Solar term badge */}
          {meta.solarTerm && !meta.holidayName && (
            <div
              style={{
                marginTop: 2,
                backgroundColor: "#EBEBEB",
                borderRadius: 2,
                padding: "0 2px",
                maxWidth: "100%",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "'Nanum Square', sans-serif",
                  fontSize: 8,
                  color: "#6E6E6E",
                  lineHeight: "13px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  display: "block",
                }}
              >
                {meta.solarTerm}
              </span>
            </div>
          )}

          {/* Event tags */}
          {hasEvents && (
            <div style={{ width: "100%", marginTop: 2, overflow: "hidden" }}>
              {meta.events.slice(0, 2).map((ev) => (
                <EventTag key={ev.id} event={ev} compact={false} />
              ))}
              {meta.events.length > 2 && (
                <span
                  style={{
                    fontFamily: "'Nanum Square', sans-serif",
                    fontSize: 8,
                    color: "#A0A0A0",
                    marginTop: 1,
                    display: "block",
                  }}
                >
                  +{meta.events.length - 2}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Day Detail Panel ─────────────────────────

const WEATHER_BY_DAY: Record<number, { temp: string; icon: "sun" | "cloud" | "rain" }> = {
  1:  { temp: "5°/11°",  icon: "cloud" },
  2:  { temp: "6°/12°",  icon: "cloud" },
  3:  { temp: "7°/13°",  icon: "sun"   },
  4:  { temp: "8°/14°",  icon: "sun"   },
  5:  { temp: "6°/13°",  icon: "cloud" },
  6:  { temp: "7°/14°",  icon: "sun"   },
  7:  { temp: "9°/16°",  icon: "sun"   },
  8:  { temp: "10°/17°", icon: "sun"   },
  9:  { temp: "8°/15°",  icon: "cloud" },
  10: { temp: "9°/16°",  icon: "sun"   },
  11: { temp: "10°/17°", icon: "sun"   },
  12: { temp: "7°/14°",  icon: "rain"  },
  13: { temp: "8°/15°",  icon: "cloud" },
  14: { temp: "11°/18°", icon: "sun"   },
  15: { temp: "10°/18°", icon: "sun"   },
  16: { temp: "9°/17°",  icon: "cloud" },
  17: { temp: "10°/18°", icon: "sun"   },
  18: { temp: "11°/19°", icon: "sun"   },
  19: { temp: "12°/20°", icon: "sun"   },
  20: { temp: "13°/21°", icon: "sun"   },
  21: { temp: "14°/22°", icon: "sun"   },
  22: { temp: "11°/19°", icon: "cloud" },
  23: { temp: "10°/18°", icon: "rain"  },
  24: { temp: "12°/20°", icon: "sun"   },
  25: { temp: "13°/21°", icon: "sun"   },
  26: { temp: "12°/19°", icon: "cloud" },
  27: { temp: "7°/17°",  icon: "sun"   },
  28: { temp: "14°/22°", icon: "sun"   },
  29: { temp: "13°/21°", icon: "cloud" },
  30: { temp: "10°/18°", icon: "rain"  },
  31: { temp: "12°/20°", icon: "sun"   },
};

function WeatherIcon({ type }: { type: "sun" | "cloud" | "rain" }) {
  if (type === "sun") {
    return (
      <div style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: "#F6C933", flexShrink: 0 }} />
    );
  }
  if (type === "cloud") {
    return (
      <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
        <ellipse cx="9" cy="11" rx="8" ry="5" fill="#D0D9E8" />
        <ellipse cx="14" cy="9" rx="6" ry="4.5" fill="#C0CCDE" />
        <ellipse cx="9" cy="9" rx="5" ry="4" fill="#D8E2EE" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <ellipse cx="10" cy="8" rx="7" ry="5" fill="#AABDD4" />
      <line x1="7" y1="13" x2="6" y2="17" stroke="#7BA0C0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="13" x2="9" y2="18" stroke="#7BA0C0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="13" x2="12" y2="17" stroke="#7BA0C0" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CategoryBadge({ category }: { category: CalEvent["category"] }) {
  const colorMap: Record<CalEvent["category"], { bg: string; text: string }> = {
    health:   { bg: "#EBF1FB", text: "#3D6AB5" },
    daycare:  { bg: "#E8F5EC", text: "#2E8049" },
    family:   { bg: "#FDF0EB", text: "#C05030" },
    activity: { bg: "#F2ECFB", text: "#6D3DB0" },
  };
  const c = colorMap[category];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: c.bg,
        borderRadius: 6,
        padding: "1px 7px",
        alignSelf: "flex-start",
      }}
    >
      <span
        style={{
          fontFamily: "'Nanum Square', sans-serif",
          fontWeight: 700,
          fontSize: 10,
          color: c.text,
          lineHeight: "16px",
        }}
      >
        {EVENT_CATEGORY_LABEL[category]}
      </span>
    </div>
  );
}

function DayDetailPanel({
  cell,
  events,
  onEventClick,
}: {
  cell: CellDate;
  events: CalEvent[];
  onEventClick: (ev: CalEvent) => void;
}) {
  const { year, month, day } = cell;
  const meta = getDayMeta(year, month, day);
  const dowIdx = new Date(year, month - 1, day).getDay();
  const dowLabel = KR_DAY[dowIdx];
  const lunarStr = meta.lunarFull ? `음력 ${meta.lunarFull}` : "";
  const weather = WEATHER_BY_DAY[day] ?? { temp: "—", icon: "sun" as const };
  const isHoliday = dowIdx === 0 || !!meta.isPublicHoliday;
  const isSat = dowIdx === 6;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        backgroundColor: "#FAFAFA",
        borderTop: "1px solid #EFEFEF",
      }}
    >
      {/* drag handle */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 12 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#D9D9D9" }} />
      </div>

      {/* day info row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px 14px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontFamily: "'Nanum Square', sans-serif",
              fontWeight: 800,
              fontSize: 20,
              color: isHoliday ? "#E05252" : isSat ? "#5B7FBF" : "#2A2A2A",
              lineHeight: "26px",
            }}
          >
            {month}월 {day}일 {dowLabel}요일
          </span>
          {lunarStr && (
            <span
              style={{
                fontFamily: "'Nanum Square', sans-serif",
                fontSize: 12,
                color: "#AAAAAA",
              }}
            >
              {lunarStr}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <WeatherIcon type={weather.icon} />
          <span style={{ fontFamily: "'Nanum Square', sans-serif", fontSize: 11, color: "#9E9E9E" }}>
            {weather.temp}
          </span>
        </div>
      </div>

      {/* divider */}
      <div style={{ height: 1, backgroundColor: "#EFEFEF", margin: "0 20px 14px 20px" }} />

      {/* ── 예방접종 / 건강검진 배너 ── */}
      <VaccinationPanel />

      {/* events list */}
      <div style={{ padding: "14px 20px 0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {events.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 12, paddingBottom: 8 }}>
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="19" stroke="#E8E8E8" strokeWidth="2" />
              <path d="M13 20h14M20 13v14" stroke="#D0D0D0" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: "'Nanum Square', sans-serif", fontSize: 13, color: "#C8C8C8" }}>
              등록된 일정이 없습니다
            </span>
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              onClick={() => onEventClick(ev)}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "stretch",
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                padding: "12px 16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 4,
                  borderRadius: 4,
                  backgroundColor: ev.color,
                  flexShrink: 0,
                  alignSelf: "stretch",
                  minHeight: 44,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                <CategoryBadge category={ev.category} />
                <span
                  style={{
                    fontFamily: "'Nanum Square', sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                    color: "#2A2A2A",
                    lineHeight: "21px",
                    marginTop: 1,
                  }}
                >
                  {ev.title}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="5.5" stroke="#BBBBBB" strokeWidth="1.2" />
                    <path d="M6.5 3.5V6.5L8.5 8" stroke="#BBBBBB" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <span
                    style={{
                      fontFamily: "'Nanum Square', sans-serif",
                      fontSize: 12,
                      color: "#AAAAAA",
                      lineHeight: "18px",
                    }}
                  >
                    {ev.startTime} – {ev.endTime}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Calendar ────────────────────────────

export function MonthlyCalendar() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  const [selectedKey, setSelectedKey] = useState(
    dayKey(TODAY.year, TODAY.month, TODAY.day)
  );
  const [modalEvent, setModalEvent] = useState<EventFormData | null>(null);
  const [modalIsNew, setModalIsNew] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const cells = buildCalendarDates(year, month);
  const numRows = cells.length / 7;
  const selectedCell =
    cells.find((c) => dayKey(c.year, c.month, c.day) === selectedKey) ?? null;
  const selectedEvents = selectedCell
    ? getDayMeta(selectedCell.year, selectedCell.month, selectedCell.day).events
    : [];
  const showDetail = !!selectedCell;

  function openEventDetail(ev: CalEvent, cell: { year: number; month: number; day: number }) {
    setModalEvent(calEventToFormData(ev, cell.year, cell.month, cell.day));
    setModalIsNew(false);
    setModalOpen(true);
  }

  function openNewEvent() {
    const cell = selectedCell ?? { year: TODAY.year, month: TODAY.month, day: TODAY.day };
    setModalEvent(makeNewEventFormData(cell.year, cell.month, cell.day));
    setModalIsNew(true);
    setModalOpen(true);
  }

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 390,
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        fontFamily: "'Nanum Square', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 16px 8px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            style={{ background: "none", border: "none", padding: 4, cursor: "pointer", display: "flex", flexDirection: "column", gap: 5 }}
          >
            <div style={{ width: 22, height: 2, borderRadius: 1, backgroundColor: "#2A2A2A" }} />
            <div style={{ width: 15, height: 2, borderRadius: 1, backgroundColor: "#2A2A2A" }} />
            <div style={{ width: 22, height: 2, borderRadius: 1, backgroundColor: "#2A2A2A" }} />
          </button>
          <button style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "'Nanum Square', sans-serif", fontWeight: 800, fontSize: 22, color: "#2A2A2A", lineHeight: "28px" }}>
              {year}. {month}
            </span>
            <svg width="13" height="8" viewBox="0 0 13 8" fill="none">
              <path d="M1 1L6.5 7L12 1" stroke="#2A2A2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px" }}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M7 1L1 7L7 13" stroke="#2A2A2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px" }}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M1 1L7 7L1 13" stroke="#2A2A2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6.5" stroke="#2A2A2A" strokeWidth="1.6" />
              <path d="M14 14L18 18" stroke="#2A2A2A" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1" stroke="#2A2A2A" strokeWidth="1.5" />
              <rect x="11" y="2.5" width="6.5" height="6.5" rx="1" stroke="#2A2A2A" strokeWidth="1.5" />
              <rect x="2.5" y="11" width="6.5" height="6.5" rx="1" stroke="#2A2A2A" strokeWidth="1.5" />
              <rect x="11" y="11" width="6.5" height="6.5" rx="1" stroke="#2A2A2A" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── DAY-OF-WEEK ROW ── */}
      <div
        style={{
          flexShrink: 0,
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          padding: "0 4px",
        }}
      >
        {DOW_LABELS.map((label, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 0" }}>
            <span
              style={{
                fontFamily: "'Nanum Square', sans-serif",
                fontWeight: 400,
                fontSize: 13,
                color: i === 0 ? "#E05252" : i === 6 ? "#5B7FBF" : "#2A2A2A",
                lineHeight: "18px",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── CALENDAR GRID ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          // When no panel: equal-height rows filling all remaining space
          // When panel shown: auto-height compact rows
          gridTemplateRows: showDetail
            ? `repeat(${numRows}, auto)`
            : `repeat(${numRows}, 1fr)`,
          padding: "0 4px",
          flex: showDetail ? "0 0 auto" : 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {cells.map((cell, idx) => {
          const col = idx % 7;
          const key = dayKey(cell.year, cell.month, cell.day);
          const isSelected = key === selectedKey;
          return (
            <DateCell
              key={`${key}-${idx}`}
              cell={cell}
              colIndex={col}
              isSelected={isSelected}
              compact={showDetail}
              onClick={() => setSelectedKey(isSelected ? "" : key)}
            />
          );
        })}
      </div>

      {/* ── DAY DETAIL PANEL (scrollable, no visible scrollbar) ── */}
      {showDetail && selectedCell && (
        <div
          className="panel-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
          }}
        >
          <DayDetailPanel
            cell={selectedCell}
            events={selectedEvents}
            onEventClick={(ev) => openEventDetail(ev, selectedCell)}
          />
          {/* bottom padding for FAB */}
          <div style={{ height: 88 }} />
        </div>
      )}

      {/* ── FAB ── */}
      <div
        style={{
          position: "fixed",
          bottom: 76,
          right: "max(20px, calc(50% - 175px))",
          zIndex: 50,
        }}
      >
        <button
          onClick={openNewEvent}
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            backgroundColor: "#2C2C2E",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.28)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <path d="M11 4V18M4 11H18" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── EVENT DETAIL / ADD MODAL ── */}
      {modalOpen && (
        <EventDetailModal
          event={modalEvent}
          isNew={modalIsNew}
          onClose={() => setModalOpen(false)}
          onSave={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}