import { useState } from "react";
import { Activity, Hand, MessageCircle, Brain, Users } from "lucide-react";
import { COLOR, FONT, RADIUS, SPACE } from "../tokens";
import { useScrollFade } from "../hooks/useScrollFade";
import { useChild } from "../contexts/ChildContext";
import { formatAgeShort } from "../utils/ageFormat";

// ── 놀이 활동 타입 ───────────────────────────
type PlayDomain = "대근육" | "소근육" | "언어" | "인지" | "사회성";

interface PlayActivity {
  title: string;
  desc: string;
  tip?: string;
  domain: PlayDomain;
  minMonths: number;
  maxMonths: number;
}

// ── 도메인 메타 ──────────────────────────────
const DOMAIN_META: Record<PlayDomain, { color: string; bg: string; icon: React.ElementType }> = {
  "대근육": { color: "#4A90D9", bg: "#EBF4FF", icon: Activity },
  "소근육": { color: "#7B68EE", bg: "#F0EEFF", icon: Hand },
  "언어":   { color: "#20B2AA", bg: "#E6F7F7", icon: MessageCircle },
  "인지":   { color: "#DA70D6", bg: "#FCF0FC", icon: Brain },
  "사회성": { color: "#FF8C69", bg: "#FFF0EB", icon: Users },
};

const ALL_DOMAINS: PlayDomain[] = ["대근육", "소근육", "언어", "인지", "사회성"];

