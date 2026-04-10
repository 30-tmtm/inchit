export type DateParts = {
  year: number;
  month: number;
  day: number;
};

export type AgeSnapshot = {
  months: number;
  daysInMonth: number;
  daysSince: number;
};

export function getSeoulTodayParts(): DateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "0");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "0");
  return { year, month, day };
}

export function parseDobParts(dob: string): DateParts {
  const [year, month, day] = dob.split(".").map(Number);
  return { year, month, day };
}

function diffDays(from: DateParts, to: DateParts) {
  const fromMs = Date.UTC(from.year, from.month - 1, from.day);
  const toMs = Date.UTC(to.year, to.month - 1, to.day);
  return Math.max(0, Math.floor((toMs - fromMs) / (1000 * 60 * 60 * 24)));
}

export function getAgeSnapshotFromDob(dob: string, today = getSeoulTodayParts()): AgeSnapshot {
  const birth = parseDobParts(dob);
  let months = (today.year - birth.year) * 12 + (today.month - birth.month);
  if (today.day < birth.day) {
    months -= 1;
  }

  const prevMonthDays = new Date(today.year, today.month - 1, 0).getDate();
  const daysInMonth =
    today.day >= birth.day
      ? today.day - birth.day
      : prevMonthDays - birth.day + today.day;

  return {
    months: Math.max(0, months),
    daysInMonth: Math.max(0, daysInMonth),
    daysSince: diffDays(birth, today),
  };
}

export function formatDateKey(parts: DateParts) {
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** ISO timestamp + 생년월일 → "N개월 N일차" */
export function getAgeAtTimestamp(dob: string, isoTimestamp: string): string {
  const checkedDate = new Date(isoTimestamp);
  const today: DateParts = {
    year: checkedDate.getFullYear(),
    month: checkedDate.getMonth() + 1,
    day: checkedDate.getDate(),
  };
  const snap = getAgeSnapshotFromDob(dob, today);
  if (snap.months < 36) {
    return `${snap.months}개월 ${snap.daysInMonth}일차`;
  }
  return `만 ${Math.floor(snap.months / 12)}세 (${snap.months}개월)`;
}

