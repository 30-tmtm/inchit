import { useState, useRef, useEffect } from "react";
import { COLOR, FONT, RADIUS, SHADOW } from "../tokens";
import { useScrollFade } from "../hooks/useScrollFade";
import { useChild } from "../contexts/ChildContext";
import { WeeklyEventModal, WeeklyEventFormData } from "../components/WeeklyEventModal";
import { WeeklySettingsModal, WeeklySettings, DEFAULT_WEEKLY_SETTINGS } from "../components/WeeklySettingsModal";
import { hourToTimeStr } from "../components/PickerComponents";

// ─── Types ────────────────────────────────────

interface ScheduleEntry {
  id: string;
  title: string;
  days: number[];   // 0=월 … 6=일
  startH: number;
  endH: number;
  location: string;
  color: string;
  alarm: string;
  memo: string;
}

// ─── Mock Data ────────────────────────────────

const MOCK_ENTRIES: Record<string, ScheduleEntry[]> = {
  c1: [],
  c2: [],
};

const ALL_DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const HOUR_H = 52;

function entryToFormData(entry: ScheduleEntry): WeeklyEventFormData {
  return { ...entry };
}

// ─── Props ────────────────────────────────────

interface WeeklyPageProps {
  embedded?: boolean;
  settings?: WeeklySettings;
  onOpenSettings?: () => void;
}

// ─── Component ────────────────────────────────

