// src/components/tour/TourProvider.tsx
"use client";
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";
import { createPortal } from "react-dom";

type Placement = "top" | "bottom" | "left" | "right" | "auto";
type Step = { el: HTMLElement; title: string; content: string; placement: Placement; order?: number };
type StartOptions = { skipIntro?: boolean };

type TourContextType = {
  start: (opts?: StartOptions) => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  isOpen: boolean;
  index: number;
};

const TourContext = createContext<TourContextType | null>(null);
const STORAGE_KEY = "site_tour_dismissed_v1";

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

function collectSteps(): Step[] {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-tour]"));
  const steps = nodes.map((el, i) => {
    const title = el.getAttribute("data-tour-title") || "راهنما";
    const content = el.getAttribute("data-tour-content") || "";
    const placement = (el.getAttribute("data-tour-placement") || "auto") as Placement;
    const orderAttr = el.getAttribute("data-tour-order");
    const order = orderAttr ? Number(orderAttr) : i;
    return { el, title, content, placement, order };
  });
  steps.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return steps;
}

function getPosition(target: HTMLElement, placement: Placement) {
  const rect = target.getBoundingClientRect();
  const m = 12;
  const tooltipW = Math.min(320, Math.floor(window.innerWidth * 0.9));
  const tooltipH = 160;

  const auto = () => {
    if (rect.top > tooltipH + m) return "top";
    if (window.innerHeight - rect.bottom > tooltipH + m) return "bottom";
    if (rect.left > tooltipW + m) return "left";
    return "right";
  };

  const place = placement === "auto" ? (auto() as Placement) : placement;

  let top = rect.top + window.scrollY;
  let left = rect.left + window.scrollX;

  if (place === "top") { top = top - tooltipH - m; left = left + rect.width / 2 - tooltipW / 2; }
  else if (place === "bottom") { top = top + rect.height + m; left = left + rect.width / 2 - tooltipW / 2; }
  else if (place === "left") { top = top + rect.height / 2 - tooltipH / 2; left = left - tooltipW - m; }
  else { top = top + rect.height / 2 - tooltipH / 2; left = left + rect.width + m; }

  const maxLeft = window.scrollX + window.innerWidth - tooltipW - 8;
  const minLeft = window.scrollX + 8;
  const maxTop = window.scrollY + window.innerHeight - tooltipH - 8;
  const minTop = window.scrollY + 8;

  top = clamp(top, minTop, maxTop);
  left = clamp(left, minLeft, maxLeft);

  return { top, left, tooltipW, tooltipH, place };
}