// ── 놀이 활동 데이터 ────────────────────────
const PLAY_ACTIVITIES: PlayActivity[] = [
  // 0~3개월
  { title: "눈 맞추며 미소 짓기", desc: "아이와 눈을 맞추고 천천히 미소 지어보세요. 아이의 첫 사회적 반응을 이끌어냅니다.", tip: "20~30cm 거리에서 얼굴을 보여주세요.", domain: "사회성", minMonths: 0, maxMonths: 3 },
  { title: "고개 따라가기 놀이", desc: "아이의 시야 안에서 천천히 움직이는 물건을 보여주세요. 시각 추적과 목 근육 발달에 좋아요.", domain: "대근육", minMonths: 0, maxMonths: 3 },
  { title: "배 깔고 누워보기 (터미 타임)", desc: "하루 3~4회, 3~5분씩 배를 깔고 눕혀보세요. 목과 등 근육을 키웁니다.", tip: "이유식 직후는 피하세요.", domain: "대근육", minMonths: 0, maxMonths: 4 },
  { title: "다양한 소리 들려주기", desc: "딸랑이, 물소리, 부드러운 음악 등 다양한 소리를 들려주세요. 청각 발달을 자극합니다.", domain: "언어", minMonths: 0, maxMonths: 4 },
  // 4~6개월
  { title: "까꿍 놀이", desc: "손으로 얼굴을 가렸다 '까꿍!'하며 보여주세요. 영구성 개념의 첫걸음이에요.", domain: "인지", minMonths: 4, maxMonths: 8 },
  { title: "거울 보여주기", desc: "아이에게 거울을 보여주고 자신의 모습을 탐색하게 해주세요. 자아 인식 발달에 도움이 돼요.", domain: "사회성", minMonths: 4, maxMonths: 9 },
  { title: "질감이 다른 물체 만져보기", desc: "부드러운 천, 딱딱한 플라스틱, 거친 종이 등 다양한 질감을 만져보게 해주세요.", domain: "소근육", minMonths: 3, maxMonths: 9 },
  { title: "노래 부르며 몸 흔들기", desc: "리듬감 있는 동요를 부르며 아이를 살살 흔들어주세요. 언어 리듬감과 청각 발달에 좋아요.", domain: "언어", minMonths: 2, maxMonths: 10 },
  // 7~12개월
  { title: "블록 쌓고 무너뜨리기", desc: "블록을 쌓아두고 아이가 밀어 무너뜨리게 해주세요. 원인-결과 개념을 배웁니다.", tip: "소리 나는 블록이면 더 좋아요.", domain: "인지", minMonths: 7, maxMonths: 14 },
  { title: "공 굴리기 주고받기", desc: "마주 앉아 공을 천천히 굴려주세요. 눈-손 협응과 사회적 상호작용을 키웁니다.", domain: "대근육", minMonths: 8, maxMonths: 18 },
  { title: "간단한 손 유희", desc: "'짝짜꿍', '섞어섞어' 같은 손 유희를 함께 해보세요.", domain: "소근육", minMonths: 7, maxMonths: 15 },
  { title: "이름 불러 반응하기", desc: "아이 이름을 다정하게 불러보세요. 이름에 반응하기 시작하면 언어 이해의 신호예요.", domain: "언어", minMonths: 6, maxMonths: 12 },
  { title: "물건 숨기고 찾기", desc: "천 밑에 장난감을 숨기고 찾아보게 해주세요. 대상 영속성 개념이 발달해요.", domain: "인지", minMonths: 8, maxMonths: 14 },
  // 13~18개월
  { title: "걸음마 연습 이끌기", desc: "아이 양손을 잡고 함께 걸어보거나, 밀고 다니는 장난감을 이용해보세요.", domain: "대근육", minMonths: 10, maxMonths: 18 },
  { title: "그림책 함께 보기", desc: "그림을 가리키며 '멍멍이는 어디있지?' 물어보세요. 어휘와 이해력이 쑥쑥 자라요.", tip: "하루 10~15분, 짧고 자주가 효과적이에요.", domain: "언어", minMonths: 10, maxMonths: 24 },
  { title: "흉내 놀이 (전화기, 빗질)", desc: "전화기를 귀에 대거나 빗으로 머리를 빗는 흉내를 내게 해주세요.", domain: "인지", minMonths: 12, maxMonths: 24 },
  { title: "컵 안에 물건 넣고 꺼내기", desc: "컵에 작은 공이나 블록을 넣었다 꺼내게 해주세요. 집기 능력과 인과관계를 이해해요.", domain: "소근육", minMonths: 10, maxMonths: 18 },
  // 19~24개월
  { title: "낙서 놀이 (크레용)", desc: "큰 종이에 크레용으로 마음껏 낙서하게 해주세요. 소근육과 창의성이 발달해요.", domain: "소근육", minMonths: 15, maxMonths: 36 },
  { title: "역할 놀이 시작하기", desc: "인형에게 밥을 먹이거나 재우는 흉내를 내게 해보세요.", domain: "사회성", minMonths: 18, maxMonths: 36 },
  { title: "두 단어 말 유도하기", desc: "'엄마 주세요', '빠빠 가자' 등 두 단어 표현을 자연스럽게 모델링 해주세요.", domain: "언어", minMonths: 18, maxMonths: 30 },
  { title: "간단한 심부름 시키기", desc: "'신발 가져다 줘', '책 놓아봐' 같은 간단한 지시를 해보세요.", domain: "인지", minMonths: 18, maxMonths: 30 },
  // 25~36개월
  { title: "세발자전거 타기", desc: "페달을 밟는 세발자전거를 시도해보세요. 다리 근육과 균형감이 발달해요.", domain: "대근육", minMonths: 24, maxMonths: 42 },
  { title: "퍼즐 맞추기 (4~6조각)", desc: "간단한 퍼즐을 함께 맞춰보세요. 공간 인지와 문제 해결력이 발달해요.", domain: "인지", minMonths: 24, maxMonths: 48 },
  { title: "친구와 병행 놀이", desc: "같은 공간에서 비슷한 놀이를 하도록 환경을 만들어 주세요. 또래 의식의 시작이에요.", domain: "사회성", minMonths: 24, maxMonths: 42 },
  { title: "이야기 들려주기", desc: "짧은 이야기나 동화를 읽어주면서 '다음엔 어떻게 될까?' 질문해보세요.", domain: "언어", minMonths: 24, maxMonths: 48 },
  { title: "가위질 연습 (유아 가위)", desc: "안전 가위로 종이를 자르는 연습을 해보세요. 소근육 조절 능력이 향상돼요.", domain: "소근육", minMonths: 30, maxMonths: 60 },
  // 37개월~
  { title: "규칙 있는 보드게임", desc: "순서 지키기, 규칙 따르기가 있는 간단한 보드게임을 시도해보세요.", domain: "사회성", minMonths: 36, maxMonths: 72 },
  { title: "그림 그리고 이야기 만들기", desc: "그림을 그리고 '이건 뭐야?'하고 물어보면서 이야기를 만들어 보세요.", domain: "언어", minMonths: 36, maxMonths: 72 },
  { title: "한 발로 뛰기 / 공 차기", desc: "한 발로 뛰거나 공을 발로 차는 연습을 해보세요.", domain: "대근육", minMonths: 36, maxMonths: 60 },
  { title: "숫자 세기 놀이", desc: "계단을 올라가며 '하나, 둘, 셋...' 함께 세어보세요.", domain: "인지", minMonths: 30, maxMonths: 60 },
];

