import { useState } from "react";
import { useNavigate } from "react-router";
import { Check, ChevronRight, X } from "lucide-react";
import { COLOR, FONT, RADIUS } from "../tokens";
import { useAuth } from "../contexts/AuthContext";

// ── Kakao 아이콘 ─────────────────────────────────
function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 2C5.582 2 2 4.925 2 8.533c0 2.296 1.527 4.312 3.838 5.464L4.87 17.22c-.085.315.295.565.56.37l3.975-2.656c.192.018.387.027.585.027 4.418 0 8-2.925 8-6.533C18 4.925 14.418 2 10 2z"
        fill="rgba(0,0,0,0.85)"
      />
    </svg>
  );
}

// ── Google 아이콘 ────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232C18.533 15.977 19.6 13.307 19.6 10.227z"
        fill="#4285F4"
      />
      <path
        d="M10 20c2.7 0 4.964-.895 6.618-2.422l-3.232-2.51c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z"
        fill="#34A853"
      />
      <path
        d="M4.405 11.9A6.01 6.01 0 014.09 10c0-.663.114-1.306.315-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49L4.405 11.9z"
        fill="#FBBC05"
      />
      <path
        d="M10 3.977c1.468 0 2.786.505 3.823 1.495l2.868-2.868C14.959.99 12.695 0 10 0A9.996 9.996 0 001.064 5.51l3.34 2.59C5.192 5.737 7.396 3.977 10 3.977z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── 약관 데이터 ──────────────────────────────────
type TermItem = {
  id: string;
  required: boolean;
  label: string;
};

const TERMS: TermItem[] = [
  { id: "tos",       required: true,  label: "서비스 이용약관" },
  { id: "privacy",   required: true,  label: "개인정보 수집 및 이용 동의" },
  { id: "marketing", required: false, label: "마케팅 정보 수신 동의" },
];

