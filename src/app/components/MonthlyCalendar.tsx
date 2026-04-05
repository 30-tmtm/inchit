import { useState, useRef, useEffect } from "react";
import {
  getDayMeta,
  dayKey,
  CalEvent,
  getAllEvents,
  upsertCalendarEvent,
  deleteCalendarEvent,
} from "./CalendarData";
import {
  EventDetailModal,
  EventFormData,
  calEventToFormData,
  eventFormToCalEvent,
  makeNewEventFormData,
} from "./EventDetailModal";
import { VaccinationPanel } from "./VaccinationPanel";
import { COLOR, FONT } from "../tokens";
import { getSeoulTodayParts } from "../utils/seoulDate";

// ─── constants ───────────────────────────────
const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const KR_DAY = ["일", "월", "화", "수", "목", "금", "토"];

// ─── helpers ─────────────────────────────────
function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function firstDOW(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}
function isToday(y: number, m: number, d: number) {
  const today = getSeoulTodayParts();
  return y === today.year && m === today.month && d === today.day;
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
function korTo24h(t: string): string {
  if (t.startsWith("오전 ")) {
    const [h, m] = t.replace("오전 ", "").split(":");
    const hour = parseInt(h);
    return `${String(hour === 12 ? 0 : hour).padStart(2, "0")}:${m}`;
  }
  if (t.startsWith("오후 ")) {
    const [h, m] = t.replace("오후 ", "").split(":");
    const hour = parseInt(h);
    return `${String(hour === 12 ? 12 : hour + 12).padStart(2, "0")}:${m}`;
  }
  return t;
}

function parseFormDate(str: string) {
  const matched = str.match(/(\d{2,4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
  if (!matched) {
    return getSeoulTodayParts();
  }
  const year = Number(matched[1]);
  return {
    year: year < 100 ? 2000 + year : year,
    month: Number(matched[2]),
    day: Number(matched[3]),
  };
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
          textOverflow: "clip",
          minWidth: 0,
          display: "block",
        }}
      >
        {event.title}
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
        backgroundColor: "transparent",
        ...(compact ? {} : { height: "100%" }),
      }}
    >
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

      {compact && hasEvents && (
        <div style={{ display: "flex", gap: 3, marginTop: 3, paddingLeft: 1 }}>
          {meta.events.slice(0, 3).map((ev) => (
            <EventTag key={ev.id} event={ev} compact />
          ))}
        </div>
      )}

      {!compact && isCurrentMonth && (
        <>
          {meta.lunarLabel && (
            <span style={{ fontFamily: "'Nanum Square', sans-serif", fontSize: 8, color: "#A0A0A0", marginTop: 1, lineHeight: "11px", flexShrink: 0 }}>
              {meta.lunarLabel}
            </span>
          )}
          {meta.holidayName && (
            <div style={{ marginTop: 2, backgroundColor: "#FFE5E5", borderRadius: 2, padding: "0 2px", maxWidth: "100%", flexShrink: 0 }}>
              <span style={{ fontFamily: "'Nanum Square', sans-serif", fontSize: 8, color: "#E05252", lineHeight: "13px", whiteSpace: "nowrap", overflow: "hidden", display: "block" }}>
                {truncate4(meta.holidayName)}
              </span>
            </div>
          )}
          {meta.solarTerm && !meta.holidayName && (
            <div style={{ marginTop: 2, backgroundColor: "#EBEBEB", borderRadius: 2, padding: "0 2px", maxWidth: "100%", flexShrink: 0 }}>
              <span style={{ fontFamily: "'Nanum Square', sans-serif", fontSize: 8, color: "#6E6E6E", lineHeight: "13px", whiteSpace: "nowrap", overflow: "hidden", display: "block" }}>
                {meta.solarTerm}
              </span>
            </div>
          )}
          {hasEvents && (
            <div style={{ width: "100%", marginTop: 2, overflow: "hidden" }}>
              {meta.events.slice(0, 2).map((ev) => (
                <EventTag key={ev.id} event={ev} compact={false} />
              ))}
              {meta.events.length > 2 && (
                <span style={{ fontFamily: "'Nanum Square', sans-serif", fontSize: 8, color: "#A0A0A0", marginTop: 1, display: "block" }}>
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
  const isHoliday = dowIdx === 0 || !!meta.isPublicHoliday;
  const isSat = dowIdx === 6;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        backgroundColor: "#FAFAFA",
        borderRadius: "20px 20px 0 0",
      }}
    >
      {/* drag handle */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 6 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#D9D9D9" }} />
      </div>

      {/* day info row */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "6px 20px 14px 20px" }}>
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
          <span style={{ fontFamily: "'Nanum Square', sans-serif", fontSize: 12, color: "#AAAAAA" }}>
            {lunarStr}
          </span>
        )}
      </div>

      {/* divider */}
      <div style={{ height: 1, backgroundColor: "#EFEFEF", margin: "0 20px 14px 20px" }} />

      {/* 예방접종 / 건강검진 배너 */}
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
              <div style={{ width: 4, borderRadius: 4, backgroundColor: ev.color, flexShrink: 0, alignSelf: "stretch", minHeight: 44 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: "'Nanum Square', sans-serif", fontWeight: 700, fontSize: 15, color: "#2A2A2A", lineHeight: "21px" }}>
                  {ev.title}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="5.5" stroke="#BBBBBB" strokeWidth="1.2" />
                    <path d="M6.5 3.5V6.5L8.5 8" stroke="#BBBBBB" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <span style={{ fontFamily: "'Nanum Square', sans-serif", fontSize: 12, color: "#AAAAAA", lineHeight: "18px" }}>
                    {korTo24h(ev.startTime)} ~ {korTo24h(ev.endTime)}
                  </span>
                </div>
                {ev.location && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M6.5 1.5C4.567 1.5 3 3.067 3 5C3 7.5 6.5 11.5 6.5 11.5C6.5 11.5 10 7.5 10 5C10 3.067 8.433 1.5 6.5 1.5Z" stroke="#BBBBBB" strokeWidth="1.2" />
                      <circle cx="6.5" cy="5" r="1.3" stroke="#BBBBBB" strokeWidth="1.1" />
                    </svg>
                    <span style={{ fontFamily: "'Nanum Square', sans-serif", fontSize: 12, color: "#AAAAAA", lineHeight: "18px" }}>
                      {ev.location}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Search Screen ────────────────────────────

function SearchScreen({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const allEvents = getAllEvents();
  const filtered = query.trim().length === 0
    ? []
    : allEvents.filter(({ event }) =>
        event.title.toLowerCase().includes(query.toLowerCase())
      );

  // 날짜별 그룹핑 (최신순)
  const grouped: Array<{ label: string; year: number; month: number; day: number; events: CalEvent[] }> = [];
  for (const { year, month, day, event } of filtered) {
    const label = `${year}년 ${month}월 ${day}일`;
    const existing = grouped.find(g => g.year === year && g.month === month && g.day === day);
    if (existing) {
      existing.events.push(event);
    } else {
      const dowIdx = new Date(year, month - 1, day).getDay();
      grouped.push({ label: `${year}년 ${month}월 ${day}일 ${KR_DAY[dowIdx]}요일`, year, month, day, events: [event] });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#FFFFFF", fontFamily: "'Nanum Square', sans-serif" }}>
      {/* 검색 헤더 */}
      <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #F0F0F0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", backgroundColor: "#F2F2F7", borderRadius: 12, padding: "8px 12px", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6.5" stroke="#AAAAAA" strokeWidth="1.6" />
              <path d="M14 14L18 18" stroke="#AAAAAA" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="일정 검색"
              style={{
                flex: 1, border: "none", background: "none", outline: "none",
                fontFamily: "'Nanum Square', sans-serif", fontSize: 15, color: "#1C1C1E",
              }}
            />
            {query.length > 0 && (
              <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" fill="#C7C7CC" />
                  <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nanum Square', sans-serif", fontSize: 15, color: "#3D6AB5", padding: "4px 0", flexShrink: 0 }}
          >
            취소
          </button>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="panel-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {query.trim().length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 10 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="22" cy="22" r="15" stroke="#E0E0E0" strokeWidth="2.5" />
              <path d="M33 33L43 43" stroke="#E0E0E0" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 14, color: "#BBBBBB" }}>검색어를 입력하세요</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 10 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="22" cy="22" r="15" stroke="#E0E0E0" strokeWidth="2.5" />
              <path d="M33 33L43 43" stroke="#E0E0E0" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 14, color: "#BBBBBB" }}>"{query}" 검색 결과가 없어요</span>
          </div>
        ) : (
          grouped.map(group => (
            <div key={`${group.year}-${group.month}-${group.day}`}>
              {/* 날짜 그룹 헤더 */}
              <div style={{ padding: "10px 20px 6px", backgroundColor: "#F7F7F7" }}>
                <span style={{ fontFamily: "'Nanum Square', sans-serif", fontWeight: 700, fontSize: 12, color: "#8A8A8E" }}>
                  {group.label}
                </span>
              </div>
              {/* 해당 날짜 일정 */}
              <div style={{ padding: "0 20px" }}>
                {group.events.map(ev => (
                  <div
                    key={ev.id}
                    style={{
                      display: "flex", alignItems: "stretch", gap: 12,
                      padding: "12px 0",
                      borderBottom: "1px solid #F2F2F2",
                    }}
                  >
                    <div style={{ width: 3, borderRadius: 3, backgroundColor: ev.color, flexShrink: 0, alignSelf: "stretch", minHeight: 36 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontFamily: "'Nanum Square', sans-serif", fontWeight: 700, fontSize: 14, color: "#1C1C1E", display: "block" }}>
                        {ev.title}
                      </span>
                      <span style={{ fontFamily: "'Nanum Square', sans-serif", fontSize: 12, color: "#AAAAAA", marginTop: 3, display: "block" }}>
                        {korTo24h(ev.startTime)} ~ {korTo24h(ev.endTime)}
                      </span>
                      {ev.location && (
                        <span style={{ fontFamily: "'Nanum Square', sans-serif", fontSize: 12, color: "#AAAAAA", marginTop: 2, display: "block" }}>
                          📍 {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
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
  const today = getSeoulTodayParts();
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [selectedKey, setSelectedKey] = useState(
    dayKey(today.year, today.month, today.day)
  );
  const [modalEvent, setModalEvent] = useState<EventFormData | null>(null);
  const [modalIsNew, setModalIsNew] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [, setEventRevision] = useState(0);

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
    const cell = selectedCell ?? { year: today.year, month: today.month, day: today.day };
    setModalEvent(makeNewEventFormData(cell.year, cell.month, cell.day));
    setModalIsNew(true);
    setModalOpen(true);
  }

  function handleSaveEvent(data: EventFormData) {
    const nextDate = parseFormDate(data.startDate);
    const nextKey = dayKey(nextDate.year, nextDate.month, nextDate.day);
    upsertCalendarEvent(nextKey, eventFormToCalEvent(data));
    setYear(nextDate.year);
    setMonth(nextDate.month);
    setSelectedKey(nextKey);
    setModalOpen(false);
    setEventRevision((value) => value + 1);
  }

  function handleDeleteEvent(id: string) {
    deleteCalendarEvent(id);
    setModalOpen(false);
    setEventRevision((value) => value + 1);
  }

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }
  function goToToday() {
    const nextToday = getSeoulTodayParts();
    setYear(nextToday.year);
    setMonth(nextToday.month);
    setSelectedKey(dayKey(nextToday.year, nextToday.month, nextToday.day));
  }

  // 검색 화면
  if (searchMode) {
    return (
      <div style={{ width: "100%", maxWidth: 430, height: "100%", overflow: "hidden", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column" }}>
        <SearchScreen onClose={() => setSearchMode(false)} />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 430,
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
          padding: "14px 16px 8px 16px",
        }}
      >
        {/* 좌: 연월 표기 */}
        <span style={{ fontFamily: "'Nanum Square', sans-serif", fontWeight: 800, fontSize: 22, color: "#2A2A2A", lineHeight: "28px", letterSpacing: "-0.3px" }}>
          {year}.{String(month).padStart(2, "0")}
        </span>

        {/* 우: 이전/다음 + 검색 + 오늘 */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
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
          {/* 검색 */}
          <button onClick={() => setSearchMode(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6.5" stroke="#2A2A2A" strokeWidth="1.6" />
              <path d="M14 14L18 18" stroke="#2A2A2A" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          {/* 오늘로 */}
          <button
            onClick={goToToday}
            style={{
              backgroundColor: "#1C1C1E", border: "none", cursor: "pointer",
              padding: "5px 11px", borderRadius: 8,
              fontFamily: "'Nanum Square', sans-serif", fontSize: 12, fontWeight: 800,
              color: "#FFFFFF", letterSpacing: "-0.2px",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            오늘
          </button>
        </div>
      </div>

      {/* ── DAY-OF-WEEK ROW ── */}
      <div style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 4px" }}>
        {DOW_LABELS.map((label, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 0" }}>
            <span style={{ fontFamily: "'Nanum Square', sans-serif", fontWeight: 400, fontSize: 13, color: i === 0 ? "#E05252" : i === 6 ? "#5B7FBF" : "#2A2A2A", lineHeight: "18px" }}>
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
          gridTemplateRows: showDetail ? `repeat(${numRows}, auto)` : `repeat(${numRows}, 1fr)`,
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

      {/* ── DAY DETAIL PANEL ── */}
      {showDetail && selectedCell && (
        <div
          className="panel-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
            backgroundColor: "#FFFFFF",
          }}
        >
          <DayDetailPanel
            cell={selectedCell}
            events={selectedEvents}
            onEventClick={(ev) => openEventDetail(ev, selectedCell)}
          />
          <div style={{ height: 88, backgroundColor: "#FAFAFA" }} />
        </div>
      )}

      {/* ── FAB ── */}
      <div style={{ position: "fixed", bottom: 76, right: "max(20px, calc(50% - 175px))", zIndex: 50 }}>
        <button
          onClick={openNewEvent}
          style={{
            width: 52, height: 52, borderRadius: "50%",
            backgroundColor: "#2C2C2E", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
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
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
}
