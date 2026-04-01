import { COLOR, FONT, RADIUS } from "../tokens";

export function PlayPage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: COLOR.bgApp,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: FONT.base,
      }}
    >
      {/* 앱바 */}
      <div
        style={{
          padding: "16px 20px 12px",
          backgroundColor: COLOR.bgCard,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: 19,
            color: COLOR.textPrimary,
            letterSpacing: "-0.5px",
          }}
        >
          놀이
        </span>
      </div>

      {/* 준비 중 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "0 32px",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: COLOR.bgCard,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
          }}
        >
          🎮
        </div>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: COLOR.textPrimary,
              letterSpacing: "-0.4px",
              margin: "0 0 8px",
            }}
          >
            놀이 콘텐츠 준비 중이에요
          </p>
          <p
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: COLOR.textMuted,
              letterSpacing: "-0.2px",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            아이 발달에 맞는 놀이 활동을
            <br />
            곧 소개해드릴게요 🧸
          </p>
        </div>
        <div
          style={{
            marginTop: 8,
            padding: "8px 20px",
            backgroundColor: COLOR.bgCard,
            borderRadius: RADIUS.pill,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: COLOR.textMuted,
              letterSpacing: "-0.1px",
            }}
          >
            베타 출시 이후 업데이트 예정
          </span>
        </div>
      </div>
    </div>
  );
}