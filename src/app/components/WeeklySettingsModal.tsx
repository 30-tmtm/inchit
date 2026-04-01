import { useState, useEffect } from "react";
import { COLOR, FONT, RADIUS } from "../tokens";
import {
  TimeState, hourToTimeState, timeStateToHour, hourToTimeStr,
  InlineTimePicker, BottomSheet, CardGroup, GroupDivider,
} from "./PickerComponents";

// ─── Types ────────────────────────────────────

export interface WeeklySettings {
  showDays: 5 | 6 | 7;   // 5=월~금, 6=월~토, 7=월~일
  startH: number;         // display start hour (integer)
  endH: number;           // display end hour (integer)
}

export const DEFAULT_WEEKLY_SETTINGS: WeeklySettings = {
  showDays: 7,
  startH: 7,
  endH: 21,
};

interface Props {
  settings: WeeklySettings;
  onSave: (s: WeeklySettings) => void;
  onClose: () => void;
}

const SHOW_DAYS_OPTIONS = ["월~금", "월~토", "월~일"];

function showDaysLabel(n: 5 | 6 | 7): string {
  return n === 5 ? "월~금" : n === 6 ? "월~토" : "월~일";
}
function labelToShowDays(label: string): 5 | 6 | 7 {
  return label === "월~금" ? 5 : label === "월~토" ? 6 : 7;
}

// ─── Main Modal ───────────────────────────────

export function WeeklySettingsModal({ settings, onSave, onClose }: Props) {
  const [showDays, setShowDays] = useState(settings.showDays);
  const [startTime, setStartTime] = useState<TimeState>(() => hourToTimeState(settings.startH));
  const [endTime, setEndTime] = useState<TimeState>(() => hourToTimeState(settings.endH));
  const [activeField, setActiveField] = useState<"startTime" | "endTime" | null>(null);
  const [daysSheet, setDaysSheet] = useState(false);

  useEffect(() => {
    setShowDays(settings.showDays);
    setStartTime(hourToTimeState(settings.startH));
    setEndTime(hourToTimeState(settings.endH));
    setActiveField(null);
  }, [settings]);

  function handleSave() {
    onSave({
      showDays,
      startH: Math.round(timeStateToHour(startTime)),
      endH: Math.round(timeStateToHour(endTime)),
    });
    onClose();
  }

  function toggleField(f: "startTime" | "endTime") {
    setActiveField(prev => prev === f ? null : f);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 300 }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed", left: "50%", top: 0, transform: "translateX(-50%)",
          width: "100%", maxWidth: 390, height: "100dvh",
          backgroundColor: COLOR.bgApp, zIndex: 301,
          display: "flex", flexDirection: "column", fontFamily: FONT.base,
        }}
      >
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
            시간표 설정
          </span>
          <button onClick={handleSave} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: FONT.base, fontSize: 15, fontWeight: 600,
            color: COLOR.primary, letterSpacing: "-0.3px", padding: "4px 2px",
            WebkitTapHighlightColor: "transparent",
          }}>저장</button>
        </div>

        {/* ── 콘텐츠 ── */}
        <div
          className="panel-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}
        >
          {/* ── 그룹 1: 표시 요일 ── */}
          <CardGroup>
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
                  {showDaysLabel(showDays)}
                </span>
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                  <path d="M1 1L5 5L1 9" stroke={COLOR.textDisabled} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </CardGroup>

          {/* ── 그룹 2: 표시 시간 ── */}
          <CardGroup>
            {/* 시작 시간 */}
            <div style={{ padding: "13px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>시작 시간</span>
                <button
                  onClick={() => toggleField("startTime")}
                  style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "5px 12px", borderRadius: RADIUS.sm, border: "none",
                    backgroundColor: activeField === "startTime" ? COLOR.primary : COLOR.bgApp,
                    cursor: "pointer", fontFamily: FONT.base, fontSize: 14,
                    fontWeight: activeField === "startTime" ? 600 : 400,
                    color: activeField === "startTime" ? COLOR.textOnDark : COLOR.textPrimary,
                    letterSpacing: "-0.3px", transition: "background-color 0.15s",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {hourToTimeStr(timeStateToHour(startTime))}
                </button>
              </div>
            </div>
            {activeField === "startTime" && (
              <>
                <GroupDivider />
                <InlineTimePicker time={startTime} onChange={t => { setStartTime(t); }} />
              </>
            )}

            <GroupDivider />

            {/* 종료 시간 */}
            <div style={{ padding: "13px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>종료 시간</span>
                <button
                  onClick={() => toggleField("endTime")}
                  style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "5px 12px", borderRadius: RADIUS.sm, border: "none",
                    backgroundColor: activeField === "endTime" ? COLOR.primary : COLOR.bgApp,
                    cursor: "pointer", fontFamily: FONT.base, fontSize: 14,
                    fontWeight: activeField === "endTime" ? 600 : 400,
                    color: activeField === "endTime" ? COLOR.textOnDark : COLOR.textPrimary,
                    letterSpacing: "-0.3px", transition: "background-color 0.15s",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {hourToTimeStr(timeStateToHour(endTime))}
                </button>
              </div>
            </div>
            {activeField === "endTime" && (
              <>
                <GroupDivider />
                <InlineTimePicker time={endTime} onChange={t => { setEndTime(t); }} />
              </>
            )}
          </CardGroup>

          <div style={{ height: 20 }} />
        </div>
      </div>

      {/* 요일 Bottom Sheet */}
      {daysSheet && (
        <BottomSheet
          title="표시 요일"
          options={SHOW_DAYS_OPTIONS}
          selected={showDaysLabel(showDays)}
          onSelect={v => setShowDays(labelToShowDays(v))}
          onClose={() => setDaysSheet(false)}
        />
      )}
    </>
  );
}