/* -------------------- Overlay (fixed; mobile-safe) -------------------- */
function FourSideOverlay({ target }: { target: HTMLElement }) {
  const [r, setR] = useState<{top:number; left:number; width:number; height:number} | null>(null);

  useEffect(() => {
    const update = () => {
      const rect = target.getBoundingClientRect();
      const pad = 8;
      setR({
        top: rect.top + window.scrollY - pad,
        left: rect.left + window.scrollX - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(target);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [target]);

  if (!r) return null;

  const z = 9998;
  const vhTop = Math.max(0, r.top - window.scrollY);
  const vhLeft = Math.max(0, r.left - window.scrollX);

  const base: React.CSSProperties = {
    position: "fixed",
    background: "rgba(0,0,0,0.55)",
    zIndex: z,
    pointerEvents: "auto",
  };

  return createPortal(
    <>
      {/* بالا */}
      <div style={{ ...base, top: 0, left: 0, width: "100vw", height: vhTop }} />
      {/* پایین */}
      <div
        style={{
          ...base,
          top: vhTop + r.height,
          left: 0,
          width: "100vw",
          height: Math.max(0, window.innerHeight - (vhTop + r.height)),
        }}
      />
      {/* چپ */}
      <div style={{ ...base, top: vhTop, left: 0, width: vhLeft, height: r.height }} />
      {/* راست */}
      <div
        style={{
          ...base,
          top: vhTop,
          left: vhLeft + r.width,
          width: Math.max(0, window.innerWidth - (vhLeft + r.width)),
          height: r.height,
        }}
      />
      {/* هایلایت دور عنصر */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: vhTop,
          left: vhLeft,
          width: r.width,
          height: r.height,
          borderRadius: 12,
          boxShadow: "0 0 0 2px rgba(255,255,255,0.9)",
          zIndex: z + 1,
          pointerEvents: "none",
        }}
      />
    </>,
    document.body
  );
}

/* ---------------------------- Tooltip -------------------------------- */
function Tooltip({
  target, title, content, placement, onNext, onPrev, onClose, index, total,
}: {
  target: HTMLElement; title: string; content: string; placement: Placement;
  onNext: () => void; onPrev: () => void; onClose: () => void; index: number; total: number;
}) {
  const [pos, setPos] = useState(() => getPosition(target, placement));

  useEffect(() => {
    const update = () => setPos(getPosition(target, placement));
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [target, placement]);

  return createPortal(
    <div
      role="dialog" aria-live="polite"
      style={{
        position: "absolute", top: pos.top, left: pos.left, width: pos.tooltipW, minHeight: pos.tooltipH,
        background: "#fff", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,.15)",
        padding: 16, zIndex: 10000, direction: "rtl", maxWidth: "90vw",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>{content}</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
        <button onClick={onPrev} disabled={index === 0} style={btnSecondary}>قبلی</button>
        <div style={{ opacity: 0.7, fontSize: 12 }}>{index + 1} / {total}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={btnLight}>بستن</button>
          <button onClick={onNext} style={btnPrimary}>{index + 1 === total ? "تمام" : "بعدی"}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const btnBase: React.CSSProperties = {
  padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,.08)", cursor: "pointer", fontWeight: 600,
};
const btnPrimary: React.CSSProperties = { ...btnBase, background: "#111", color: "#fff" };
const btnSecondary: React.CSSProperties = { ...btnBase, background: "#f0f0f0" };
const btnLight: React.CSSProperties = { ...btnBase, background: "#fff" };

/* ---------------------------- Intro Modal ----------------------------- */
function IntroModal({ onStart, onClose }: { onStart: () => void; onClose: () => void }) {
  return createPortal(
    <div role="dialog" aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 11000, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.45)" }}>
      <div style={{ width: "min(520px, 92vw)", background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,.25)", padding: 20, direction: "rtl" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>راهنمای فروشگاه</div>
          <button onClick={onClose} style={btnLight}>بستن</button>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.9, marginBottom: 16 }}>
          با چند قدم کوتاه با قسمت‌های مهم همین صفحه آشنا می‌شوید.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={btnSecondary}>بعداً</button>
          <button onClick={onStart} style={btnPrimary}>شروع آموزش</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ----------------------------- Provider ------------------------------- */
export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within <TourProvider/>");
  return ctx;
}

export default function TourProvider({ children }: { children: React.ReactNode }) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [intro, setIntro] = useState(false);

  const actuallyOpenSteps = useCallback(() => {
    const s = collectSteps();
    if (!s.length) { setIntro(false); return; }
    s[0].el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      setSteps(s);
      setIndex(0);
      setIsOpen(true);
      setIntro(false);
      // قفل اسکرول بدنه
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    }, 250);
  }, []);

  const start = useCallback((opts?: StartOptions) => {
    if (opts?.skipIntro) actuallyOpenSteps();
    else setIntro(true);
  }, [actuallyOpenSteps]);

  const close = useCallback(() => {
    setIsOpen(false);
    // آزاد کردن اسکرول بدنه
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
  }, []);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i + 1 < steps.length) {
        const nxt = steps[i + 1];
        nxt.el.scrollIntoView({ behavior: "smooth", block: "center" });
        return i + 1;
      }
      close();
      return i;
    });
  }, [steps, close]);

  const prev = useCallback(() => {
    setIndex((i) => {
      const j = Math.max(0, i - 1);
      steps[j]?.el.scrollIntoView({ behavior: "smooth", block: "center" });
      return j;
    });
  }, [steps]);

  const ctx = useMemo<TourContextType>(() => ({
    start, stop: close, next, prev, isOpen, index,
  }), [start, close, next, prev, isOpen, index]);

  const active = isOpen ? steps[index] : null;

  return (
    <TourContext.Provider value={ctx}>
      {children}
      {intro && <IntroModal onStart={actuallyOpenSteps} onClose={() => setIntro(false)} />}
      {isOpen && active?.el && (
        <>
          <FourSideOverlay target={active.el} />
          <Tooltip
            target={active.el}
            title={active.title}
            content={active.content}
            placement={active.placement}
            onNext={next} onPrev={prev} onClose={close}
            index={index} total={steps.length}
          />
        </>
      )}
    </TourContext.Provider>
  );
}
