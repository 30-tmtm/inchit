import { useState, useEffect, useRef } from "react";
import { COLOR, FONT, RADIUS, SHADOW } from "../tokens";

// ─── Color Palette ────────────────────────────

export const PALETTE_25 = [
  "#EE7EA0", "#FFA9BA", "#FFD7D6", "#EA7D70", "#F69F95",
  "#FFAF6E", "#FFCC80", "#FFE2A6", "#BCC07B", "#DBE098",
  "#7D8BE0", "#B5BEF5", "#ABCDDE", "#D5EDF8", "#D5E2D3",
  "#9A81B0", "#CDBDEB", "#8E715B", "#C9A98D", "#E5DACA",
  "#000000", "#4F3F3E", "#B19F9A", "#E1CFCA", "#F1ECEA",
];
export const DEFAULT_COLOR = "#ABCDDE";

// ─── Time Helpers ─────────────────────────────

export interface TimeState { ampm: "오전" | "오후"; hour: number; minute: number }

export function hourToTimeState(h: number): TimeState {
  const floored = Math.floor(h);
  const minute = Math.round((h - floored) * 60);
  const ampm: "오전" | "오후" = floored < 12 ? "오전" : "오후";
  let hour = floored % 12;
  if (hour === 0) hour = 12;
  return { ampm, hour, minute };
}

export function timeStateToHour(t: TimeState): number {
  let h = t.hour % 12;
  if (t.ampm === "오후") h += 12;
  return h + t.minute / 60;
}

export function hourToTimeStr(h: number): string {
  const t = hourToTimeState(h);
  return `${t.ampm} ${t.hour}:${String(t.minute).padStart(2, "0")}`;
}

// ─── Drum Roll Column ─────────────────────────

const ITEM_H = 40;
const AMPM_LIST = ["오전", "오후"];
const HOUR_LIST = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTE_LIST = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

export function DrumColumn({
  items,
  selectedIdx,
  onChange,
}: {
  items: string[];
  selectedIdx: number;
  onChange: (idx: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settling = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        ref.current.scrollTop = clamped * ITEM_H;
      }
    }, 80);
  }

  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden", height: ITEM_H * 5 }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: ITEM_H * 2,
        background: `linear-gradient(to bottom, ${COLOR.bgCard}, ${COLOR.bgCard}cc, transparent)`,
        zIndex: 2, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: ITEM_H * 2,
        background: `linear-gradient(to top, ${COLOR.bgCard}, ${COLOR.bgCard}cc, transparent)`,
        zIndex: 2, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: ITEM_H * 2, left: 6, right: 6, height: ITEM_H,
        backgroundColor: COLOR.bgApp, borderRadius: RADIUS.sm, zIndex: 1,
      }} />
      <div
        ref={ref}
        onScroll={handleScroll}
        style={{
          height: ITEM_H * 5, overflowY: "scroll",
          scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
          position: "relative", zIndex: 3,
        } as React.CSSProperties}
      >
        <div style={{ height: ITEM_H * 2 }} />
        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => { onChange(i); if (ref.current) ref.current.scrollTop = i * ITEM_H; }}
            style={{
              height: ITEM_H, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 17,
              fontWeight: i === selectedIdx ? 700 : 400,
              color: i === selectedIdx ? COLOR.textPrimary : COLOR.textMuted,
              fontFamily: FONT.base, letterSpacing: "-0.3px", transition: "color 0.1s",
            }}
          >{item}</div>
        ))}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}

export function InlineTimePicker({
  time,
  onChange,
}: {
  time: TimeState;
  onChange: (t: TimeState) => void;
}) {
  const ampmIdx = AMPM_LIST.indexOf(time.ampm);
  const hourIdx = HOUR_LIST.indexOf(String(time.hour));
  const minuteIdx = MINUTE_LIST.indexOf(String(time.minute).padStart(2, "0"));

  return (
    <div style={{ display: "flex", backgroundColor: COLOR.bgCard, padding: "8px 16px 16px" }}>
      <DrumColumn
        items={AMPM_LIST}
        selectedIdx={ampmIdx === -1 ? 0 : ampmIdx}
        onChange={i => onChange({ ...time, ampm: AMPM_LIST[i] as "오전" | "오후" })}
      />
      <DrumColumn
        items={HOUR_LIST}
        selectedIdx={hourIdx === -1 ? 0 : hourIdx}
        onChange={i => onChange({ ...time, hour: parseInt(HOUR_LIST[i]) })}
      />
      <DrumColumn
        items={MINUTE_LIST}
        selectedIdx={minuteIdx === -1 ? 0 : minuteIdx}
        onChange={i => onChange({ ...time, minute: parseInt(MINUTE_LIST[i]) })}
      />
    </div>
  );
}

