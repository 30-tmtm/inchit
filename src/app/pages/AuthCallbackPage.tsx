import { useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { COLOR, FONT } from "../tokens";

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      const { data } = await supabase
        .from("children")
        .select("id")
        .eq("user_id", session.user.id)
        .limit(1);

      if (data && data.length > 0) {
        navigate("/", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLOR.bgCard,
        gap: 16,
        fontFamily: FONT.base,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: `3px solid ${COLOR.border}`,
          borderTopColor: COLOR.textPrimary,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: 14, color: COLOR.textMuted, margin: 0 }}>로그인 중...</p>
    </div>
  );
}
