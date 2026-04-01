import { useEffect, useRef } from "react";

/**
 * 스크롤 중일 때 .scrolling 클래스를 붙이고,
 * 멈추면 일정 시간 후 제거합니다.
 * → CSS .panel-scroll.scrolling 에서 얇은 스크롤바를 노출.
 */
export function useScrollFade(delay = 900) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      el.classList.add("scrolling");
      clearTimeout(timer);
      timer = setTimeout(() => el.classList.remove("scrolling"), delay);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, [delay]);

  return ref;
}
