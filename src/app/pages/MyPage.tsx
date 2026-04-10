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
import { formatAgeShort } from "../utils/ageFormat";
import { COLOR, FONT, RADIUS, SPACE } from "../tokens";
import { useScrollFade } from "../hooks/useScrollFade";
import { useChild, type Child } from "../contexts/ChildContext";
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
        badge: null,
      },
      {
        icon: CalendarDays,
        label: "발달 기록",
        desc: "체크리스트 완료 이력",
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

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "15px 18px",
        background: "none",
        border: "none",
        borderBottom: isLast ? "none" : `1px solid ${COLOR.borderLight}`,
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
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
      <ChevronRight size={16} color={COLOR.borderInactive} strokeWidth={2} />
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

function DeleteConfirmDialog({
  childName,
  onCancel,
  onConfirm,
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

// ── Main Component ────────────────────────────

export function MyPage() {
  const scrollRef = useScrollFade();
  const { childList, deleteChild } = useChild();
  const [childSettingsOpen, setChildSettingsOpen] = useState(false);
  const [selectedDetailChildId, setSelectedDetailChildId] = useState<string | null>(null);
  const [pendingDeleteChild, setPendingDeleteChild] = useState<Child | null>(null);

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
                    : undefined}
                />
              ))}
            </div>
          </div>
        ))}

        {/* ── 로그아웃 ── */}
        <button
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
    </div>
  );
}