// ── 체크박스 컴포넌트 ────────────────────────────
function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 24,
        height: 24,
        borderRadius: RADIUS.xs,
        border: `2px solid ${checked ? COLOR.textPrimary : COLOR.borderMid}`,
        backgroundColor: checked ? COLOR.textPrimary : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "all 0.15s ease",
        cursor: "pointer",
        padding: 0,
      }}
    >
      {checked && <Check size={14} color="#fff" strokeWidth={3} />}
    </button>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate();
  const { signInWithKakao, signInWithGoogle } = useAuth();
  const [showTerms, setShowTerms] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<"kakao" | "google" | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({
    tos: false,
    privacy: false,
    marketing: false,
  });

  const allChecked = TERMS.every((t) => checked[t.id]);
  const allRequiredChecked = TERMS.filter((t) => t.required).every((t) => checked[t.id]);

  const handleCheckAll = () => {
    const newVal = !allChecked;
    setChecked({ tos: newVal, privacy: newVal, marketing: newVal });
  };

  const handleCheckItem = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirm = async () => {
    if (!allRequiredChecked) return;
    setShowTerms(false);
    if (pendingProvider === "kakao") await signInWithKakao();
    if (pendingProvider === "google") await signInWithGoogle();
  };

  const handleLoginClick = (provider: "kakao" | "google") => {
    setPendingProvider(provider);
    setShowTerms(true);
  };

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
      {/* 모바일 카드 */}
      <div
        style={{
          width: "100%",
          maxWidth: 390,
          height: "100dvh",
          backgroundColor: COLOR.bgCard,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          fontFamily: FONT.base,
        }}
      >
        {/* ── 상단: 로고 + 슬로건 ── */}
        <div
          style={{
            paddingTop: 72,
            paddingLeft: 32,
            paddingRight: 32,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: COLOR.textPrimary,
              letterSpacing: "-1.5px",
              lineHeight: 1,
            }}
          >
            inchit
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 14,
              fontWeight: 400,
              color: COLOR.textMuted,
              letterSpacing: "-0.2px",
              lineHeight: 1.5,
            }}
          >
            inch by inch, together it matters
          </div>
        </div>

        {/* ── 중앙: 일러스트 영역 ── */}
        <div style={{ flex: 1 }} />

        {/* ── 하단: 로그인 버튼 ── */}
        <div
          style={{
            padding: "0 20px 48px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* 카카오 버튼 */}
          <button
            onClick={() => handleLoginClick("kakao")}
            style={{
              width: "100%",
              height: 56,
              borderRadius: RADIUS.md,
              backgroundColor: "#FEE500",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: FONT.base,
              fontSize: 16,
              fontWeight: 600,
              color: "rgba(0,0,0,0.85)",
              letterSpacing: "-0.3px",
              transition: "background-color 0.15s ease",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5DA00")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FEE500")}
          >
            <KakaoIcon />
            카카오로 시작하기
          </button>

          {/* 구글 버튼 */}
          <button
            onClick={() => handleLoginClick("google")}
            style={{
              width: "100%",
              height: 56,
              borderRadius: RADIUS.md,
              backgroundColor: COLOR.bgCard,
              border: `1.5px solid ${COLOR.border}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: FONT.base,
              fontSize: 16,
              fontWeight: 600,
              color: COLOR.textPrimary,
              letterSpacing: "-0.3px",
              transition: "background-color 0.15s ease",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLOR.bgApp)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLOR.bgCard)}
          >
            <GoogleIcon />
            구글로 시작하기
          </button>

          {/* 개발용: 데모 미리보기 */}
          <button
            onClick={() => {
              const demoChild = {
                id: "c1",
                name: "김우리",
                gender: "female",
                months: 19,
                daysInMonth: 15,
                dob: "2023.08.15",
                daysSince: 589,
                kdst: { done: 5, total: 20 },
                todaySchedule: [],
                vaccination: [],
              };
              localStorage.setItem("inchit_children", JSON.stringify([demoChild]));
              localStorage.setItem("inchit_custom_lists", JSON.stringify([
                {
                  id: "demo1", emoji: "🏫", title: "어린이집 등원 체크", pinned: true,
                  items: [
                    { id: "d1-1", label: "기저귀·물티슈", checked: false },
                    { id: "d1-2", label: "여벌 옷", checked: true },
                    { id: "d1-3", label: "이름표 확인", checked: false },
                    { id: "d1-4", label: "연락장", checked: false },
                    { id: "d1-5", label: "점심 도시락", checked: false },
                  ],
                },
                {
                  id: "demo2", emoji: "🏥", title: "소아과 준비물", pinned: false,
                  items: [
                    { id: "d2-1", label: "건강보험증", checked: false },
                    { id: "d2-2", label: "진료기록수첩", checked: false },
                    { id: "d2-3", label: "간식·장난감", checked: false },
                  ],
                },
              ]));
              localStorage.setItem("inchit_onboarded", "1");
              navigate("/", { replace: true });
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: FONT.base,
              fontSize: 13,
              color: COLOR.textDisabled,
              letterSpacing: "-0.2px",
              padding: "4px 0",
              textDecoration: "underline",
              textDecorationColor: COLOR.borderInactive,
              alignSelf: "center",
            }}
          >
            데모 화면으로 미리보기
          </button>
        </div>

        {/* ── 약관 동의 바텀 시트 ── */}
        {showTerms && (
          <>
            {/* 백드롭 */}
            <div
              className="backdrop-fade"
              onClick={() => setShowTerms(false)}
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.45)",
                zIndex: 10,
              }}
            />

            {/* 바텀 시트 */}
            <div
              className="sheet-slide-up"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: COLOR.bgCard,
                borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`,
                zIndex: 11,
                padding: "0 20px 48px",
                boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
              }}
            >
              {/* 핸들 */}
              <div
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: COLOR.border,
                  borderRadius: RADIUS.pill,
                  margin: "12px auto 20px",
                }}
              />

              {/* 닫기 버튼 */}
              <button
                onClick={() => setShowTerms(false)}
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: COLOR.bgApp,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={16} color={COLOR.textMuted} strokeWidth={2} />
              </button>

              {/* 제목 */}
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: COLOR.textPrimary,
                  letterSpacing: "-0.5px",
                  lineHeight: 1.4,
                  marginBottom: 24,
                }}
              >
                서비스 시작을 위해
                <br />
                동의해주세요 🙏
              </div>

              {/* 전체 동의 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "4px 0 16px",
                }}
              >
                <Checkbox checked={allChecked} onChange={handleCheckAll} />
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: COLOR.textPrimary,
                    letterSpacing: "-0.3px",
                    flex: 1,
                    textAlign: "left",
                  }}
                >
                  전체 동의하기
                </span>
              </div>

              {/* 구분선 */}
              <div
                style={{
                  height: 1,
                  backgroundColor: COLOR.border,
                  marginBottom: 8,
                }}
              />

              {/* 개별 항목 */}
              {TERMS.map((term) => (
                <div
                  key={term.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 0",
                    gap: 12,
                  }}
                >
                  <Checkbox
                    checked={checked[term.id]}
                    onChange={() => handleCheckItem(term.id)}
                  />
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: term.required ? COLOR.info : COLOR.textMuted,
                        letterSpacing: "-0.1px",
                        flexShrink: 0,
                      }}
                    >
                      {term.required ? "(필수)" : "(선택)"}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: COLOR.textSecondary,
                        letterSpacing: "-0.2px",
                      }}
                    >
                      {term.label}
                    </span>
                  </div>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0 2px",
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ChevronRight size={18} color={COLOR.textMuted} strokeWidth={2} />
                  </button>
                </div>
              ))}

              {/* 확인 버튼 */}
              <button
                onClick={handleConfirm}
                disabled={!allRequiredChecked}
                style={{
                  width: "100%",
                  height: 56,
                  marginTop: 24,
                  borderRadius: RADIUS.md,
                  backgroundColor: allRequiredChecked
                    ? COLOR.textPrimary
                    : COLOR.bgApp,
                  border: "none",
                  cursor: allRequiredChecked ? "pointer" : "not-allowed",
                  fontFamily: FONT.base,
                  fontSize: 16,
                  fontWeight: 700,
                  color: allRequiredChecked ? "#fff" : COLOR.textDisabled,
                  letterSpacing: "-0.3px",
                  transition: "background-color 0.2s ease, color 0.2s ease",
                }}
              >
                확인
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
