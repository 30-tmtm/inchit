import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getAgeSnapshotFromDob } from "../utils/seoulDate";
import { ensureDevelopmentNotifications } from "../utils/notifications";
import { supabase } from "../../lib/supabase";
import { getKdstTotal } from "../data/kdst";
import { useAuth } from "./AuthContext";

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

// ── localStorage 헬퍼 ──────────────────────────────
const STORAGE_KEY = "inchit_children";

function loadChildrenFromStorage(): Child[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveChildrenToStorage(list: Child[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadKdstFromStorage(childId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`inchit_kdst_${childId}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveKdstToStorage(childId: string, checked: Set<string>) {
  localStorage.setItem(`inchit_kdst_${childId}`, JSON.stringify([...checked]));
}

function normalizeChild(child: Omit<Child, "kdst"> & { kdst?: Child["kdst"] }): Child {
  const age = getAgeSnapshotFromDob(child.dob);
  return {
    todaySchedule: [],
    vaccination: [],
    kdst: { done: 0, total: 0 },
    ...child,
    months: age.months,
    daysInMonth: age.daysInMonth,
    daysSince: age.daysSince,
  };
}

// ── Context ───────────────────────────────────────
type ChildContextType = {
  childList: Child[];
  selectedChild: Child | null;
  setSelectedChildId: (id: string) => void;
  addChild: (data: { name: string; gender?: "male" | "female"; dob: string }) => Promise<void>;
  updateChild: (id: string, data: { name: string; gender?: "male" | "female"; dob: string }) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;
  toggleKdstItem: (childId: string, itemKey: string) => Promise<void>;
  isKdstChecked: (childId: string, itemKey: string) => boolean;
  loading: boolean;
};

const ChildContext = createContext<ChildContextType | null>(null);

export function ChildProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [rawChildren, setRawChildren] = useState<Omit<Child, "kdst">[]>([]);
  const [kdstChecked, setKdstChecked] = useState<Record<string, Set<string>>>({});
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── 데이터 로드 ──────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);

    if (user) {
      // Supabase에서 로드
      const { data: childrenData } = await supabase
        .from("children")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");

      const normalized = (childrenData ?? []).map((c) =>
        normalizeChild({ id: c.id, name: c.name, gender: c.gender ?? undefined, dob: c.dob })
      );
      setRawChildren(normalized);

      // KDST 체크 데이터 로드
      const childIds = normalized.map((c) => c.id);
      if (childIds.length > 0) {
        const { data: checks } = await supabase
          .from("kdst_checks")
          .select("child_id, item_key")
          .eq("user_id", user.id)
          .in("child_id", childIds);

        const map: Record<string, Set<string>> = {};
        for (const c of checks ?? []) {
          if (!map[c.child_id]) map[c.child_id] = new Set();
          map[c.child_id].add(c.item_key);
        }
        setKdstChecked(map);
      }

      // 선택된 자녀 초기화
      setSelectedChildId((prev) => prev ?? normalized[0]?.id ?? null);
    } else {
      // 데모 모드: localStorage에서 로드
      const saved = loadChildrenFromStorage().map((c) => normalizeChild(c));
      setRawChildren(saved);

      const map: Record<string, Set<string>> = {};
      for (const c of saved) map[c.id] = loadKdstFromStorage(c.id);
      setKdstChecked(map);

      setSelectedChildId((prev) => prev ?? saved[0]?.id ?? null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── childList (kdst 포함) ─────────────────────────
  const childList: Child[] = rawChildren.map((c) => ({
    ...c,
    kdst: {
      done: kdstChecked[c.id]?.size ?? 0,
      total: getKdstTotal(c.months),
    },
  }));

  const selectedChild = childList.find((c) => c.id === selectedChildId) ?? childList[0] ?? null;

  // ── 알림 동기화 ───────────────────────────────────
  useEffect(() => {
    if (childList.length > 0) {
      ensureDevelopmentNotifications(
        childList.map(({ id, name, dob }) => ({ id, name, dob }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawChildren]);

  // ── addChild ──────────────────────────────────────
  const addChild = async (data: { name: string; gender?: "male" | "female"; dob: string }) => {
    const newId = `c_${Date.now()}`;

    if (user) {
      await supabase.from("children").insert({
        id: newId,
        user_id: user.id,
        name: data.name,
        gender: data.gender ?? null,
        dob: data.dob,
      });
    } else {
      // 데모 모드: localStorage 저장
      const normalized = normalizeChild({ id: newId, ...data });
      const updated = [...rawChildren.map((c) => ({ ...c, kdst: { done: 0, total: 0 } })), normalized];
      saveChildrenToStorage(updated);
      localStorage.setItem("inchit_onboarded", "1");
    }

    await loadData();
    setSelectedChildId(newId);
  };

  // ── updateChild ──────────────────────────────────
  const updateChild = async (id: string, data: { name: string; gender?: "male" | "female"; dob: string }) => {
    if (user) {
      await supabase.from("children").update({
        name: data.name,
        gender: data.gender ?? null,
        dob: data.dob,
      }).eq("id", id).eq("user_id", user.id);
    } else {
      const updated = rawChildren.map((c) =>
        c.id === id ? normalizeChild({ ...c, ...data }) : c
      );
      saveChildrenToStorage(updated.map((c) => ({ ...c, kdst: { done: 0, total: 0 } })));
    }
    await loadData();
  };

  // ── deleteChild ───────────────────────────────────
  const deleteChild = async (id: string) => {
    if (user) {
      await supabase.from("children").delete().eq("id", id).eq("user_id", user.id);
      await supabase.from("kdst_checks").delete().eq("child_id", id).eq("user_id", user.id);
    } else {
      const updated = rawChildren.filter((c) => c.id !== id).map((c) => ({
        ...c,
        kdst: { done: kdstChecked[c.id]?.size ?? 0, total: getKdstTotal(c.months) },
      }));
      saveChildrenToStorage(updated);
      localStorage.removeItem(`inchit_kdst_${id}`);

      try {
        const raw = localStorage.getItem("inchit_notifications");
        if (raw) {
          const notifications = JSON.parse(raw) as Array<{ childId?: string }>;
          localStorage.setItem("inchit_notifications", JSON.stringify(notifications.filter((n) => n.childId !== id)));
        }
      } catch { /* ignore */ }
    }

    setRawChildren((prev) => prev.filter((c) => c.id !== id));
    setKdstChecked((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setSelectedChildId((prev) => (prev === id ? rawChildren.find((c) => c.id !== id)?.id ?? null : prev));
  };

  // ── toggleKdstItem ────────────────────────────────
  const toggleKdstItem = async (childId: string, itemKey: string) => {
    const current = kdstChecked[childId] ?? new Set<string>();
    const isChecked = current.has(itemKey);

    if (user) {
      if (isChecked) {
        await supabase.from("kdst_checks")
          .delete()
          .eq("user_id", user.id)
          .eq("child_id", childId)
          .eq("item_key", itemKey);
      } else {
        await supabase.from("kdst_checks")
          .insert({ user_id: user.id, child_id: childId, item_key: itemKey });
      }
    } else {
      const newSet = new Set(current);
      isChecked ? newSet.delete(itemKey) : newSet.add(itemKey);
      saveKdstToStorage(childId, newSet);
    }

    setKdstChecked((prev) => {
      const newSet = new Set(prev[childId] ?? new Set<string>());
      isChecked ? newSet.delete(itemKey) : newSet.add(itemKey);
      return { ...prev, [childId]: newSet };
    });
  };

  const isKdstChecked = (childId: string, itemKey: string) =>
    kdstChecked[childId]?.has(itemKey) ?? false;

  return (
    <ChildContext.Provider value={{
      childList,
      selectedChild,
      setSelectedChildId,
      addChild,
      updateChild,
      deleteChild,
      toggleKdstItem,
      isKdstChecked,
      loading,
    }}>
      {children}
    </ChildContext.Provider>
  );
}

export function useChild() {
  const ctx = useContext(ChildContext);
  if (!ctx) throw new Error("useChild must be used within ChildProvider");
  return ctx;
}
