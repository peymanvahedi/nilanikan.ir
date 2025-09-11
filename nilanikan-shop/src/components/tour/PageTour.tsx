// src/components/tour/PageTour.tsx
"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Placement = "top" | "bottom" | "left" | "right" | "auto";

type StepConf =
  | { selector: string; title: string; content: string; order?: number; placement?: Placement }
  | {
      find: Partial<{
        tag: string;                 // div / button / a ...
        textIncludes: string[];      // متن شامل هرکدام (OR)
        href: string;                // a[href="/cart"]
        placeholderIncludes: string[]; // placeholder شامل هرکدام (OR)
        idIncludes: string[];        // id شامل هرکدام (OR)
        classIncludes: string[];     // className شامل هرکدام (OR)
        name: string;                // name=
        attr: [string, string][];    // جفت‌های [نام، مقدار]
      }>;
      title: string;
      content: string;
      order?: number;
      placement?: Placement;
    };

type Page = { test: (path: string) => boolean; steps: StepConf[] };

/* ---------------- helpers ---------------- */
const qs = (sel: string) => document.querySelector(sel) as HTMLElement | null;
const textOf = (el: Element) => (el.textContent || "").replace(/\s+/g, " ").trim();
const hasAny = (s: string, arr?: string[]) =>
  !!arr?.some((n) => s?.toLowerCase().includes(n.toLowerCase()));

function findEl(find: NonNullable<Extract<StepConf, { find: any }>["find"]>): HTMLElement | null {
  const tag = find.tag || "*";
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(tag));
  for (const el of nodes) {
    if (find.href && !(el instanceof HTMLAnchorElement && el.getAttribute("href") === find.href)) continue;
    if (find.name && el.getAttribute("name") !== find.name) continue;

    if (find.placeholderIncludes?.length) {
      const ph =
        (el as HTMLInputElement).placeholder ||
        (el as HTMLTextAreaElement).placeholder ||
        el.getAttribute("placeholder") ||
        "";
      if (!hasAny(ph, find.placeholderIncludes)) continue;
    }
    if (find.idIncludes?.length) {
      if (!hasAny((el.id || ""), find.idIncludes)) continue;
    }
    if (find.classIncludes?.length) {
      const cn = (el.className || "").toString();
      if (!hasAny(cn, find.classIncludes)) continue;
    }
    if (find.textIncludes?.length) {
      if (!hasAny(textOf(el), find.textIncludes)) continue;
    }
    if (find.attr?.length) {
      let ok = true;
      for (const [k, v] of find.attr) if (el.getAttribute(k) !== v) { ok = false; break; }
      if (!ok) continue;
    }
    return el;
  }
  return null;
}

function applyStep(el: HTMLElement, s: Omit<StepConf, "selector" | "find"> & { order: number }) {
  el.setAttribute("data-tour", "");
  el.setAttribute("data-tour-title", s.title);
  el.setAttribute("data-tour-content", s.content);
  el.setAttribute("data-tour-order", String(s.order));
  el.setAttribute("data-tour-placement", s.placement ?? "auto");
  return () => {
    el.removeAttribute("data-tour");
    el.removeAttribute("data-tour-title");
    el.removeAttribute("data-tour-content");
    el.removeAttribute("data-tour-order");
    el.removeAttribute("data-tour-placement");
  };
}

