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
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { DevelopmentRecordPage } from "./pages/DevelopmentRecordPage";

export const router = createBrowserRouter([
  // ── 인증 플로우 ──
  { path: "/login",         Component: LoginPage },
  { path: "/auth/callback", Component: AuthCallbackPage },
  { path: "/onboarding",    Component: ChildProfilePage },
  { path: "/notifications", Component: NotificationPage },
  { path: "/growth",        Component: GrowthPage },
  { path: "/development-record", Component: DevelopmentRecordPage },

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
