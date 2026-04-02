import { useState, useEffect, useRef } from "react";
import { COLOR, FONT, RADIUS, SHADOW } from "../tokens";
import {
  TimeState, hourToTimeState, timeStateToHour, hourToTimeStr,
  InlineTimePicker, BottomSheet, CardGroup, GroupDivider, PALETTE_25, DEFAULT_COLOR,
  ColorBottomSheet,
} from "./PickerComponents";
import { WeeklySettings } from "./WeeklySettingsModal";

// ??? Types ????????????????????????????????????

export interface WeeklyEventFormData {
  id: string;
  title: string;
  days: number[];    // 0=? 1=? 2=? 3=? 4=? 5=? 6=?
  startH: number;
  endH: number;
  location: string;
  color: string;
  alarm: string;
  memo: string;       // ???/??
}

interface Props {
  data: WeeklyEventFormData | null;
  isNew: boolean;
  viewSettings: WeeklySettings;
  onClose: () => void;
  onSave: (data: WeeklyEventFormData) => void;
  onViewSettingsChange: (s: WeeklySettings) => void;
  onDelete?: (id: string) => void;
}

// ??? Constants ????????????????????????????????

const DAY_LABELS = ["?", "?", "?", "?", "?", "?", "?"];
const ALARM_OPTIONS = ["??", "5? ?", "10? ?", "30? ?", "1?? ?"];
const SHOW_DAYS_OPTIONS = ["?~?", "?~?", "?~?"];

type ActiveField = "startTime" | "endTime" | "viewTime" | "viewStartTime" | "viewEndTime" | null;

function makeEmpty(): WeeklyEventFormData {
  return {
    id: `wev-${Date.now()}`,
    title: "", days: [], startH: 16, endH: 18,
    location: "", color: DEFAULT_COLOR, alarm: "??", memo: "",
  };
}

function showDaysLabel(n: 5 | 6 | 7) {
  return n === 5 ? "?~?" : n === 6 ? "?~?" : "?~?";
}
function labelToShowDays(label: string): 5 | 6 | 7 {
  return label === "?~?" ? 5 : label === "?~?" ? 6 : 7;
}

// ??? Chevron ??????????????????????????????????

function Chevron() {
  return (
    <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
      <path d="M1 1L5 5L1 9" stroke={COLOR.textDisabled} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ??? Time Chip ????????????????????????????????

function TimeChip({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "5px 12px", borderRadius: RADIUS.sm, border: "none",
        backgroundColor: isActive ? COLOR.primary : COLOR.bgApp,
        cursor: "pointer", fontFamily: FONT.base, fontSize: 14,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? COLOR.textOnDark : COLOR.textPrimary,
        letterSpacing: "-0.3px", transition: "background-color 0.15s, color 0.15s",
        WebkitTapHighlightColor: "transparent",
      }}
    >{label}</button>
  );
}

// ??? Main Modal ???????????????????????????????

