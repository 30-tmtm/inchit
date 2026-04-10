import { useState, useRef, useEffect } from "react";
import { formatAgeShort } from "../utils/ageFormat";
import { ChevronDown, Check, Plus } from "lucide-react";
import { WeeklyPage } from "./WeeklyPage";
import { MonthlyCalendar } from "../components/MonthlyCalendar";
import { COLOR, FONT, RADIUS } from "../tokens";
import { useChild } from "../contexts/ChildContext";

type CalView = "weekly" | "monthly";

// 자녀 순서 레이블
const ORDINALS = ["첫째", "둘째", "셋째", "넷째", "다섯째", "여섯째"];
function getOrdinal(idx: number): string {
  return ORDINALS[idx] ?? `${idx + 1}번째`;
}

export function CalendarPage() {
  const [view, setView] = useState<CalView>("monthly");
  const { childList, selectedChild, setSelectedChildId } = useChild();

  const sortedChildren = [...childList].sort((a, b) => a.dob.localeCompare(b.dob));
  const showOrdinal = childList.length > 1;
  function childLabel(childId: string, name: string): string {
    if (!showOrdinal) return name;
    const idx = sortedChildren.findIndex(c => c.id === childId);
    return `${getOrdinal(idx)} ${name}`;
  }

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      overflow: "hidden", backgroundColor: COLOR.bgCard, fontFamily: FONT.base,
    }}>
      {/* ── 앱바 ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px 10px", backgroundColor: COLOR.bgCard, flexShrink: 0,
      }}>
        {/* 좌: 자녀 선택 드롭다운 */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: RADIUS.pill,
              border: "none", backgroundColor: COLOR.primary, cursor: "pointer",
              fontFamily: FONT.base, fontSize: 15, fontWeight: 700,
              color: "#fff", letterSpacing: "-0.3px",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {childLabel(selectedChild.id, selectedChild.name)}
            <ChevronDown
              size={15} color="rgba(255,255,255,0.85)" strokeWidth={2}
              style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
            />
          </button>

          {dropdownOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0,
              backgroundColor: COLOR.bgCard, borderRadius: RADIUS.md,
              boxShadow: "0 4px 20px rgba(0,0,0,0.13)", zIndex: 100,
              minWidth: 200, overflow: "hidden",
            }}>
              {[...childList].sort((a, b) => a.dob.localeCompare(b.dob)).map(child => {
                const isSelected = selectedChild.id === child.id;
                return (
                  <button
                    key={child.id}
                    onClick={() => { setSelectedChildId(child.id); setDropdownOpen(false); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center",
                      justifyContent: "space-between", padding: "14px 16px",
                      backgroundColor: isSelected ? COLOR.bgApp : "transparent",
                      border: "none", borderBottom: `1px solid ${COLOR.borderLight}`,
                      cursor: "pointer", fontFamily: FONT.base, textAlign: "left",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <span style={{
                      fontSize: 14, fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? COLOR.textPrimary : COLOR.textSecondary,
                      letterSpacing: "-0.3px",
                    }}>
                      {childLabel(child.id, child.name)}
                      <span style={{ fontWeight: 400, color: COLOR.textMuted, marginLeft: 5 }}>
                        · {formatAgeShort(child.months)}
                      </span>
                    </span>
                    {isSelected && <Check size={15} color={COLOR.textPrimary} strokeWidth={2.5} />}
                  </button>
                );
              })}
              <button
                onClick={() => { setDropdownOpen(false); alert("베타 출시 이후 다자녀 지원 예정입니다 (유료 구독제)"); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "14px 16px", backgroundColor: "transparent", border: "none",
                  cursor: "pointer", fontFamily: FONT.base, textAlign: "left",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Plus size={15} color={COLOR.textMuted} strokeWidth={2} />
                <span style={{ fontSize: 14, fontWeight: 500, color: COLOR.textMuted, letterSpacing: "-0.3px" }}>
                  자녀 추가
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 우: Pill Switch */}
        <div style={{
          position: "relative",
          display: "flex", backgroundColor: COLOR.bgApp,
          borderRadius: RADIUS.pill, padding: 3,
        }}>
          {/* 슬라이딩 배경 */}
          <div style={{
            position: "absolute",
            top: 3, bottom: 3, left: 3,
            width: "calc(50% - 3px)",
            borderRadius: RADIUS.pill,
            backgroundColor: COLOR.bgCard,
            boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
            transform: view === "monthly" ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: "none",
          }} />
          {(["monthly", "weekly"] as CalView[]).map(v => {
            const isActive = view === v;
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  flex: 1,
                  padding: "6px 16px", borderRadius: RADIUS.pill, border: "none",
                  cursor: "pointer", fontFamily: FONT.base, fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? COLOR.textPrimary : COLOR.textMuted,
                  backgroundColor: "transparent",
                  transition: "color 0.22s ease",
                  letterSpacing: "-0.2px",
                  WebkitTapHighlightColor: "transparent", whiteSpace: "nowrap",
                  position: "relative", zIndex: 1,
                }}
              >
                {v === "weekly" ? "주간" : "월간"}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 콘텐츠 영역 ── */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
        <div style={{
          position: "absolute", inset: 0,
          display: view === "weekly" ? "flex" : "none", flexDirection: "column",
        }}>
          {/* WeeklyPage manages its own settings internally */}
          <WeeklyPage embedded />
        </div>
        <div style={{
          position: "absolute", inset: 0,
          display: view === "monthly" ? "flex" : "none", flexDirection: "column",
        }}>
          <MonthlyCalendar />
        </div>
      </div>
    </div>
  );
}
