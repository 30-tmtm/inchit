import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { TabBar } from "./components/TabBar";
import { COLOR } from "./tokens";
import { ChildProvider } from "./contexts/ChildContext";

export function Root() {
  const navigate = useNavigate();

  // 온보딩 미완료 시 로그인 화면으로 리다이렉트
  useEffect(() => {
    if (!localStorage.getItem("inchit_onboarded")) {
      navigate("/login", { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ChildProvider>
      {/* 전체 화면을 가득 채우는 외부 컨테이너 */}
      <div
        style={{
          height: "100dvh",
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          backgroundColor: COLOR.bgOuter,
        }}
      >
        {/* 모바일 카드 (PC에서는 430px 제한, 폰에서는 전체 너비) */}
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

          {/* 탭바 — 항상 하단에 고정 */}
          <TabBar />
        </div>
      </div>
    </ChildProvider>
  );
}