export function WeeklyEventModal({
  data, isNew, viewSettings, onClose, onSave, onViewSettingsChange, onDelete,
}: Props) {
  const [form, setForm] = useState<WeeklyEventFormData>(() => data ?? makeEmpty());
  const [startTime, setStartTime] = useState<TimeState>(() => hourToTimeState(data?.startH ?? 16));
  const [endTime, setEndTime] = useState<TimeState>(() => hourToTimeState(data?.endH ?? 18));
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [alarmSheet, setAlarmSheet] = useState(false);
  const [daysSheet, setDaysSheet] = useState(false);
  const [colorSheet, setColorSheet] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // View settings local state (editable in modal)
  const [viewStartTime, setViewStartTime] = useState<TimeState>(() => hourToTimeState(viewSettings.startH));
  const [viewEndTime, setViewEndTime] = useState<TimeState>(() => hourToTimeState(viewSettings.endH));
  const [viewShowDays, setViewShowDays] = useState(viewSettings.showDays);

  useEffect(() => {
    const base = data ?? makeEmpty();
    setForm(base);
    setStartTime(hourToTimeState(base.startH));
    setEndTime(hourToTimeState(base.endH));
    setActiveField(null);
  }, [data]);

  useEffect(() => {
    setViewStartTime(hourToTimeState(viewSettings.startH));
    setViewEndTime(hourToTimeState(viewSettings.endH));
    setViewShowDays(viewSettings.showDays);
  }, [viewSettings]);

  function update<K extends keyof WeeklyEventFormData>(key: K, val: WeeklyEventFormData[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function toggleDay(idx: number) {
    setForm(prev => {
      const days = prev.days.includes(idx) ? prev.days.filter(d => d !== idx) : [...prev.days, idx];
      return { ...prev, days };
    });
  }

  function handleStartTimeChange(t: TimeState) {
    setStartTime(t);
    const h = timeStateToHour(t);
    update("startH", h);
    if (timeStateToHour(endTime) <= h) {
      const newEnd = hourToTimeState(Math.min(h + 1, 24));
      setEndTime(newEnd);
      update("endH", timeStateToHour(newEnd));
    }
  }

  function handleEndTimeChange(t: TimeState) {
    setEndTime(t);
    update("endH", timeStateToHour(t));
  }

  function toggleField(field: ActiveField) {
    setActiveField(prev => prev === field ? null : field);
  }

  function handleSave() {
    onSave({ ...form, startH: timeStateToHour(startTime), endH: timeStateToHour(endTime) });
    onViewSettingsChange({
      showDays: viewShowDays,
      startH: Math.round(timeStateToHour(viewStartTime)),
      endH: Math.round(timeStateToHour(viewEndTime)),
    });
    onClose();
  }

  function handleDelete() {
    onDelete?.(form.id);
    onClose();
  }

  const viewTimeLabel = `${hourToTimeStr(timeStateToHour(viewStartTime))} ~ ${hourToTimeStr(timeStateToHour(viewEndTime))}`;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 200 }} />

      {/* Modal Panel */}
      <div style={{
        position: "fixed", left: "50%", top: 0, transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, height: "100dvh",
        backgroundColor: COLOR.bgApp, zIndex: 201,
        display: "flex", flexDirection: "column", fontFamily: FONT.base,
      }}>
        {/* ?? ?? ?? */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", backgroundColor: COLOR.bgCard, flexShrink: 0,
          borderBottom: `1px solid ${COLOR.borderLight}`,
        }}>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", padding: 4,
            display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent",
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2L16 16M16 2L2 16" stroke={COLOR.textPrimary} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
            {isNew ? "? ???" : "??"}
          </span>
          <button onClick={handleSave} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: FONT.base, fontSize: 15, fontWeight: 600,
            color: COLOR.primary, letterSpacing: "-0.3px", padding: "4px 2px",
            WebkitTapHighlightColor: "transparent",
          }}>??</button>
        </div>

        {/* ?? ??? ??? ?? */}
        <div
          ref={scrollRef}
          className="panel-scroll"
          style={{ flex: 1, minHeight: 0, overflowY: "scroll", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}
        >
          {/* ?? ?? 1: ?? ?? ?? */}
          <CardGroup>
            <div style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {DAY_LABELS.map((label, idx) => {
                  const selected = form.days.includes(idx);
                  return (
                    <div
                      key={label}
                      onClick={() => toggleDay(idx)}
                      style={{
                        width: 36, height: 36, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                        backgroundColor: selected ? form.color : "transparent",
                        border: selected ? "none" : `1.5px solid ${COLOR.borderMid}`,
                        transition: "background-color 0.15s",
                      }}
                    >
                      <span style={{
                        fontSize: 13, fontWeight: selected ? 700 : 400,
                        color: selected ? "#FFFFFF" : COLOR.textMuted, letterSpacing: "-0.2px",
                      }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardGroup>

          {/* ?? ?? 2: ?? ?? ?? */}
          <CardGroup>
            {/* ?? */}
            <div style={{ padding: "13px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>??</span>
                <TimeChip
                  label={hourToTimeStr(timeStateToHour(startTime))}
                  isActive={activeField === "startTime"}
                  onClick={() => toggleField("startTime")}
                />
              </div>
            </div>
            {activeField === "startTime" && (
              <><GroupDivider /><InlineTimePicker time={startTime} onChange={handleStartTimeChange} /></>
            )}
            <GroupDivider />
            {/* ?? */}
            <div style={{ padding: "13px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>??</span>
                <TimeChip
                  label={hourToTimeStr(timeStateToHour(endTime))}
                  isActive={activeField === "endTime"}
                  onClick={() => toggleField("endTime")}
                />
              </div>
            </div>
            {activeField === "endTime" && (
              <><GroupDivider /><InlineTimePicker time={endTime} onChange={handleEndTimeChange} /></>
            )}
          </CardGroup>

          {/* ?? ?? 3: ?? / ?? / ??? ?? */}
          <CardGroup>
            <div style={{ padding: "14px 16px" }}>
              <input
                type="text"
                value={form.title}
                onChange={e => update("title", e.target.value)}
                placeholder="??"
                style={{
                  width: "100%", fontFamily: FONT.base, fontSize: 15,
                  color: COLOR.textPrimary, border: "none", outline: "none",
                  padding: 0, backgroundColor: "transparent", letterSpacing: "-0.3px",
                }}
              />
            </div>
            <GroupDivider />
            <div style={{ padding: "14px 16px" }}>
              <input
                type="text"
                value={form.location}
                onChange={e => update("location", e.target.value)}
                placeholder="??"
                style={{
                  width: "100%", fontFamily: FONT.base, fontSize: 15,
                  color: COLOR.textPrimary, border: "none", outline: "none",
                  padding: 0, backgroundColor: "transparent", letterSpacing: "-0.3px",
                }}
              />
            </div>
            <GroupDivider />
            <div style={{ padding: "14px 16px" }}>
              <input
                type="text"
                value={form.memo}
                onChange={e => update("memo", e.target.value)}
                placeholder="???/??"
                style={{
                  width: "100%", fontFamily: FONT.base, fontSize: 15,
                  color: COLOR.textPrimary, border: "none", outline: "none",
                  padding: 0, backgroundColor: "transparent", letterSpacing: "-0.3px",
                }}
              />
            </div>
          </CardGroup>

          {/* ?? ?? 4: ?? ?? ?? */}
          <CardGroup>
            <div
              onClick={() => setColorSheet(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "13px 16px", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>??</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", backgroundColor: form.color,
                  flexShrink: 0,
                }} />
                <Chevron />
              </div>
            </div>
          </CardGroup>

          {/* ?? ?? 5: ?? ?? */}
          <CardGroup>
            <div
              onClick={() => setAlarmSheet(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "15px 16px", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>??</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, color: COLOR.textMuted, letterSpacing: "-0.3px" }}>{form.alarm}</span>
                <Chevron />
              </div>
            </div>
          </CardGroup>

          {/* ?? ?? 6: ?? ?? ?? */}
          <CardGroup>
            {/* ?? ?? */}
            <div
              onClick={() => setDaysSheet(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "15px 16px", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>?? ??</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, color: COLOR.textMuted, letterSpacing: "-0.3px" }}>
                  {showDaysLabel(viewShowDays)}
                </span>
                <Chevron />
              </div>
            </div>
            <GroupDivider />
            {/* ?? ?? */}
            <div
              onClick={() => {
                const opening = activeField !== "viewTime";
                toggleField("viewTime");
                if (opening) {
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
                  }, 80);
                }
              }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "15px 16px", cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>?? ??</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, color: COLOR.textMuted, letterSpacing: "-0.3px" }}>
                  {viewTimeLabel}
                </span>
                <Chevron />
              </div>
            </div>
            {activeField === "viewTime" && (
              <>
                <GroupDivider />
                {/* ?? ?? sub-row */}
                <div style={{ padding: "11px 16px 11px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, color: COLOR.textSecondary, letterSpacing: "-0.3px" }}>?? ??</span>
                    <TimeChip
                      label={hourToTimeStr(timeStateToHour(viewStartTime))}
                      isActive={activeField === "viewStartTime"}
                      onClick={() => setActiveField(prev => prev === "viewStartTime" ? "viewTime" : "viewStartTime")}
                    />
                  </div>
                </div>
                {activeField === "viewStartTime" && (
                  <><GroupDivider /><InlineTimePicker time={viewStartTime} onChange={t => { setViewStartTime(t); setActiveField("viewTime"); }} /></>
                )}
                <GroupDivider />
                {/* ?? ?? sub-row */}
                <div style={{ padding: "11px 16px 11px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, color: COLOR.textSecondary, letterSpacing: "-0.3px" }}>?? ??</span>
                    <TimeChip
                      label={hourToTimeStr(timeStateToHour(viewEndTime))}
                      isActive={activeField === "viewEndTime"}
                      onClick={() => setActiveField(prev => prev === "viewEndTime" ? "viewTime" : "viewEndTime")}
                    />
                  </div>
                </div>
                {activeField === "viewEndTime" && (
                  <><GroupDivider /><InlineTimePicker time={viewEndTime} onChange={t => { setViewEndTime(t); setActiveField("viewTime"); }} /></>
                )}
              </>
            )}
          </CardGroup>

          {/* ?? ?? ?? (?? ??) ?? */}
          {!isNew && (
            <button
              onClick={handleDelete}
              style={{
                width: "100%", padding: "15px", backgroundColor: COLOR.bgCard,
                border: "none", borderRadius: RADIUS.lg, cursor: "pointer",
                fontFamily: FONT.base, fontSize: 15, fontWeight: 500,
                color: COLOR.danger, letterSpacing: "-0.3px", boxShadow: SHADOW.card,
              }}
            >?? ??</button>
          )}

          <div style={{ height: 20 }} />
        </div>
      </div>

      {/* Alarm Bottom Sheet */}
      {alarmSheet && (
        <BottomSheet
          title="??" options={ALARM_OPTIONS} selected={form.alarm}
          onSelect={v => update("alarm", v)} onClose={() => setAlarmSheet(false)}
        />
      )}
      {/* Days Bottom Sheet */}
      {daysSheet && (
        <BottomSheet
          title="?? ??" options={SHOW_DAYS_OPTIONS} selected={showDaysLabel(viewShowDays)}
          onSelect={v => setViewShowDays(labelToShowDays(v))} onClose={() => setDaysSheet(false)}
        />
      )}
      {/* Color Bottom Sheet */}
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
