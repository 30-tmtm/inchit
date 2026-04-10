import {
  ChevronRight,
  Bell,
  FileText,
  Moon,
  MessageSquare,
  Info,
  Shield,
  Users,
  Baby,
  CalendarDays,
  X,
  Trash2,
  Pencil,
  Check,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { formatAgeShort } from "../utils/ageFormat";
import { COLOR, FONT, RADIUS, SPACE } from "../tokens";
import { useScrollFade } from "../hooks/useScrollFade";
import { useChild, type Child } from "../contexts/ChildContext";
import { useAuth } from "../contexts/AuthContext";
import { DrumRollPicker, DATE_YEAR_ITEMS, DATE_MONTH_ITEMS, getDateDayItems } from "../components/PickerComponents";

const MENU_SECTIONS = [
  {
    title: "아이 정보",
    items: [
      {
        icon: Baby,
        label: "자녀 설정",
        desc: "자녀 이름 · 성별 · 생년월일 관리",
        badge: null,
      },
      {
        icon: Users,
        label: "가족 공유",
        desc: "보호자 추가 · 권한 설정",
        badge: "준비 중",
      },
      {
        icon: CalendarDays,
        label: "인칫 보고서",
        desc: "인칫 포인트 달성 기록",
        badge: null,
      },
    ],
  },
  {
    title: "앱 설정",
    items: [
      {
        icon: Bell,
        label: "알림 설정",
        desc: null,
        badge: "켜짐",
      },
      {
        icon: FileText,
        label: "자동 일정 정보",
        desc: null,
        badge: null,
      },
      {
        icon: Moon,
        label: "다크 모드",
        desc: null,
        badge: "준비 중",
      },
    ],
  },
  {
    title: "기타",
    items: [
      {
        icon: MessageSquare,
        label: "피드백 보내기",
        desc: null,
        badge: null,
      },
      {
        icon: Shield,
        label: "개인정보 처리방침",
        desc: null,
        badge: null,
      },
      {
        icon: FileText,
        label: "이용약관",
        desc: null,
        badge: null,
      },
      {
        icon: Info,
        label: "앱 버전",
        desc: null,
        badge: "v0.1 Beta",
      },
    ],
  },
];

// ── Sub Components ────────────────────────────

function MenuItem({
  item,
  isLast,
  onClick,
}: {
  item: (typeof MENU_SECTIONS)[0]["items"][0];
  isLast: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const isDisabled = item.badge === "준비 중";

  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "15px 18px",
        background: "none",
        border: "none",
        borderBottom: isLast ? "none" : `1px solid ${COLOR.borderLight}`,
        cursor: isDisabled ? "default" : "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
        opacity: isDisabled ? 0.5 : 1,
      }}
    >
      {/* 아이콘 */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: RADIUS.sm,
          backgroundColor: COLOR.bgApp,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={17} color={COLOR.textPrimary} strokeWidth={1.8} />
      </div>

      {/* 텍스트 */}
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontFamily: FONT.base,
            fontWeight: 600,
            fontSize: 14,
            color: COLOR.textPrimary,
            display: "block",
          }}
        >
          {item.label}
        </span>
        {item.desc && (
          <span
            style={{
              fontSize: 12,
              color: COLOR.textMuted,
              display: "block",
              marginTop: 1,
            }}
          >
            {item.desc}
          </span>
        )}
      </div>

      {/* 뱃지 or 화살표 */}
      {item.badge ? (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: COLOR.textMuted,
            backgroundColor: COLOR.bgApp,
            borderRadius: RADIUS.pill,
            padding: "3px 9px",
            marginRight: 4,
          }}
        >
          {item.badge}
        </span>
      ) : null}
      {!isDisabled && <ChevronRight size={16} color={COLOR.borderInactive} strokeWidth={2} />}
    </button>
  );
}

function formatDob(dob: string) {
  const [year, month, day] = dob.split(".");
  return `${year}.${month}.${day}`;
}

function genderLabel(gender?: "male" | "female") {
  if (gender === "male") return "남아";
  if (gender === "female") return "여아";
  return "미입력";
}

function ageLabel(months: number) {
  return formatAgeShort(months);
}

