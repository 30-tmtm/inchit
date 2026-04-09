import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./app/routes";
import { AuthProvider } from "./app/contexts/AuthContext";
import { ChildProvider } from "./app/contexts/ChildContext";
import "./styles/index.css";
import "./styles/tailwind.css";
import "./styles/fonts.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ChildProvider>
        <RouterProvider router={router} />
      </ChildProvider>
    </AuthProvider>
  </StrictMode>
);
