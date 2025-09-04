"use client";

import { useEffect, useState } from "react";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: "open" | "closed";
  createdAt: string; // ISO
};

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // بارگذاری تیکت‌ها از localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nnp_tickets");
      if (raw) setTickets(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  // ذخیره هر تغییر
  useEffect(() => {
    if (!loading) localStorage.setItem("nnp_tickets", JSON.stringify(tickets));
  }, [tickets, loading]);

  const submitTicket = () => {
    if (!subject.trim() || !message.trim()) return;
    const t: Ticket = {
      id: crypto.randomUUID(),
      subject: subject.trim(),
      message: message.trim(),
      status: "open",
      createdAt: new Date().toISOString(),
    };
    setTickets([t, ...tickets]);
    setSubject("");
    setMessage("");
    alert("تیکت با موفقیت ثبت شد ✅");
  };

  const closeTicket = (id: string) =>
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "closed" } : t))
    );

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-pink-600 mb-6">پشتیبانی</h1>

      {/* باکس واتساپ */}
      <div className="mb-6 p-4 rounded-2xl border bg-white flex items-center justify-between">
        <div className="text-sm text-zinc-700">
          نیاز به پاسخ سریع دارید؟
        </div>
        <a
          href="https://wa.me/989123456789" // شماره‌ات را بگذار
          target="_blank"
          className="bg-green-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-700 transition"
        >
          چت واتساپ
        </a>
      </div>

      {/* فرم تیکت */}
      <div className="mb-8 rounded-2xl border bg-white p-4 space-y-3">
        <div>
          <label className="block text-sm mb-1 text-zinc-700">عنوان تیکت</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-pink-200"
            placeholder="مثلاً: سوال درباره سایزبندی"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-zinc-700">متن پیام</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 h-28 outline-none focus:ring-2 focus:ring-pink-200"
            placeholder="توضیحات خود را بنویسید..."
          />
        </div>
        <button
          onClick={submitTicket}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition disabled:opacity-50"
          disabled={!subject.trim() || !message.trim()}
        >
          ارسال تیکت
        </button>
      </div>

      {/* لیست تیکت‌ها */}
      <section>
        <h2 className="font-bold text-zinc-800 mb-3">تیکت‌های من</h2>
        {tickets.length === 0 ? (
          <p className="text-sm text-zinc-600">هنوز تیکتی ثبت نکرده‌اید.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="border rounded-2xl bg-white p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-zinc-800">{t.subject}</div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      t.status === "open"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {t.status === "open" ? "باز" : "بسته"}
                  </span>
                </div>
                <div className="text-sm text-zinc-600 whitespace-pre-wrap">
                  {t.message}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {new Date(t.createdAt).toLocaleString("fa-IR")}
                </div>
                {t.status === "open" && (
                  <div className="pt-1">
                    <button
                      onClick={() => closeTicket(t.id)}
                      className="text-xs text-zinc-500 hover:text-zinc-700"
                    >
                      بستن تیکت
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
