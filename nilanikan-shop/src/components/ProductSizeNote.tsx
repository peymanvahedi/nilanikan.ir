"use client";

import { motion } from "framer-motion";

export default function ProductSizeNote() {
  return (
    <div className="mt-3 w-full max-w-[640px] space-y-2">
      <SizingCard />
      <BlinkNote />
    </div>
  );
}

/* --- کارت نکته سایزبندی (کامپکت و استاندارد) --- */
function SizingCard() {
  return (
    <div
      className="rounded-lg border border-pink-200 bg-pink-50/80 p-2.5 pr-3
                 flex items-start gap-2.5"
    >
      <div
        className="shrink-0 h-7 w-7 rounded-md bg-pink-600 text-white
                   flex items-center justify-center text-base"
        aria-hidden="true"
        title="راهنمای اندازه"
      >
        📏
      </div>

      <p className="m-0 leading-7 text-[14px] md:text-[13.5px] text-zinc-700 text-justify">
        برای انتخاب سایز مناسب کافیست یکی از لباس‌های فرزندتان را که کاملاً اندازه است
        روی زمین پهن کرده و اندازه آن را مطابق تصویر زیر یادداشت کنید و با جدول سایزبندی مطابقت دهید.
        <br className="hidden sm:block" />
        <span className="text-rose-600 font-semibold">۱ تا ۲ سانت خطای اندازه‌گیری</span> را در نظر بگیرید.
      </p>
    </div>
  );
}

/* --- متن چشمک‌زن بولد، رنگی و وسط‌چین --- */
function BlinkNote() {
  return (
    <div
      className="rounded-lg border border-pink-200 bg-white px-3 py-2
                 flex items-center justify-center text-center"
      dir="rtl"
    >
      <motion.span
        animate={{ opacity: [1, 0.35, 1] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        className="text-[13px] md:text-[15px] text-pink-600 font-extrabold leading-7"
      >
        اگر بین دو سایز مردد هستید، یک سایز بزرگ‌تر انتخاب کنید.
      </motion.span>
    </div>
  );
}
