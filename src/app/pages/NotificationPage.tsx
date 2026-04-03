import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { COLOR, FONT, RADIUS } from "../tokens";
import {
  AppNotification,
  formatRelativeNotificationTime,
  loadNotifications,
  markAllNotificationsRead,
} from "../utils/notifications";

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
          maxWidth: 430,
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
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadNotifications().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  useEffect(() => {
    markAllNotificationsRead();
    setNotifications(
      loadNotifications().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
  }, []);

  return (
    <PageWrapper>
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
          ??
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

        <div style={{ width: 44 }} />
      </div>

      <div
        className="panel-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        {notifications.length === 0 ? (
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
            <div style={{ fontSize: 52, lineHeight: 1 }}>??</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: COLOR.textPrimary,
                letterSpacing: "-0.5px",
              }}
            >
              ??? ???
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
              ??? ??? ?? ??? ????
            </div>
          </div>
        ) : (
          <>
            <div style={{ backgroundColor: COLOR.bgCard }}>
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: "16px 20px",
                    borderBottom:
                      index < notifications.length - 1
                        ? `1px solid ${COLOR.borderLight}`
                        : "none",
                    backgroundColor: notification.isRead
                      ? "transparent"
                      : `${notification.emojiColor}08`,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: `${notification.emojiColor}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {notification.emoji}
                  </div>

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
                            color: notification.isRead
                              ? COLOR.textSecondary
                              : COLOR.textPrimary,
                            letterSpacing: "-0.2px",
                          }}
                        >
                          {notification.title}
                        </span>
                        {!notification.isRead && (
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
                        {formatRelativeNotificationTime(notification.createdAt)}
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
                      {notification.body}
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
              ?? ???? ???? ???? ???
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
