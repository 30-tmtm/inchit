import { useState, useRef, useEffect, useCallback } from "react";
import {
  Activity,
  Hand,
  MessageCircle,
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Check,
  Pencil,
  Trash2,
  Brain,
  Pin,
  PinOff,
} from "lucide-react";
import { useLocation } from "react-router";
import { COLOR, FONT, RADIUS, SPACE } from "../tokens";
import { useScrollFade } from "../hooks/useScrollFade";
import { useChild } from "../contexts/ChildContext";

// ── Types ──────────────────────────────────────
export type CheckItem = { id: string; label: string; checked: boolean };
export type CustomList = {
  id: string;
  title: string;
  emoji: string;
  items: CheckItem[];
  pinned: boolean;
};

// ── localStorage 연동 ───────────────────────────
export const CUSTOM_LISTS_KEY = "inchit_custom_lists";

export function loadCustomLists(): CustomList[] {
  try {
    const raw = localStorage.getItem(CUSTOM_LISTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomLists(lists: CustomList[]) {
  localStorage.setItem(CUSTOM_LISTS_KEY, JSON.stringify(lists));
}

// ── K-DST Mock Data — 12개월 이상 (19개월 기준) ─
const KDST_GROUPS_TODDLER = [
  {
    domain: "대근육 운동",
    icon: Activity,
    color: "#4A90D9",
    items: [
      "혼자 계단을 오를 수 있어요",
      "공을 차려고 시도해요",
      "뛰기 시작했어요",
      "쭈그려 앉았다 일어나요",
    ],
  },
  {
    domain: "소근육 운동",
    icon: Hand,
    color: "#7B68EE",
    items: [
      "컵으로 혼자 물을 마셔요",
      "숟가락을 사용하려 해요",
      "블록을 3~4개 쌓아요",
      "책장을 넘겨요",
    ],
  },
  {
    domain: "언어",
    icon: MessageCircle,
    color: "#20B2AA",
    items: [
      "단어를 10개 이상 말해요",
      "두 단어를 붙여 말해요",
      "가리키면서 이름을 말해요",
      "간단한 지시를 따라요",
    ],
  },
  {
    domain: "사회성·인지",
    icon: Users,
    color: "#FF8C69",
    items: [
      "다른 아이에게 관심을 보여요",
      "어른을 흉내 내요",
      "거울 속 자신을 알아봐요",
      "혼자 놀다 엄마·아빠를 찾아요",
    ],
  },
  {
    domain: "인지·적응",
    icon: Brain,
    color: "#DA70D6",
    items: [
      "장난감의 용도를 알아요",
      "간단한 퍼즐을 맞춰요",
      "그림책을 보며 가리켜요",
      "숨겨진 물건을 찾아요",
    ],
  },
];

// ── K-DST Mock Data — 11개월 이하 (6개월 기준) ──
const KDST_GROUPS_INFANT = [
  {
    domain: "대근육 운동",
    icon: Activity,
    color: "#4A90D9",
    items: [
      "배를 바닥에 대고 고개를 들어요",
      "뒤집기를 시도해요",
      "두 손을 가운데로 모아요",
      "다리로 바닥을 밀어요",
    ],
  },
  {
    domain: "소근육 운동",
    icon: Hand,
    color: "#7B68EE",
    items: [
      "물건을 손으로 잡아요",
      "양손으로 물건을 잡아요",
      "잡은 물건을 입에 가져가요",
      "물건을 한 손에서 다른 손으로 옮겨요",
    ],
  },
  {
    domain: "언어",
    icon: MessageCircle,
    color: "#20B2AA",
    items: [
      "옹알이를 해요",
      "소리 내어 웃어요",
      "이름 부르면 반응해요",
      "다양한 모음을 소리 내요",
    ],
  },
  {
    domain: "사회성·인지",
    icon: Users,
    color: "#FF8C69",
    items: [
      "낯선 사람과 아는 사람을 구분해요",
      "거울을 보며 반응해요",
      "까꿍 놀이에 반응해요",
      "기쁨과 불쾌함을 표현해요",
    ],
  },
  {
    domain: "인지·적응",
    icon: Brain,
    color: "#DA70D6",
    items: [
      "떨어지는 물건을 눈으로 쫓아요",
      "손에 닿은 물건을 입으로 탐색해요",
      "소리 나는 방향을 찾아요",
      "물건 숨기기에 반응해요",
    ],
  },
];

function getKdstGroups(months: number) {
  return months <= 11 ? KDST_GROUPS_INFANT : KDST_GROUPS_TODDLER;
}

// ── Custom List Mock Data ───────────────────────
const INITIAL_LISTS: CustomList[] = [
  {
    id: "c1",
    title: "학원 라이딩 준비물",
    emoji: "🚗",
    pinned: true,
    items: [
      { id: "c1-1", label: "물통", checked: false },
      { id: "c1-2", label: "간식", checked: false },
      { id: "c1-3", label: "책가방", checked: true },
      { id: "c1-4", label: "숙제물", checked: false },
      { id: "c1-5", label: "실내화", checked: false },
    ],
  },
  {
    id: "c2",
    title: "어린이집 등원 체크",
    emoji: "🏫",
    pinned: false,
    items: [
      { id: "c2-1", label: "기저귀·물티슈", checked: false },
      { id: "c2-2", label: "여벌 옷", checked: false },
      { id: "c2-3", label: "이름표 확인", checked: true },
      { id: "c2-4", label: "연락장", checked: false },
    ],
  },
  {
    id: "c3",
    title: "병원 갈 때",
    emoji: "🏥",
    pinned: false,
    items: [
      { id: "c3-1", label: "건강보험증", checked: false },
      { id: "c3-2", label: "진료기록수첩", checked: false },
      { id: "c3-3", label: "간식·장난감", checked: false },
    ],
  },
];

// ── Emoji Options ───────────────────────────────
const EMOJI_OPTIONS = [
  "🚗","🏫","🏥","🎒","📚","🧸","🍎","🛁","🌙","⭐",
  "🎨","🏃","🛒","🧹","💊","📋","🎯","🌿","❤️","✨",
];

// ── Helpers ─────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Sub Components (K-DST) ─────────────────────

function KdstCheckItem({
  label,
  checked,
  onToggle,
  isLast,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: "none",
        border: "none",
        borderBottom: isLast ? "none" : `1px solid ${COLOR.borderLight}`,
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          border: checked ? "none" : `2px solid ${COLOR.borderInactive}`,
          backgroundColor: checked ? COLOR.textPrimary : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.15s ease",
        }}
      >
        {checked && (
          <svg width="11" height="8" viewBox="0 0 12 9" fill="none">
            <path
              d="M1 4L4.5 7.5L11 1"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span
        style={{
          fontFamily: FONT.base,
          fontSize: 14,
          fontWeight: checked ? 400 : 500,
          color: checked ? COLOR.textMuted : COLOR.textPrimary,
          textDecoration: checked ? "line-through" : "none",
          flex: 1,
          transition: "color 0.15s ease",
        }}
      >
        {label}
      </span>
    </button>
  );
}

type KdstGroup = (typeof KDST_GROUPS_TODDLER)[0];

function KdstDomainCard({
  group,
  checkedItems,
  onToggle,
}: {
  group: KdstGroup;
  checkedItems: Set<string>;
  onToggle: (key: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const doneCount = group.items.filter((item) =>
    checkedItems.has(`${group.domain}::${item}`)
  ).length;
  const allDone = doneCount === group.items.length;
  const Icon = group.icon;

  return (
    <div
      style={{
        backgroundColor: COLOR.bgCard,
        borderRadius: RADIUS.lg,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          padding: "14px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          borderBottom: open ? `1px solid ${COLOR.borderLight}` : "none",
          WebkitTapHighlightColor: "transparent",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: `${group.color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={16} color={group.color} strokeWidth={1.8} />
        </div>

        <div style={{ flex: 1, textAlign: "left" }}>
          <span
            style={{
              fontFamily: FONT.base,
              fontWeight: 700,
              fontSize: 14,
              color: COLOR.textPrimary,
            }}
          >
            {group.domain}
          </span>
        </div>

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: allDone ? "#fff" : COLOR.textMuted,
            backgroundColor: allDone ? group.color : COLOR.bgApp,
            borderRadius: RADIUS.pill,
            padding: "2px 9px",
            marginRight: 4,
            transition: "all 0.2s ease",
          }}
        >
          {doneCount}/{group.items.length}
        </span>

        {open ? (
          <ChevronUp size={15} color={COLOR.textMuted} strokeWidth={2} />
        ) : (
          <ChevronDown size={15} color={COLOR.textMuted} strokeWidth={2} />
        )}
      </button>

      {open && (
        <div>
          {group.items.map((item, i) => {
            const key = `${group.domain}::${item}`;
            return (
              <KdstCheckItem
                key={key}
                label={item}
                checked={checkedItems.has(key)}
                onToggle={() => onToggle(key)}
                isLast={i === group.items.length - 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sub Components (Custom List) ───────────────

function CustomListCard({
  list,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onDeleteList,
  onRenameList,
  onTogglePin,
}: {
  list: CustomList;
  onToggleItem: (listId: string, itemId: string) => void;
  onAddItem: (listId: string, label: string) => void;
  onDeleteItem: (listId: string, itemId: string) => void;
  onDeleteList: (listId: string) => void;
  onRenameList: (listId: string, title: string) => void;
  onTogglePin: (listId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(list.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const doneCount = list.items.filter((i) => i.checked).length;

  useEffect(() => {
    if (addingItem && inputRef.current) inputRef.current.focus();
  }, [addingItem]);

  useEffect(() => {
    if (editingTitle && titleRef.current) titleRef.current.focus();
  }, [editingTitle]);

  const submitNewItem = () => {
    const trimmed = newItemText.trim();
    if (trimmed) {
      onAddItem(list.id, trimmed);
      setNewItemText("");
    }
    setAddingItem(false);
  };

  const submitTitle = () => {
    const trimmed = titleText.trim();
    if (trimmed) onRenameList(list.id, trimmed);
    else setTitleText(list.title);
    setEditingTitle(false);
  };

  return (
    <div
      style={{
        backgroundColor: COLOR.bgCard,
        borderRadius: RADIUS.lg,
        overflow: "visible",
        border: list.pinned ? `1.5px solid ${COLOR.textPrimary}18` : "none",
      }}
    >
      {/* 핀 고정 배지 */}
      {list.pinned && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 14px",
            backgroundColor: `${COLOR.textPrimary}07`,
            borderBottom: `1px solid ${COLOR.borderLight}`,
            borderRadius: `${RADIUS.lg}px ${RADIUS.lg}px 0 0`,
          }}
        >
          <Pin size={10} color={COLOR.textMuted} strokeWidth={2.5} />
          <span
            style={{
              fontFamily: FONT.base,
              fontSize: 10,
              fontWeight: 600,
              color: COLOR.textMuted,
              letterSpacing: "0.3px",
            }}
          >
            상단 고정
          </span>
        </div>
      )}

      {/* 카드 헤더 */}
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          padding: "14px 16px 12px 16px",
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          borderBottom: open ? `1px solid ${COLOR.borderLight}` : "none",
          gap: 8,
          background: "none",
          boxSizing: "border-box",
          borderRadius: list.pinned
            ? "0"
            : `${RADIUS.lg}px ${RADIUS.lg}px 0 0`,
        }}
      >
        {/* 왼쪽 — 클릭하면 펼치기/접기 */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setOpen((v) => !v);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>
            {list.emoji}
          </span>

          {editingTitle ? (
            <input
              ref={titleRef}
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              onBlur={submitTitle}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitTitle();
                if (e.key === "Escape") {
                  setTitleText(list.title);
                  setEditingTitle(false);
                }
              }}
              style={{
                flex: 1,
                fontFamily: FONT.base,
                fontWeight: 700,
                fontSize: 15,
                color: COLOR.textPrimary,
                border: "none",
                borderBottom: `1.5px solid ${COLOR.textPrimary}`,
                background: "transparent",
                outline: "none",
                padding: "2px 0",
                minWidth: 0,
              }}
            />
          ) : (
            <span
              style={{
                flex: 1,
                fontFamily: FONT.base,
                fontWeight: 700,
                fontSize: 15,
                color: COLOR.textPrimary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {list.title}
            </span>
          )}

          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: doneCount > 0 ? COLOR.textMuted : COLOR.textDisabled,
              backgroundColor: COLOR.bgApp,
              borderRadius: RADIUS.pill,
              padding: "2px 8px",
              flexShrink: 0,
            }}
          >
            {doneCount}/{list.items.length}
          </span>
        </div>

        {/* 오른쪽 — ⋯ 메뉴 */}
        <div
          style={{ position: "relative", flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowMenu((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 6px",
              display: "flex",
              alignItems: "center",
              color: COLOR.textMuted,
            }}
          >
            <svg width="16" height="4" viewBox="0 0 16 4" fill="currentColor">
              <circle cx="2" cy="2" r="1.5" />
              <circle cx="8" cy="2" r="1.5" />
              <circle cx="14" cy="2" r="1.5" />
            </svg>
          </button>

          {showMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                backgroundColor: COLOR.bgCard,
                borderRadius: RADIUS.md,
                boxShadow: "0 4px 20px rgba(0,0,0,0.16)",
                border: `1px solid ${COLOR.border}`,
                zIndex: 200,
                minWidth: 138,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => {
                  onTogglePin(list.id);
                  setShowMenu(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 14px",
                  background: "none",
                  border: "none",
                  borderBottom: `1px solid ${COLOR.borderLight}`,
                  cursor: "pointer",
                  fontFamily: FONT.base,
                  fontSize: 13,
                  fontWeight: 500,
                  color: COLOR.textPrimary,
                }}
              >
                {list.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                {list.pinned ? "고정 해제" : "상단 고정"}
              </button>
              <button
                onClick={() => {
                  setEditingTitle(true);
                  setOpen(true);
                  setShowMenu(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 14px",
                  background: "none",
                  border: "none",
                  borderBottom: `1px solid ${COLOR.borderLight}`,
                  cursor: "pointer",
                  fontFamily: FONT.base,
                  fontSize: 13,
                  fontWeight: 500,
                  color: COLOR.textPrimary,
                }}
              >
                <Pencil size={13} />
                이름 수정
              </button>
              <button
                onClick={() => {
                  onDeleteList(list.id);
                  setShowMenu(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: FONT.base,
                  fontSize: 13,
                  fontWeight: 500,
                  color: COLOR.danger,
                }}
              >
                <Trash2 size={13} />
                삭제
              </button>
            </div>
          )}
        </div>

        {/* 접기/펼치기 chevron */}
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 0 4px 2px",
            display: "flex",
            alignItems: "center",
            color: COLOR.textMuted,
            flexShrink: 0,
          }}
        >
          {open ? (
            <ChevronUp size={15} strokeWidth={2} />
          ) : (
            <ChevronDown size={15} strokeWidth={2} />
          )}
        </button>
      </div>

      {/* ── 펼쳐진 내용 ── */}
      {open && (
        <>
          {list.items.length === 0 && !addingItem && (
            <div
              style={{
                padding: "18px 16px",
                textAlign: "center",
                color: COLOR.textMuted,
                fontSize: 13,
              }}
            >
              항목을 추가해 보세요
            </div>
          )}

          {list.items.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 16px",
                borderBottom:
                  i < list.items.length - 1 || addingItem
                    ? `1px solid ${COLOR.borderLight}`
                    : "none",
              }}
            >
              <button
                onClick={() => onToggleItem(list.id, item.id)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  border: item.checked ? "none" : `2px solid ${COLOR.borderInactive}`,
                  backgroundColor: item.checked ? COLOR.textPrimary : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {item.checked && (
                  <Check size={11} color="#fff" strokeWidth={3} />
                )}
              </button>

              <span
                style={{
                  flex: 1,
                  fontFamily: FONT.base,
                  fontSize: 14,
                  fontWeight: item.checked ? 400 : 500,
                  color: item.checked ? COLOR.textMuted : COLOR.textPrimary,
                  textDecoration: item.checked ? "line-through" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {item.label}
              </span>

              <button
                onClick={() => onDeleteItem(list.id, item.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  color: COLOR.textDisabled,
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {/* 항목 추가 인풋 */}
          {addingItem && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  border: `2px solid ${COLOR.borderInactive}`,
                  flexShrink: 0,
                }}
              />
              <input
                ref={inputRef}
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitNewItem();
                  if (e.key === "Escape") {
                    setAddingItem(false);
                    setNewItemText("");
                  }
                }}
                placeholder="항목 입력..."
                style={{
                  flex: 1,
                  fontFamily: FONT.base,
                  fontSize: 14,
                  color: COLOR.textPrimary,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                }}
              />
              <button
                onClick={submitNewItem}
                style={{
                  background: COLOR.textPrimary,
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  padding: "4px 6px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Check size={12} color="#fff" strokeWidth={3} />
              </button>
              <button
                onClick={() => {
                  setAddingItem(false);
                  setNewItemText("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  color: COLOR.textMuted,
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* + 항목 추가 버튼 */}
          {!addingItem && (
            <button
              onClick={() => setAddingItem(true)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "11px 16px",
                background: "none",
                border: "none",
                borderTop:
                  list.items.length > 0 ? `1px solid ${COLOR.borderLight}` : "none",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <Plus size={14} color={COLOR.textMuted} strokeWidth={2.5} />
              <span
                style={{
                  fontFamily: FONT.base,
                  fontSize: 13,
                  color: COLOR.textMuted,
                }}
              >
                항목 추가
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── New List Modal ──────────────────────────────

function NewListModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string, emoji: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("📋");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate(title.trim(), emoji);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          backgroundColor: COLOR.bgCard,
          borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`,
          padding: "24px 20px 40px 20px",
        }}
      >
        {/* 핸들 */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: COLOR.border,
            margin: "0 auto 20px auto",
          }}
        />

        <span
          style={{
            fontFamily: FONT.base,
            fontWeight: 800,
            fontSize: 17,
            color: COLOR.textPrimary,
            display: "block",
            marginBottom: 20,
          }}
        >
          새 체크리스트 만들기
        </span>

        {/* 이모지 선택 */}
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: COLOR.textMuted,
              display: "block",
              marginBottom: 8,
            }}
          >
            아이콘
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: RADIUS.md,
                  border:
                    emoji === e
                      ? `2px solid ${COLOR.textPrimary}`
                      : `1.5px solid ${COLOR.border}`,
                  backgroundColor:
                    emoji === e ? `${COLOR.textPrimary}08` : "transparent",
                  fontSize: 20,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.1s ease",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 입력 */}
        <div style={{ marginBottom: 24 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: COLOR.textMuted,
              display: "block",
              marginBottom: 8,
            }}
          >
            리스트 이름
          </span>
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            placeholder="예: 등원 준비물, 학원 가방"
            style={{
              width: "100%",
              fontFamily: FONT.base,
              fontSize: 15,
              fontWeight: 500,
              color: COLOR.textPrimary,
              border: `1.5px solid ${COLOR.border}`,
              borderRadius: RADIUS.md,
              padding: "12px 14px",
              outline: "none",
              boxSizing: "border-box",
              backgroundColor: COLOR.bgApp,
            }}
          />
        </div>

        {/* 버튼 */}
        <button
          onClick={handleCreate}
          disabled={!title.trim()}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: RADIUS.lg,
            border: "none",
            backgroundColor: title.trim() ? COLOR.textPrimary : COLOR.borderInactive,
            color: "#fff",
            fontFamily: FONT.base,
            fontWeight: 700,
            fontSize: 15,
            cursor: title.trim() ? "pointer" : "default",
            transition: "background 0.2s ease",
          }}
        >
          만들기
        </button>
      </div>
    </div>
  );
}

