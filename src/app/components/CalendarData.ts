// ─────────────────────────────────────────────
// Static data for the calendar (March 2026)
// 만 3세 아이를 키우는 부모 맞춤 샘플 이벤트
// ─────────────────────────────────────────────

export interface CalEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  color: string;
  category: "health" | "daycare" | "family" | "activity";
}

export interface DayMeta {
  lunarLabel?: string;
  lunarFull?: string;
  holidayName?: string;
  isPublicHoliday?: boolean;
  solarTerm?: string;
  events: CalEvent[];
}

export const EVENT_CATEGORY_LABEL: Record<CalEvent["category"], string> = {
  health: "건강·의료",
  daycare: "어린이집",
  family: "가족",
  activity: "활동·수업",
};

/** Returns a key like "2026-3-24" */
export function dayKey(year: number, month: number, day: number) {
  return `${year}-${month}-${day}`;
}

// ─── Lunar labels (shown in cell) ───────────
const LUNAR_LABELS: Record<string, string> = {
  "2026-3-3": "1.15",
  "2026-3-19": "2.1",
};

// ─── Full lunar dates ────────────────────────
const LUNAR_FULL: Record<string, string> = {
  "2026-3-1":  "01.13",
  "2026-3-2":  "01.14",
  "2026-3-3":  "01.15",
  "2026-3-4":  "01.16",
  "2026-3-5":  "01.17",
  "2026-3-6":  "01.18",
  "2026-3-7":  "01.19",
  "2026-3-8":  "01.20",
  "2026-3-9":  "01.21",
  "2026-3-10": "01.22",
  "2026-3-11": "01.23",
  "2026-3-12": "01.24",
  "2026-3-13": "01.25",
  "2026-3-14": "01.26",
  "2026-3-15": "01.27",
  "2026-3-16": "01.28",
  "2026-3-17": "01.29",
  "2026-3-18": "01.30",
  "2026-3-19": "02.01",
  "2026-3-20": "02.02",
  "2026-3-21": "02.03",
  "2026-3-22": "02.04",
  "2026-3-23": "02.05",
  "2026-3-24": "02.06",
  "2026-3-25": "02.07",
  "2026-3-26": "02.08",
  "2026-3-27": "02.09",
  "2026-3-28": "02.10",
  "2026-3-29": "02.11",
  "2026-3-30": "02.12",
  "2026-3-31": "02.13",
};

// ─── Public holidays ─────────────────────────
const HOLIDAYS: Record<string, { name: string; isPublic: boolean }> = {
  "2026-3-1": { name: "삼일절", isPublic: true },
  "2026-3-2": { name: "대체공휴일", isPublic: true },
};

// ─── Solar terms ─────────────────────────────
const SOLAR_TERMS: Record<string, string> = {
  "2026-3-5":  "경칩",
  "2026-3-20": "춘분",
};

// ─── Events ──────────────────────────────────
// Color guide:
//   health   #5B8BE0  파란색 — 건강·의료
//   daycare  #6BBF7E  초록색 — 어린이집
//   family   #E07B5B  주황색 — 가족 행사
//   activity #A07BE0  보라색 — 활동·수업

