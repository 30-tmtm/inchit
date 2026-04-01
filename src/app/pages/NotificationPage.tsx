import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { COLOR, FONT, RADIUS } from "../tokens";

// ── 개발 미리보기 플래그 ───────────────────────────
// true  → 샘플 알림 표시 (디자인 검토용)
// false → 실제 데이터 (빈 상태 확인)
const SHOW_MOCK = true;

type Notification = {
  id: string;
  category: "일정" | "발달" | "검진";
  emoji: string;
  emojiColor: string;
  title: string;
  body: string;
  relativeTime: string;
  isRead: boolean;
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    category: "일정",
    emoji: "📅",
    emojiColor: COLOR.catFamily,
    title: "오늘 일정",
    body: "오늘 오후 3시 어린이집 하원이 있어요.",
    relativeTime: "방금 전",
    isRead: false,
  },
  {
    id: "n2",
    category: "발달",
    emoji: "🌱",
    emojiColor: COLOR.catDaycare,
    title: "발달 체크",
    body: "이번 달 K-DST 19개월 발달 체크를 아직 시작하지 않으셨어요.",
    relativeTime: "1시간 전",
    isRead: false,
  },
  {
    id: "n3",
    category: "검진",
    emoji: "💉",
    emojiColor: COLOR.catHealth,
    title: "예방접종 D-3",
    body: "4월 2일에 예방접종이 예정되어 있어요. 미리 준비해두세요.",
    relativeTime: "3월 30일",
    isRead: true,
  },
  {
    id: "n4",
    category: "일정",
    emoji: "📅",
    emojiColor: COLOR.catFamily,
    title: "내일 일정",
    body: "내일 오전 10시 소아과 검진이 예정되어 있어요.",
    relativeTime: "3월 29일",
    isRead: true,
  },
];

function PageWrapper({ children }: { children: React.ReactNode }) {
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
          backgroundColor: COLOR.bgApp,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: FONT.base,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function NotificationPage() {
  const navigate = useNavigate();
  const notifications = SHOW_MOCK ? MOCK_NOTIFICATIONS : [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <PageWrapper>
      {/* ── 앱바 ── */}
      <div
        style={{
          backgroundColor: COLOR.bgCard,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
          padding: "0 8px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={22} color={COLOR.textPrimary} strokeWidth={2} />
        </button>

        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: COLOR.textPrimary,
            letterSpacing: "-0.3px",
          }}
        >
          알림
          {unreadCount > 0 && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 12,
                fontWeight: 700,
                color: COLOR.danger,
                backgroundColor: `${COLOR.danger}12`,
                borderRadius: RADIUS.pill,
                padding: "1px 7px",
              }}
            >
              {unreadCount}
            </span>
          )}
        </span>

        {/* 우: 균형용 여백 (알림 설정 버튼 없음) */}
        <div style={{ width: 44 }} />
      </div>

      {/* ── 컨텐츠 ── */}
      <div
        className="panel-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        {notifications.length === 0 ? (
          /* 빈 상태 */
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "0 40px",
            }}
          >
            <div style={{ fontSize: 52, lineHeight: 1 }}>🔔</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: COLOR.textPrimary,
                letterSpacing: "-0.5px",
              }}
            >
              알림이 없어요
            </div>
            <div
              style={{
                fontSize: 14,
                color: COLOR.textMuted,
                textAlign: "center",
                lineHeight: 1.6,
                letterSpacing: "-0.2px",
              }}
            >
              새로운 알림이 오면 여기에 표시돼요
            </div>
          </div>
        ) : (
          /* 알림 목록 */
          <>
            <div style={{ backgroundColor: COLOR.bgCard }}>
              {notifications.map((noti, i) => (
                <div
                  key={noti.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: "16px 20px",
                    borderBottom:
                      i < notifications.length - 1
                        ? `1px solid ${COLOR.borderLight}`
                        : "none",
                    backgroundColor: noti.isRead
                      ? "transparent"
                      : `${noti.emojiColor}08`,
                    cursor: "pointer",
                  }}
                >
                  {/* 이모지 아이콘 */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: `${noti.emojiColor}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {noti.emoji}
                  </div>

                  {/* 텍스트 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 4,
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: noti.isRead
                              ? COLOR.textSecondary
                              : COLOR.textPrimary,
                            letterSpacing: "-0.2px",
                          }}
                        >
                          {noti.title}
                        </span>
                        {!noti.isRead && (
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor: COLOR.danger,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: COLOR.textMuted,
                          flexShrink: 0,
                        }}
                      >
                        {noti.relativeTime}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        color: COLOR.textMuted,
                        lineHeight: 1.55,
                        letterSpacing: "-0.1px",
                        display: "block",
                      }}
                    >
                      {noti.body}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                textAlign: "center",
                padding: "20px 0 32px",
                fontSize: 12,
                color: COLOR.textMuted,
                letterSpacing: "-0.1px",
              }}
            >
              7일 전 알림까지 확인할 수 있어요
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
