"use client";

import { useEffect } from "react";

export default function FallingLeaves() {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.id = "leaves-canvas";
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "3", // زیر محتوای اصلی که z-10 دارد
    } as Partial<CSSStyleDeclaration>);
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // ===== انواع و داده‌ها (Type-safe) =====
    const GLYPHS = ["🍁", "🍂", "🍃"] as const;
    type Glyph = (typeof GLYPHS)[number];
    const randGlyph = (): Glyph =>
      GLYPHS[Math.floor(Math.random() * GLYPHS.length)] as Glyph; // هرگز undefined

    type Leaf = {
      x: number;
      y: number;
      size: number;
      speedY: number;
      drift: number;
      phase: number;
      rot: number;
      rotSpeed: number;
      g: Glyph;
    };

    const LEAF_COUNT = 70; // لطیف‌تر
    const leaves: Leaf[] = Array.from({ length: LEAF_COUNT }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: 14 + Math.random() * 18,      // کوچک‌تر
      speedY: 0.4 + Math.random() * 0.9,  // کندتر
      drift: 0.6 + Math.random() * 1.0,   // موج افقی ملایم
      phase: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.015,
      g: randGlyph(),
    }));

    let raf = 0;
    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      // لایه مه‌آلود خیلی ملایم قهوه‌ای/نارنجی
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(255, 232, 210, 0.06)");
      grad.addColorStop(1, "rgba(140, 100, 70, 0.05)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const leaf of leaves) {
        const x = leaf.x + Math.sin(leaf.phase) * leaf.drift * 8;
        const y = leaf.y;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(leaf.rot);
        ctx.font = `${leaf.size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        ctx.globalAlpha = 0.55; // شفاف‌تر
        ctx.fillText(leaf.g, 0, 0);
        ctx.restore();

        // حرکت
        leaf.y += leaf.speedY + leaf.size * 0.008;
        leaf.phase += 0.012 + leaf.drift * 0.004;
        leaf.rot += leaf.rotSpeed;

        // ریست از بالا
        if (leaf.y > h + 40) {
          leaf.y = -40;
          leaf.x = Math.random() * w;
          leaf.g = randGlyph();
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.body.removeChild(canvas);
    };
  }, []);

  return null;
}
