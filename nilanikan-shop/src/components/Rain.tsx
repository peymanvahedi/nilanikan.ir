"use client";

import { useEffect } from "react";

export default function Rain() {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.id = "rain-canvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "1"; // زیر اسلایدر

    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const raindrops = Array.from({ length: 200 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      l: Math.random() * 25 + 15,
      xs: Math.random() * 2 - 1,
      ys: Math.random() * 15 + 20,
    }));

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(120,150,255,0.7)";
      ctx.lineWidth = 1;
      ctx.lineCap = "round";

      raindrops.forEach((r) => {
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + r.xs, r.y + r.l);
        ctx.stroke();
      });
      move();
    }

    function move() {
      raindrops.forEach((r) => {
        r.x += r.xs;
        r.y += r.ys;
        if (r.x > width || r.y > height) {
          r.x = Math.random() * width;
          r.y = -20;
        }
      });
    }

    let animationFrame: number;
    function animate() {
      draw();
      animationFrame = requestAnimationFrame(animate);
    }
    animate();

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      document.body.removeChild(canvas);
    };
  }, []);

  return null;
}