function getActivities(months: number, domain: PlayDomain | "전체"): PlayActivity[] {
  const buffer = 4;
  return PLAY_ACTIVITIES.filter(a => {
    const inRange = a.minMonths <= months + buffer && a.maxMonths >= months - buffer;
    const inDomain = domain === "전체" || a.domain === domain;
    return inRange && inDomain;
  });
}

// ── 활동 카드 ────────────────────────────────
function ActivityCard({ activity }: { activity: PlayActivity }) {
  const { color, bg, icon: Icon } = DOMAIN_META[activity.domain];
  return (
    <div style={{ backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: RADIUS.sm, backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} color={color} strokeWidth={2} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: "-0.1px" }}>{activity.domain}</span>
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px", lineHeight: 1.4 }}>
        {activity.title}
      </span>
      <span style={{ fontSize: 13, color: COLOR.textSecondary, lineHeight: 1.7, letterSpacing: "-0.2px" }}>
        {activity.desc}
      </span>
      {activity.tip && (
        <div style={{ backgroundColor: bg, borderRadius: RADIUS.sm, padding: "8px 12px", marginTop: 2 }}>
          <span style={{ fontSize: 12, color, fontWeight: 600, letterSpacing: "-0.1px" }}>💡 {activity.tip}</span>
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────
export function PlayPage() {
  const { selectedChild } = useChild();
  const scrollRef = useScrollFade();
  const [activeDomain, setActiveDomain] = useState<PlayDomain | "전체">("전체");

  const months = selectedChild?.months ?? 12;
  const activities = getActivities(months, activeDomain);

  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: COLOR.bgApp, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: FONT.base }}>
      {/* 앱바 */}
      <div style={{ padding: "16px 20px 0", backgroundColor: COLOR.bgCard, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 19, color: COLOR.textPrimary, letterSpacing: "-0.5px" }}>놀이 활동</span>
          {selectedChild && (
            <span style={{ fontSize: 13, color: COLOR.textMuted, fontWeight: 500 }}>
              {selectedChild.name} · {formatAgeShort(months)}
            </span>
          )}
        </div>

        {/* 도메인 필터 탭 */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
          {(["전체", ...ALL_DOMAINS] as (PlayDomain | "전체")[]).map(d => {
            const isActive = activeDomain === d;
            const meta = d !== "전체" ? DOMAIN_META[d] : null;
            return (
              <button
                key={d}
                onClick={() => setActiveDomain(d)}
                style={{
                  flexShrink: 0, padding: "6px 14px", borderRadius: RADIUS.pill,
                  border: "none", cursor: "pointer", fontFamily: FONT.base,
                  fontSize: 12, fontWeight: 600, letterSpacing: "-0.1px",
                  backgroundColor: isActive ? (meta?.color ?? COLOR.primary) : COLOR.bgApp,
                  color: isActive ? "#fff" : COLOR.textMuted,
                  WebkitTapHighlightColor: "transparent",
                  transition: "background-color 0.15s, color 0.15s",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* 활동 목록 */}
      <div ref={scrollRef} className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: `14px ${SPACE.pagePadding}px 32px`, display: "flex", flexDirection: "column", gap: 10 }}>
        {activities.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "60px 0" }}>
            <span style={{ fontSize: 36 }}>🧸</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: COLOR.textMuted }}>해당 활동을 준비 중이에요</span>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, color: COLOR.textDisabled, margin: "0 0 2px", letterSpacing: "-0.1px" }}>
              {selectedChild ? `${formatAgeShort(months)} 아이에게 맞는 활동 ${activities.length}개` : `놀이 활동 ${activities.length}개`}
            </p>
            {activities.map((a, i) => <ActivityCard key={`${a.title}-${i}`} activity={a} />)}
            <p style={{ fontSize: 11, color: COLOR.textDisabled, textAlign: "center", marginTop: 8, lineHeight: 1.6 }}>
              모든 활동은 참고용이며 아이의 발달 속도는 개인차가 있어요.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