const EVENTS: Record<string, CalEvent[]> = {
  // 3/3(화) — 정기 예방접종 (A형 간염 2차)
  "2026-3-3": [
    {
      id: "ev-0303-1",
      title: "A형 간염 예방접종",
      startTime: "오전 10:00",
      endTime: "오전 10:30",
      color: "#5B8BE0",
      category: "health",
    },
  ],

  // 3/6(금) — 어린이집 적응 상담
  "2026-3-6": [
    {
      id: "ev-0306-1",
      title: "어린이집 신입 적응 상담",
      startTime: "오후 1:00",
      endTime: "오후 1:40",
      color: "#6BBF7E",
      category: "daycare",
    },
  ],

  // 3/10(화) — 소아과 + 미술 수업
  "2026-3-10": [
    {
      id: "ev-0310-1",
      title: "소아과 정기 진료",
      startTime: "오전 10:30",
      endTime: "오전 11:00",
      color: "#5B8BE0",
      category: "health",
    },
    {
      id: "ev-0310-2",
      title: "유아 미술 수업",
      startTime: "오후 4:00",
      endTime: "오후 5:00",
      color: "#A07BE0",
      category: "activity",
    },
  ],

  // 3/14(토) — 가족 나들이 (키즈카페)
  "2026-3-14": [
    {
      id: "ev-0314-1",
      title: "가족 나들이 · 키즈카페",
      startTime: "오전 11:00",
      endTime: "오후 2:00",
      color: "#E07B5B",
      category: "family",
    },
  ],

  // 3/17(화) — 어린이 치과 검진
  "2026-3-17": [
    {
      id: "ev-0317-1",
      title: "어린이 치과 정기 검진",
      startTime: "오후 3:00",
      endTime: "오후 3:40",
      color: "#5B8BE0",
      category: "health",
    },
  ],

  // 3/19(목) — 어린이집 봄 참관수업
  "2026-3-19": [
    {
      id: "ev-0319-1",
      title: "어린이집 봄 참관수업",
      startTime: "오전 10:00",
      endTime: "오전 11:30",
      color: "#6BBF7E",
      category: "daycare",
    },
  ],

  // 3/21(토) — 친구 생일 파티
  "2026-3-21": [
    {
      id: "ev-0321-1",
      title: "서준이 생일 파티 🎂",
      startTime: "오후 2:00",
      endTime: "오후 4:30",
      color: "#E07B5B",
      category: "family",
    },
  ],

  // 3/24(화) — 영유아 건강검진 + 수영 수업
  "2026-3-24": [
    {
      id: "ev-0324-1",
      title: "영유아 건강검진 (36개월)",
      startTime: "오후 2:30",
      endTime: "오후 3:30",
      color: "#5B8BE0",
      category: "health",
    },
    {
      id: "ev-0324-2",
      title: "유아 수영 수업",
      startTime: "오후 4:30",
      endTime: "오후 5:10",
      color: "#A07BE0",
      category: "activity",
    },
  ],

  // 3/26(목) — 어린이집 담임 상담
  "2026-3-26": [
    {
      id: "ev-0326-1",
      title: "어린이집 담임 상담",
      startTime: "오후 5:00",
      endTime: "오후 5:30",
      color: "#6BBF7E",
      category: "daycare",
    },
  ],

  // 3/27(금) — 오늘 · 유아 수영 수업
  "2026-3-27": [
    {
      id: "ev-0327-1",
      title: "유아 수영 수업",
      startTime: "오후 4:30",
      endTime: "오후 5:10",
      color: "#A07BE0",
      category: "activity",
    },
  ],

  // 3/28(토) — 벚꽃 나들이
  "2026-3-28": [
    {
      id: "ev-0328-1",
      title: "가족 벚꽃 나들이 🌸",
      startTime: "오전 10:30",
      endTime: "오후 3:00",
      color: "#E07B5B",
      category: "family",
    },
  ],

  // 3/31(화) — 아이 생일 D-1 준비
  "2026-3-31": [
    {
      id: "ev-0331-1",
      title: "생일 케이크 픽업 🎂",
      startTime: "오후 6:00",
      endTime: "오후 6:30",
      color: "#E07B5B",
      category: "family",
    },
  ],
};

export function getDayMeta(year: number, month: number, day: number): DayMeta {
  const key = dayKey(year, month, day);
  const holiday = HOLIDAYS[key];
  return {
    lunarLabel: LUNAR_LABELS[key],
    lunarFull: LUNAR_FULL[key],
    holidayName: holiday?.name,
    isPublicHoliday: holiday?.isPublic,
    solarTerm: SOLAR_TERMS[key],
    events: EVENTS[key] ?? [],
  };
}