// ── 자녀 순서 레이블 ───────────────────────────
const ORDINALS_CL = ["첫째", "둘째", "셋째", "넷째", "다섯째", "여섯째"];
function getOrdinalCL(idx: number): string {
  return ORDINALS_CL[idx] ?? `${idx + 1}번째`;
}

// ── Main Component ─────────────────────────────

export function ChecklistPage() {
  // 자녀 컨텍스트
  const { childList, selectedChild, setSelectedChildId } = useChild();

  // 자녀 드롭다운 (발달 체크 탭 앱바)
  const [clDropdownOpen, setClDropdownOpen] = useState(false);
  const clDropdownRef = useRef<HTMLDivElement>(null);
  const clSortedChildren = [...childList].sort((a, b) => a.dob.localeCompare(b.dob));
  const clShowOrdinal = childList.length > 1;
  function clChildLabel(childId: string, name: string): string {
    if (!clShowOrdinal) return name;
    const idx = clSortedChildren.findIndex(c => c.id === childId);
    return `${getOrdinalCL(idx)} ${name}`;
  }

  useEffect(() => {
    if (!clDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (clDropdownRef.current && !clDropdownRef.current.contains(e.target as Node)) {
        setClDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [clDropdownOpen]);
  
  // 라우터 location state에서 초기 탭 읽기
  const location = useLocation();
  const initialTab = (location.state as { tab?: "kdst" | "custom" })?.tab ?? "custom";

  // K-DST 상태 — 자녀별 개별 관리
  const [kdstCheckedByChild, setKdstCheckedByChild] = useState<
    Record<string, Set<string>>
  >({ c1: new Set(), c2: new Set() });

  const kdstChecked = kdstCheckedByChild[selectedChild.id] ?? new Set<string>();

  // 인칫 포인트 달성 팝업
  const [inchitPopup, setInchitPopup] = useState<{ emoji: string; title: string; body: string } | null>(null);

  // 현재 자녀 월령에 맞는 K-DST 그룹
  const kdstGroups = getKdstGroups(selectedChild.months);
  const totalKdst = kdstGroups.reduce((a, g) => a + g.items.length, 0);
  const kdstDone = kdstChecked.size;
  const kdstProgress = totalKdst > 0 ? kdstDone / totalKdst : 0;

  const toggleKdst = (key: string) => {
    const isAdding = !kdstChecked.has(key);
    const current = new Set(kdstChecked);
    if (isAdding) current.add(key); else current.delete(key);

    if (isAdding) {
      const newSize = current.size;
      const half = Math.ceil(totalKdst / 2);
      if (newSize === 1) {
        setInchitPopup({
          emoji: "🌱",
          title: "첫 인칫 포인트를 기록했어요!",
          body: "아이의 성장을 함께 쌓아가요.",
        });
      } else if (newSize === half && kdstChecked.size < half) {
        setInchitPopup({
          emoji: "🌿",
          title: "절반을 채웠어요!",
          body: `우리 ${selectedChild.name}, 정말 잘 자라고 있네요.`,
        });
      } else if (newSize === totalKdst && totalKdst > 0) {
        setInchitPopup({
          emoji: "✨",
          title: `${selectedChild.name}가 이렇게 잘 커가는 건`,
          body: `모두 당신의 노력 덕분이에요.\n정말 수고하셨어요.`,
        });
      }
    }

    setKdstCheckedByChild((prev) => ({
      ...prev,
      [selectedChild.id]: current,
    }));
  };

  // 내 체크리스트 상태 (user_id 기반 — 자녀 전환과 무관)
  const [lists, setLists] = useState<CustomList[]>(() => {
    const saved = loadCustomLists();
    return saved.length > 0 ? saved : INITIAL_LISTS;
  });
  const [showNewModal, setShowNewModal] = useState(false);

  // localStorage 동기화
  useEffect(() => {
    saveCustomLists(lists);
  }, [lists]);

  const toggleItem = useCallback((listId: string, itemId: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id !== listId
          ? l
          : {
              ...l,
              items: l.items.map((it) =>
                it.id !== itemId ? it : { ...it, checked: !it.checked }
              ),
            }
      )
    );
  }, []);

  const addItem = (listId: string, label: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id !== listId
          ? l
          : { ...l, items: [...l.items, { id: uid(), label, checked: false }] }
      )
    );
  };

  const deleteItem = (listId: string, itemId: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id !== listId
          ? l
          : { ...l, items: l.items.filter((it) => it.id !== itemId) }
      )
    );
  };

  const deleteList = (listId: string) => {
    setLists((prev) => prev.filter((l) => l.id !== listId));
  };

  const renameList = (listId: string, title: string) => {
    setLists((prev) =>
      prev.map((l) => (l.id !== listId ? l : { ...l, title }))
    );
  };

  const createList = (title: string, emoji: string) => {
    setLists((prev) => [
      ...prev,
      { id: uid(), title, emoji, items: [], pinned: false },
    ]);
  };

  const togglePin = (listId: string) => {
    setLists((prev) =>
      prev.map((l) => (l.id !== listId ? l : { ...l, pinned: !l.pinned }))
    );
  };

  // 탭 상태 - location state에서 초기값 설정
  const [tab, setTab] = useState<"kdst" | "custom">(initialTab);

  const scrollRef = useScrollFade();

  return (
    <div
      style={{
        width: "100%",
        flex: 1,
        minHeight: 0,
        backgroundColor: COLOR.bgApp,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: FONT.base,
        position: "relative",
      }}
    >
      {/* ── 앱바 ── */}
      <div
        style={{
          padding: "16px 20px 0 20px",
          backgroundColor: COLOR.bgCard,
          borderBottom: `1px solid ${COLOR.border}`,
          flexShrink: 0,
        }}
      >
        {/* 타이틀 행 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: 19,
              color: COLOR.textPrimary,
            }}
          >
            체크리스트
          </span>

          {tab === "custom" && (
            <button
              onClick={() => setShowNewModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                backgroundColor: COLOR.textPrimary,
                border: "none",
                borderRadius: RADIUS.pill,
                cursor: "pointer",
              }}
            >
              <Plus size={13} color="#fff" strokeWidth={2.5} />
              <span
                style={{
                  fontFamily: FONT.base,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                새 리스트
              </span>
            </button>
          )}

          {tab === "kdst" && (
            <div ref={clDropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setClDropdownOpen(v => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: RADIUS.pill,
                  border: "none", backgroundColor: COLOR.primary, cursor: "pointer",
                  fontFamily: FONT.base, fontSize: 14, fontWeight: 700,
                  color: "#fff", letterSpacing: "-0.3px",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {clChildLabel(selectedChild.id, selectedChild.name)}
                <ChevronDown
                  size={14} color="rgba(255,255,255,0.85)" strokeWidth={2}
                  style={{ transform: clDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
                />
              </button>
              {clDropdownOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", right: 0,
                  backgroundColor: COLOR.bgCard, borderRadius: RADIUS.md,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.13)", zIndex: 100,
                  minWidth: 200, overflow: "hidden",
                }}>
                  {clSortedChildren.map(child => {
                    const isSelected = selectedChild.id === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => { setSelectedChildId(child.id); setClDropdownOpen(false); }}
                        style={{
                          width: "100%", display: "flex", alignItems: "center",
                          justifyContent: "space-between", padding: "14px 16px",
                          backgroundColor: isSelected ? COLOR.bgApp : "transparent",
                          border: "none", borderBottom: `1px solid ${COLOR.borderLight}`,
                          cursor: "pointer", fontFamily: FONT.base, textAlign: "left",
                          WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        <span style={{
                          fontSize: 14, fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? COLOR.textPrimary : COLOR.textSecondary,
                          letterSpacing: "-0.3px",
                        }}>
                          {clChildLabel(child.id, child.name)}
                          <span style={{ fontWeight: 400, color: COLOR.textMuted, marginLeft: 5 }}>
                            · {child.months}개월
                          </span>
                        </span>
                        {isSelected && <Check size={15} color={COLOR.textPrimary} strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 탭 바 */}
        <div style={{ display: "flex", gap: 0 }}>
          {[
            { key: "custom", label: "내 체크리스트" },
            { key: "kdst", label: "발달 체크" },
          ].map(({ key, label }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key as "kdst" | "custom")}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: "none",
                  border: "none",
                  borderBottom: active
                    ? `2px solid ${COLOR.textPrimary}`
                    : "2px solid transparent",
                  cursor: "pointer",
                  fontFamily: FONT.base,
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? COLOR.textPrimary : COLOR.textMuted,
                  transition: "all 0.15s ease",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 스크롤 영역 ── */}
      <div
        ref={scrollRef}
        className="panel-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: `16px ${SPACE.pagePadding}px 24px`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* ─── 발달 체크 탭 ─── */}
          {tab === "kdst" && (
            <>
              {/* 진행 카드 */}
              <div
                style={{
                  backgroundColor: COLOR.bgCard,
                  borderRadius: RADIUS.lg,
                  padding: "16px 18px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: 12,
                        color: COLOR.textMuted,
                        display: "block",
                        marginBottom: 2,
                      }}
                    >
                      전체 진행률
                    </span>
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: COLOR.textPrimary,
                      }}
                    >
                      {kdstDone}
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 400,
                          color: COLOR.textMuted,
                        }}
                      >
                        {" "}
                        / {totalKdst}
                      </span>
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: COLOR.textPrimary,
                      marginBottom: 2,
                    }}
                  >
                    {Math.round(kdstProgress * 100)}%
                  </span>
                </div>

                <div
                  style={{
                    height: 5,
                    backgroundColor: COLOR.bgApp,
                    borderRadius: RADIUS.pill,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${kdstProgress * 100}%`,
                      backgroundColor: COLOR.textPrimary,
                      borderRadius: RADIUS.pill,
                      transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  />
                </div>

                <span
                  style={{
                    fontSize: 11,
                    color:
                      kdstDone === totalKdst && totalKdst > 0
                        ? COLOR.success
                        : COLOR.textMuted,
                    marginTop: 7,
                    display: "block",
                    fontWeight: kdstDone === totalKdst ? 700 : 400,
                  }}
                >
                  {kdstDone === totalKdst && totalKdst > 0
                    ? "🎉 이번 달 발달 체크를 모두 완료했어요!"
                    : "체크하면 완료 날짜가 기록돼요"}
                </span>
              </div>

              {kdstGroups.map((group) => (
                <KdstDomainCard
                  key={group.domain}
                  group={group}
                  checkedItems={kdstChecked}
                  onToggle={toggleKdst}
                />
              ))}

              <div style={{ padding: "4px 0 8px" }}>
                <span
                  style={{
                    fontSize: 11,
                    color: COLOR.textDisabled,
                    lineHeight: "17px",
                    display: "block",
                  }}
                >
                  본 체크리스트는 K-DST 기준 참고용이며, 진단을 대체하지
                  않습니다. 발달에는 개인차가 있습니다.
                </span>
              </div>
            </>
          )}

          {/* ─── 내 체크리스트 탭 ─── */}
          {tab === "custom" && (
            <>
              {lists.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 20px",
                    color: COLOR.textMuted,
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                  <span
                    style={{
                      fontFamily: FONT.base,
                      fontSize: 14,
                      fontWeight: 500,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    아직 체크리스트가 없어요
                  </span>
                  <span style={{ fontSize: 12 }}>
                    위 '새 리스트' 버튼을 눌러 만��어 보세요
                  </span>
                </div>
              )}

              {[
                ...lists.filter((l) => l.pinned),
                ...lists.filter((l) => !l.pinned),
              ].map((list) => (
                <CustomListCard
                  key={list.id}
                  list={list}
                  onToggleItem={toggleItem}
                  onAddItem={addItem}
                  onDeleteItem={deleteItem}
                  onDeleteList={deleteList}
                  onRenameList={renameList}
                  onTogglePin={togglePin}
                />
              ))}

              {lists.length > 0 && (
                <button
                  onClick={() => setShowNewModal(true)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: RADIUS.lg,
                    border: `1.5px dashed ${COLOR.border}`,
                    backgroundColor: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <Plus size={15} color={COLOR.textMuted} strokeWidth={2.5} />
                  <span
                    style={{
                      fontFamily: FONT.base,
                      fontSize: 13,
                      fontWeight: 600,
                      color: COLOR.textMuted,
                    }}
                  >
                    새 체크리스트 만들기
                  </span>
                </button>
              )}

              <div style={{ height: 8 }} />
            </>
          )}
        </div>
      </div>

      {/* ── 새 리스트 모달 ── */}
      {showNewModal && (
        <NewListModal
          onClose={() => setShowNewModal(false)}
          onCreate={createList}
        />
      )}

      {/* ── 인칫 포인트 달성 팝업 ── */}
      {inchitPopup && (
        <>
          {/* 백드롭 */}
          <div
            className="backdrop-fade"
            onClick={() => setInchitPopup(null)}
            style={{
              position: "absolute", inset: 0,
              backgroundColor: "rgba(0,0,0,0.4)", zIndex: 50,
            }}
          />
          {/* 팝업 카드 */}
          <div
            className="sheet-slide-up"
            style={{
              position: "absolute",
              bottom: 0, left: 0, right: 0,
              backgroundColor: COLOR.bgCard,
              borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`,
              zIndex: 51,
              padding: "28px 28px 44px",
              boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              textAlign: "center",
            }}
          >
            {/* 핸들 */}
            <div style={{
              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              width: 40, height: 4,
              backgroundColor: COLOR.border, borderRadius: RADIUS.pill,
            }} />

            <span style={{ fontSize: 48, lineHeight: 1, marginBottom: 4 }}>
              {inchitPopup.emoji}
            </span>
            <span style={{
              fontSize: 18, fontWeight: 800, color: COLOR.textPrimary,
              letterSpacing: "-0.5px", lineHeight: 1.4,
            }}>
              {inchitPopup.title}
            </span>
            <span style={{
              fontSize: 14, color: COLOR.textSecondary, lineHeight: 1.6,
              letterSpacing: "-0.2px", whiteSpace: "pre-line",
            }}>
              {inchitPopup.body}
            </span>
            <button
              onClick={() => setInchitPopup(null)}
              style={{
                marginTop: 12,
                width: "100%", height: 52,
                backgroundColor: COLOR.textPrimary,
                border: "none", borderRadius: RADIUS.md,
                cursor: "pointer", fontFamily: FONT.base,
                fontSize: 15, fontWeight: 700, color: "#fff",
                letterSpacing: "-0.3px",
              }}
            >
              계속 기록하기
            </button>
          </div>
        </>
      )}
    </div>
  );
}