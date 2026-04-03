export interface CalEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  color: string;
  category: "health" | "daycare" | "family" | "activity";
  location?: string;
}

export interface DayMeta {
  lunarLabel?: string;
  lunarFull?: string;
  holidayName?: string;
  isPublicHoliday?: boolean;
  solarTerm?: string;
  events: CalEvent[];
}

type HolidayInfo = {
  name: string;
  isPublic: boolean;
};

type CalendarEventStore = {
  eventsByDate: Record<string, CalEvent[]>;
  deletedIds: string[];
};

const CALENDAR_EVENT_STORAGE_KEY = "inchit_calendar_events";

export const EVENT_CATEGORY_LABEL: Record<CalEvent["category"], string> = {
  health: "건강·의료",
  daycare: "어린이집",
  family: "가족",
  activity: "활동·수업",
};

export function dayKey(year: number, month: number, day: number) {
  return `${year}-${month}-${day}`;
}

const LUNAR_LABELS: Record<string, string> = {
  "2026-3-3": "1.15",
  "2026-3-19": "2.1",
};

const LUNAR_FULL: Record<string, string> = {
  "2026-3-1": "01.13",
  "2026-3-2": "01.14",
  "2026-3-3": "01.15",
  "2026-3-4": "01.16",
  "2026-3-5": "01.17",
  "2026-3-6": "01.18",
  "2026-3-7": "01.19",
  "2026-3-8": "01.20",
  "2026-3-9": "01.21",
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

const HOLIDAYS: Record<string, HolidayInfo> = {
  "2025-1-1": { name: "신정", isPublic: true },
  "2025-1-27": { name: "임시공휴일(설날)", isPublic: true },
  "2025-1-28": { name: "설날 연휴", isPublic: true },
  "2025-1-29": { name: "설날", isPublic: true },
  "2025-1-30": { name: "설날 연휴", isPublic: true },
  "2025-3-1": { name: "삼일절", isPublic: true },
  "2025-3-3": { name: "대체공휴일(삼일절)", isPublic: true },
  "2025-5-5": { name: "어린이날 · 부처님오신날", isPublic: true },
  "2025-5-6": { name: "대체공휴일(부처님오신날)", isPublic: true },
  "2025-6-6": { name: "현충일", isPublic: true },
  "2025-8-15": { name: "광복절", isPublic: true },
  "2025-10-3": { name: "개천절", isPublic: true },
  "2025-10-5": { name: "추석 연휴", isPublic: true },
  "2025-10-6": { name: "추석", isPublic: true },
  "2025-10-7": { name: "추석 연휴", isPublic: true },
  "2025-10-8": { name: "대체공휴일(추석)", isPublic: true },
  "2025-10-9": { name: "한글날", isPublic: true },
  "2025-12-25": { name: "크리스마스", isPublic: true },
  "2026-1-1": { name: "신정", isPublic: true },
  "2026-2-16": { name: "설날 연휴", isPublic: true },
  "2026-2-17": { name: "설날", isPublic: true },
  "2026-2-18": { name: "설날 연휴", isPublic: true },
  "2026-3-1": { name: "삼일절", isPublic: true },
  "2026-3-2": { name: "대체공휴일(삼일절)", isPublic: true },
  "2026-5-5": { name: "어린이날", isPublic: true },
  "2026-5-24": { name: "부처님오신날", isPublic: true },
  "2026-5-25": { name: "대체공휴일(부처님오신날)", isPublic: true },
  "2026-6-6": { name: "현충일", isPublic: true },
  "2026-8-15": { name: "광복절", isPublic: true },
  "2026-8-17": { name: "대체공휴일(광복절)", isPublic: true },
  "2026-9-24": { name: "추석 연휴", isPublic: true },
  "2026-9-25": { name: "추석", isPublic: true },
  "2026-9-26": { name: "추석 연휴", isPublic: true },
  "2026-10-3": { name: "개천절", isPublic: true },
  "2026-10-5": { name: "대체공휴일(개천절)", isPublic: true },
  "2026-10-9": { name: "한글날", isPublic: true },
  "2026-12-25": { name: "크리스마스", isPublic: true },
  "2027-1-1": { name: "신정", isPublic: true },
  "2027-2-6": { name: "설날 연휴", isPublic: true },
  "2027-2-7": { name: "설날", isPublic: true },
  "2027-2-8": { name: "설날 연휴", isPublic: true },
  "2027-2-9": { name: "대체공휴일(설날)", isPublic: true },
  "2027-3-1": { name: "삼일절", isPublic: true },
  "2027-5-5": { name: "어린이날", isPublic: true },
  "2027-5-13": { name: "부처님오신날", isPublic: true },
  "2027-6-6": { name: "현충일", isPublic: true },
  "2027-8-15": { name: "광복절", isPublic: true },
  "2027-8-16": { name: "대체공휴일(광복절)", isPublic: true },
  "2027-9-14": { name: "추석 연휴", isPublic: true },
  "2027-9-15": { name: "추석", isPublic: true },
  "2027-9-16": { name: "추석 연휴", isPublic: true },
  "2027-10-3": { name: "개천절", isPublic: true },
  "2027-10-4": { name: "대체공휴일(개천절)", isPublic: true },
  "2027-10-9": { name: "한글날", isPublic: true },
  "2027-10-11": { name: "대체공휴일(한글날)", isPublic: true },
  "2027-12-25": { name: "크리스마스", isPublic: true },
  "2027-12-27": { name: "대체공휴일(크리스마스)", isPublic: true },
};

const SOLAR_TERMS: Record<string, string> = {
  "2026-3-5": "경칩",
  "2026-3-20": "춘분",
};

const STATIC_EVENTS: Record<string, CalEvent[]> = {
  "2026-3-3": [
    {
      id: "ev-0303-1",
      title: "A형 간염 예방접종",
      startTime: "오전 10:00",
      endTime: "오전 10:30",
      color: "#7D8BE0",
      category: "health",
      location: "우리 소아과의원",
    },
  ],
  "2026-3-6": [
    {
      id: "ev-0306-1",
      title: "어린이집 신입 적응 상담",
      startTime: "오후 1:00",
      endTime: "오후 1:40",
      color: "#BCC07B",
      category: "daycare",
      location: "햇살 어린이집",
    },
  ],
  "2026-3-10": [
    {
      id: "ev-0310-1",
      title: "소아과 정기 진료",
      startTime: "오전 10:30",
      endTime: "오전 11:00",
      color: "#7D8BE0",
      category: "health",
      location: "우리 소아과의원",
    },
    {
      id: "ev-0310-2",
      title: "유아 미술 수업",
      startTime: "오후 4:00",
      endTime: "오후 5:00",
      color: "#9A81B0",
      category: "activity",
      location: "리틀 아트 스튜디오",
    },
  ],
  "2026-3-14": [
    {
      id: "ev-0314-1",
      title: "가족 나들이 · 키즈카페",
      startTime: "오전 11:00",
      endTime: "오후 2:00",
      color: "#F69F95",
      category: "family",
      location: "별빛 키즈카페",
    },
  ],
  "2026-3-17": [
    {
      id: "ev-0317-1",
      title: "어린이 치과 정기 검진",
      startTime: "오후 3:00",
      endTime: "오후 3:40",
      color: "#7D8BE0",
      category: "health",
      location: "미소 치과",
    },
  ],
  "2026-3-19": [
    {
      id: "ev-0319-1",
      title: "어린이집 봄 참관수업",
      startTime: "오전 10:00",
      endTime: "오전 11:30",
      color: "#BCC07B",
      category: "daycare",
      location: "햇살 어린이집",
    },
  ],
  "2026-3-21": [
    {
      id: "ev-0321-1",
      title: "서준이 생일 파티 🎂",
      startTime: "오후 2:00",
      endTime: "오후 4:30",
      color: "#F69F95",
      category: "family",
    },
  ],
  "2026-3-24": [
    {
      id: "ev-0324-1",
      title: "영유아 건강검진 (36개월)",
      startTime: "오후 2:30",
      endTime: "오후 3:30",
      color: "#7D8BE0",
      category: "health",
      location: "행복 소아과의원",
    },
    {
      id: "ev-0324-2",
      title: "유아 수영 수업",
      startTime: "오후 4:30",
      endTime: "오후 5:10",
      color: "#9A81B0",
      category: "activity",
      location: "스포츠센터 수영장",
    },
  ],
  "2026-3-26": [
    {
      id: "ev-0326-1",
      title: "어린이집 담임 상담",
      startTime: "오후 5:00",
      endTime: "오후 5:30",
      color: "#BCC07B",
      category: "daycare",
      location: "햇살 어린이집",
    },
  ],
  "2026-3-27": [
    {
      id: "ev-0327-1",
      title: "유아 수영 수업",
      startTime: "오후 4:30",
      endTime: "오후 5:10",
      color: "#9A81B0",
      category: "activity",
      location: "스포츠센터 수영장",
    },
  ],
  "2026-3-28": [
    {
      id: "ev-0328-1",
      title: "가족 벚꽃 나들이 🌸",
      startTime: "오전 10:30",
      endTime: "오후 3:00",
      color: "#F69F95",
      category: "family",
      location: "여의도 한강공원",
    },
  ],
  "2026-3-31": [
    {
      id: "ev-0331-1",
      title: "생일 케이크 픽업 🎂",
      startTime: "오후 6:00",
      endTime: "오후 6:30",
      color: "#F69F95",
      category: "family",
      location: "파리바게뜨 마포점",
    },
  ],
};

function makeEmptyStore(): CalendarEventStore {
  return { eventsByDate: {}, deletedIds: [] };
}

function loadCalendarEventStore(): CalendarEventStore {
  try {
    const raw = localStorage.getItem(CALENDAR_EVENT_STORAGE_KEY);
    if (!raw) {
      return makeEmptyStore();
    }
    const parsed = JSON.parse(raw) as Partial<CalendarEventStore>;
    return {
      eventsByDate: parsed.eventsByDate ?? {},
      deletedIds: parsed.deletedIds ?? [],
    };
  } catch {
    return makeEmptyStore();
  }
}

function saveCalendarEventStore(store: CalendarEventStore) {
  localStorage.setItem(CALENDAR_EVENT_STORAGE_KEY, JSON.stringify(store));
}

function getCustomEventIds(store: CalendarEventStore) {
  const ids = new Set<string>();
  Object.values(store.eventsByDate).forEach((events) => {
    events.forEach((event) => ids.add(event.id));
  });
  return ids;
}

function getEventsForDateFromStore(key: string, store: CalendarEventStore) {
  const deletedIds = new Set(store.deletedIds);
  const customIds = getCustomEventIds(store);
  const staticEvents = (STATIC_EVENTS[key] ?? []).filter(
    (event) => !deletedIds.has(event.id) && !customIds.has(event.id),
  );
  const customEvents = (store.eventsByDate[key] ?? []).filter(
    (event) => !deletedIds.has(event.id),
  );
  return [...staticEvents, ...customEvents];
}

export function upsertCalendarEvent(targetKey: string, event: CalEvent) {
  const store = loadCalendarEventStore();
  const nextEventsByDate: Record<string, CalEvent[]> = {};

  Object.entries(store.eventsByDate).forEach(([key, events]) => {
    const filtered = events.filter((item) => item.id !== event.id);
    if (filtered.length > 0) {
      nextEventsByDate[key] = filtered;
    }
  });

  nextEventsByDate[targetKey] = [...(nextEventsByDate[targetKey] ?? []), event];

  saveCalendarEventStore({
    eventsByDate: nextEventsByDate,
    deletedIds: store.deletedIds.filter((id) => id !== event.id),
  });
}

export function deleteCalendarEvent(eventId: string) {
  const store = loadCalendarEventStore();
  const nextEventsByDate: Record<string, CalEvent[]> = {};

  Object.entries(store.eventsByDate).forEach(([key, events]) => {
    const filtered = events.filter((event) => event.id !== eventId);
    if (filtered.length > 0) {
      nextEventsByDate[key] = filtered;
    }
  });

  saveCalendarEventStore({
    eventsByDate: nextEventsByDate,
    deletedIds: store.deletedIds.includes(eventId)
      ? store.deletedIds
      : [...store.deletedIds, eventId],
  });
}

export function getDayMeta(year: number, month: number, day: number): DayMeta {
  const key = dayKey(year, month, day);
  const holiday = HOLIDAYS[key];
  const store = loadCalendarEventStore();
  return {
    lunarLabel: LUNAR_LABELS[key],
    lunarFull: LUNAR_FULL[key],
    holidayName: holiday?.name,
    isPublicHoliday: holiday?.isPublic,
    solarTerm: SOLAR_TERMS[key],
    events: getEventsForDateFromStore(key, store),
  };
}

export function getAllEvents(): Array<{ year: number; month: number; day: number; event: CalEvent }> {
  const result: Array<{ year: number; month: number; day: number; event: CalEvent }> = [];
  const store = loadCalendarEventStore();
  const allKeys = new Set([
    ...Object.keys(STATIC_EVENTS),
    ...Object.keys(store.eventsByDate),
  ]);

  allKeys.forEach((key) => {
    const [year, month, day] = key.split("-").map(Number);
    getEventsForDateFromStore(key, store).forEach((event) => {
      result.push({ year, month, day, event });
    });
  });

  result.sort((a, b) => {
    const dateDiff =
      new Date(b.year, b.month - 1, b.day).getTime()
      - new Date(a.year, a.month - 1, a.day).getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return a.event.startTime.localeCompare(b.event.startTime);
  });

  return result;
}
