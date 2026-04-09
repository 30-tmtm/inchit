import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { COLOR, FONT, RADIUS } from "../tokens";
import type { Child } from "../contexts/ChildContext";
import { useChild } from "../contexts/ChildContext";

// ─────────────────────────────────────────────────
// DrumRollPicker
// ─────────────────────────────────────────────────
const ITEM_H = 48;
const VISIBLE = 5; // 한 번에 보이는 아이템 수

type DrumRollPickerProps = {
  items: string[];
  defaultIndex?: number;
  onChange: (value: string, index: number) => void;
  unit?: string; // 선택값 옆에 표시할 단위 (예: "년", "월", "일")
};

function DrumRollPicker({
  items,
  defaultIndex = 0,
  onChange,
  unit,
}: DrumRollPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(defaultIndex);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isProgrammatic = useRef(false);

  // 마운트 시 초기 위치로 스크롤 (onChange 호출 없음)
  useEffect(() => {
    if (!scrollRef.current) return;
    isProgrammatic.current = true;
    scrollRef.current.scrollTop = defaultIndex * ITEM_H;
    const t = setTimeout(() => {
      isProgrammatic.current = false;
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = useCallback(() => {
    if (isProgrammatic.current || !scrollRef.current) return;
    const raw = scrollRef.current.scrollTop / ITEM_H;
    const idx = Math.round(raw);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setActiveIdx(clamped);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(items[clamped], clamped);
      // Snap to nearest item
      if (scrollRef.current) {
        isProgrammatic.current = true;
        scrollRef.current.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
        setTimeout(() => {
          isProgrammatic.current = false;
        }, 400);
      }
    }, 80);
  }, [items, onChange]);

  const scrollToIdx = (idx: number) => {
    setActiveIdx(idx);
    onChange(items[idx], idx);
    if (scrollRef.current) {
      isProgrammatic.current = true;
      scrollRef.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
      setTimeout(() => {
        isProgrammatic.current = false;
      }, 400);
    }
  };

  const padTop = ITEM_H * Math.floor(VISIBLE / 2);
  const padBottom = ITEM_H * Math.floor(VISIBLE / 2);

  return (
    <div
      style={{
        position: "relative",
        height: ITEM_H * VISIBLE,
        flex: 1,
        overflow: "hidden",
      }}
    >
      {/* 상단 페이드 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: padTop + 8,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,1) 50%, rgba(255,255,255,0))",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      {/* 하단 페이드 */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: padBottom + 8,
          background:
            "linear-gradient(to top, rgba(255,255,255,1) 50%, rgba(255,255,255,0))",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      {/* 중앙 하이라이트 바 */}
      <div
        style={{
          position: "absolute",
          top: padTop,
          left: 4,
          right: 4,
          height: ITEM_H,
          backgroundColor: COLOR.bgApp,
          borderRadius: RADIUS.sm,
          zIndex: 0,
        }}
      />
      {/* 스크롤 영역 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="drum-picker-scroll"
        style={{
          height: "100%",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          paddingTop: padTop,
          paddingBottom: padBottom,
          position: "relative",
          zIndex: 1,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {items.map((item, idx) => {
          const isActive = idx === activeIdx;
          return (
            <div
              key={idx}
              onClick={() => scrollToIdx(idx)}
              style={{
                height: ITEM_H,
                scrollSnapAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT.base,
                fontSize: isActive ? 20 : 15,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? COLOR.textPrimary : COLOR.textMuted,
                transition: "font-size 0.12s ease, color 0.12s ease",
                userSelect: "none",
                cursor: "pointer",
                gap: 2,
              }}
            >
              {item}
              {isActive && unit && (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: COLOR.textSecondary,
                  }}
                >
                  {unit}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// 날짜 데이터 생성 유틸
// ─────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
// 최근 13년 (현재 ~ 13년 전), 신생아부터 초등학교 저학년까지
const YEAR_ITEMS = Array.from({ length: 13 }, (_, i) => String(CURRENT_YEAR - i));
const MONTH_ITEMS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

function getDayItems(year: number, month: number): string[] {
  const days = new Date(year, month, 0).getDate();
  return Array.from({ length: days }, (_, i) => String(i + 1).padStart(2, "0"));
}

function calcAgeMonths(year: number, month: number, day: number): number {
  const today = new Date();
  const birth = new Date(year, month - 1, day);
  if (birth > today) return 0;
  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months += today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
}

// ─────────────────────────────────────────────────
// ChildProfilePage
// ─────────────────────────────────────────────────
export function ChildProfilePage() {
  const navigate = useNavigate();
  const { addChild } = useChild();

  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);

  // 생년월일 인덱스 상태 (초기값: 1년 전, 1월, 1일)
  const [yearIdx, setYearIdx] = useState(1);
  const [monthIdx, setMonthIdx] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  // 사용자가 피커를 실제로 조작했는지 여부
  const [birthdayTouched, setBirthdayTouched] = useState(false);

  const selectedYear = parseInt(YEAR_ITEMS[yearIdx]);
  const selectedMonth = parseInt(MONTH_ITEMS[monthIdx]);
  const dayItems = getDayItems(selectedYear, selectedMonth);
  const safeDayIdx = Math.min(dayIdx, dayItems.length - 1);
  const selectedDay = parseInt(dayItems[safeDayIdx]);

  const ageMonths = birthdayTouched
    ? calcAgeMonths(selectedYear, selectedMonth, selectedDay)
    : 0;

  // 월/년 변경 시 날짜 인덱스 보정
  useEffect(() => {
    const maxIdx = getDayItems(selectedYear, selectedMonth).length - 1;
    if (dayIdx > maxIdx) setDayIdx(maxIdx);
  }, [selectedYear, selectedMonth, dayIdx]);

  const handleYearChange = useCallback((_val: string, idx: number) => {
    setYearIdx(idx);
    setBirthdayTouched(true);
  }, []);

  const handleMonthChange = useCallback((_val: string, idx: number) => {
    setMonthIdx(idx);
    setBirthdayTouched(true);
  }, []);

  const handleDayChange = useCallback((_val: string, idx: number) => {
    setDayIdx(idx);
    setBirthdayTouched(true);
  }, []);

  const handleNext = async () => {
    if (!birthdayTouched) return;

    const dob = `${selectedYear}.${String(selectedMonth).padStart(2, "0")}.${String(selectedDay).padStart(2, "0")}`;

    // addChild (Supabase 또는 localStorage 자동 처리)
    await addChild({ name: name.trim() || "우리 아이", gender: gender ?? undefined, dob });
    navigate("/");
  };

  return (
    <div
      style={{
        height: "100dvh",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        backgroundColor: COLOR.bgOuter,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 390,
          height: "100dvh",
          backgroundColor: COLOR.bgCard,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: FONT.base,
        }}
      >
        {/* ── 헤더 ── */}
        <div
          style={{
            padding: "56px 24px 24px",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <button
            onClick={() => navigate("/login")}
            style={{
              position: "absolute",
              top: 20,
              left: 16,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={22} color={COLOR.textPrimary} strokeWidth={2} />
          </button>

          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: COLOR.textPrimary,
              letterSpacing: "-0.7px",
              lineHeight: 1.35,
            }}
          >
            우리 아이를
            <br />
            소개해주세요
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              fontWeight: 400,
              color: COLOR.textMuted,
              letterSpacing: "-0.2px",
              lineHeight: 1.5,
            }}
          >
            일정과 발달 체크를 맞춤으로 준비해드릴게요
          </div>
        </div>

        {/* ── 스크롤 컨텐츠 ── */}
        <div
          className="panel-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 24px",
          }}
        >
          {/* 1. 아이 이름 */}
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLOR.textSecondary,
                  letterSpacing: "-0.2px",
                }}
              >
                아이 이름
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: COLOR.textDisabled,
                }}
              >
                (선택)
              </span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력해주세요"
              maxLength={20}
              style={{
                width: "100%",
                height: 52,
                borderRadius: RADIUS.md,
                border: "none",
                backgroundColor: COLOR.bgApp,
                padding: "0 16px",
                fontFamily: FONT.base,
                fontSize: 15,
                fontWeight: 400,
                color: COLOR.textPrimary,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* 2. 성별 */}
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLOR.textSecondary,
                  letterSpacing: "-0.2px",
                }}
              >
                성별
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: COLOR.textDisabled,
                }}
              >
                (선택)
              </span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {(["male", "female"] as const).map((g) => {
                const isActive = gender === g;
                return (
                  <button
                    key={g}
                    onClick={() => setGender(g === gender ? null : g)}
                    style={{
                      flex: 1,
                      height: 52,
                      borderRadius: RADIUS.md,
                      border: `1.5px solid ${
                        isActive ? COLOR.textPrimary : COLOR.border
                      }`,
                      backgroundColor: isActive
                        ? COLOR.textPrimary
                        : "transparent",
                      cursor: "pointer",
                      fontFamily: FONT.base,
                      fontSize: 15,
                      fontWeight: 600,
                      color: isActive ? "#fff" : COLOR.textSecondary,
                      letterSpacing: "-0.2px",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>
                      {g === "male" ? "👦" : "👧"}
                    </span>
                    {g === "male" ? "남아" : "여아"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 생년월일 드럼롤 피커 */}
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLOR.textSecondary,
                  letterSpacing: "-0.2px",
                }}
              >
                생년월일
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLOR.danger,
                }}
              >
                (필수)
              </span>
            </div>

            {/* 피커 컨테이너 */}
            <div
              style={{
                backgroundColor: COLOR.bgCard,
                borderRadius: RADIUS.lg,
                border: `1px solid ${COLOR.border}`,
                overflow: "hidden",
                boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
              }}
            >
              {/* 컬럼 헤더 */}
              <div
                style={{
                  display: "flex",
                  padding: "12px 12px 0",
                  borderBottom: `1px solid ${COLOR.borderLight}`,
                }}
              >
                {["년도", "월", "일"].map((label) => (
                  <div
                    key={label}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      paddingBottom: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: COLOR.textMuted,
                      letterSpacing: "-0.1px",
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* 피커 행 */}
              <div
                style={{
                  display: "flex",
                  padding: "0 8px",
                }}
              >
                {/* 년도 피커 */}
                <DrumRollPicker
                  items={YEAR_ITEMS}
                  defaultIndex={yearIdx}
                  onChange={handleYearChange}
                />

                {/* 구분선 */}
                <div
                  style={{
                    width: 1,
                    backgroundColor: COLOR.borderLight,
                    margin: "12px 0",
                    flexShrink: 0,
                  }}
                />

                {/* 월 피커 */}
                <DrumRollPicker
                  items={MONTH_ITEMS}
                  defaultIndex={monthIdx}
                  onChange={handleMonthChange}
                />

                {/* 구분선 */}
                <div
                  style={{
                    width: 1,
                    backgroundColor: COLOR.borderLight,
                    margin: "12px 0",
                    flexShrink: 0,
                  }}
                />

                {/* 일 피커 — 월/년 변경 시 리마운트 */}
                <DrumRollPicker
                  key={`${selectedYear}-${selectedMonth}`}
                  items={dayItems}
                  defaultIndex={safeDayIdx}
                  onChange={handleDayChange}
                />
              </div>
            </div>

            {/* 개월 수 안내 */}
            <div
              style={{
                marginTop: 14,
                minHeight: 24,
                textAlign: "center",
              }}
            >
              {birthdayTouched ? (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 400,
                    color: COLOR.textSecondary,
                    letterSpacing: "-0.2px",
                  }}
                >
                  현재{" "}
                  <span
                    style={{
                      fontWeight: 700,
                      color: COLOR.textPrimary,
                    }}
                  >
                    {ageMonths}개월
                  </span>
                  이에요
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 13,
                    color: COLOR.textDisabled,
                    letterSpacing: "-0.2px",
                  }}
                >
                  생년월일을 선택해주세요
                </span>
              )}
            </div>
          </div>

          {/* 하단 여백 */}
          <div style={{ height: 8 }} />
        </div>

        {/* ── 하단 고정: 다음 버튼 ── */}
        <div
          style={{
            padding: "12px 24px 48px",
            flexShrink: 0,
            borderTop: `1px solid ${COLOR.borderLight}`,
          }}
        >
          <button
            onClick={handleNext}
            disabled={!birthdayTouched}
            style={{
              width: "100%",
              height: 56,
              borderRadius: RADIUS.md,
              backgroundColor: birthdayTouched
                ? COLOR.textPrimary
                : COLOR.bgApp,
              border: "none",
              cursor: birthdayTouched ? "pointer" : "not-allowed",
              fontFamily: FONT.base,
              fontSize: 16,
              fontWeight: 700,
              color: birthdayTouched ? "#fff" : COLOR.textDisabled,
              letterSpacing: "-0.3px",
              transition:
                "background-color 0.2s ease, color 0.2s ease",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
