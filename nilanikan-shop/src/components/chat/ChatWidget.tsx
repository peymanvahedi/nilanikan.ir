// src/components/chat/ChatWidget.tsx
"use client";
import { useEffect, useRef, useState } from "react";

type Msg =
  | { role: "user"; text: string }
  | { role: "bot"; text: string }
  | { role: "faq"; text?: string };

const faqItems = [
  { q: "سایز مناسب بچه‌ام چیه؟", a: "سایزها از نوزادی (0–3 ماه) تا 12 سال موجوده و جدول دقیق سایزبندی توی صفحه هر محصول هست." },
  { q: "پارچه‌ها ضدحساسیت هستن؟", a: "بله، همه لباس‌ها پنبه‌ای و ضدحساسیت برای پوست لطیف کودک هستند." },
  { q: "تعویض یا مرجوعی دارین؟", a: "تا 7 روز بعد از تحویل، در صورت سلامت کالا و بسته‌بندی، امکان تعویض یا مرجوعی هست." },
  { q: "ارسال چقدر طول می‌کشه؟", a: "رشت: رایگان 1–2 روز کاری / سایر شهرها: 2–4 روز طبق تعرفه پست." },
  { q: "خرید حضوری کجاست؟", a: `همه‌روزه حتی تعطیلات به شعبات ما در رشت سر بزنید:
• گلسار، بلوار دیلمان، روبروی مرکز خرید دیلمان
• خیابان مطهری، روبروی مسجد بادی‌الله، نبش کوچه ساغری‌سازان
• خیابان مطهری، بازار بزرگ مسگران` },
  { q: "ساعت پشتیبانی؟", a: "هر روز 9 صبح تا 17. تلفن: 013-33346429" },
  { q: "بسته‌بندی هدیه دارین؟", a: "بله، هنگام ثبت سفارش می‌تونید گزینهٔ بسته‌بندی هدیه رو انتخاب کنید." },
  { q: "چطور از تخفیف‌ها باخبر شم؟", a: "عضویت در خبرنامه یا دنبال کردن اینستاگرام نیلا نیکان." },
];

// آیکون گفت‌وگو
function ChatIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
    </svg>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: "سلام 👋 به فروشگاه پوشاک کودک نیلا نیکان خوش اومدی!" },
    { role: "bot", text: "سوالت رو از بین موارد زیر انتخاب کن؛ جوابش همون‌جا توی چت میاد." },
    { role: "faq" },
  ]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  function ask(q: string, a: string) {
    setMessages((m) => [
      ...m.filter((x) => x.role !== "faq"),
      { role: "user", text: q },
      { role: "bot", text: a },
      { role: "faq" },
    ]);
  }

  return (
    <div dir="rtl">
      {/* دکمه سه‌بعدی گفتگو */}
      <button
        onClick={() => setOpen(v => !v)}
        className="
          fixed bottom-4 right-4 z-[1000000]
          flex items-center gap-2 px-6 py-3 rounded-full
          bg-gradient-to-b from-rose-400 via-rose-500 to-rose-600
          text-white font-semibold
          shadow-[0_12px_24px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.3)]
          border border-white/20
          transform-gpu transition-all duration-200
          hover:translate-y-[-3px] hover:shadow-[0_16px_30px_rgba(0,0,0,0.35)]
          active:translate-y-[1px]
        "
        style={{ perspective: "800px" }}
      >
        <ChatIcon className="w-5 h-5" />
        گفتگو
      </button>

      {/* اوورلی */}
      {open && (
        <div
          className="fixed inset-0 bg-black/35 backdrop-blur-[2px] z-[999999]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* پنجره چت */}
      {open && (
        <div
          className="fixed bottom-20 right-4 w-[380px] max-w-[92vw] h-[520px]
                     z-[1000001] rounded-2xl shadow-2xl bg-white flex flex-col overflow-hidden border border-rose-100"
        >
          {/* هدر */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white">
            <div className="font-semibold text-sm flex items-center gap-2">
              <ChatIcon className="w-4 h-4" />
              پشتیبان نیلا نیکان
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/90 hover:text-white"
              aria-label="بستن"
            >
              ✕
            </button>
          </div>

          {/* بدنه چت */}
          <div ref={boxRef} className="flex-1 overflow-auto p-3 space-y-3 bg-gradient-to-b from-zinc-50 to-white">
            {messages.map((m, i) => {
              if (m.role === "user" || m.role === "bot") {
                return (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-xl px-3 py-2 text-sm shadow-md whitespace-pre-line ${
                        m.role === "user"
                          ? "bg-rose-500 text-white"
                          : "bg-white border border-zinc-200 text-zinc-800"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              }

              // حباب پرسش‌های متداول
              return (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[95%] w-full rounded-2xl px-3 py-2 text-sm bg-white border border-zinc-200 shadow">
                    <div className="text-[13px] text-zinc-600 mb-2">پرسش‌های متداول:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {faqItems.map((f, idx) => (
                        <button
                          key={idx}
                          onClick={() => ask(f.q, f.a)}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white shadow-sm hover:shadow-md transition
                                     border border-rose-100 text-right text-xs text-zinc-800 hover:bg-rose-50"
                          title={f.q}
                        >
                          <span className="text-rose-500">❓</span>
                          <span className="flex-1">{f.q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
