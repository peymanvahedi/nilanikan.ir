// src/app/orders/[id]/page.tsx
// صفحهٔ نمایش جزئیات سفارش

// === تنظیم آدرس API (بک‌اند Django) ===
// اگر متغیر محیطی NEXT_PUBLIC_API_HOST را ست کرده‌اید مثل:
// NEXT_PUBLIC_API_HOST=http://192.168.103.17:8000
// از همان استفاده می‌کنیم، وگرنه مقدار پیش‌فرض را می‌گذاریم.
const API_HOST =
  (process.env.NEXT_PUBLIC_API_HOST || "http://192.168.103.17:8000").replace(/\/$/, "");

// همیشه /api را اضافه می‌کنیم تا آدرس کامل درست شود
const API_BASE = `${API_HOST}/api`;

type OrderItem = {
  id: number;
  product: { id: number; name?: string; title?: string; image?: string; price?: number };
  price: number;
  quantity: number;
};

type Order = {
  id: number;
  status?: "pending" | "paid" | "canceled" | string;
  address: string;
  shipping_method?: "post" | "mahex" | string;
  shipping_cost?: number;
  items_subtotal: number;
  total_amount: number;
  tracking_code?: string;
  created_at: string;
  items: OrderItem[];
};

const nf = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });
const toFa = (n: number | string) => Number(n || 0).toLocaleString("fa-IR");

function StatusBadge({ s }: { s?: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    paid: { label: "پرداخت‌شده", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "#059669" },
    pending: { label: "در انتظار", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "#d97706" },
    canceled: { label: "لغو‌شده", cls: "bg-rose-50 text-rose-700 border-rose-200", dot: "#e11d48" },
  };
  const m = s ? map[s] : undefined;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-full ${m?.cls || "bg-zinc-50 text-zinc-700 border-zinc-200"}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m?.dot || "#71717a" }} />
      {m?.label || "—"}
    </span>
  );
}

async function fetchOrder(id: string): Promise<{ ok: true; data: Order } | { ok: false; status: number; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, status: res.status, message: text || res.statusText };
    }
    const json = (await res.json()) as Order;
    return { ok: true, data: json };
  } catch (e: any) {
    return { ok: false, status: 0, message: e?.message || "network error" };
  }
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const result = await fetchOrder(params.id);

  // اگر خطا داشتیم، پیام کاربرپسند نمایش بده
  if (!result.ok) {
    return (
      <main className="max-w-3xl mx-auto p-8" dir="rtl">
        <h1 className="text-xl md:text-2xl font-bold mb-4">جزئیات سفارش</h1>

        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700">
          <p className="font-semibold mb-1">نمایش سفارش ممکن نیست</p>
          <p className="text-sm">
            {result.status === 401 || result.status === 403
              ? "برای مشاهدهٔ جزئیات سفارش وارد حساب کاربری شوید."
              : result.status === 404
              ? "سفارشی با این شماره پیدا نشد."
              : "خطا در دریافت اطلاعات از سرور."}
          </p>
          {process.env.NODE_ENV !== "production" && (
            <p className="text-xs mt-2 opacity-80">({result.status}) {result.message}</p>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <a
            href="/login"
            className="h-10 px-4 grid place-items-center rounded-xl border border-zinc-300 hover:bg-zinc-50 transition text-sm"
          >
            ورود
          </a>
          <a
            href="/"
            className="h-10 px-4 grid place-items-center rounded-xl bg-zinc-900 text-white hover:bg-black transition text-sm"
          >
            بازگشت به فروشگاه
          </a>
        </div>
      </main>
    );
  }

  const order = result.data;

  return (
    <main className="max-w-5xl mx-auto p-6 md:p-8" dir="rtl">
      {/* هدر */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">سفارش شماره {order.id.toString()}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            ثبت شده در {new Date(order.created_at).toLocaleString("fa-IR")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge s={order.status} />
          {order.tracking_code ? (
            <span className="px-3 py-1 text-xs rounded-lg bg-zinc-50 border border-zinc-200">
              کد پیگیری: <b className="font-semibold">{order.tracking_code}</b>
            </span>
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* اقلام سفارش */}
        <section className="lg:col-span-2 p-4 rounded-2xl border border-zinc-200 bg-white">
          <h2 className="font-semibold mb-4">اقلام سفارش</h2>
          <ul className="divide-y">
            {order.items?.length ? (
              order.items.map((it) => (
                <li key={it.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {it.product?.title || it.product?.name || `محصول #${it.product?.id ?? "?"}`}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      قیمت واحد: {nf.format(it.price)} تومان • تعداد: {toFa(it.quantity)}
                    </p>
                  </div>
                  <div className="text-pink-600 font-semibold whitespace-nowrap">
                    {nf.format((it.price || 0) * (it.quantity || 1))} تومان
                  </div>
                </li>
              ))
            ) : (
              <li className="py-6 text-zinc-500 text-sm">هیچ آیتمی در این سفارش ثبت نشده.</li>
            )}
          </ul>
        </section>

        {/* خلاصه و ارسال */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="p-4 rounded-2xl border border-zinc-200 bg-white">
            <h3 className="font-semibold mb-3">اطلاعات ارسال</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">روش ارسال</span>
                <span className="font-medium">{order.shipping_method === "mahex" ? "ماهکس" : "پست"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">هزینه ارسال</span>
                <span className="font-medium">{nf.format(order.shipping_cost || 0)} تومان</span>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">آدرس</div>
                <div className="font-medium whitespace-pre-wrap break-words">{order.address || "—"}</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-200 bg-white">
            <h3 className="font-semibold mb-3">خلاصه پرداخت</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">جمع اقلام</span>
                <span className="font-medium">{nf.format(order.items_subtotal || 0)} تومان</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">ارسال</span>
                <span className="font-medium">{nf.format(order.shipping_cost || 0)} تومان</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-base font-bold">
                <span>مبلغ نهایی</span>
                <span>{nf.format(order.total_amount || 0)} تومان</span>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <a
                href="/"
                className="flex-1 h-10 grid place-items-center rounded-xl border border-zinc-300 hover:bg-zinc-50 transition text-sm"
              >
                بازگشت به فروشگاه
              </a>
              {order.status !== "paid" && (
                <span className="flex-1 h-10 grid place-items-center rounded-xl bg-amber-500 text-white text-sm">
                  پرداخت درب منزل
                </span>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
