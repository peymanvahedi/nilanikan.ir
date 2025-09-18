"use client";

export default function ContactForm() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const name = f.get("name");
        const phone = f.get("phone");
        const msg = f.get("message");
        const body =
          `نام: ${name}\n` +
          `تلفن: ${phone}\n\n` +
          `پیام:\n${msg}`;
        window.location.href = `mailto:info@nilanikan.com?subject=${encodeURIComponent(
          "پیام از فرم تماس"
        )}&body=${encodeURIComponent(body)}`;
      }}
      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-3"
    >
      <div>
        <label className="block text-sm mb-1">نام و نام خانوادگی</label>
        <input
          name="name"
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="مثلاً نیلانیکان"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">تلفن تماس</label>
        <input
          name="phone"
          inputMode="tel"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="0912xxxxxxx"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">پیام شما</label>
        <textarea
          name="message"
          rows={5}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="متن پیام..."
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center rounded-md bg-pink-600 px-4 text-white text-sm font-bold hover:bg-pink-700"
      >
        ارسال
      </button>
    </form>
  );
}