/* ---------------- per-page steps ---------------- */
const PAGES: Page[] = [
  // Product / Bundle
  {
    test: (p) => /^\/(product|products|bundle)\//.test(p),
    steps: [
      {
        find: { classIncludes: ["gallery", "product-gallery", "ImageGallery"], tag: "div" },
        title: "گالری تصاویر",
        content: "عکس‌های محصول را ورق بزنید.",
        order: 1,
      },
      {
        find: { classIncludes: ["variants", "options", "AttributePicker"] },
        title: "انتخاب ویژگی‌ها",
        content: "سایز/رنگ را انتخاب کنید.",
        order: 2,
      },
      {
        find: {
          tag: "button",
          textIncludes: ["افزودن", "افزودن به سبد", "Add to Cart", "اضافه"],
          idIncludes: ["add", "cart", "buy"],
          classIncludes: ["add", "cart", "buy", "AddToCart"],
        },
        title: "افزودن به سبد خرید",
        content: "برای افزودن محصول به سبد خرید، این دکمه را بزنید.",
        order: 3,
      },
      {
        selector: "a[href='/cart']",
        title: "مشاهده سبد خرید",
        content: "پس از افزودن محصول به سبد خرید، برای مشاهده به اینجا بروید.",
        order: 4,
        placement: "bottom",
      },
      {
        selector: ".product-description",
        title: "توضیحات محصول",
        content: "برای مشاهده اطلاعات کامل‌تر، این بخش را مطالعه کنید.",
        order: 5,
        placement: "top",
      },
      {
        find: { tag: "button", textIncludes: ["اضافه به لیست علاقه‌مندی", "Add to Wishlist"] },
        title: "لیست علاقه‌مندی‌ها",
        content: "برای ذخیره محصول برای خرید در آینده، از این دکمه استفاده کنید.",
        order: 6,
        placement: "top",
      },
    ],
  },

  // Cart
  {
    test: (p) => p === "/cart",
    steps: [
      { find: { classIncludes: ["cart", "items", "CartSheet", "CartModal"] }, title: "اقلام سبد", content: "ویرایش تعداد یا حذف هر آیتم.", order: 1 },
      { find: { tag: "input", placeholderIncludes: ["کد", "تخفیف", "coupon"] }, title: "کد تخفیف", content: "اگر کد دارید وارد کنید.", order: 2 },
      { find: { tag: "a", href: "/checkout" }, title: "ادامه و پرداخت", content: "برای ثبت سفارش به مرحله بعد بروید.", order: 3 },
    ],
  },

  // Checkout
  {
    test: (p) => /^\/checkout(\/|$)/.test(p),
    steps: [
      { find: { tag: "input", placeholderIncludes: ["نام", "name"] }, title: "مشخصات گیرنده", content: "نام و مشخصات را وارد کنید.", order: 1 },
      { find: { tag: "input", placeholderIncludes: ["09", "phone", "تلفن"] }, title: "شماره موبایل", content: "شماره تماس برای هماهنگی ارسال.", order: 2 },
      { find: { tag: "textarea", placeholderIncludes: ["آدرس", "address"] }, title: "آدرس کامل", content: "آدرس پستی دقیق را بنویسید.", order: 3 },
      { find: { tag: "button", textIncludes: ["ثبت", "پرداخت", "Pay", "نهایی"] }, title: "ثبت و پرداخت", content: "برای نهایی‌سازی سفارش.", order: 4 },
    ],
  },

  // سایر صفحات می‌توانند به همین صورت اضافه شوند...
];

/* ---------------- main injector ---------------- */
export default function PageTour() {
  const pathname = usePathname() || "/";
  const observerRef = useRef<MutationObserver | null>(null);
  const cleanupsRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    const page = PAGES.find((p) => p.test(pathname));
    if (!page) return;

    const applyAll = () => {
      // پاکسازی قبلی
      cleanupsRef.current.forEach((fn) => fn());
      cleanupsRef.current = [];

      let applied = 0;
      page.steps.forEach((step, i) => {
        let el: HTMLElement | null = null;
        if ("selector" in step) el = qs(step.selector);
        else if ("find" in step) el = findEl(step.find || {});
        if (!el) return;
        applied++;
        cleanupsRef.current.push(
          applyStep(el, {
            title: step.title,
            content: step.content,
            order: step.order ?? i + 1,
            placement: (step as any).placement ?? "auto",
          })
        );
      });
    };

    // retry
    let tries = 0;
    const tick = () => {
      applyAll();
      tries++;
      if (tries < 6) setTimeout(tick, 250);
    };
    setTimeout(tick, 0);

    // observe changes
    observerRef.current?.disconnect();
    observerRef.current = new MutationObserver(() => applyAll());
    observerRef.current.observe(document.body, { childList: true, subtree: true });

    const onEv = () => applyAll();
    window.addEventListener("load", onEv);
    window.addEventListener("resize", onEv);

    return () => {
      cleanupsRef.current.forEach((fn) => fn());
      cleanupsRef.current = [];
      observerRef.current?.disconnect();
      window.removeEventListener("load", onEv);
      window.removeEventListener("resize", onEv);
    };
  }, [pathname]);

  return null;
}
