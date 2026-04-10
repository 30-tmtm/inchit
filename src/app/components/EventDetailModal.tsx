import { useState, useEffect, useRef } from "react";
import { CalEvent } from "./CalendarData";
import { COLOR, FONT, RADIUS, SHADOW } from "../tokens";
import { PALETTE_25, DEFAULT_COLOR, ColorBottomSheet } from "./PickerComponents";

// ─── Types ────────────────────────────────────

export interface EventFormData {
  id: string;
  title: string;
  color: string;
  category: CalEvent["category"];
  allDay: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  repeat: string;
  location: string;
  description: string;
  alarm: string;
  done: boolean;
  dday: boolean;
}

interface DateState { year: number; month: number; day: number }
interface TimeState { ampm: "오전" | "오후"; hour: number; minute: number }

interface Props {
  event: EventFormData | null;
  isNew: boolean;
  onClose: () => void;
  onSave?: (data: EventFormData) => void;
  onDelete?: (id: string) => void;
}

// ─── Options ─────────────────────────────────
const REPEAT_OPTIONS = ["안 함", "매일", "매주", "2주마다", "매월", "매년"];
const ALARM_OPTIONS = [
  "없음", "5분 전", "10분 전", "15분 전", "30분 전",
  "1시간 전", "2시간 전", "1일 전", "2일 전", "1주 전",
];
const DOW_KR = ["일", "월", "화", "수", "목", "금", "토"];

const AMPM_LIST = ["오전", "오후"];
const HOUR_LIST = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTE_LIST = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0")
);

// ─── Date/Time Helpers ───────────────────────