export function WeeklyPage({ embedded = false, settings: propSettings, onOpenSettings }: WeeklyPageProps) {
  const { selectedChild } = useChild();

  // ── Entries (schedule blocks) state
  const [entries, setEntries] = useState<ScheduleEntry[]>(() => MOCK_ENTRIES[selectedChild.id] ?? []);
  useEffect(() => {
    setEntries(MOCK_ENTRIES[selectedChild.id] ?? []);
  }, [selectedChild.id]);

  // ── Settings (standalone mode only)
  const [internalSettings, setInternalSettings] = useState<WeeklySettings>(DEFAULT_WEEKLY_SETTINGS);
  const effectiveSettings: WeeklySettings = (embedded && propSettings) ? propSettings : internalSettings;

  const displayDayCount = effectiveSettings.showDays;
  const displayDays = ALL_DAY_LABELS.slice(0, displayDayCount);
  const displayHours: number[] = Array.from(
    { length: effectiveSettings.endH - effectiveSettings.startH + 1 },
    (_, i) => effectiveSettings.startH + i
  );

  // ── Modal state
  const [modalData, setModalData] = useState<WeeklyEventFormData | null>(null);
  const [modalIsNew, setModalIsNew] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  function openNewEvent(prefilledDays: number[] = [], startH = 16, endH = 18) {
    setModalData({
      id: `wev-${Date.now()}`,
      title: "", days: prefilledDays,
      startH, endH, location: "",
      color: "#ABCDDE", alarm: "없음", memo: "",
    });
    setModalIsNew(true);
    setModalOpen(true);
  }

  function openEditEvent(entry: ScheduleEntry) {
    setModalData(entryToFormData(entry));
    setModalIsNew(false);
    setModalOpen(true);
  }

  function handleSaveEntry(data: WeeklyEventFormData) {
    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === data.id);
      return idx >= 0
        ? prev.map(e => e.id === data.id ? data : e)
        : [...prev, data];
    });
  }

  function handleDeleteEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  // ── Drag-to-add state
  const scrollRef = useScrollFade();
  const [ghostBlock, setGhostBlock] = useState<{ dayIdx: number; startH: number; endH: number } | null>(null);

  const pointerStateRef = useRef<{
    active: boolean;
    dayIdx: number;
    anchorH: number;
    startY: number;
    startH: number;
    endH: number;
    pointerId: number;
    target: Element | null;
  } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable wrapper pattern: handlers stored in ref to avoid stale closures
  const handlerRef = useRef({
    move: (_e: PointerEvent) => {},
    up: (_e: PointerEvent) => {},
  });

  // clientY → decimal hour in the display range
  function clientYToHour(clientY: number): number {
    if (!scrollRef.current) return displayHours[0];
    const rect = scrollRef.current.getBoundingClientRect();
    const relY = clientY - rect.top + scrollRef.current.scrollTop;
    const raw = displayHours[0] + relY / HOUR_H;
    const snapped = Math.round(raw * 2) / 2; // 30min snapping
    return Math.max(displayHours[0], Math.min(displayHours[displayHours.length - 1], snapped));
  }

  // Update handlers every render (they close over latest state via refs)
  handlerRef.current.move = (e: PointerEvent) => {
    const ps = pointerStateRef.current;
    if (!ps) return;
    if (!ps.active) {
      // 20px 이상 움직이면 롱프레스 취소 (이전 10px에서 완화)
      if (Math.abs(e.clientY - ps.startY) > 20) {
        if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
        pointerStateRef.current = null;
      }
      return;
    }
    e.preventDefault();
    const curH = clientYToHour(e.clientY);
    const startH = Math.min(ps.anchorH, curH);
    const endH = Math.max(ps.anchorH + 0.5, curH + 0.5);
    ps.startH = startH;
    ps.endH = endH;
    setGhostBlock({ dayIdx: ps.dayIdx, startH, endH });
  };

  handlerRef.current.up = (_e: PointerEvent) => {
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
    const ps = pointerStateRef.current;
    if (ps?.active) {
      const { dayIdx, startH, endH } = ps;
      setGhostBlock(null);
      pointerStateRef.current = null;
      openNewEvent([dayIdx], startH, endH);
    } else {
      pointerStateRef.current = null;
      setGhostBlock(null);
    }
  };

  // Add stable global listeners once
  useEffect(() => {
    const onMove = (e: PointerEvent) => handlerRef.current.move(e);
    const onUp = (e: PointerEvent) => handlerRef.current.up(e);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  function handleColumnPointerDown(e: React.PointerEvent, dayIdx: number) {
    // Only primary button / touch
    if (e.button !== undefined && e.button !== 0) return;
    const anchorH = clientYToHour(e.clientY);
    const target = e.currentTarget;
    const pointerId = e.pointerId;
    pointerStateRef.current = {
      active: false, dayIdx, anchorH,
      startY: e.clientY, startH: anchorH, endH: anchorH + 1,
      pointerId, target,
    };
    // 500ms → 280ms: 더 빠르게 반응
    longPressTimerRef.current = setTimeout(() => {
      const ps = pointerStateRef.current;
      if (!ps) return;
      ps.active = true;
      // 포인터 캡처: 빠른 드래그에도 추적이 끊기지 않음
      try { target.setPointerCapture(pointerId); } catch { /* ignore */ }
      setGhostBlock({ dayIdx: ps.dayIdx, startH: ps.startH, endH: ps.endH });
    }, 280);
  }

  return (
    <div style={{
      width: "100%", height: "100%", backgroundColor: COLOR.bgCard,
      display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: FONT.base,
    }}>
      {/* ── 앱바 (standalone only) ── */}
      {!embedded && (
        <div style={{
          padding: "14px 20px", backgroundColor: COLOR.bgCard,
          borderBottom: `1px solid ${COLOR.borderLight}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
            주간 시간표
          </span>
        </div>
      )}

      {/* ── 요일 헤더 ── */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid #E5E8EB",
        flexShrink: 0, backgroundColor: "#FFFFFF",
      }}>
        <div style={{ width: 40, flexShrink: 0 }} />
        {displayDays.map((d, i) => (
          <div key={d} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 0" }}>
            <span style={{
              fontWeight: 700, fontSize: 12,
              color: i === 5 && displayDayCount > 5 ? COLOR.calSaturday
                : i === 6 && displayDayCount > 6 ? COLOR.calHoliday
                : COLOR.primary,
            }}>{d}</span>
          </div>
        ))}
      </div>

      {/* ── 시간표 그리드 ── */}
      <div
        ref={scrollRef}
        className="panel-scroll"
        style={{ flex: 1, overflowY: "auto", position: "relative" }}
      >
        <div style={{ display: "flex", position: "relative" }}>
          {/* 시간 레이블 열 */}
          <div style={{ width: 40, flexShrink: 0 }}>
            {displayHours.map(h => (
              <div key={h} style={{
                height: HOUR_H, display: "flex", alignItems: "flex-start",
                justifyContent: "flex-end", paddingRight: 8, paddingTop: 4,
              }}>
                <span style={{ fontSize: 10, color: COLOR.textDisabled, lineHeight: 1 }}>{h}</span>
              </div>
            ))}
          </div>

          {/* 요일 열 */}
          {displayDays.map((d, dayIdx) => {
            const dayEntries = entries.filter(e => e.days.includes(dayIdx));
            const dayGhost = ghostBlock?.dayIdx === dayIdx ? ghostBlock : null;
            return (
              <div
                key={d}
                style={{ flex: 1, position: "relative", borderLeft: `1px solid ${COLOR.borderLight}`, touchAction: "pan-x" }}
                onPointerDown={e => handleColumnPointerDown(e, dayIdx)}
              >
                {/* Hour grid lines */}
                {displayHours.map(h => (
                  <div key={h} style={{
                    height: HOUR_H, borderBottom: `1px solid ${COLOR.borderLight}`,
                    boxSizing: "border-box",
                  }} />
                ))}

                {/* Schedule entry blocks */}
                {dayEntries.map((entry, bi) => {
                  const top = (entry.startH - displayHours[0]) * HOUR_H + 2;
                  const height = (entry.endH - entry.startH) * HOUR_H - 4;
                  if (top < 0 || height <= 0) return null;
                  return (
                    <div
                      key={entry.id + bi}
                      onClick={e => { e.stopPropagation(); openEditEvent(entry); }}
                      style={{
                        position: "absolute", top, left: 2, right: 2, height,
                        backgroundColor: entry.color, borderRadius: RADIUS.sm,
                        opacity: 0.88, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        padding: "2px 3px", cursor: "pointer",
                        overflow: "hidden",
                      }}
                    >
                      <span style={{
                        fontSize: 9, color: "#fff", fontWeight: 700,
                        textAlign: "center", lineHeight: "12px",
                        whiteSpace: "pre-line", overflow: "hidden",
                      }}>
                        {entry.title}
                      </span>
                    </div>
                  );
                })}

                {/* Ghost drag block */}
                {dayGhost && (() => {
                  const top = (dayGhost.startH - displayHours[0]) * HOUR_H;
                  const height = (dayGhost.endH - dayGhost.startH) * HOUR_H;
                  return (
                    <div
                      style={{
                        position: "absolute", top, left: 0, right: 0, height,
                        backgroundColor: "#C1DBE8",
                        opacity: 0.6,
                        borderRadius: RADIUS.sm,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        pointerEvents: "none", padding: "4px 2px",
                      }}
                    >
                      <span style={{
                        fontSize: 9, color: "#1C4F6E", fontWeight: 700,
                        textAlign: "center", lineHeight: "13px",
                      }}>
                        {hourToTimeStr(dayGhost.startH)}{"\n"}–{"\n"}{hourToTimeStr(dayGhost.endH)}
                      </span>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FAB ── */}
      <div style={{
        position: "fixed", bottom: 76,
        right: "max(20px, calc(50% - 175px))",
        zIndex: 50,
      }}>
        <button
          onClick={() => openNewEvent()}
          style={{
            width: 52, height: 52, borderRadius: "50%",
            backgroundColor: COLOR.fab, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: SHADOW.fab,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <path d="M11 4V18M4 11H18" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Modals ── */}
      {modalOpen && (
        <WeeklyEventModal
          data={modalData}
          isNew={modalIsNew}
          viewSettings={effectiveSettings}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveEntry}
          onViewSettingsChange={s => setInternalSettings(s)}
          onDelete={handleDeleteEntry}
        />
      )}

      {/* Settings modal no longer needed — settings are in the add/edit modal */}
    </div>
  );
}