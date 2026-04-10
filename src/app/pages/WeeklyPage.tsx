import { useState, useRef, useEffect } from "react";
import { COLOR, FONT, RADIUS, SHADOW } from "../tokens";
import { useScrollFade } from "../hooks/useScrollFade";
import { useChild } from "../contexts/ChildContext";
import { WeeklyEventModal, WeeklyEventFormData } from "../components/WeeklyEventModal";
import { WeeklySettingsModal, WeeklySettings, DEFAULT_WEEKLY_SETTINGS } from "../components/WeeklySettingsModal";
import { hourToTimeStr as _hourToTimeStr } from "../components/PickerComponents"; // reserved for future use

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

// ─── Mock Data (removed - using localStorage) ─────────

// ─── localStorage helpers ────────────────────
const weeklyStorageKey = (childId: string) => `inchit_weekly_${childId}`;

function loadWeeklyEntries(childId: string): ScheduleEntry[] {
  try {
    const raw = localStorage.getItem(weeklyStorageKey(childId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveWeeklyEntries(childId: string, entries: ScheduleEntry[]) {
  localStorage.setItem(weeklyStorageKey(childId), JSON.stringify(entries));
}

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
  const [entries, setEntries] = useState<ScheduleEntry[]>(() => loadWeeklyEntries(selectedChild.id));
  useEffect(() => {
    setEntries(loadWeeklyEntries(selectedChild.id));
  }, [selectedChild.id]);

  // entries 변경 시 저장
  useEffect(() => {
    saveWeeklyEntries(selectedChild.id, entries);
  }, [entries, selectedChild.id]);

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
            return (
              <div
                key={d}
                style={{ flex: 1, position: "relative", borderLeft: `1px solid ${COLOR.borderLight}` }}
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
                        fontSize: 11, color: "#fff", fontWeight: 700,
                        textAlign: "center", lineHeight: "15px",
                        whiteSpace: "pre-line", overflow: "hidden",
                      }}>
                        {entry.title}
                      </span>
                    </div>
                  );
                })}

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