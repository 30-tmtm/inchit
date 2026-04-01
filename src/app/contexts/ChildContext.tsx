import { createContext, useContext, useState, ReactNode } from "react";
import { COLOR } from "../tokens";

// ── Types ─────────────────────────────────────────
export type VaccinationItem = {
  id: number;
  type: string;
  label: string;
  date: string;
  dday: string;
  color: string;
  icon: "stethoscope" | "syringe";
};

export type ScheduleItem = {
  id: number;
  time: string;
  label: string;
  color: string;
};

export type Child = {
  id: string;
  name: string;
  months: number;
  daysInMonth: number;
  dob: string;
  daysSince: number;
  kdst: { done: number; total: number };
  todaySchedule: ScheduleItem[];
  vaccination: VaccinationItem[];
};

// ── Mock Children Data ────────────────────────────
export const CHILDREN_MOCK: Child[] = [
  {
    id: "c1",
    name: "김우리",
    months: 19,
    daysInMonth: 12,
    dob: "2024.08.18",
    daysSince: 578,
    kdst: { done: 3, total: 20 },
    todaySchedule: [
      { id: 1, time: "09:30", label: "어린이집 등원",   color: COLOR.catDaycare },
      { id: 2, time: "16:00", label: "소아과 정기 검진", color: COLOR.catHealth  },
      { id: 3, time: "19:00", label: "가족 저녁 식사",  color: COLOR.catFamily  },
    ],
    vaccination: [
      {
        id: 1, type: "검진", label: "18~24개월 발달 검진",
        date: "4월 3일 (목)", dday: "D-5",
        color: COLOR.catHealth, icon: "stethoscope",
      },
      {
        id: 2, type: "접종", label: "MMR 1차",
        date: "2025.06.18", dday: "D-81",
        color: COLOR.catActivity, icon: "syringe",
      },
    ],
  },
  {
    id: "c2",
    name: "김은하",
    months: 6,
    daysInMonth: 3,
    dob: "2025.09.28",
    daysSince: 185,
    kdst: { done: 1, total: 20 },
    todaySchedule: [
      { id: 1, time: "10:00", label: "영아 마사지",   color: COLOR.catActivity },
      { id: 2, time: "14:30", label: "예방접종 검진", color: COLOR.catHealth   },
    ],
    vaccination: [
      {
        id: 1, type: "접종", label: "로타바이러스 3차",
        date: "4월 10일 (목)", dday: "D-12",
        color: COLOR.catActivity, icon: "syringe",
      },
      {
        id: 2, type: "검진", label: "4~6개월 영유아 검진",
        date: "4월 18일 (금)", dday: "D-20",
        color: COLOR.catHealth, icon: "stethoscope",
      },
    ],
  },
];

// ── Context ───────────────────────────────────────
type ChildContextType = {
  childList: Child[];
  selectedChild: Child;
  setSelectedChildId: (id: string) => void;
};

const ChildContext = createContext<ChildContextType | null>(null);

export function ChildProvider({ children }: { children: ReactNode }) {
  const [selectedChildId, setSelectedChildId] = useState(CHILDREN_MOCK[0].id);
  const selectedChild =
    CHILDREN_MOCK.find((c) => c.id === selectedChildId) ?? CHILDREN_MOCK[0];

  return (
    <ChildContext.Provider value={{ childList: CHILDREN_MOCK, selectedChild, setSelectedChildId }}>
      {children}
    </ChildContext.Provider>
  );
}

export function useChild() {
  const ctx = useContext(ChildContext);
  if (!ctx) throw new Error("useChild must be used within ChildProvider");
  return ctx;
}