function parseDateStr(str: string): DateState {
  const m = str.match(/(\d+)\.\s*(\d+)\.\s*(\d+)/);
  if (m) {
    const y = parseInt(m[1]);
    return { year: y < 100 ? 2000 + y : y, month: parseInt(m[2]), day: parseInt(m[3]) };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

function parseTimeStr(str: string): TimeState {
  const m = str.match(/(오전|오후)\s*(\d+):(\d+)/);
  if (m) {
    return { ampm: m[1] as "오전" | "오후", hour: parseInt(m[2]), minute: parseInt(m[3]) };
  }
  return { ampm: "오전", hour: 9, minute: 0 };
}

function formatDateDisplay(d: DateState): string {
  return `${d.year}. ${d.month}. ${d.day}.`;
}

function formatTimeDisplay(t: TimeState): string {
  return `${t.ampm} ${t.hour}:${String(t.minute).padStart(2, "0")}`;
}

function formatDateStore(d: DateState): string {
  const dow = new Date(d.year, d.month - 1, d.day).getDay();
  return `${String(d.year).slice(2)}. ${d.month}. ${d.day}.(${DOW_KR[dow]})`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function firstDOW(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

function makeEmpty(dateStr?: string): EventFormData {
  const now = new Date();
  const defaultDate = dateStr ?? `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}.`;
  return {
    id: `ev-new-${Date.now()}`,
    title: "",
    color: DEFAULT_COLOR,
    category: "health",
    allDay: false,
    startDate: defaultDate,
    startTime: "오전 9:00",
    endDate: defaultDate,
    endTime: "오전 10:00",
    repeat: "안 함",
    location: "",
    description: "",
    alarm: "없음",
    done: false,
    dday: false,
  };
}

// ─── Inline Mini Calendar ─────────────────────

function InlineCalendar({
  selected,
  onChange,
}: {
  selected: DateState;
  onChange: (d: DateState) => void;
}) {
  const [calYear, setCalYear] = useState(selected.year);
  const [calMonth, setCalMonth] = useState(selected.month);

  function prevMonth() {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); }
    else setCalMonth(m => m + 1);
  }

  const firstDay = firstDOW(calYear, calMonth);
  const totalDays = daysInMonth(calYear, calMonth);
  const cells: Array<{ day: number; isCurrentMonth: boolean }> = [];

  const prevTotal = daysInMonth(calYear, calMonth === 1 ? 12 : calMonth - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevTotal - i, isCurrentMonth: false });
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, isCurrentMonth: true });
  }
  const needed = (Math.ceil(cells.length / 7) * 7) - cells.length;
  for (let d = 1; d <= needed; d++) {
    cells.push({ day: d, isCurrentMonth: false });
  }

  const isSelected = (d: number, cur: boolean) =>
    cur && d === selected.day && calYear === selected.year && calMonth === selected.month;

  return (
    <div
      style={{
        padding: "12px 16px 16px 16px",
        backgroundColor: COLOR.bgCard,
        fontFamily: FONT.base,
      }}
    >
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
          {calYear}년 {calMonth}월
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={prevMonth}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", color: COLOR.textMuted }}
          >
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M6 1L1 6L6 11" stroke={COLOR.textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", color: COLOR.textMuted }}
          >
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1 1L6 6L1 11" stroke={COLOR.textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* DOW labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div key={d} style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}>
            <span style={{
              fontSize: 11,
              color: i === 0 ? COLOR.calHoliday : i === 6 ? COLOR.calSaturday : COLOR.textMuted,
            }}>
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px 0" }}>
        {cells.map((cell, idx) => {
          const col = idx % 7;
          const sel = isSelected(cell.day, cell.isCurrentMonth);
          return (
            <div
              key={idx}
              onClick={() => {
                if (!cell.isCurrentMonth) return;
                onChange({ year: calYear, month: calMonth, day: cell.day });
              }}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "3px 0",
                cursor: cell.isCurrentMonth ? "pointer" : "default",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: sel ? COLOR.primary : "transparent",
                }}
              >
                <span style={{
                  fontSize: 13,
                  fontWeight: sel ? 700 : 400,
                  color: sel
                    ? COLOR.textOnDark
                    : !cell.isCurrentMonth
                    ? COLOR.textDisabled
                    : col === 0
                    ? COLOR.calHoliday
                    : col === 6
                    ? COLOR.calSaturday
                    : COLOR.textPrimary,
                }}>
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

// ─── Drum Roll Time Picker ────────────────────

const ITEM_H = 40;

function DrumColumn({
  items,
  selectedIdx,
  onChange,
  visibleRows = 5,
}: {
  items: string[];
  selectedIdx: number;
  onChange: (idx: number) => void;
  visibleRows?: 3 | 5;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settling = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const padRows = Math.floor(visibleRows / 2);
  const pickerHeight = ITEM_H * visibleRows;
  const fadeHeight = ITEM_H * padRows;

  // Sync scroll position when selectedIdx changes from outside
  useEffect(() => {
    if (ref.current && !settling.current) {
      ref.current.scrollTop = selectedIdx * ITEM_H;
    }
  }, [selectedIdx]);

  function handleScroll() {
    settling.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      settling.current = false;
      if (ref.current) {
        const idx = Math.round(ref.current.scrollTop / ITEM_H);
        const clamped = Math.max(0, Math.min(idx, items.length - 1));
        onChange(clamped);
        // snap
        ref.current.scrollTop = clamped * ITEM_H;
      }
    }, 80);
  }

  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden", height: pickerHeight }}>
      {/* Top gradient */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: fadeHeight,
        background: `linear-gradient(to bottom, ${COLOR.bgCard}, ${COLOR.bgCard}cc, transparent)`,
        zIndex: 2, pointerEvents: "none",
      }} />
      {/* Bottom gradient */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: fadeHeight,
        background: `linear-gradient(to top, ${COLOR.bgCard}, ${COLOR.bgCard}cc, transparent)`,
        zIndex: 2, pointerEvents: "none",
      }} />
      {/* Selection indicator */}
      <div style={{
        position: "absolute", top: ITEM_H * padRows, left: 0, right: 0, height: ITEM_H,
        backgroundColor: COLOR.bgApp,
        borderRadius: RADIUS.sm,
        zIndex: 1,
      }} />
      {/* Scrollable list */}
      <div
        ref={ref}
        onScroll={handleScroll}
        style={{
          height: pickerHeight,
          overflowY: "scroll",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          position: "relative",
          zIndex: 3,
        } as React.CSSProperties}
      >
        {/* Top spacer */}
        <div style={{ height: ITEM_H * padRows }} />
        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => {
              onChange(i);
              if (ref.current) ref.current.scrollTop = i * ITEM_H;
            }}
            style={{
              height: ITEM_H,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 17,
              fontWeight: i === selectedIdx ? 700 : 400,
              color: i === selectedIdx ? COLOR.textPrimary : COLOR.textMuted,
              fontFamily: FONT.base,
              letterSpacing: "-0.3px",
              transition: "color 0.1s",
            }}
          >
            {item}
          </div>
        ))}
        {/* Bottom spacer */}
        <div style={{ height: ITEM_H * padRows }} />
      </div>
    </div>
  );
}

