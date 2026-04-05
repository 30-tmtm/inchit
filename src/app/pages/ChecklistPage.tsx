import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Check,
  Pencil,
  Trash2,
  Pin,
  PinOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { COLOR, FONT, RADIUS, SPACE } from "../tokens";
import { useScrollFade } from "../hooks/useScrollFade";
import { useChild } from "../contexts/ChildContext";
import {
  getPendingDevelopmentPopup,
  markNotificationPopupSeen,
} from "../utils/notifications";

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

// ── Emoji Options ───────────────────────────────
const EMOJI_OPTIONS = [
  "🚗","🏫","🏥","🎒","📚","🧸","🍎","🛁","🌙","⭐",
  "🎨","🏃","🛒","🧹","💊","📋","🎯","🌿","❤️","✨",
];

// ── Helpers ─────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9);
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

// ── Main Component ─────────────────────────────

export function ChecklistPage() {
  // 자녀 컨텍스트
  const { childList: _childList, selectedChild, setSelectedChildId: _setSel } = useChild();
  void _childList; void _setSel;

  // 내 체크리스트 상태 (user_id 기반 — 자녀 전환과 무관)
  const [lists, setLists] = useState<CustomList[]>(loadCustomLists);
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


  const scrollRef = useScrollFade();

  useEffect(() => {
    const pendingPopup = getPendingDevelopmentPopup(selectedChild.id);
    if (!pendingPopup) return;
    markNotificationPopupSeen(pendingPopup.id);
  }, [selectedChild]);

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
          {/* ─── 내 체크리스트 ─── */}
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