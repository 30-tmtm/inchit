import { useNavigate, useLocation } from "react-router";
import { COLOR, FONT, SHADOW, SPACE } from "../tokens";

const TABS = [
  {
    path: "/",
    label: "홈",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
          stroke={active ? COLOR.tabActive : COLOR.tabInactive}
          strokeWidth="1.7"
          strokeLinejoin="round"
          fill={active ? COLOR.tabActiveBg : "none"}
        />
      </svg>
    ),
  },
  {
    path: "/calendar",
    label: "캘린더",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect
          x="3" y="4" width="18" height="17" rx="2"
          stroke={active ? COLOR.tabActive : COLOR.tabInactive}
          strokeWidth="1.7"
          fill={active ? COLOR.tabActiveBg : "none"}
        />
        <path d="M3 9H21" stroke={active ? COLOR.tabActive : COLOR.tabInactive} strokeWidth="1.5" />
        <path d="M8 4V6M16 4V6" stroke={active ? COLOR.tabActive : COLOR.tabInactive} strokeWidth="1.7" strokeLinecap="round" />
        {/* 주간 그리드 라인 (가로) */}
        <path d="M7 13H11M13 13H17" stroke={active ? COLOR.tabActive : COLOR.tabInactive} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M7 17H11M13 17H17" stroke={active ? COLOR.tabActive : COLOR.tabInactive} strokeWidth="1.3" strokeLinecap="round" />
        {/* 세로 구분선 */}
        <path d="M12 9V21" stroke={active ? COLOR.tabActive : COLOR.tabInactive} strokeWidth="1.2" strokeDasharray="1.5 1.5" />
      </svg>
    ),
  },
  {
    path: "/checklist",
    label: "체크리스트",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect
          x="4" y="3" width="16" height="18" rx="2"
          stroke={active ? COLOR.tabActive : COLOR.tabInactive}
          strokeWidth="1.7"
          fill={active ? COLOR.tabActiveBg : "none"}
        />
        <path d="M8 8H16M8 12H16M8 16H12" stroke={active ? COLOR.tabActive : COLOR.tabInactive} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="6.5" cy="8" r="1" fill={active ? COLOR.tabActive : COLOR.tabInactive} />
        <circle cx="6.5" cy="12" r="1" fill={active ? COLOR.tabActive : COLOR.tabInactive} />
        <circle cx="6.5" cy="16" r="1" fill={active ? COLOR.tabActive : COLOR.tabInactive} />
      </svg>
    ),
  },
  {
    path: "/play",
    label: "놀이",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        {/* 별 모양 */}
        <path
          d="M12 3L14.09 8.26L20 9.27L15.82 13.14L17.18 19L12 16.27L6.82 19L8.18 13.14L4 9.27L9.91 8.26L12 3Z"
          stroke={active ? COLOR.tabActive : COLOR.tabInactive}
          strokeWidth="1.7"
          strokeLinejoin="round"
          fill={active ? COLOR.tabActiveBg : "none"}
        />
      </svg>
    ),
  },
  {
    path: "/my",
    label: "마이",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12" cy="8" r="4"
          stroke={active ? COLOR.tabActive : COLOR.tabInactive}
          strokeWidth="1.7"
          fill={active ? COLOR.tabActiveBg : "none"}
        />
        <path
          d="M4 20C4 17 7.58 14 12 14C16.42 14 20 17 20 20"
          stroke={active ? COLOR.tabActive : COLOR.tabInactive}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
] as const;

export function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  function isActive(path: string) {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  }

  return (
    <div
      style={{
        width: "100%",
        height: SPACE.tabBarHeight,
        backgroundColor: COLOR.bgCard,
        borderTop: `1px solid ${COLOR.border}`,
        display: "flex",
        alignItems: "stretch",
        flexShrink: 0,
        boxShadow: SHADOW.tabBar,
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 0 6px 0",
              WebkitTapHighlightColor: "transparent",
              position: "relative",
            }}
          >
            {/* 활성 탭 상단 인디케이터 */}
            {active && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 28,
                  height: 2.5,
                  borderRadius: "0 0 3px 3px",
                  backgroundColor: COLOR.tabActive,
                }}
              />
            )}
            {tab.icon(active)}
            <span
              style={{
                fontFamily: FONT.base,
                fontWeight: active ? 700 : 400,
                fontSize: 10,
                color: active ? COLOR.tabActive : COLOR.tabInactive,
                lineHeight: 1,
                letterSpacing: "-0.2px",
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