function InlineTimePicker({
  time,
  onChange,
  visibleRows = 5,
}: {
  time: TimeState;
  onChange: (t: TimeState) => void;
  visibleRows?: 3 | 5;
}) {
  const ampmIdx = AMPM_LIST.indexOf(time.ampm);
  const hourIdx = HOUR_LIST.indexOf(String(time.hour));
  const minuteIdx = MINUTE_LIST.indexOf(String(time.minute).padStart(2, "0"));

  return (
    <div style={{ display: "flex", backgroundColor: COLOR.bgCard, padding: "8px 16px 16px" }}>
      <DrumColumn
        items={AMPM_LIST}
        selectedIdx={ampmIdx === -1 ? 0 : ampmIdx}
        onChange={(i) => onChange({ ...time, ampm: AMPM_LIST[i] as "오전" | "오후" })}
        visibleRows={visibleRows}
      />
      <DrumColumn
        items={HOUR_LIST}
        selectedIdx={hourIdx === -1 ? 0 : hourIdx}
        onChange={(i) => onChange({ ...time, hour: parseInt(HOUR_LIST[i]) })}
        visibleRows={visibleRows}
      />
      <DrumColumn
        items={MINUTE_LIST}
        selectedIdx={minuteIdx === -1 ? 0 : minuteIdx}
        onChange={(i) => onChange({ ...time, minute: parseInt(MINUTE_LIST[i]) })}
        visibleRows={visibleRows}
      />
    </div>
  );
}

// ─── Bottom Sheet Selector ────────────────────

