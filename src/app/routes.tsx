import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { HomePage } from "./pages/HomePage";
import { CalendarPage } from "./pages/CalendarPage";
import { ChecklistPage } from "./pages/ChecklistPage";
import { PlayPage } from "./pages/PlayPage";
import { MyPage } from "./pages/MyPage";
import { LoginPage } from "./pages/LoginPage";
import { ChildProfilePage } from "./pages/ChildProfilePage";
import { NotificationPage } from "./pages/NotificationPage";
import { GrowthPage } from "./pages/GrowthPage";

export const router = createBrowserRouter([
  // ── 온보딩 플로우 (탭바 없음) ──
  { path: "/login",                    Component: LoginPage },
  { path: "/onboarding",               Component: ChildProfilePage },
  { path: "/notifications", Component: NotificationPage },
  { path: "/growth",        Component: GrowthPage },

  // ── 메인 앱 (탭바 포함) ──
  {
    path: "/",
    Component: Root,
    children: [
      { index: true,       Component: HomePage },
      { path: "calendar",  Component: CalendarPage },
      { path: "checklist", Component: ChecklistPage },
      { path: "play",      Component: PlayPage },
      { path: "my",        Component: MyPage },
    ],
  },
]);
