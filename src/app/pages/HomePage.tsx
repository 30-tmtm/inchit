import { useState, useEffect, useRef } from "react";
import {
  Bell,
  ChevronRight,
  CheckCircle2,
  Clock,
  ChevronDown,
  Check,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router";
import { COLOR, FONT, RADIUS, SPACE } from "../tokens";

// v2.0 출시 시 false로 변경 → 히어로 카드 내 놀이 링크 노출
const IS_BETA = true;

// 월령별 캐릭터 이미지 매핑
function getBabyCharacterSrc(months: number): string {
  if (months <= 5)  return "/baby_1_5month_character.png";
  if (months <= 12) return "/baby_6_12month_character.png";
  return "/baby_13_36month_character.png";
}

function BabyCharacterPlaceholder({ months }: { months: number }) {
  return (
    <img
      src={getBabyCharacterSrc(months)}
      alt="아이 캐릭터"
      style={{
        width: 174,
        height: 188,
        objectFit: "contain",
      }}
    />
  );
}
import { useScrollFade } from "../hooks/useScrollFade";
import { useChild, CHILDREN_MOCK, type Child } from "../contexts/ChildContext";
import { getDayMeta } from "../components/CalendarData";

// ── 오늘의 메시지: 월령 구간별 ──────────────────
type MsgPool = { upTo: number; messages: string[] };

const MESSAGE_POOLS: MsgPool[] = [
  {
    upTo: 5,
    messages: [
      "이 시기\n아이는 소리에\n귀 기울여요",
      "눈 맞춤이\n점점 늘어나는\n때예요",
      "완벽한 부모는\n세상에\n없어요",
    ],
  },
  {
    upTo: 11,
    messages: [
      "낯가림이\n시작될 수\n있어요",
      "기기 시작하는\n아이를 보면\n감동이에요",
      "완벽한 부모는\n세상에\n없어요",
    ],
  },
  {
    upTo: 17,
    messages: [
      "첫 걸음마를\n준비하는\n시기예요",
      "첫 단어가\n나올 수\n있어요",
      "지치는 날도\n있는 게\n당연해요",
      "완벽한 부모는\n세상에\n없어요",
    ],
  },
  {
    upTo: 23,
    messages: [
      "어휘가 급격히\n늘어나는\n때예요",
      "안 된다는 말\n자주 하게\n되죠",
      "혼자 해보려는\n시도가\n많아져요",
      "소근육이\n한창 발달하는\n시기예요",
      "오늘도\n아이 곁에\n있어줬어요",
      "지치는 날도\n있는 게\n당연해요",
      "완벽한 부모는\n세상에\n없어요",
    ],
  },
  {
    upTo: 35,
    messages: [
      "상상력이\n피어나는\n시기예요",
      "고집이 세질 수\n있는 시기\n맞아요",
      "오늘도\n아이 곁에\n있어줬어요",
      "완벽한 부모는\n세상에\n없어요",
    ],
  },
  {
    upTo: 47,
    messages: [
      "친구에 관심이\n생기는\n때예요",
      "왜냐고 묻는\n질문이\n많아져요",
      "지치는 날도\n있는 게\n당연해요",
      "완벽한 부모는\n세상에\n없어요",
    ],
  },
  {
    upTo: 59,
    messages: [
      "한글에 관심\n가질 수\n있어요",
      "규칙에\n익숙해지는\n때예요",
      "오늘도\n아이 곁에\n있어줬어요",
      "완벽한 부모는\n세상에\n없어요",
    ],
  },
  {
    upTo: 71,
    messages: [
      "취학 준비하는\n시기가\n됐어요",
      "독립심이\n자라는\n시기예요",
      "지치는 날도\n있는 게\n당연해요",
      "완벽한 부모는\n세상에\n없어요",
    ],
  },
  {
    upTo: Infinity,
    messages: [
      "완벽한 부모는\n세상에\n없어요",
      "지치는 날도\n있는 게\n당연해요",
      "오늘도\n아이 곁에\n있어줬어요",
      "힘든 날도\n당신은 좋은\n부모예요",
      "육아는 완주가\n아니라\n여정이에요",
    ],
  },
];

function getDailyMessage(months: number): string {
  const pool = MESSAGE_POOLS.find((p) => months <= p.upTo)!;
  return pool.messages[new Date().getDate() % pool.messages.length];
}

function getAgeLabel(months: number): string {
  if (months < 12) return `만 0세`;
  return `만 ${Math.floor(months / 12)}세`;
}

// ── 주간 시간표에서 오늘 일정 가져오기 ──────────────
type Block = { day: number; startH: number; endH: number; label: string; color: string };

const MOCK_BLOCKS_BY_CHILD: Record<string, Block[]> = {
  c1: [
    { day: 0, startH: 8,  endH: 9,  label: "어린이집 등원", color: COLOR.catHealth   },
    { day: 0, startH: 15, endH: 16, label: "어린이집 하원", color: COLOR.catHealth   },
    { day: 1, startH: 8,  endH: 9,  label: "어린이집 등원", color: COLOR.catHealth   },
    { day: 1, startH: 16, endH: 17, label: "영어 학원",     color: COLOR.catFamily   },
    { day: 2, startH: 8,  endH: 9,  label: "어린이집 등원", color: COLOR.catHealth   },
    { day: 2, startH: 11, endH: 12, label: "소아과",         color: COLOR.catDaycare  },
    { day: 3, startH: 8,  endH: 9,  label: "어린이집 등원", color: COLOR.catHealth   },
    { day: 4, startH: 8,  endH: 9,  label: "어린이집 등원", color: COLOR.catHealth   },
    { day: 4, startH: 15, endH: 17, label: "발레 학원",     color: COLOR.catActivity },
  ],
  c2: [
    { day: 0, startH: 10, endH: 11, label: "영아 마사지",   color: COLOR.catActivity },
    { day: 1, startH: 13, endH: 14, label: "낮잠 루틴",     color: COLOR.catDaycare  },
    { day: 2, startH: 14, endH: 15, label: "육아 교실",     color: COLOR.catFamily   },
    { day: 3, startH: 11, endH: 12, label: "소아과 검진",   color: COLOR.catHealth   },
    { day: 4, startH: 10, endH: 11, label: "예방 접종",     color: COLOR.catHealth   },
    { day: 5, startH: 14, endH: 15, label: "가족 외출",     color: COLOR.catFamily   },
  ],
};

function getTodayScheduleFromWeekly(childId: string): Array<{id: number; time: string; label: string; color: string}> {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=일, 1=월, ..., 6=토
  const dayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 월요일=0 변환
  
  const blocks = MOCK_BLOCKS_BY_CHILD[childId] ?? [];
  const todayBlocks = blocks.filter(b => b.day === dayIdx);
  
  return todayBlocks.map((b, i) => ({
    id: i + 1,
    time: `${b.startH}:00`,
    label: b.label.replace('\n', ' '),
    color: b.color,
  }));
}

function getTodayScheduleFromCalendar(): Array<{id: number; time: string; label: string; color: string}> {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  
  const dayMeta = getDayMeta(year, month, day);
  
  return dayMeta.events.map((ev, i) => ({
    id: 1000 + i, // 충돌 방지용 높은 ID
    time: ev.startTime.replace('오전 ', '').replace('오후 ', ''),
    label: ev.title,
    color: ev.color,
  }));
}

// 나의 체크리스트 — localStorage에서 불러오기 (없으면 빈 배열)
type MyList = { id: string; emoji: string; title: string; total: number; done: number; color: string };

function loadMyLists(): MyList[] {
  try {
    const raw = localStorage.getItem("inchit_my_lists");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ── Sub Components ────────────────────────────

/** 카드 내부 상단 헤더 (타이틀 좌 + CTA 우) */
function CardInnerHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 16px 12px 16px",
      }}
    >
      <span
        style={{
          fontFamily: FONT.base,
          fontWeight: 700,
          fontSize: 15,
          color: COLOR.textPrimary,
          letterSpacing: "-0.3px",
        }}
      >
        {title}
      </span>
      {actionLabel && (
        <button
          onClick={onAction}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 2,
            /* 터치 영역 최소 44px 확보 — 좌측 여백으로 탭 범위 확장 */
            padding: "11px 0 11px 12px",
            margin: "-11px 0 -11px 0",
          }}
        >
          <span
            style={{
              fontFamily: FONT.base,
              fontSize: 13,
              color: COLOR.textMuted,
              letterSpacing: "-0.2px",
            }}
          >
            {actionLabel}
          </span>
          <ChevronRight size={14} color={COLOR.textMuted} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        backgroundColor: COLOR.bgCard,
        borderRadius: RADIUS.lg,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────

export function HomePage() {
  const navigate = useNavigate();
  const scrollRef = useScrollFade();

  const { childList, selectedChild, setSelectedChildId } = useChild();

  // 나의 체크리스트 (localStorage 기반)
  const myLists = loadMyLists();

  // 드롭다운 상태
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 자녀 전환 시 페이드 전환을 위한 상태
  const [displayedChild, setDisplayedChild] = useState<Child | null>(selectedChild);
  const [contentOpacity, setContentOpacity] = useState(1);
  const prevIdRef = useRef(selectedChild?.id ?? null);

  // 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!selectedChild || selectedChild.id === prevIdRef.current) return;
    prevIdRef.current = selectedChild.id;
    setContentOpacity(0);
    const timer = setTimeout(() => {
      setDisplayedChild(selectedChild);
      setContentOpacity(1);
    }, 190);
    return () => clearTimeout(timer);
  }, [selectedChild]); // eslint-disable-line react-hooks/exhaustive-deps

  const todayMsg = displayedChild ? getDailyMessage(displayedChild.months) : "";

  // 오늘 일정 데이터 합치기
  const weeklySchedule = displayedChild ? getTodayScheduleFromWeekly(displayedChild.id) : [];
  const calendarSchedule = getTodayScheduleFromCalendar();
  const allTodaySchedule = [...weeklySchedule, ...calendarSchedule]
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 3);

  // 자녀가 없을 때 — 등록 유도 화면
  if (childList.length === 0) {
    return (
      <div style={{ width: "100%", height: "100%", backgroundColor: COLOR.bgApp, display: "flex", flexDirection: "column", fontFamily: FONT.base }}>
        {/* 앱바 */}
        <div style={{ padding: "16px 20px 12px", backgroundColor: COLOR.bgCard, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Bell size={22} color={COLOR.textPrimary} strokeWidth={1.8} />
          </button>
        </div>
        {/* 중앙 유도 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 40px", gap: 16 }}>
          <div style={{ fontSize: 56, lineHeight: 1 }}>👶</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLOR.textPrimary, letterSpacing: "-0.5px", textAlign: "center" }}>
            아이를 등록해주세요
          </div>
          <div style={{ fontSize: 14, color: COLOR.textMuted, textAlign: "center", lineHeight: 1.6, letterSpacing: "-0.2px" }}>
            아이 정보를 등록하면<br />발달 체크, 일정 관리를 시작할 수 있어요
          </div>
          <button
            onClick={() => navigate("/onboarding")}
            style={{
              marginTop: 8,
              width: "100%",
              height: 52,
              borderRadius: RADIUS.md,
              backgroundColor: COLOR.textPrimary,
              border: "none",
              cursor: "pointer",
              fontFamily: FONT.base,
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.3px",
            }}
          >
            아이 등록하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: COLOR.bgApp,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: FONT.base,
      }}
    >
      {/* ── 앱바 (자녀칩 + 벨) — 드롭다운 컨테이너 포함 ── */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          flexShrink: 0,
          backgroundColor: COLOR.bgCard,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "13px 20px",
          }}
        >
          {/* 좌: 자녀 선택 드롭다운 칩 */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                borderRadius: RADIUS.pill,
                border: "none",
                backgroundColor: COLOR.bgApp,
                cursor: "pointer",
                fontFamily: FONT.base,
                fontSize: 15,
                fontWeight: 700,
                color: COLOR.textPrimary,
                letterSpacing: "-0.3px",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {selectedChild.name}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: COLOR.textMuted,
                }}
              >
                · {selectedChild.months}개월
              </span>
              <ChevronDown
                size={15}
                color={COLOR.textMuted}
                strokeWidth={2}
                style={{
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

            {/* 드롭다운 패널 */}
            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  backgroundColor: COLOR.bgCard,
                  borderRadius: RADIUS.md,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.13)",
                  zIndex: 100,
                  minWidth: 200,
                  overflow: "hidden",
                }}
              >
                {[...childList]
                  .sort((a, b) => a.dob.localeCompare(b.dob))
                  .map((child, i) => {
                  const isSelected = selectedChild.id === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => {
                        setSelectedChildId(child.id);
                        setDropdownOpen(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 16px",
                        backgroundColor: isSelected ? COLOR.bgApp : "transparent",
                        border: "none",
                        borderBottom: `1px solid ${COLOR.borderLight}`,
                        cursor: "pointer",
                        fontFamily: FONT.base,
                        textAlign: "left",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? COLOR.textPrimary : COLOR.textSecondary,
                          letterSpacing: "-0.3px",
                        }}
                      >
                        {child.name}
                        <span style={{ fontWeight: 400, color: COLOR.textMuted, marginLeft: 5 }}>
                          · {child.months}개월
                        </span>
                      </span>
                      {isSelected && (
                        <Check size={15} color={COLOR.textPrimary} strokeWidth={2.5} />
                      )}
                    </button>
                  );
                })}
                {/* 자녀 추가 */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/onboarding");
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 16px",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: FONT.base,
                    textAlign: "left",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <Plus size={14} color={COLOR.textMuted} strokeWidth={2} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: COLOR.textMuted, letterSpacing: "-0.3px" }}>
                    자녀 추가
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* 우: 알림 벨 — 터치 영역 최소 44×44 확보 */}
          <button
            onClick={() => navigate("/notifications")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 11,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bell size={22} color={COLOR.textPrimary} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* ── 스크롤 영역 ── */}
      <div
        ref={scrollRef}
        className="panel-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: `16px ${SPACE.pagePadding}px`,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* ── 자녀별 컨텐츠 (페이드 전환 영역) ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            opacity: contentOpacity,
            transition: "opacity 0.19s ease",
          }}
        >
          {/* ── 1. 아이 히어로 카드 ── */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 160,
              overflow: "visible",
            }}
          >
            {/* 좌: 텍스트 영역 — 피그마 기준 left:5, top:7.5 */}
            <div
              style={{
                position: "absolute",
                left: 20,
                top: 8,
                width: 180,
                height: 146,
              }}
            >
              {/* 개월수 · 만 나이 행 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, height: 22 }}>
                <span
                  style={{
                    fontFamily: FONT.base,
                    fontWeight: 600,
                    fontSize: 10,
                    lineHeight: "18px",
                    letterSpacing: "-0.2px",
                    color: "#8B95A1",
                  }}
                >
                  {displayedChild.months}개월 {displayedChild.daysInMonth}일차
                </span>
                <div style={{ width: 1, height: 10, backgroundColor: "#8A9ABD", opacity: 0.5 }} />
                <span
                  style={{
                    fontFamily: FONT.base,
                    fontWeight: 600,
                    fontSize: 10,
                    lineHeight: "18px",
                    color: "#8B95A1",
                  }}
                >
                  {getAgeLabel(displayedChild.months)}
                </span>
              </div>

              {/* 응원 메시지 — top:22px, 24px bold */}
              <div
                style={{
                  position: "absolute",
                  width: 170,
                  left: 0,
                  top: 22,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT.base,
                    fontWeight: 700,
                    fontSize: 24,
                    lineHeight: "30px",
                    letterSpacing: "-0.5px",
                    color: "#1A1A3A",
                    whiteSpace: "pre-line",
                    display: "block",
                  }}
                >
                  {todayMsg}
                </span>
              </div>

              {/* 성장 기록하기 CTA — 베타 노출, v2.0부터 도약돌로 교체 */}
              {IS_BETA ? (
                <button
                  onClick={() => navigate("/growth")}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 119,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontFamily: FONT.base,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#4A5A8A",
                    letterSpacing: "-0.2px",
                    lineHeight: "20px",
                  }}
                >
                  성장 기록하기
                  <ChevronRight size={14} strokeWidth={2} color="#4A5A8A" />
                </button>
              ) : (
                <button
                  onClick={() => navigate("/play")}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 119,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontFamily: FONT.base,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#4A5A8A",
                    letterSpacing: "-0.2px",
                    lineHeight: "20px",
                  }}
                >
                  도약돌 모으러 가기
                  <ChevronRight size={14} strokeWidth={2} color="#4A5A8A" />
                </button>
              )}
            </div>

            {/* 우: 캐릭터 — 카드 위로 overflow, 피그마 기준 right쪽 */}
            <div
              style={{
                position: "absolute",
                right: 12,
                top: -14,
                width: 150,
                height: 188,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <BabyCharacterPlaceholder months={displayedChild.months} />
            </div>
          </div>

          {/* ── 2. 오늘 일정 카드 ── */}
          <Card>
            <CardInnerHeader
              title="오늘 일정"
              actionLabel="캘린더 보기"
              onAction={() => navigate("/calendar")}
            />
            <div style={{ borderTop: `1px solid ${COLOR.borderLight}` }}>
              {allTodaySchedule.length === 0 ? (
                <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: COLOR.textMuted }}>오늘은 여유로운 하루네요. :)</span>
                  <button
                    onClick={() => navigate("/calendar")}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "8px 16px", borderRadius: RADIUS.md,
                      border: `1.5px solid ${COLOR.border}`,
                      background: "none", cursor: "pointer",
                      fontFamily: FONT.base, fontSize: 13, fontWeight: 600,
                      color: COLOR.textSecondary, letterSpacing: "-0.2px",
                    }}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    일정 추가
                  </button>
                </div>
              ) : (
                allTodaySchedule.map((item, i) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "13px 16px",
                      borderBottom:
                        i < allTodaySchedule.length - 1
                          ? `1px solid ${COLOR.borderLight}`
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                      <Clock size={13} color={COLOR.textMuted} strokeWidth={1.8} />
                      <span
                        style={{
                          fontSize: 12,
                          color: COLOR.textMuted,
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {item.time}
                      </span>
                    </div>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: COLOR.textPrimary }}>
                      {item.label}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* ── 3. 나의 체크리스트 카드 ── */}
          <Card>
            <CardInnerHeader
              title="나의 체크리스트"
              actionLabel={myLists.length > 0 ? "모두 보기" : undefined}
              onAction={() => navigate("/checklist", { state: { tab: "custom" } })}
            />
            <div style={{ borderTop: `1px solid ${COLOR.borderLight}` }}>
              {myLists.length === 0 ? (
                <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: COLOR.textMuted }}>중요한 건 잊지 않게 함께 챙겨줄게요.</span>
                  <button
                    onClick={() => navigate("/checklist")}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "8px 16px", borderRadius: RADIUS.md,
                      border: `1.5px solid ${COLOR.border}`,
                      background: "none", cursor: "pointer",
                      fontFamily: FONT.base, fontSize: 13, fontWeight: 600,
                      color: COLOR.textSecondary, letterSpacing: "-0.2px",
                    }}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    체크리스트 만들기
                  </button>
                </div>
              ) : (
                myLists.map((list, i) => {
                  const remaining = list.total - list.done;
                  return (
                    <button
                      key={list.id}
                      onClick={() => navigate("/checklist")}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "12px 16px",
                        minHeight: 44,
                        background: "none",
                        border: "none",
                        borderBottom:
                          i < myLists.length - 1
                            ? `1px solid ${COLOR.borderLight}`
                            : "none",
                        cursor: "pointer",
                        WebkitTapHighlightColor: "transparent",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          backgroundColor: list.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontSize: 17,
                        }}
                      >
                        {list.emoji}
                      </div>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: 600,
                          color: COLOR.textPrimary,
                          letterSpacing: "-0.2px",
                        }}
                      >
                        {list.title}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: remaining > 0 ? COLOR.textSecondary : COLOR.textMuted,
                          marginRight: 2,
                        }}
                      >
                        {remaining}
                      </span>
                      <ChevronRight size={16} color={COLOR.textMuted} strokeWidth={2} />
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* ── 4. 우리 아이 발달 이야기 카드 ── */}
          <Card>
            <CardInnerHeader
              title="우리 아이 발달 이야기"
              actionLabel={displayedChild.kdst.total > 0 ? "더 보기" : undefined}
              onAction={() => navigate("/checklist")}
            />
            <div
              style={{
                borderTop: `1px solid ${COLOR.borderLight}`,
                padding: "14px 16px 16px",
              }}
            >
              {displayedChild.kdst.total === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "6px 0" }}>
                  <span style={{ fontSize: 13, color: COLOR.textMuted }}>아직 발달 이야기가 준비되지 않았어요</span>
                  <button
                    onClick={() => navigate("/checklist")}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "8px 16px", borderRadius: RADIUS.md,
                      border: `1.5px solid ${COLOR.border}`,
                      background: "none", cursor: "pointer",
                      fontFamily: FONT.base, fontSize: 13, fontWeight: 600,
                      color: COLOR.textSecondary, letterSpacing: "-0.2px",
                    }}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    발달 이야기 시작하기
                  </button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircle2 size={16} color={COLOR.textPrimary} strokeWidth={1.8} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.textPrimary }}>
                        {Math.max(0, displayedChild.months - 1)}~{displayedChild.months}개월의 발달 포인트
                      </span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.textPrimary }}>
                      {displayedChild.kdst.done}
                      <span style={{ fontWeight: 400, color: COLOR.textMuted }}>
                        {" "}/ {displayedChild.kdst.total}
                      </span>
                    </span>
                  </div>

                  <div
                    style={{
                      height: 5,
                      backgroundColor: COLOR.bgApp,
                      borderRadius: RADIUS.pill,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(displayedChild.kdst.done / displayedChild.kdst.total) * 100}%`,
                        backgroundColor: COLOR.textPrimary,
                        borderRadius: RADIUS.pill,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>

                  <span
                    style={{
                      fontSize: 12,
                      color: COLOR.textMuted,
                      marginTop: 8,
                      display: "block",
                      letterSpacing: "-0.1px",
                    }}
                  >
                    {displayedChild.name}만의 속도로 잘 자라고 있어요.
                  </span>
                </>
              )}
            </div>
          </Card>

        </div>

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}