import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Activity, Hand, MessageCircle, Brain, Users, ChevronDown, Check } from "lucide-react";
import { COLOR, FONT, RADIUS, SPACE, SHADOW } from "../tokens";
import { useChild } from "../contexts/ChildContext";
import { KDST_ITEMS, KDST_RANGES, KdstRangeKey } from "../data/kdst";
import { getAgeAtTimestamp } from "../utils/seoulDate";
import { formatAgeShort } from "../utils/ageFormat";

// ── 도메인 메타 ─────────────────────────────────────────────
const DOMAINS = [
  { label: "대근육 운동", icon: Activity,      color: "#4A90D9" },
  { label: "소근육 운동", icon: Hand,          color: "#7B68EE" },
  { label: "언어",       icon: MessageCircle,  color: "#20B2AA" },
  { label: "인지",       icon: Brain,          color: "#DA70D6" },
  { label: "사회성",     icon: Users,          color: "#FF8C69" },
] as const;

// ── 구간 레이블 ─────────────────────────────────────────────
function rangeLabel(start: number, end: number): string {
  if (start >= 36) {
    const startY = Math.floor(start / 12);
    const endY   = Math.floor(end / 12);
    return startY === endY
      ? `만 ${startY}세 (${start}~${end}개월)`
      : `만 ${startY}~${endY}세 (${start}~${end}개월)`;
  }
  return `${start}~${end}개월`;
}

// ── 구간 상태 ───────────────────────────────────────────────
type RangeStatus = "past" | "current" | "future";
function getRangeStatus(start: number, end: number, months: number): RangeStatus {
  if (months > end)   return "past";
  if (months < start) return "future";
  return "current";
}

// ── 체크 항목 키 ────────────────────────────────────────────
function makeKey(domain: string, item: string) {
  return `${domain}::${item}`;
}

// ── 구간별 체크 데이터 ──────────────────────────────────────
function getRangeCheckedData(
  rangeKey: KdstRangeKey,
  childId: string,
  isChecked: (cId: string, key: string) => boolean,
  getCheckedAt: (cId: string, key: string) => string | undefined,
) {
  const items = KDST_ITEMS[rangeKey];
  const domainData = DOMAINS.map((d, di) => ({
    ...d,
    items: items[di].map((item) => {
      const key = makeKey(d.label, item);
      const checked = isChecked(childId, key);
      return { label: item, key, checked, checkedAt: checked ? getCheckedAt(childId, key) : undefined };
    }),
  }));
  const total = domainData.reduce((s, d) => s + d.items.length, 0);
  const done  = domainData.reduce((s, d) => s + d.items.filter(i => i.checked).length, 0);
  return { domainData, total, done };
}