// ─── Bottom Sheet ─────────────────────────────

export function BottomSheet({
  title, options, selected, onSelect, onClose,
}: {
  title: string; options: string[]; selected: string;
  onSelect: (v: string) => void; onClose: () => void;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 400 }} />
      <div style={{
        position: "fixed", left: "50%", bottom: 0, transform: "translateX(-50%)",
        width: "100%", maxWidth: 390, backgroundColor: COLOR.bgCard,
        borderRadius: "20px 20px 0 0", zIndex: 401, paddingBottom: 34,
        boxShadow: "0 -4px 24px rgba(0,0,0,0.12)", fontFamily: FONT.base,
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 8px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: COLOR.border }} />
        </div>
        <div style={{ padding: "4px 20px 10px" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>{title}</span>
        </div>
        {options.map((opt, i) => (
          <div key={opt} onClick={() => { onSelect(opt); onClose(); }} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "15px 24px", cursor: "pointer",
            borderTop: i === 0 ? `1px solid ${COLOR.borderLight}` : "none",
            borderBottom: `1px solid ${COLOR.borderLight}`,
          }}>
            <span style={{
              fontSize: 15, fontWeight: opt === selected ? 600 : 400,
              color: opt === selected ? COLOR.textPrimary : COLOR.textSecondary,
              letterSpacing: "-0.3px",
            }}>{opt}</span>
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

// ─── Color Bottom Sheet ───────────────────────

export function ColorBottomSheet({
  selected,
  onConfirm,
  onClose,
}: {
  selected: string;
  onConfirm: (color: string) => void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(selected);

  function needsDarkCheck(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7;
  }

  function handleConfirm() {
    onConfirm(pending);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 500 }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed", left: "50%", bottom: 0, transform: "translateX(-50%)",
          width: "100%", maxWidth: 390, backgroundColor: COLOR.bgCard,
          borderRadius: "20px 20px 0 0", zIndex: 501,
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12)", fontFamily: FONT.base,
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 8px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: COLOR.border }} />
        </div>

        {/* Title */}
        <div style={{ padding: "4px 20px 16px" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
            색상 선택
          </span>
        </div>

        {/* Color Grid */}
        <div
          style={{
            display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
            gap: 14, padding: "4px 24px 24px",
          }}
        >
          {PALETTE_25.map(color => {
            const isSelected = pending === color;
            const dark = needsDarkCheck(color);
            return (
              <div
                key={color}
                onClick={() => setPending(color)}
                style={{
                  width: 32, height: 32, borderRadius: "50%", backgroundColor: color,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto",
                  boxShadow: isSelected ? `0 0 0 2.5px ${COLOR.bgCard}, 0 0 0 4px ${color}` : "none",
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

        {/* Confirm Button */}
        <div style={{ padding: "0 16px 34px" }}>
          <button
            onClick={handleConfirm}
            style={{
              width: "100%", padding: "15px", border: "none", borderRadius: RADIUS.lg,
              backgroundColor: COLOR.primary, cursor: "pointer",
              fontFamily: FONT.base, fontSize: 15, fontWeight: 700,
              color: COLOR.textOnDark, letterSpacing: "-0.3px",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            확인
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Card Wrapper ─────────────────────────────

export function CardGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg,
      boxShadow: SHADOW.card,
    }}>
      {children}
    </div>
  );
}

export function GroupDivider() {
  return <div style={{ height: 1, backgroundColor: COLOR.borderLight, marginLeft: 16 }} />;
}

// ─── 5×5 Color Grid ──────────────────────────

export function ColorGrid({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (c: string) => void;
}) {
  // Determine text color for checkmark
  function needsDarkCheck(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.7;
  }

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
      gap: 10, padding: "16px",
    }}>
      {PALETTE_25.map(color => {
        const isSelected = selected === color;
        const darkCheck = needsDarkCheck(color);
        return (
          <div
            key={color}
            onClick={() => onSelect(color)}
            style={{
              aspectRatio: "1", borderRadius: "50%", backgroundColor: color,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: isSelected ? `0 0 0 2.5px ${COLOR.bgCard}, 0 0 0 4px ${color}` : "none",
              transition: "box-shadow 0.15s",
            }}
          >
            {isSelected && (
              <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                <path
                  d="M1 5.5L5 9.5L13 1.5"
                  stroke={darkCheck ? "#555" : "white"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}