import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { TabBar } from "./components/TabBar";
import { COLOR } from "./tokens";
import { useAuth } from "./contexts/AuthContext";
import { useChild } from "./contexts/ChildContext";

export function Root() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { childList, loading: childLoading } = useChild();
  const isDemoMode = !!localStorage.getItem("inchit_onboarded");

  useEffect(() => {
    if (authLoading || childLoading) return;

    // 비로그인 + 데모모드 아님 → 로그인 페이지
    if (!session && !isDemoMode) {
      navigate("/login", { replace: true });
      return;
    }

    // 로그인했는데 자녀가 없으면 → 온보딩
    if (session && childList.length === 0) {
      navigate("/onboarding", { replace: true });
    }
  }, [session, authLoading, childList, childLoading, isDemoMode, navigate]);

  if (authLoading || childLoading) {
    return (
      <div
        style={{
          height: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLOR.bgCard,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: `3px solid ${COLOR.border}`,
            borderTopColor: COLOR.textPrimary,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

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
          backgroundColor: COLOR.bgCard,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Outlet />
        </div>
        <TabBar />
      </div>
    </div>
  );
}
