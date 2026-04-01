import { useState, useEffect } from "react";
import { COLOR, FONT, RADIUS, SHADOW } from "../tokens";
import {
  TimeState, hourToTimeState, timeStateToHour, hourToTimeStr,
  InlineTimePicker, BottomSheet, CardGroup, GroupDivider, PALETTE_25, DEFAULT_COLOR,
  ColorBottomSheet,
} from "./PickerComponents";
import { WeeklySettings } from "./WeeklySettingsModal";

// ─── Types ────────────────────────────────────

export interface WeeklyEventFormData {
  id: string;
  title: string;
  days: number[];    // 0=월 1=화 2=수 3=목 4=금 5=토 6=일
  startH: number;
  endH: number;
  location: string;
  color: string;
  alarm: string;
  memo: string;       // 준비물/메모
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

// ─── Constants ────────────────────────────────

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const ALARM_OPTIONS = ["없음", "5분 전", "10분 전", "30분 전", "1시간 전"];
const SHOW_DAYS_OPTIONS = ["월~금", "월~토", "월~일"];

type ActiveField = "startTime" | "endTime" | "viewTime" | "viewStartTime" | "viewEndTime" | null;

function makeEmpty(): WeeklyEventFormData {
  return {
    id: `wev-${Date.now()}`,
    title: "", days: [], startH: 16, endH: 18,
    location: "", color: DEFAULT_COLOR, alarm: "없음", memo: "",
  };
}

function showDaysLabel(n: 5 | 6 | 7) {
  return n === 5 ? "월~금" : n === 6 ? "월~토" : "월~일";
}
function labelToShowDays(label: string): 5 | 6 | 7 {
  return label === "월~금" ? 5 : label === "월~토" ? 6 : 7;
}

// ─── Chevron ──────────────────────────────────

function Chevron() {
  return (
    <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
      <path d="M1 1L5 5L1 9" stroke={COLOR.textDisabled} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Time Chip ────────────────────────────────

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

// ─── Main Modal ───────────────────────────────

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
        width: "100%", maxWidth: 390, height: "100dvh",
        backgroundColor: COLOR.bgApp, zIndex: 201,
        display: "flex", flexDirection: "column", fontFamily: FONT.base,
      }}>
        {/* ── 앱바 ── */}
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
            {isNew ? "새 시간표" : "수정"}
          </span>
          <button onClick={handleSave} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: FONT.base, fontSize: 15, fontWeight: 600,
            color: COLOR.primary, letterSpacing: "-0.3px", padding: "4px 2px",
            WebkitTapHighlightColor: "transparent",
          }}>저장</button>
        </div>

        {/* ── 스크롤 콘텐츠 ── */}
        <div
          className="panel-scroll"
          style={{ flex: 1, minHeight: 0, overflowY: "scroll", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}
        >
          {/* ── 그룹 1: 요일 선택 ── */}
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

          {/* ── 그룹 2: 시간 ── */}
          <CardGroup>
            {/* 시작 */}
            <div style={{ padding: "13px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>시작</span>
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
            {/* 종료 */}
            <div style={{ padding: "13px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>종료</span>
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

          {/* ── 그룹 3: 제목 / 장소 / 준비물 ── */}
          <CardGroup>
            <div style={{ padding: "14px 16px" }}>
              <input
                type="text"
                value={form.title}
                onChange={e => update("title", e.target.value)}
                placeholder="제목"
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
                placeholder="장소"
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
                placeholder="준비물"
                style={{
                  width: "100%", fontFamily: FONT.base, fontSize: 15,
                  color: COLOR.textPrimary, border: "none", outline: "none",
                  padding: 0, backgroundColor: "transparent", letterSpacing: "-0.3px",
                }}
              />
            </div>
          </CardGroup>

          {/* ── 그룹 4: 색상 ── */}
          <CardGroup>
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
                  width: 30, height: 30, borderRadius: "50%", backgroundColor: form.color,
                  flexShrink: 0,
                }} />
                <Chevron />
              </div>
            </div>
          </CardGroup>

          {/* ── 그룹 5: 알림 ── */}
          <CardGroup>
            <div
              onClick={() => setAlarmSheet(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "15px 16px", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>알림</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, color: COLOR.textMuted, letterSpacing: "-0.3px" }}>{form.alarm}</span>
                <Chevron />
              </div>
            </div>
          </CardGroup>

          {/* ── 그룹 6: 보기 설정 ── */}
          <CardGroup>
            {/* 표시 요일 */}
            <div
              onClick={() => setDaysSheet(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "15px 16px", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>표시 요일</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, color: COLOR.textMuted, letterSpacing: "-0.3px" }}>
                  {showDaysLabel(viewShowDays)}
                </span>
                <Chevron />
              </div>
            </div>
            <GroupDivider />
            {/* 표시 시간 */}
            <div
              onClick={() => toggleField("viewTime")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "15px 16px", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>표시 시간</span>
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
                {/* 시작 시간 sub-row */}
                <div style={{ padding: "11px 16px 11px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, color: COLOR.textSecondary, letterSpacing: "-0.3px" }}>시작 시간</span>
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
                {/* 종료 시간 sub-row */}
                <div style={{ padding: "11px 16px 11px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, color: COLOR.textSecondary, letterSpacing: "-0.3px" }}>종료 시간</span>
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

          {/* ── 삭제 버튼 (수정 모드) ── */}
          {!isNew && (
            <button
              onClick={handleDelete}
              style={{
                width: "100%", padding: "15px", backgroundColor: COLOR.bgCard,
                border: "none", borderRadius: RADIUS.lg, cursor: "pointer",
                fontFamily: FONT.base, fontSize: 15, fontWeight: 500,
                color: COLOR.danger, letterSpacing: "-0.3px", boxShadow: SHADOW.card,
              }}
            >일정 삭제</button>
          )}

          <div style={{ height: 20 }} />
        </div>
      </div>

      {/* Alarm Bottom Sheet */}
      {alarmSheet && (
        <BottomSheet
          title="알림" options={ALARM_OPTIONS} selected={form.alarm}
          onSelect={v => update("alarm", v)} onClose={() => setAlarmSheet(false)}
        />
      )}
      {/* Days Bottom Sheet */}
      {daysSheet && (
        <BottomSheet
          title="표시 요일" options={SHOW_DAYS_OPTIONS} selected={showDaysLabel(viewShowDays)}
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