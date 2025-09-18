"use client";

export default function ContactChatCTA() {
  const openChat = () => {
    // باز کردن ویجت گفتگوی آنلاین (گفتینو)
    (window as any)?.Goftino?.open?.();
  };

  return (
    <div className="rounded-2xl border border-pink-200/70 bg-gradient-to-l from-pink-50 to-white p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
        <div className="shrink-0 grid place-items-center w-14 h-14 rounded-2xl bg-pink-600 text-white text-2xl">
          💬
        </div>
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-extrabold text-zinc-900">گفتگوی آنلاین نیلانیکان</h3>
          <p className="mt-1 text-zinc-600">
            سریع‌ترین راه ارتباط با ما همینجاست. روی دکمه زیر بزنید و همین الان گفتگو را شروع کنید.
          </p>
        </div>
        <button
          onClick={openChat}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-pink-600 px-5 text-white text-sm md:text-base font-extrabold hover:bg-pink-700"
        >
          شروع گفت‌وگو
        </button>
      </div>
    </div>
  );
}