function BottomSheet({
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 400 }}
      />
      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: 0,
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 390,
          backgroundColor: COLOR.bgCard,
          borderRadius: "20px 20px 0 0",
          zIndex: 401,
          paddingBottom: 34,
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
          fontFamily: FONT.base,
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 8px 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: COLOR.border }} />
        </div>
        {/* Title */}
        <div style={{ padding: "4px 20px 10px 20px" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
            {title}
          </span>
        </div>
        {/* Options */}
        {options.map((opt, i) => (
          <div
            key={opt}
            onClick={() => { onSelect(opt); onClose(); }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "15px 24px",
              cursor: "pointer",
              borderTop: i === 0 ? `1px solid ${COLOR.borderLight}` : "none",
              borderBottom: `1px solid ${COLOR.borderLight}`,
              backgroundColor: "transparent",
            }}
          >
            <span style={{
              fontSize: 15,
              fontWeight: opt === selected ? 600 : 400,
              color: opt === selected ? COLOR.textPrimary : COLOR.textSecondary,
              letterSpacing: "-0.3px",
            }}>
              {opt}
            </span>
            {opt === selected && (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path d="M1 6L6 11L15 1" stroke={COLOR.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Card Group Wrapper ───────────────────────

function CardGroup({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: COLOR.bgCard,
        borderRadius: RADIUS.lg,
        boxShadow: SHADOW.card,
        marginBottom: 0,
      }}
    >
      {children}
    </div>
  );
}

function GroupDivider() {
  return (
    <div style={{ height: 1, backgroundColor: COLOR.borderLight, marginLeft: 16 }} />
  );
}

// ─── Inline Color Grid (32px chips) ───────────

function InlineColorGrid({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
  function needsDarkCheck(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7;
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, padding: "14px 16px" }}>
      {PALETTE_25.map(color => {
        const isSelected = selected === color;
        const dark = needsDarkCheck(color);
        return (
          <div
            key={color}
            onClick={() => onSelect(color)}
            style={{
              width: 32, height: 32, borderRadius: "50%", backgroundColor: color,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto",
              boxShadow: isSelected ? `0 0 0 2px ${COLOR.bgCard}, 0 0 0 3.5px ${color}` : "none",
              transition: "box-shadow 0.15s",
            }}
          >
            {isSelected && (
              <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                <path d="M1 5L4.5 8.5L12 1" stroke={dark ? "#555" : "#fff"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Date/Time Row ────────────────────────────

type ActiveField = "startDate" | "startTime" | "endDate" | "endTime" | null;

// ─── Toggle ──────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: value ? "#34C759" : COLOR.border,
        position: "relative",
        cursor: "pointer",
        transition: "background-color 0.2s ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: value ? 23 : 3,
          width: 22,
          height: 22,
          borderRadius: "50%",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          transition: "left 0.2s ease",
        }}
      />
    </div>
  );
}

function DateTimeChip({
  label,
  isActive,
  onClick,
  type,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  type: "date" | "time";
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: type === "date" ? "5px 10px" : "5px 10px",
        borderRadius: RADIUS.sm,
        border: "none",
        backgroundColor: isActive ? COLOR.primary : COLOR.bgApp,
        cursor: "pointer",
        fontFamily: FONT.base,
        fontSize: 14,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? COLOR.textOnDark : COLOR.textPrimary,
        letterSpacing: "-0.3px",
        transition: "background-color 0.15s, color 0.15s",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {label}
    </button>
  );
}

// ─── Main Modal ───────────────────────────────

export function EventDetailModal({ event, isNew, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<EventFormData>(() => event ?? makeEmpty());

  // Parse dates for inline pickers
  const [startDate, setStartDateState] = useState<DateState>(() =>
    parseDateStr(event?.startDate ?? "")
  );
  const [endDate, setEndDateState] = useState<DateState>(() =>
    parseDateStr(event?.endDate ?? "")
  );
  const [startTime, setStartTimeState] = useState<TimeState>(() =>
    parseTimeStr(event?.startTime ?? "오전 9:00")
  );
  const [endTime, setEndTimeState] = useState<TimeState>(() =>
    parseTimeStr(event?.endTime ?? "오전 10:00")
  );

  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [repeatSheet, setRepeatSheet] = useState(false);
  const [alarmSheet, setAlarmSheet] = useState(false);
  const [colorSheet, setColorSheet] = useState(false);

  useEffect(() => {
    const base = event ?? makeEmpty();
    setForm(base);
    setStartDateState(parseDateStr(base.startDate));
    setEndDateState(parseDateStr(base.endDate));
    setStartTimeState(parseTimeStr(base.startTime));
    setEndTimeState(parseTimeStr(base.endTime));
    setActiveField(null);
  }, [event]);

  function update<K extends keyof EventFormData>(key: K, val: EventFormData[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function handleStartDateChange(d: DateState) {
    setStartDateState(d);
    update("startDate", formatDateStore(d));
    // If end is before start, sync end
    const startMs = new Date(d.year, d.month - 1, d.day).getTime();
    const endMs = new Date(endDate.year, endDate.month - 1, endDate.day).getTime();
    if (endMs < startMs) {
      setEndDateState(d);
      update("endDate", formatDateStore(d));
    }
  }

  function handleEndDateChange(d: DateState) {
    setEndDateState(d);
    update("endDate", formatDateStore(d));
  }

  function handleStartTimeChange(t: TimeState) {
    setStartTimeState(t);
    update("startTime", formatTimeDisplay(t));
  }

  function handleEndTimeChange(t: TimeState) {
    setEndTimeState(t);
    update("endTime", formatTimeDisplay(t));
  }

  function toggleField(field: ActiveField) {
    setActiveField(prev => (prev === field ? null : field));
  }

  function handleSave() {
    onSave?.(form);
    onClose();
  }

  function handleDelete() {
    if (!isNew) onDelete?.(form.id);
    onClose();
  }

  return (
    <>
      {/* Backdrop - solid to look like a full page */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: COLOR.bgApp,
          zIndex: 200,
        }}
      />

      {/* Modal Panel */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          top: 0,
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 390,
          height: "100dvh",
          backgroundColor: COLOR.bgApp,
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          fontFamily: FONT.base,
        }}
      >
        {/* ── 앱바 ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            backgroundColor: COLOR.bgCard,
            flexShrink: 0,
            borderBottom: `1px solid ${COLOR.borderLight}`,
          }}
        >
          {/* X 닫기 */}
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 4, display: "flex", alignItems: "center", justifyContent: "center",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2L16 16M16 2L2 16" stroke={COLOR.textPrimary} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* 제목 */}
          <span style={{
            fontSize: 16, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px",
          }}>
            {isNew ? "새 일정" : "일정"}
          </span>

          {/* 저장 */}
          <button
            onClick={handleSave}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: FONT.base,
              fontSize: 15,
              fontWeight: 600,
              color: COLOR.primary,
              letterSpacing: "-0.3px",
              padding: "4px 2px",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            저장
          </button>
        </div>

        {/* ── 스크롤 콘텐츠 ── */}
        <div
          className="panel-scroll"
          style={{ flex: 1, minHeight: 0, overflowY: "scroll", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}
        >
          {/* ── 그룹 1: 제목 / 장소 ── */}
          <CardGroup>
            {/* 제목 */}
            <div style={{ padding: "14px 16px" }}>
              <input
                type="text"
                value={form.title}
                onChange={e => update("title", e.target.value)}
                placeholder="제목"
                style={{
                  width: "100%",
                  fontFamily: FONT.base,
                  fontSize: 15,
                  color: COLOR.textPrimary,
                  border: "none",
                  outline: "none",
                  padding: 0,
                  backgroundColor: "transparent",
                  letterSpacing: "-0.3px",
                }}
              />
            </div>
            <GroupDivider />
            {/* 장소 */}
            <div style={{ padding: "14px 16px" }}>
              <input
                type="text"
                value={form.location}
                onChange={e => update("location", e.target.value)}
                placeholder="장소"
                style={{
                  width: "100%",
                  fontFamily: FONT.base,
                  fontSize: 15,
                  color: COLOR.textPrimary,
                  border: "none",
                  outline: "none",
                  padding: 0,
                  backgroundColor: "transparent",
                  letterSpacing: "-0.3px",
                }}
              />
            </div>
          </CardGroup>

          {/* ── 그룹 2: 시간 ── */}
          <CardGroup>
            {/* 하루 종일 */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px",
            }}>
              <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>하루 종일</span>
              <Toggle
                value={form.allDay}
                onChange={v => {
                  update("allDay", v);
                  if (v) setActiveField(null);
                }}
              />
            </div>
            <GroupDivider />

            {/* 시작 */}
            <div style={{ padding: "13px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>시작</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <DateTimeChip
                    label={formatDateDisplay(startDate)}
                    isActive={activeField === "startDate"}
                    type="date"
                    onClick={() => toggleField("startDate")}
                  />
                  {!form.allDay && (
                    <DateTimeChip
                      label={formatTimeDisplay(startTime)}
                      isActive={activeField === "startTime"}
                      type="time"
                      onClick={() => toggleField("startTime")}
                    />
                  )}
                </div>
              </div>
            </div>

            {activeField === "startDate" && (
              <>
                <GroupDivider />
                <InlineCalendar
                  selected={startDate}
                  onChange={d => handleStartDateChange(d)}
                />
              </>
            )}
            {activeField === "startTime" && !form.allDay && (
              <>
                <GroupDivider />
                <InlineTimePicker time={startTime} visibleRows={3} onChange={handleStartTimeChange} />
              </>
            )}

            <GroupDivider />

            {/* 종료 */}
            <div style={{ padding: "13px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>종료</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <DateTimeChip
                    label={formatDateDisplay(endDate)}
                    isActive={activeField === "endDate"}
                    type="date"
                    onClick={() => toggleField("endDate")}
                  />
                  {!form.allDay && (
                    <DateTimeChip
                      label={formatTimeDisplay(endTime)}
                      isActive={activeField === "endTime"}
                      type="time"
                      onClick={() => toggleField("endTime")}
                    />
                  )}
                </div>
              </div>
            </div>

            {activeField === "endDate" && (
              <>
                <GroupDivider />
                <InlineCalendar
                  selected={endDate}
                  onChange={d => handleEndDateChange(d)}
                />
              </>
            )}
            {activeField === "endTime" && !form.allDay && (
              <>
                <GroupDivider />
                <InlineTimePicker time={endTime} visibleRows={3} onChange={handleEndTimeChange} />
              </>
            )}
          </CardGroup>

          {/* ── 그룹 3: 반복 / 알림 ── */}
          <CardGroup>
            {/* 반복 */}
            <div
              onClick={() => setRepeatSheet(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "15px 16px", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>반복</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, color: COLOR.textMuted, letterSpacing: "-0.3px" }}>
                  {form.repeat}
                </span>
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                  <path d="M1 1L5 5L1 9" stroke={COLOR.textDisabled} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <GroupDivider />
            {/* 알림 */}
            <div
              onClick={() => setAlarmSheet(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "15px 16px", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>알림</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, color: COLOR.textMuted, letterSpacing: "-0.3px" }}>
                  {form.alarm}
                </span>
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                  <path d="M1 1L5 5L1 9" stroke={COLOR.textDisabled} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </CardGroup>

          {/* ── 그룹 4: 색상 ── */}
          <CardGroup>
            {/* 색상 행 */}
            <div
              onClick={() => setColorSheet(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "13px 16px", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>색상</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", backgroundColor: form.color,
                  flexShrink: 0,
                }} />
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                  <path d="M1 1L5 5L1 9" stroke={COLOR.textDisabled} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </CardGroup>

          {/* ── 그룹 5: 메모 ── */}
          <CardGroup>
            <div style={{ padding: "14px 16px" }}>
              <textarea
                value={form.description}
                onChange={e => update("description", e.target.value)}
                placeholder="메모"
                rows={3}
                style={{
                  width: "100%",
                  fontFamily: FONT.base,
                  fontSize: 15,
                  color: COLOR.textPrimary,
                  border: "none",
                  outline: "none",
                  padding: 0,
                  backgroundColor: "transparent",
                  resize: "none",
                  letterSpacing: "-0.3px",
                }}
              />
            </div>
          </CardGroup>

          {/* 삭제 버튼 (기존 일정만) */}
          {!isNew && (
            <button
              onClick={handleDelete}
              style={{
                width: "100%",
                padding: "15px",
                backgroundColor: COLOR.bgCard,
                border: "none",
                borderRadius: RADIUS.lg,
                cursor: "pointer",
                fontFamily: FONT.base,
                fontSize: 15,
                fontWeight: 500,
                color: COLOR.danger,
                letterSpacing: "-0.3px",
                boxShadow: SHADOW.card,
              }}
            >
              일정 삭제
            </button>
          )}

          <div style={{ height: 20 }} />
        </div>
      </div>

      {/* Bottom Sheets */}
      {repeatSheet && (
        <BottomSheet
          title="반복"
          options={REPEAT_OPTIONS}
          selected={form.repeat}
          onSelect={v => update("repeat", v)}
          onClose={() => setRepeatSheet(false)}
        />
      )}
      {alarmSheet && (
        <BottomSheet
          title="알림"
          options={ALARM_OPTIONS}
          selected={form.alarm}
          onSelect={v => update("alarm", v)}
          onClose={() => setAlarmSheet(false)}
        />
      )}
      {colorSheet && (
        <ColorBottomSheet
          selected={form.color}
          onConfirm={c => update("color", c)}
          onClose={() => setColorSheet(false)}
        />
      )}
    </>
  );
}

// ─── Exports for CalendarData ────────────────

const KR_DOW = ["일", "월", "화", "수", "목", "금", "토"];

export function calEventToFormData(
  ev: CalEvent,
  year: number,
  month: number,
  day: number
): EventFormData {
  const dow = new Date(year, month - 1, day).getDay();
  const dateStr = `${year}. ${month}. ${day}.`;
  return {
    id: ev.id,
    title: ev.title,
    color: ev.color,
    category: ev.category,
    allDay: false,
    startDate: dateStr,
    startTime: ev.startTime,
    endDate: dateStr,
    endTime: ev.endTime,
    repeat: "안 함",
    location: ev.location ?? "",
    description: "",
    alarm: "없음",
    done: false,
    dday: false,
  };
}

export function makeNewEventFormData(
  year: number,
  month: number,
  day: number
): EventFormData {
  return makeEmpty(`${year}. ${month}. ${day}.`);
}

export function eventFormToCalEvent(form: EventFormData): CalEvent {
  return {
    id: form.id,
    title: form.title.trim() || "새 일정",
    startTime: form.startTime,
    endTime: form.endTime,
    color: form.color,
    category: form.category,
    location: form.location.trim() || undefined,
  };
}