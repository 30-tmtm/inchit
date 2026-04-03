import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getAgeSnapshotFromDob } from "../utils/seoulDate";
import { ensureDevelopmentNotifications } from "../utils/notifications";

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
  gender?: "male" | "female";
  months: number;
  daysInMonth: number;
  dob: string;
  daysSince: number;
  kdst: { done: number; total: number };
  todaySchedule: ScheduleItem[];
  vaccination: VaccinationItem[];
};

// ── localStorage 키 ────────────────────────────────
const STORAGE_KEY = "inchit_children";

function loadChildren(): Child[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChildren(list: Child[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function normalizeChild(child: Child): Child {
  const age = getAgeSnapshotFromDob(child.dob);
  return {
    ...child,
    months: age.months,
    daysInMonth: age.daysInMonth,
    daysSince: age.daysSince,
  };
}

function normalizeChildren(children: Child[]) {
  return children.map(normalizeChild);
}

// ── Context ───────────────────────────────────────
type ChildContextType = {
  childList: Child[];
  selectedChild: Child | null;
  setSelectedChildId: (id: string) => void;
  addChild: (child: Omit<Child, "id">) => void;
  deleteChild: (id: string) => void;
};

const ChildContext = createContext<ChildContextType | null>(null);

export function ChildProvider({ children }: { children: ReactNode }) {
  const [childList, setChildList] = useState<Child[]>(() => normalizeChildren(loadChildren()));
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    () => loadChildren()[0]?.id ?? null
  );

  const selectedChild = childList.find((c) => c.id === selectedChildId) ?? childList[0] ?? null;

  const addChild = (data: Omit<Child, "id">) => {
    const newChild: Child = { ...data, id: `c_${Date.now()}` };
    const updated = normalizeChildren([...childList, newChild]);
    setChildList(updated);
    saveChildren(updated);
    setSelectedChildId(newChild.id);
  };

  const deleteChild = (id: string) => {
    const updated = childList.filter((child) => child.id !== id);
    setChildList(updated);
    saveChildren(updated);

    const nextSelectedId =
      selectedChildId === id
        ? (updated[0]?.id ?? null)
        : selectedChildId;
    setSelectedChildId(nextSelectedId);

    try {
      const rawNotifications = localStorage.getItem("inchit_notifications");
      if (rawNotifications) {
        const notifications = JSON.parse(rawNotifications) as Array<{ childId?: string }>;
        const filtered = notifications.filter((notification) => notification.childId !== id);
        localStorage.setItem("inchit_notifications", JSON.stringify(filtered));
      }
    } catch {
      // Ignore notification cleanup failures to avoid blocking child deletion.
    }
  };

  useEffect(() => {
    const normalized = normalizeChildren(childList);
    const hasChanged = JSON.stringify(normalized) !== JSON.stringify(childList);
    if (hasChanged) {
      setChildList(normalized);
      saveChildren(normalized);
      return;
    }
    saveChildren(childList);
    ensureDevelopmentNotifications(
      childList.map(({ id, name, dob }) => ({ id, name, dob })),
    );
  }, [childList]);

  return (
    <ChildContext.Provider value={{ childList, selectedChild, setSelectedChildId, addChild, deleteChild }}>
      {children}
    </ChildContext.Provider>
  );
}

export function useChild() {
  const ctx = useContext(ChildContext);
  if (!ctx) throw new Error("useChild must be used within ChildProvider");
  return ctx;
}