function ChildSettingsSheet({
  children,
  selectedChildId,
  onSelectChild,
  onRequestDelete,
  onClose,
}: {
  children: Child[];
  selectedChildId: string | null;
  onSelectChild: (id: string) => void;
  onRequestDelete: (child: Child) => void;
  onClose: () => void;
}) {
  const { updateChild } = useChild();
  const selectedChild = children.find((child) => child.id === selectedChildId) ?? children[0] ?? null;

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editGender, setEditGender] = useState<"male" | "female" | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // 드럼 피커 상태
  const [yearIdx, setYearIdx] = useState(0);
  const [monthIdx, setMonthIdx] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);

  const selectedYear = parseInt(DATE_YEAR_ITEMS[yearIdx]);
  const selectedMonth = parseInt(DATE_MONTH_ITEMS[monthIdx]);
  const dayItems = getDateDayItems(selectedYear, selectedMonth);
  const safeDayIdx = Math.min(dayIdx, dayItems.length - 1);

  useEffect(() => {
    if (dayIdx > dayItems.length - 1) setDayIdx(dayItems.length - 1);
  }, [selectedYear, selectedMonth, dayIdx, dayItems.length]);

  const handleYearChange = useCallback((_v: string, idx: number) => setYearIdx(idx), []);
  const handleMonthChange = useCallback((_v: string, idx: number) => setMonthIdx(idx), []);
  const handleDayChange = useCallback((_v: string, idx: number) => setDayIdx(idx), []);

  // 선택 자녀 바뀌면 편집 모드 종료
  const prevChildId = selectedChild?.id;
  useEffect(() => { setEditMode(false); }, [prevChildId]);

  const openEdit = () => {
    if (!selectedChild) return;
    setEditName(selectedChild.name);
    setEditGender(selectedChild.gender);
    // dob: "2025.06.01" 파싱해서 드럼 피커 인덱스 설정
    const [y, m, d] = selectedChild.dob.split(".");
    const yIdx = DATE_YEAR_ITEMS.indexOf(y);
    const mIdx = DATE_MONTH_ITEMS.indexOf(m);
    const dIdx = getDateDayItems(parseInt(y), parseInt(m)).indexOf(d);
    setYearIdx(yIdx >= 0 ? yIdx : 0);
    setMonthIdx(mIdx >= 0 ? mIdx : 0);
    setDayIdx(dIdx >= 0 ? dIdx : 0);
    setEditMode(true);
  };

  const cancelEdit = () => setEditMode(false);

  const handleSave = async () => {
    if (!selectedChild) return;
    setSaving(true);
    const day = dayItems[safeDayIdx];
    const dob = `${selectedYear}.${DATE_MONTH_ITEMS[monthIdx]}.${day}`;
    await updateChild(selectedChild.id, {
      name: editName.trim() || selectedChild.name,
      gender: editGender,
      dob,
    });
    setSaving(false);
    setEditMode(false);
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.38)",
          zIndex: 100,
        }}
      />
      <div
        style={{
          position: "fixed",
          left: "50%",
          top: 0,
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 430,
          height: "100dvh",
          backgroundColor: COLOR.bgApp,
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          fontFamily: FONT.base,
        }}
      >
        <div
          style={{
            padding: "16px 20px 12px",
            backgroundColor: COLOR.bgCard,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${COLOR.borderLight}`,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, color: COLOR.textPrimary }}>
            자녀 설정
          </span>
          <button
            onClick={onClose}
            style={{
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
            <X size={16} color={COLOR.textMuted} strokeWidth={2.2} />
          </button>
        </div>

        <div
          className="panel-scroll"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: `20px ${SPACE.pagePadding}px 32px`,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: COLOR.textMuted,
                display: "block",
                marginBottom: 8,
                paddingLeft: 2,
              }}
            >
              자녀 목록
            </span>
            <div
              style={{
                backgroundColor: COLOR.bgCard,
                borderRadius: RADIUS.lg,
                overflow: "hidden",
              }}
            >
              {children.length === 0 ? (
                <div style={{ padding: "22px 18px", textAlign: "center" }}>
                  <span style={{ fontSize: 14, color: COLOR.textMuted, lineHeight: 1.6 }}>
                    아직 등록된 자녀가 없어요
                  </span>
                </div>
              ) : (
                children.map((child, index) => {
                  const active = child.id === selectedChild?.id;
                  return (
                    <div
                      key={child.id}
                      style={{
                        borderBottom: index === children.length - 1 ? "none" : `1px solid ${COLOR.borderLight}`,
                        backgroundColor: active ? `${COLOR.textPrimary}04` : "transparent",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "15px 18px",
                        }}
                      >
                        <button
                          onClick={() => onSelectChild(child.id)}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 12,
                              backgroundColor: active ? `${COLOR.textPrimary}10` : COLOR.bgApp,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Baby size={18} color={COLOR.textPrimary} strokeWidth={1.8} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: active ? 700 : 600,
                                color: COLOR.textPrimary,
                                display: "block",
                                letterSpacing: "-0.2px",
                              }}
                            >
                              {child.name}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                color: COLOR.textMuted,
                                display: "block",
                                marginTop: 2,
                              }}
                            >
                              {formatAgeShort(child.months)} · {formatDob(child.dob)}
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={() => onRequestDelete(child)}
                          style={{
                            border: "none",
                            background: "none",
                            color: COLOR.danger,
                            cursor: "pointer",
                            padding: "6px 4px",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            flexShrink: 0,
                          }}
                        >
                          <Trash2 size={15} strokeWidth={2} />
                          <span style={{ fontSize: 12, fontWeight: 600 }}>삭제</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {selectedChild && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingLeft: 2, paddingRight: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.textMuted }}>
                  자녀 정보
                </span>
                {!editMode ? (
                  <button
                    onClick={openEdit}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "2px 4px" }}
                  >
                    <Pencil size={13} color={COLOR.textMuted} strokeWidth={2} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLOR.textMuted, letterSpacing: "-0.2px" }}>편집</span>
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={cancelEdit}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: COLOR.textMuted, letterSpacing: "-0.2px", padding: "2px 4px" }}
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: COLOR.primary, letterSpacing: "-0.2px", padding: "2px 4px" }}
                    >
                      {saving ? "저장 중…" : "저장"}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg, overflow: "hidden" }}>
                {!editMode ? (
                  <>
                    {[
                      { label: "이름", value: selectedChild.name },
                      { label: "성별", value: genderLabel(selectedChild.gender) },
                      { label: "생년월일", value: formatDob(selectedChild.dob) },
                      { label: "현재 월령", value: `${formatAgeShort(selectedChild.months)} (${selectedChild.months}개월)` },
                    ].map((item, index, array) => (
                      <div
                        key={item.label}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          gap: 16, padding: "15px 18px",
                          borderBottom: index === array.length - 1 ? "none" : `1px solid ${COLOR.borderLight}`,
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 600, color: COLOR.textMuted }}>{item.label}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: COLOR.textPrimary, textAlign: "right" }}>{item.value}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {/* 이름 */}
                    <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLOR.borderLight}` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: COLOR.textMuted, marginBottom: 6, letterSpacing: "-0.1px" }}>이름</div>
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="이름 입력"
                        style={{
                          width: "100%", border: "none", outline: "none", background: "transparent",
                          fontFamily: FONT.base, fontSize: 15, fontWeight: 600,
                          color: COLOR.textPrimary, letterSpacing: "-0.3px",
                        }}
                      />
                    </div>
                    {/* 성별 */}
                    <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLOR.borderLight}` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: COLOR.textMuted, marginBottom: 8, letterSpacing: "-0.1px" }}>성별</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {(["male", "female"] as const).map(g => (
                          <button
                            key={g}
                            onClick={() => setEditGender(g)}
                            style={{
                              flex: 1, height: 38, borderRadius: RADIUS.sm,
                              border: `1.5px solid ${editGender === g ? COLOR.textPrimary : COLOR.border}`,
                              backgroundColor: editGender === g ? COLOR.textPrimary : "transparent",
                              cursor: "pointer", fontFamily: FONT.base,
                              fontSize: 14, fontWeight: 600,
                              color: editGender === g ? "#fff" : COLOR.textMuted,
                              letterSpacing: "-0.2px",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                            }}
                          >
                            {editGender === g && <Check size={13} strokeWidth={2.5} />}
                            {g === "male" ? "남아" : "여아"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* 생년월일 */}
                    <div style={{ padding: "14px 18px" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: COLOR.textMuted, marginBottom: 8, letterSpacing: "-0.1px" }}>생년월일</div>
                      {/* 컬럼 헤더 */}
                      <div style={{ display: "flex", borderBottom: `1px solid ${COLOR.borderLight}`, marginBottom: 0 }}>
                        {["년도", "월", "일"].map(label => (
                          <div key={label} style={{ flex: 1, textAlign: "center", paddingBottom: 6, fontSize: 11, fontWeight: 600, color: COLOR.textMuted, letterSpacing: "-0.1px" }}>{label}</div>
                        ))}
                      </div>
                      {/* 드럼 피커 */}
                      <div style={{ display: "flex" }}>
                        <DrumRollPicker key={`y-${editMode}`} items={DATE_YEAR_ITEMS} defaultIndex={yearIdx} onChange={handleYearChange} />
                        <div style={{ width: 1, backgroundColor: COLOR.borderLight, margin: "10px 0", flexShrink: 0 }} />
                        <DrumRollPicker key={`m-${editMode}`} items={DATE_MONTH_ITEMS} defaultIndex={monthIdx} onChange={handleMonthChange} />
                        <div style={{ width: 1, backgroundColor: COLOR.borderLight, margin: "10px 0", flexShrink: 0 }} />
                        <DrumRollPicker key={`d-${selectedYear}-${selectedMonth}-${editMode}`} items={dayItems} defaultIndex={safeDayIdx} onChange={handleDayChange} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function LogoutConfirmDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 120 }} />
      <div style={{
        position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
        width: "calc(100% - 40px)", maxWidth: 340,
        backgroundColor: COLOR.bgCard, borderRadius: RADIUS.xl,
        zIndex: 121, boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
        overflow: "hidden", fontFamily: FONT.base,
      }}>
        <div style={{ padding: "28px 24px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>👋</div>
          <span style={{ fontSize: 17, fontWeight: 800, color: COLOR.textPrimary, display: "block", marginBottom: 10, letterSpacing: "-0.4px" }}>
            잠깐, 벌써 가려고요?
          </span>
          <span style={{ fontSize: 13, color: COLOR.textMuted, lineHeight: 1.7, display: "block", letterSpacing: "-0.1px" }}>
            아이의 소중한 기록은 그대로 남아있어요.
            <br />
            다음에 다시 만나요 :)
          </span>
        </div>
        <div style={{ display: "flex", borderTop: `1px solid ${COLOR.borderLight}` }}>
          <button onClick={onCancel} style={{ flex: 1, height: 52, border: "none", backgroundColor: COLOR.bgCard, color: COLOR.textSecondary, fontFamily: FONT.base, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            계속 있을게요
          </button>
          <div style={{ width: 1, backgroundColor: COLOR.borderLight }} />
          <button onClick={onConfirm} style={{ flex: 1, height: 52, border: "none", backgroundColor: COLOR.bgCard, color: COLOR.danger, fontFamily: FONT.base, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
}

function DeleteConfirmDialog({
}: {
  childName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
          zIndex: 120,
        }}
      />
      <div
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "calc(100% - 40px)",
          maxWidth: 340,
          backgroundColor: COLOR.bgCard,
          borderRadius: RADIUS.xl,
          zIndex: 121,
          boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
          overflow: "hidden",
          fontFamily: FONT.base,
        }}
      >
        <div style={{ padding: "24px 22px 18px" }}>
          <span
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: COLOR.textPrimary,
              display: "block",
              marginBottom: 8,
              letterSpacing: "-0.3px",
            }}
          >
            {childName}의 정보를 지울까요?
          </span>
          <span
            style={{
              fontSize: 13,
              color: COLOR.textMuted,
              lineHeight: 1.6,
              display: "block",
            }}
          >
            자녀 정보와 연결된 기록이 함께 사라져요.
            <br />
            삭제한 뒤에는 되돌릴 수 없어요.
          </span>
        </div>
        <div style={{ display: "flex", borderTop: `1px solid ${COLOR.borderLight}` }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              height: 52,
              border: "none",
              backgroundColor: COLOR.bgCard,
              color: COLOR.textSecondary,
              fontFamily: FONT.base,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <div style={{ width: 1, backgroundColor: COLOR.borderLight }} />
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              height: 52,
              border: "none",
              backgroundColor: COLOR.bgCard,
              color: COLOR.danger,
              fontFamily: FONT.base,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </>
  );
}

// ── Sub Page Wrapper ──────────────────────────
function SubPageWrapper({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: COLOR.bgApp, zIndex: 200, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 430, height: "100dvh", backgroundColor: COLOR.bgApp, display: "flex", flexDirection: "column", fontFamily: FONT.base }}>
        <div style={{ backgroundColor: COLOR.bgCard, display: "flex", alignItems: "center", height: 56, padding: "0 8px", flexShrink: 0, borderBottom: `1px solid ${COLOR.borderLight}` }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 11, display: "flex", alignItems: "center" }}>
            <ChevronRight size={22} color={COLOR.textPrimary} strokeWidth={2} style={{ transform: "rotate(180deg)" }} />
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>{title}</span>
          </div>
          <div style={{ width: 44 }} />
        </div>
        <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px 20px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── 알림 설정 ──────────────────────────────────
const NOTIFICATION_ITEMS = [
  { key: "dev_check",    label: "발달 체크 알림",      desc: "월령별 발달 체크리스트 안내" },
  { key: "vaccination",  label: "예방접종 알림",        desc: "예방접종 일정 전 미리 알림" },
  { key: "schedule",     label: "일정 알림",            desc: "등록된 일정 30분 전 알림" },
  { key: "weekly",       label: "주간 요약",            desc: "매주 월요일 아이 성장 요약" },
];

function NotificationSettingsPage({ onBack }: { onBack: () => void }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("inchit_notif_settings") ?? "{}"); }
    catch { return {}; }
  });

  const toggle = (key: string) => {
    const next = { ...enabled, [key]: !enabled[key] };
    setEnabled(next);
    localStorage.setItem("inchit_notif_settings", JSON.stringify(next));
  };

  return (
    <SubPageWrapper title="알림 설정" onBack={onBack}>
      <div style={{ backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg, overflow: "hidden" }}>
        {NOTIFICATION_ITEMS.map((item, i) => (
          <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px", borderBottom: i < NOTIFICATION_ITEMS.length - 1 ? `1px solid ${COLOR.borderLight}` : "none" }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: COLOR.textPrimary, display: "block", letterSpacing: "-0.2px" }}>{item.label}</span>
              <span style={{ fontSize: 12, color: COLOR.textMuted, display: "block", marginTop: 2 }}>{item.desc}</span>
            </div>
            <button
              onClick={() => toggle(item.key)}
              style={{
                width: 44, height: 26, borderRadius: RADIUS.pill, border: "none", cursor: "pointer", padding: 3, flexShrink: 0,
                backgroundColor: enabled[item.key] ? COLOR.primary : COLOR.borderMid,
                transition: "background-color 0.2s ease",
                display: "flex", alignItems: "center",
                justifyContent: enabled[item.key] ? "flex-end" : "flex-start",
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            </button>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: COLOR.textDisabled, lineHeight: 1.7, letterSpacing: "-0.1px", margin: 0 }}>
        알림은 기기 설정에서 허용되어야 정상적으로 수신됩니다. 앱 알림 기능은 순차적으로 적용될 예정입니다.
      </p>
    </SubPageWrapper>
  );
}

// ── 자동 일정 정보 ─────────────────────────────
function AutoScheduleInfoPage({ onBack }: { onBack: () => void }) {
  const items = [
    { title: "예방접종 일정", desc: "아이 생년월일을 기준으로 국가 필수 예방접종 일정을 자동으로 캘린더에 추가해요. 접종 시기가 되면 알림을 보내드려요." },
    { title: "발달 체크 알림", desc: "월령이 새로운 발달 구간에 진입하면 인칫 포인트 체크리스트가 업데이트돼요. 새 항목이 생기면 알림으로 알려드려요." },
    { title: "자동 일정 수정", desc: "자동으로 생성된 일정은 캘린더에서 직접 수정하거나 삭제할 수 있어요. 수정한 내용은 유지됩니다." },
  ];
  return (
    <SubPageWrapper title="자동 일정 정보" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item) => (
          <div key={item.title} style={{ backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg, padding: "16px 18px" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: COLOR.textPrimary, display: "block", marginBottom: 6, letterSpacing: "-0.3px" }}>{item.title}</span>
            <span style={{ fontSize: 13, color: COLOR.textSecondary, lineHeight: 1.7, letterSpacing: "-0.2px" }}>{item.desc}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: COLOR.textDisabled, lineHeight: 1.7, letterSpacing: "-0.1px", margin: 0 }}>
        자동 일정은 사용자 편의를 위한 참고용이며, 실제 의료 일정은 담당 의사와 상의하세요.
      </p>
    </SubPageWrapper>
  );
}

// ── 피드백 보내기 ──────────────────────────────
function FeedbackPage({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!text.trim()) return;
    const subject = encodeURIComponent("[inchit 피드백]");
    const body = encodeURIComponent(text.trim());
    window.open(`mailto:feedback@inchit.app?subject=${subject}&body=${body}`, "_blank");
    setSent(true);
  };

  return (
    <SubPageWrapper title="피드백 보내기" onBack={onBack}>
      {sent ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "40px 0" }}>
          <div style={{ fontSize: 48 }}>🙏</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: COLOR.textPrimary, letterSpacing: "-0.5px" }}>감사해요!</span>
          <span style={{ fontSize: 14, color: COLOR.textMuted, textAlign: "center", lineHeight: 1.6 }}>소중한 의견이 inchit을 더 좋게 만들어요.</span>
        </div>
      ) : (
        <>
          <div style={{ backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg, padding: "16px 18px" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: COLOR.textMuted, display: "block", marginBottom: 10 }}>불편한 점, 원하는 기능, 무엇이든 편하게 적어주세요 :)</span>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="예) 예방접종 기록을 직접 입력하고 싶어요"
              rows={6}
              style={{
                width: "100%", border: "none", outline: "none", resize: "none", background: "transparent",
                fontFamily: FONT.base, fontSize: 14, color: COLOR.textPrimary, lineHeight: 1.7,
                letterSpacing: "-0.2px", boxSizing: "border-box",
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            style={{
              width: "100%", height: 52, borderRadius: RADIUS.md, border: "none", cursor: text.trim() ? "pointer" : "not-allowed",
              backgroundColor: text.trim() ? COLOR.primary : COLOR.bgApp,
              fontFamily: FONT.base, fontSize: 15, fontWeight: 700,
              color: text.trim() ? "#fff" : COLOR.textDisabled, letterSpacing: "-0.3px",
              transition: "background-color 0.2s, color 0.2s",
            }}
          >
            피드백 보내기
          </button>
          <p style={{ fontSize: 12, color: COLOR.textDisabled, textAlign: "center", margin: 0, lineHeight: 1.6 }}>
            메일 앱이 열립니다. feedback@inchit.app 으로 직접 보내셔도 됩니다.
          </p>
        </>
      )}
    </SubPageWrapper>
  );
}

// ── 법률 문서 공통 ─────────────────────────────
function LegalPage({ title, onBack, sections }: {
  title: string; onBack: () => void;
  sections: { heading: string; body: string }[];
}) {
  return (
    <SubPageWrapper title={title} onBack={onBack}>
      {sections.map((s) => (
        <div key={s.heading}>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.textPrimary, display: "block", marginBottom: 6, letterSpacing: "-0.2px" }}>{s.heading}</span>
          <span style={{ fontSize: 13, color: COLOR.textSecondary, lineHeight: 1.8, letterSpacing: "-0.2px", display: "block", whiteSpace: "pre-wrap" }}>{s.body}</span>
        </div>
      ))}
      <p style={{ fontSize: 11, color: COLOR.textDisabled, lineHeight: 1.6, margin: 0 }}>최종 업데이트: 2025년 4월</p>
    </SubPageWrapper>
  );
}

const PRIVACY_SECTIONS = [
  { heading: "1. 수집하는 개인정보 항목", body: "• 필수: 이메일 주소, 소셜 로그인 식별자(Google/Kakao)\n• 아이 정보: 이름(선택), 성별(선택), 생년월일\n• 서비스 이용 기록: 발달 체크 항목, 일정 정보, 체크리스트" },
  { heading: "2. 개인정보 수집 및 이용 목적", body: "• 회원 식별 및 서비스 제공\n• 아이 발달 기록 및 일정 관리 서비스\n• 서비스 개선 및 통계 분석 (비식별화)" },
  { heading: "3. 개인정보 보유 및 이용 기간", body: "서비스 탈퇴 시까지 보유합니다. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다." },
  { heading: "4. 개인정보의 제3자 제공", body: "원칙적으로 외부에 제공하지 않습니다. 단, 법령에 의한 경우 또는 이용자 동의가 있는 경우는 예외입니다." },
  { heading: "5. 개인정보 처리 위탁", body: "• Supabase Inc.: 데이터 저장 및 인증 처리\n• Google LLC, Kakao Corp.: 소셜 로그인 서비스" },
  { heading: "6. 정보주체의 권리", body: "언제든지 개인정보 열람, 수정, 삭제, 처리 정지를 요청할 수 있습니다. 앱 내 '마이페이지 > 계정 탈퇴' 또는 feedback@inchit.app 으로 요청 가능합니다." },
  { heading: "7. 문의", body: "개인정보 관련 문의: feedback@inchit.app" },
];

const TERMS_SECTIONS = [
  { heading: "제1조 (목적)", body: "본 약관은 inchit(이하 '서비스')를 이용함에 있어 서비스 제공자와 이용자 간의 권리, 의무 및 책임사항을 규정합니다." },
  { heading: "제2조 (서비스 이용)", body: "• 서비스는 아이의 발달 기록 및 육아 일정 관리를 위한 도구입니다.\n• 본 서비스의 발달 체크리스트는 K-DST를 참고한 정보 제공용으로, 의료적 진단을 대체하지 않습니다." },
  { heading: "제3조 (계정)", body: "이용자는 소셜 로그인(Google, Kakao)을 통해 계정을 생성할 수 있습니다. 계정 정보를 타인과 공유해서는 안 됩니다." },
  { heading: "제4조 (금지 행위)", body: "• 서비스를 이용한 불법 행위 금지\n• 타인의 개인정보 무단 수집 금지\n• 서비스 운영 방해 행위 금지" },
  { heading: "제5조 (서비스 변경 및 중단)", body: "서비스 제공자는 운영상 필요에 따라 서비스 내용을 변경하거나 중단할 수 있으며, 이 경우 사전에 공지합니다." },
  { heading: "제6조 (면책)", body: "서비스 내 발달 정보 및 일정은 참고용입니다. 이를 기반으로 한 의사결정으로 발생한 손해에 대해 서비스 제공자는 책임지지 않습니다." },
  { heading: "제7조 (준거법 및 분쟁 해결)", body: "본 약관은 대한민국 법률에 따라 해석되며, 분쟁 발생 시 서울중앙지방법원을 관할 법원으로 합니다." },
];

// ── Main Component ────────────────────────────

export function MyPage() {
  const navigate = useNavigate();
  const scrollRef = useScrollFade();
  const { childList, deleteChild } = useChild();
  const { signOut } = useAuth();
  const [childSettingsOpen, setChildSettingsOpen] = useState(false);
  const [selectedDetailChildId, setSelectedDetailChildId] = useState<string | null>(null);
  const [pendingDeleteChild, setPendingDeleteChild] = useState<Child | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [subPage, setSubPage] = useState<"notifications" | "auto-schedule" | "feedback" | "privacy" | "terms" | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const sortedChildren = useMemo(
    () => [...childList].sort((a, b) => a.dob.localeCompare(b.dob)),
    [childList],
  );

  useEffect(() => {
    if (!childSettingsOpen) return;
    if (sortedChildren.length === 0) {
      setSelectedDetailChildId(null);
      return;
    }
    if (!selectedDetailChildId || !sortedChildren.some((child) => child.id === selectedDetailChildId)) {
      setSelectedDetailChildId(sortedChildren[0].id);
    }
  }, [childSettingsOpen, selectedDetailChildId, sortedChildren]);

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
      {/* ── 앱바 ── */}
      <div
        style={{
          padding: "16px 20px 12px 20px",
          backgroundColor: COLOR.bgCard,
          flexShrink: 0,
        }}
      >
        <span
          style={{ fontWeight: 800, fontSize: 19, color: COLOR.textPrimary }}
        >
          마이
        </span>
      </div>

      {/* ── 스크롤 ── */}
      <div
        ref={scrollRef}
        className="panel-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: `20px ${SPACE.pagePadding}px`,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* ── 메뉴 섹션 ── */}
        {MENU_SECTIONS.map((section) => (
          <div key={section.title}>
            {/* 섹션 타이틀 */}
            <span
              style={{
                fontFamily: FONT.base,
                fontSize: 13,
                fontWeight: 700,
                color: COLOR.textMuted,
                display: "block",
                marginBottom: 8,
                paddingLeft: 2,
              }}
            >
              {section.title}
            </span>

            {/* 메뉴 카드 */}
            <div
              style={{
                backgroundColor: COLOR.bgCard,
                borderRadius: RADIUS.lg,
                overflow: "hidden",
              }}
            >
              {section.items.map((item, i) => (
                <MenuItem
                  key={item.label}
                  item={item}
                  isLast={i === section.items.length - 1}
                  onClick={item.label === "자녀 설정"
                    ? () => {
                        setChildSettingsOpen(true);
                        setSelectedDetailChildId(sortedChildren[0]?.id ?? null);
                      }
                    : item.label === "인칫 보고서"
                    ? () => navigate("/development-record")
                    : item.label === "알림 설정"
                    ? () => setSubPage("notifications")
                    : item.label === "자동 일정 정보"
                    ? () => setSubPage("auto-schedule")
                    : item.label === "피드백 보내기"
                    ? () => setSubPage("feedback")
                    : item.label === "개인정보 처리방침"
                    ? () => setSubPage("privacy")
                    : item.label === "이용약관"
                    ? () => setSubPage("terms")
                    : undefined}
                />
              ))}
            </div>
          </div>
        ))}

        {/* ── 로그아웃 ── */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            width: "100%",
            backgroundColor: COLOR.bgCard,
            border: "none",
            borderRadius: RADIUS.lg,
            padding: "15px 18px",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            textAlign: "left",
          }}
        >
          <span
            style={{
              fontFamily: FONT.base,
              fontSize: 14,
              fontWeight: 600,
              color: COLOR.danger,
            }}
          >
            로그아웃
          </span>
        </button>

        <div style={{ height: 4 }} />
      </div>

      {childSettingsOpen && (
        <ChildSettingsSheet
          children={sortedChildren}
          selectedChildId={selectedDetailChildId}
          onSelectChild={setSelectedDetailChildId}
          onRequestDelete={setPendingDeleteChild}
          onClose={() => setChildSettingsOpen(false)}
        />
      )}

      {subPage === "notifications" && <NotificationSettingsPage onBack={() => setSubPage(null)} />}
      {subPage === "auto-schedule" && <AutoScheduleInfoPage onBack={() => setSubPage(null)} />}
      {subPage === "feedback" && <FeedbackPage onBack={() => setSubPage(null)} />}
      {subPage === "privacy" && <LegalPage title="개인정보 처리방침" onBack={() => setSubPage(null)} sections={PRIVACY_SECTIONS} />}
      {subPage === "terms" && <LegalPage title="이용약관" onBack={() => setSubPage(null)} sections={TERMS_SECTIONS} />}

      {pendingDeleteChild && (
        <DeleteConfirmDialog
          childName={pendingDeleteChild.name}
          onCancel={() => setPendingDeleteChild(null)}
          onConfirm={() => {
            deleteChild(pendingDeleteChild.id);
            setPendingDeleteChild(null);
          }}
        />
      )}

      {showLogoutConfirm && (
        <LogoutConfirmDialog
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleSignOut}
        />
      )}
    </div>
  );
}