// ── 메인 컴포넌트 ────────────────────────────────────────────
export function DevelopmentRecordPage() {
  const navigate = useNavigate();
  const { childList, selectedChild, isKdstChecked, getKdstCheckedAt } = useChild();

  const [detailKey, setDetailKey] = useState<KdstRangeKey | null>(null);
  const [viewingChildId, setViewingChildId] = useState<string | null>(selectedChild?.id ?? null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // 자녀 변경 시 detail 닫기
  useEffect(() => {
    setDetailKey(null);
  }, [viewingChildId]);

  const sortedChildren = [...childList].sort((a, b) => a.dob.localeCompare(b.dob));
  const viewingChild = childList.find(c => c.id === viewingChildId) ?? selectedChild;

  if (!viewingChild) return null;
  const { id: childId, months, dob } = viewingChild;
  const hasMultipleChildren = sortedChildren.length > 1;

  // 현재 아이 구간 기준
  const currentRange = KDST_RANGES.find(r => months >= r.start && months <= r.end)
    ?? KDST_RANGES[KDST_RANGES.length - 1];

  // ── 목록 화면 ──────────────────────────────────────────────
  if (!detailKey) {
    return (
      <div style={{ height: "100dvh", overflow: "hidden", display: "flex", justifyContent: "center", backgroundColor: COLOR.bgOuter }}>
        <div style={{ width: "100%", maxWidth: 430, height: "100dvh", backgroundColor: COLOR.bgApp, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: FONT.base }}>

          {/* 앱바 */}
          <div style={{ backgroundColor: COLOR.bgCard, display: "flex", alignItems: "center", height: 56, padding: "0 8px", flexShrink: 0, borderBottom: `1px solid ${COLOR.borderLight}` }}>
            <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 11, display: "flex", alignItems: "center" }}>
              <ChevronLeft size={22} color={COLOR.textPrimary} strokeWidth={2} />
            </button>
            <div style={{ flex: 1, textAlign: "center" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>발달 기록</span>
            </div>
            <div style={{ width: 44 }} />
          </div>

          {/* 아이 선택 칩 */}
          <div style={{ padding: "16px 20px 4px" }}>
            <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
              <button
                onClick={() => hasMultipleChildren && setDropdownOpen(v => !v)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  backgroundColor: COLOR.primary, borderRadius: RADIUS.pill,
                  padding: "7px 14px", border: "none",
                  cursor: hasMultipleChildren ? "pointer" : "default",
                  fontFamily: FONT.base, WebkitTapHighlightColor: "transparent",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>
                  {viewingChild.name}
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", letterSpacing: "-0.1px" }}>
                  {formatAgeShort(months)}
                </span>
                {hasMultipleChildren && (
                  <ChevronDown
                    size={13}
                    color="rgba(255,255,255,0.85)"
                    strokeWidth={2.5}
                    style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
                  />
                )}
              </button>

              {/* 드롭다운 */}
              {dropdownOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0,
                  backgroundColor: COLOR.bgCard, borderRadius: RADIUS.md,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.13)", zIndex: 100,
                  minWidth: 180, overflow: "hidden",
                }}>
                  {sortedChildren.map((child, i) => {
                    const isSelected = viewingChild.id === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => { setViewingChildId(child.id); setDropdownOpen(false); }}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "13px 16px", backgroundColor: isSelected ? COLOR.bgApp : "transparent",
                          border: "none", borderBottom: i < sortedChildren.length - 1 ? `1px solid ${COLOR.borderLight}` : "none",
                          cursor: "pointer", fontFamily: FONT.base, textAlign: "left",
                          WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        <div>
                          <span style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500, color: COLOR.textPrimary, display: "block", letterSpacing: "-0.2px" }}>
                            {child.name}
                          </span>
                          <span style={{ fontSize: 12, color: COLOR.textMuted }}>{formatAgeShort(child.months)}</span>
                        </div>
                        {isSelected && <Check size={16} color={COLOR.primary} strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 구간 목록 */}
          <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: `12px ${SPACE.pagePadding}px 32px`, display: "flex", flexDirection: "column", gap: 10 }}>
            {KDST_RANGES.map((r) => {
              const key = `${r.start}-${r.end}` as KdstRangeKey;
              const status = getRangeStatus(r.start, r.end, months);
              const { total, done } = getRangeCheckedData(key, childId, isKdstChecked, getKdstCheckedAt);
              const pct = total > 0 ? done / total : 0;
              const isCurrent = status === "current";
              const isFuture  = status === "future";

              return (
                <button
                  key={key}
                  onClick={() => !isFuture && setDetailKey(key)}
                  style={{
                    width: "100%", textAlign: "left", background: "none", border: "none",
                    cursor: isFuture ? "default" : "pointer", padding: 0,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <div style={{
                    backgroundColor: COLOR.bgCard,
                    borderRadius: RADIUS.lg,
                    padding: "15px 16px",
                    boxShadow: isCurrent ? `0 0 0 2px ${COLOR.primary}` : SHADOW.card,
                    opacity: isFuture ? 0.45 : 1,
                    transition: "opacity 0.15s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
                          {rangeLabel(r.start, r.end)}
                        </span>
                        {isCurrent && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", backgroundColor: COLOR.primary, borderRadius: RADIUS.pill, padding: "2px 7px", letterSpacing: "-0.1px" }}>
                            현재
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: done === total && total > 0 ? COLOR.success : COLOR.textMuted, letterSpacing: "-0.1px" }}>
                          {done}<span style={{ fontWeight: 400, color: COLOR.textDisabled }}> / {total}</span>
                        </span>
                        {!isFuture && <ChevronRight size={14} color={COLOR.textDisabled} strokeWidth={2} />}
                      </div>
                    </div>

                    {/* 진행률 바 */}
                    <div style={{ height: 4, backgroundColor: COLOR.bgApp, borderRadius: RADIUS.pill, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${pct * 100}%`,
                        backgroundColor: done === total && total > 0 ? COLOR.success : isCurrent ? COLOR.primary : COLOR.textDisabled,
                        borderRadius: RADIUS.pill,
                        transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
                      }} />
                    </div>

                    {/* 도메인 미니 뱃지 */}
                    {!isFuture && done > 0 && (
                      <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
                        {DOMAINS.map((d, di) => {
                          const domItems = KDST_ITEMS[key][di];
                          const domDone  = domItems.filter(item => isKdstChecked(childId, makeKey(d.label, item))).length;
                          if (domDone === 0) return null;
                          return (
                            <span key={d.label} style={{ fontSize: 10, fontWeight: 600, color: d.color, backgroundColor: `${d.color}15`, borderRadius: RADIUS.pill, padding: "2px 8px", letterSpacing: "-0.1px" }}>
                              {d.label} {domDone}/{domItems.length}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── 상세 화면 ──────────────────────────────────────────────
  const range = KDST_RANGES.find(r => `${r.start}-${r.end}` === detailKey)!;
  const { domainData, total, done } = getRangeCheckedData(detailKey, childId, isKdstChecked, getKdstCheckedAt);
  const pct = total > 0 ? done / total : 0;

  // 타임라인: 체크된 항목 checked_at 기준 최신순
  const timeline = domainData
    .flatMap(d => d.items.filter(i => i.checked).map(i => ({ ...i, domain: d.label, domainColor: d.color })))
    .sort((a, b) => {
      if (!a.checkedAt && !b.checkedAt) return 0;
      if (!a.checkedAt) return 1;
      if (!b.checkedAt) return -1;
      return new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime();
    });

  return (
    <div style={{ height: "100dvh", overflow: "hidden", display: "flex", justifyContent: "center", backgroundColor: COLOR.bgOuter }}>
      <div style={{ width: "100%", maxWidth: 430, height: "100dvh", backgroundColor: COLOR.bgApp, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: FONT.base }}>

        {/* 앱바 */}
        <div style={{ backgroundColor: COLOR.bgCard, display: "flex", alignItems: "center", height: 56, padding: "0 8px", flexShrink: 0, borderBottom: `1px solid ${COLOR.borderLight}` }}>
          <button onClick={() => setDetailKey(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 11, display: "flex", alignItems: "center" }}>
            <ChevronLeft size={22} color={COLOR.textPrimary} strokeWidth={2} />
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: COLOR.textPrimary, letterSpacing: "-0.3px" }}>
              {rangeLabel(range.start, range.end)} 보고서
            </span>
          </div>
          <div style={{ width: 44 }} />
        </div>

        <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: `20px ${SPACE.pagePadding}px 40px`, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* 전체 진행 요약 카드 */}
          <div style={{ backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg, padding: "18px 18px", boxShadow: SHADOW.card }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 12, color: COLOR.textMuted, display: "block", marginBottom: 4, letterSpacing: "-0.1px" }}>
                  인칫 포인트 달성
                </span>
                <span style={{ fontSize: 26, fontWeight: 800, color: COLOR.textPrimary, letterSpacing: "-1px" }}>
                  {done}
                  <span style={{ fontSize: 14, fontWeight: 400, color: COLOR.textMuted }}> / {total}</span>
                </span>
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: done === total && total > 0 ? COLOR.success : COLOR.textPrimary, marginBottom: 2, letterSpacing: "-0.5px" }}>
                {Math.round(pct * 100)}%
              </span>
            </div>
            <div style={{ height: 6, backgroundColor: COLOR.bgApp, borderRadius: RADIUS.pill, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct * 100}%`,
                backgroundColor: done === total && total > 0 ? COLOR.success : COLOR.primary,
                borderRadius: RADIUS.pill,
                transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
              }} />
            </div>
            {done === total && total > 0 && (
              <span style={{ fontSize: 12, color: COLOR.success, fontWeight: 700, marginTop: 8, display: "block" }}>
                🎉 이 구간의 모든 인칫 포인트를 달성했어요!
              </span>
            )}
          </div>

          {/* 도메인별 진행 */}
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.textMuted, display: "block", marginBottom: 8, paddingLeft: 2, letterSpacing: "-0.2px" }}>
              영역별 달성
            </span>
            <div style={{ backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg, overflow: "hidden", boxShadow: SHADOW.card }}>
              {domainData.map((d, i) => {
                const domDone = d.items.filter(item => item.checked).length;
                const domPct  = d.items.length > 0 ? domDone / d.items.length : 0;
                const Icon = d.icon;
                return (
                  <div key={d.label} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "13px 16px",
                    borderBottom: i < domainData.length - 1 ? `1px solid ${COLOR.borderLight}` : "none",
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${d.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} color={d.color} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: COLOR.textPrimary, letterSpacing: "-0.2px" }}>{d.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: domDone === d.items.length ? COLOR.success : COLOR.textMuted, letterSpacing: "-0.1px" }}>
                          {domDone}/{d.items.length}
                        </span>
                      </div>
                      <div style={{ height: 3, backgroundColor: COLOR.bgApp, borderRadius: RADIUS.pill, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${domPct * 100}%`,
                          backgroundColor: domDone === d.items.length ? COLOR.success : d.color,
                          borderRadius: RADIUS.pill,
                          transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 달성 타임라인 */}
          {timeline.length > 0 && (
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.textMuted, display: "block", marginBottom: 8, paddingLeft: 2, letterSpacing: "-0.2px" }}>
                달성 기록
              </span>
              <div style={{ backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg, overflow: "hidden", boxShadow: SHADOW.card }}>
                {timeline.map((item, i) => {
                  const ageLabel = item.checkedAt ? getAgeAtTimestamp(dob, item.checkedAt) : null;
                  return (
                    <div key={item.key} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "13px 16px",
                      borderBottom: i < timeline.length - 1 ? `1px solid ${COLOR.borderLight}` : "none",
                    }}>
                      {/* 도메인 색상 dot */}
                      <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: item.domainColor, flexShrink: 0, marginLeft: 2 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: COLOR.textSecondary, letterSpacing: "-0.2px", display: "block" }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: 11, color: COLOR.textDisabled, letterSpacing: "-0.1px" }}>
                          {item.domain}
                        </span>
                      </div>
                      {ageLabel && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: COLOR.textMuted, letterSpacing: "-0.1px", flexShrink: 0 }}>
                          {ageLabel}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 미달성 항목 */}
          {done < total && (
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.textMuted, display: "block", marginBottom: 8, paddingLeft: 2, letterSpacing: "-0.2px" }}>
                아직 체크되지 않은 항목
              </span>
              <div style={{ backgroundColor: COLOR.bgCard, borderRadius: RADIUS.lg, overflow: "hidden", boxShadow: SHADOW.card }}>
                {domainData.flatMap(d =>
                  d.items
                    .filter(item => !item.checked)
                    .map((item, idx, arr) => {
                      const isLastInDomain = idx === arr.length - 1;
                      const isLastOverall  = domainData.flatMap(x => x.items.filter(i => !i.checked)).at(-1)?.key === item.key;
                      return (
                        <div key={item.key} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "12px 16px",
                          borderBottom: isLastOverall ? "none" : `1px solid ${COLOR.borderLight}`,
                          opacity: 0.65,
                        }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: COLOR.borderInactive, flexShrink: 0, marginLeft: 2 }} />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 400, color: COLOR.textMuted, letterSpacing: "-0.2px", display: "block" }}>
                              {item.label}
                            </span>
                            <span style={{ fontSize: 11, color: COLOR.textDisabled, letterSpacing: "-0.1px" }}>
                              {domainData.find(d => d.items.some(i => i.key === item.key))?.label}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
