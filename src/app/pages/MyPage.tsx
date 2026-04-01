import {
  ChevronRight,
  Bell,
  FileText,
  Moon,
  MessageSquare,
  Info,
  Shield,
  Users,
  Baby,
  CalendarDays,
} from "lucide-react";
import { COLOR, FONT, RADIUS, SPACE } from "../tokens";
import { useScrollFade } from "../hooks/useScrollFade";

// ── Mock Data ──────────────────────────────────
const CHILD = {
  name: "채린",
  months: 19,
  dob: "2024.08.18",
  age: "만 1세",
};

const MENU_SECTIONS = [
  {
    title: "아이 정보",
    items: [
      {
        icon: Baby,
        label: "자녀 설정",
        desc: "자녀 추가 · 이름 · 생년월일 · 사진",
        badge: null,
      },
      {
        icon: Users,
        label: "가족 공유",
        desc: "보호자 추가 · 권한 설정",
        badge: null,
      },
      {
        icon: CalendarDays,
        label: "발달 기록",
        desc: "체크리스트 완료 이력",
        badge: null,
      },
    ],
  },
  {
    title: "앱 설정",
    items: [
      {
        icon: Bell,
        label: "알림 설정",
        desc: null,
        badge: "켜짐",
      },
      {
        icon: FileText,
        label: "자동 일정 정보",
        desc: null,
        badge: null,
      },
      {
        icon: Moon,
        label: "다크 모드",
        desc: null,
        badge: "준비 중",
      },
    ],
  },
  {
    title: "기타",
    items: [
      {
        icon: MessageSquare,
        label: "피드백 보내기",
        desc: null,
        badge: null,
      },
      {
        icon: Shield,
        label: "개인정보 처리방침",
        desc: null,
        badge: null,
      },
      {
        icon: FileText,
        label: "이용약관",
        desc: null,
        badge: null,
      },
      {
        icon: Info,
        label: "앱 버전",
        desc: null,
        badge: "v0.1 Beta",
      },
    ],
  },
];

// ── Sub Components ────────────────────────────

function MenuItem({
  item,
  isLast,
}: {
  item: (typeof MENU_SECTIONS)[0]["items"][0];
  isLast: boolean;
}) {
  const Icon = item.icon;

  return (
    <button
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "15px 18px",
        background: "none",
        border: "none",
        borderBottom: isLast ? "none" : `1px solid ${COLOR.borderLight}`,
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* 아이콘 */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: RADIUS.sm,
          backgroundColor: COLOR.bgApp,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={17} color={COLOR.textPrimary} strokeWidth={1.8} />
      </div>

      {/* 텍스트 */}
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontFamily: FONT.base,
            fontWeight: 600,
            fontSize: 14,
            color: COLOR.textPrimary,
            display: "block",
          }}
        >
          {item.label}
        </span>
        {item.desc && (
          <span
            style={{
              fontSize: 12,
              color: COLOR.textMuted,
              display: "block",
              marginTop: 1,
            }}
          >
            {item.desc}
          </span>
        )}
      </div>

      {/* 뱃지 or 화살표 */}
      {item.badge ? (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: COLOR.textMuted,
            backgroundColor: COLOR.bgApp,
            borderRadius: RADIUS.pill,
            padding: "3px 9px",
            marginRight: 4,
          }}
        >
          {item.badge}
        </span>
      ) : null}
      <ChevronRight size={16} color={COLOR.borderInactive} strokeWidth={2} />
    </button>
  );
}

// ── Main Component ────────────────────────────

export function MyPage() {
  const scrollRef = useScrollFade();

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
      {/* ── 앱바 ── */}
      <div
        style={{
          padding: "16px 20px 12px 20px",
          backgroundColor: COLOR.bgCard,
          flexShrink: 0,
        }}
      >
        <span
          style={{ fontWeight: 800, fontSize: 19, color: COLOR.textPrimary }}
        >
          마이
        </span>
      </div>

      {/* ── 스크롤 ── */}
      <div
        ref={scrollRef}
        className="panel-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: `20px ${SPACE.pagePadding}px`,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* ── 메뉴 섹션 ── */}
        {MENU_SECTIONS.map((section) => (
          <div key={section.title}>
            {/* 섹션 타이틀 */}
            <span
              style={{
                fontFamily: FONT.base,
                fontSize: 13,
                fontWeight: 700,
                color: COLOR.textMuted,
                display: "block",
                marginBottom: 8,
                paddingLeft: 2,
              }}
            >
              {section.title}
            </span>

            {/* 메뉴 카드 */}
            <div
              style={{
                backgroundColor: COLOR.bgCard,
                borderRadius: RADIUS.lg,
                overflow: "hidden",
              }}
            >
              {section.items.map((item, i) => (
                <MenuItem
                  key={item.label}
                  item={item}
                  isLast={i === section.items.length - 1}
                />
              ))}
            </div>
          </div>
        ))}

        {/* ── 로그아웃 ── */}
        <button
          style={{
            width: "100%",
            backgroundColor: COLOR.bgCard,
            border: "none",
            borderRadius: RADIUS.lg,
            padding: "15px 18px",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            textAlign: "left",
          }}
        >
          <span
            style={{
              fontFamily: FONT.base,
              fontSize: 14,
              fontWeight: 600,
              color: COLOR.danger,
            }}
          >
            로그아웃
          </span>
        </button>

        <div style={{ height: 4 }} />
      </div>
    </div>
  );
}