import { COLOR } from "../tokens";
import { getAgeSnapshotFromDob } from "./seoulDate";

export type AppNotification = {
  id: string;
  category: "일정" | "발달" | "검진";
  emoji: string;
  emojiColor: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  childId?: string;
  popupEligible?: boolean;
  popupSeen?: boolean;
};

type NotificationChild = {
  id: string;
  name: string;
  dob: string;
};

const NOTIFICATION_STORAGE_KEY = "inchit_notifications";

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]) {
  localStorage.setItem(
    NOTIFICATION_STORAGE_KEY,
    JSON.stringify(notifications),
  );
}

function upsertNotification(
  notifications: AppNotification[],
  nextNotification: AppNotification,
) {
  if (notifications.some((notification) => notification.id === nextNotification.id)) {
    return notifications;
  }
  return [nextNotification, ...notifications];
}

export function ensureDevelopmentNotifications(children: NotificationChild[]) {
  let notifications = loadNotifications();

  children.forEach((child) => {
    const age = getAgeSnapshotFromDob(child.dob);
    if (age.months < 1 || age.months > 36) {
      return;
    }

    if (age.daysInMonth === 0) {
      notifications = upsertNotification(notifications, {
        id: `development-month-start-${child.id}-${age.months}`,
        category: "발달",
        emoji: "🌱",
        emojiColor: COLOR.catDaycare,
        title: `${child.name} · ${age.months}개월 발달 체크`,
        body: `이번 시기의 발달 체크를 시작할 수 있어요. ${child.name}만의 속도를 편안하게 살펴봐요.`,
        createdAt: new Date().toISOString(),
        isRead: false,
        childId: child.id,
        popupEligible: false,
        popupSeen: true,
      });
    }

    if (age.daysInMonth === 15) {
      notifications = upsertNotification(notifications, {
        id: `development-month-mid-${child.id}-${age.months}`,
        category: "발달",
        emoji: "✨",
        emojiColor: COLOR.warning,
        title: `${child.name} · ${age.months}개월 발달 체크`,
        body: `지금 시기의 변화를 한 번 더 살펴볼 타이밍이에요. 오늘 체크를 이어가볼까요?`,
        createdAt: new Date().toISOString(),
        isRead: false,
        childId: child.id,
        popupEligible: true,
        popupSeen: false,
      });
    }
  });

  saveNotifications(notifications);
}

export function getPendingDevelopmentPopup(childId: string) {
  return loadNotifications().find(
    (notification) =>
      notification.category === "발달"
      && notification.childId === childId
      && notification.popupEligible
      && !notification.popupSeen,
  ) ?? null;
}

export function markNotificationPopupSeen(id: string) {
  const nextNotifications = loadNotifications().map((notification) =>
    notification.id === id
      ? { ...notification, popupSeen: true }
      : notification,
  );
  saveNotifications(nextNotifications);
}

export function markAllNotificationsRead() {
  const nextNotifications = loadNotifications().map((notification) => ({
    ...notification,
    isRead: true,
  }));
  saveNotifications(nextNotifications);
}

export function formatRelativeNotificationTime(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  if (diffMinutes < 1) {
    return "방금 전";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }

  const date = new Date(createdAt);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

