// src/app/account/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* =========================
   Types
========================= */
type OrderStatus =
  | "پرداخت شد"
  | "در حال پردازش"
  | "در حال ارسال"
  | "تحویل داده شد"
  | "لغو شده";

type OrderItem = {
  kind: "product" | "bundle";
  id: number;
  name?: string;
  title?: string;
  price: number;
  qty: number;
};

type Order = {
  id: string;
  user: { fullName: string; phone: string };
  address?: string;
  postalCode?: string;
  shippingMethod: "post" | "mahex";
  items: OrderItem[];
  itemsSubtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

type Address = {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  street: string;
  plaque?: string;
  unit?: string;
  postalCode: string;
  isDefault?: boolean;
};

type NotificationPref = {
  orderUpdates: boolean;
  promos: boolean;
  newsletter: boolean;
};

type User = { fullName?: string; phone?: string; email?: string };

/* =========================
   Helpers
========================= */
const nf = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });

const USER_LABEL: Record<OrderStatus, string> = {
  "پرداخت شد": "ثبت شد",
  "در حال پردازش": "آماده‌سازی",
  "در حال ارسال": "ارسال شد",
  "تحویل داده شد": "تحویل شد",
  "لغو شده": "لغو شد",
};

const FLOW: OrderStatus[] = [
  "پرداخت شد",
  "در حال پردازش",
  "در حال ارسال",
  "تحویل داده شد",
];

function isOrderStatus(s: any): s is OrderStatus {
  return (
    s === "پرداخت شد" ||
    s === "در حال پردازش" ||
    s === "در حال ارسال" ||
    s === "تحویل داده شد" ||
    s === "لغو شده"
  );
}

function Progress({ status }: { status: OrderStatus }) {
  const currentIndex =
    status === "لغو شده" ? -1 : Math.max(0, FLOW.indexOf(status));
  return (
    <ol className="grid grid-cols-4 gap-2 mt-3 text-xs">
      {FLOW.map((s, i) => {
        const done = currentIndex >= i;
        return (
          <li
            key={s}
            className={`h-2 rounded-full ${done ? "bg-pink-600" : "bg-zinc-200"}`}
            title={USER_LABEL[s]}
          />
        );
      })}
    </ol>
  );
}

/* =========================
   Main
========================= */
export default function AccountPage() {
  const router = useRouter();

  /* ---- tabs ---- */
  type Tab = "orders" | "profile" | "addresses" | "notifications" | "support";
  const [tab, setTab] = useState<Tab>("orders");

  /* ---- orders ---- */
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");

  /* ---- profile ---- */
  const [user, setUser] = useState<User>({});

  /* ---- addresses ---- */
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrDraft, setAddrDraft] = useState<Address | null>(null);
  const [addrModalOpen, setAddrModalOpen] = useState(false);

  /* ---- notification prefs ---- */
  const [prefs, setPrefs] = useState<NotificationPref>({
    orderUpdates: true,
    promos: false,
    newsletter: true,
  });

  /* ---- boot ---- */
  useEffect(() => {
    // user
    try {
      const rawU = localStorage.getItem("user");
      if (rawU) setUser(JSON.parse(rawU));
    } catch {}

    // orders
    try {
      const raw = localStorage.getItem("orders");
      if (raw) {
        const parsed = JSON.parse(raw) as any[];
        const normalized: Order[] = (parsed || []).map((o: any) => ({
          ...o,
          status: isOrderStatus(o?.status) ? o.status : "پرداخت شد",
        }));
        setOrders(normalized);
      }
    } catch {}

    // addresses
    try {
      const rawA = localStorage.getItem("addresses");
      if (rawA) setAddresses(JSON.parse(rawA));
    } catch {}

    // prefs
    try {
      const rawP = localStorage.getItem("notif_prefs");
      if (rawP) setPrefs(JSON.parse(rawP));
    } catch {}
  }, []);

  /* ---- persist helpers ---- */
  const saveOrders = (next: Order[]) => {
    setOrders(next);
    localStorage.setItem("orders", JSON.stringify(next));
  };
  const saveAddresses = (next: Address[]) => {
    setAddresses(next);
    localStorage.setItem("addresses", JSON.stringify(next));
  };
  const saveUser = (next: User) => {
    setUser(next);
    localStorage.setItem("user", JSON.stringify(next));
    // برای هدر
    localStorage.setItem("auth:ts", String(Date.now()));
    window.dispatchEvent(new Event("auth-change"));
  };
  const savePrefs = (next: NotificationPref) => {
    setPrefs(next);
    localStorage.setItem("notif_prefs", JSON.stringify(next));
  };

  /* ---- orders actions ---- */
  const toggleDetails = (id: string) =>
    setExpanded((s) => ({ ...s, [id]: !s[id] }));

  // ⚠️ قابلیت لغو سفارش برای کاربر حذف شد: هیچ canCancel/cancelOrder ی وجود ندارد.

  const filteredOrders = useMemo(() => {
    let list = [...orders];
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.trim();
      list = list.filter(
        (o) =>
          o.id.includes(q) ||
          o.items.some(
            (it) =>
              (it.name || it.title || "")
                .toLocaleLowerCase()
                .includes(q.toLocaleLowerCase())
          )
      );
    }
    // newest first
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, statusFilter, search]);

  const reorder = (order: Order) => {
    try {
      const cartKey = "cart_v2";
      const lines = order.items.map((it) =>
        it.kind === "product"
          ? { kind: "product", id: it.id, name: it.name || "", price: it.price, qty: it.qty }
          : { kind: "bundle", id: it.id, title: it.title || "", price: it.price, qty: it.qty, items: [] as any[] }
      );

      localStorage.setItem(cartKey, JSON.stringify(lines));

      // هیدراته کردن CartProvider و آپدیت بج سبد
      window.dispatchEvent(new Event("cart:hydrate"));
      const count = lines.reduce((s: number, l: any) => s + (l.qty ?? 1), 0);
      window.dispatchEvent(new CustomEvent("cart:set", { detail: { count } }) as any);

      router.push("/cart");
    } catch {
      router.push("/cart");
    }
  };

  const printInvoice = (o: Order) => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    const rows = o.items
      .map(
        (it) => `
        <tr>
          <td style="padding:6px 8px;border:1px solid #ddd">${it.kind === "bundle" ? "باندل: " + (it.title || "") : (it.name || "")}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${it.qty}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:left">${nf.format(it.price)} تومان</td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:left">${nf.format(it.price * it.qty)} تومان</td>
        </tr>`
      )
      .join("");
    w.document.write(`
      <html lang="fa" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <title>صورتحساب ${o.id}</title>
        <style>
          body{font-family:sans-serif}
          .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        </style>
      </head>
      <body>
        <h2>صورتحساب سفارش #${o.id}</h2>
        <div class="grid">
          <div>نام: ${o.user?.fullName || "-"}</div>
          <div>تاریخ: ${new Date(o.createdAt).toLocaleString("fa-IR")}</div>
          <div>موبایل: ${o.user?.phone || "-"}</div>
          <div>وضعیت: ${USER_LABEL[o.status]}</div>
        </div>
        <p>آدرس: ${o.address || "-"}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:8px">
          <thead>
            <tr>
              <th style="padding:6px 8px;border:1px solid #ddd">کالا</th>
              <th style="padding:6px 8px;border:1px solid #ddd">تعداد</th>
              <th style="padding:6px 8px;border:1px solid #ddd">قیمت واحد</th>
              <th style="padding:6px 8px;border:1px solid #ddd">جمع</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:10px">هزینه ارسال: ${nf.format(o.shippingCost)} تومان</p>
        <h3>مبلغ نهایی: ${nf.format(o.total)} تومان</h3>
        <script>window.print();setTimeout(()=>window.close(),300);</script>
      </body>
      </html>
    `);
    w.document.close();
  };

  /* ---- addresses CRUD ---- */
  const openAddrModal = (a?: Address) => {
    setAddrDraft(
      a ?? {
        id: `addr-${Date.now()}`,
        fullName: user.fullName || "",
        phone: user.phone || "",
        province: "",
        city: "",
        street: "",
        plaque: "",
        unit: "",
        postalCode: "",
        isDefault: addresses.length === 0,
      }
    );
    setAddrModalOpen(true);
  };

  const saveAddrDraft = () => {
    if (!addrDraft) return; // ✅ type guard
    const exists = addresses.some((x) => x.id === addrDraft.id);
    let next = exists
      ? addresses.map((x) => (x.id === addrDraft.id ? addrDraft : x))
      : [...addresses, addrDraft];

    if (addrDraft.isDefault) {
      next = next.map((x) => ({ ...x, isDefault: x.id === addrDraft.id }));
    }
    saveAddresses(next);
    setAddrModalOpen(false);
  };

  const removeAddress = (id: string) => {
    const next = addresses.filter((x) => x.id !== id);
    if (next.length > 0 && !next.some((x) => x.isDefault)) {
      next[0] = { ...next[0]!, isDefault: true };
    }
    saveAddresses(next);
  };

  /* ---- notifications ---- */
  const togglePref = (k: keyof NotificationPref) =>
    setPrefs((p) => ({ ...p, [k]: !p[k] }));

  /* ---- logout ---- */
  const logout = () => {
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_phone");
      localStorage.removeItem("user");
      localStorage.setItem("auth:ts", String(Date.now()));
      window.dispatchEvent(new Event("auth-change"));
    } catch {}
    router.replace("/");
  };

  /* ---- UI shared ---- */
  const hasOrders = useMemo(() => orders.length > 0, [orders]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8" dir="rtl">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-xl md:text-2xl font-bold">پیشخوان حساب</h1>
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm border px-3 py-1.5 rounded-lg hover:bg-zinc-50">
            ادامه خرید
          </Link>
          <button
            onClick={logout}
            className="text-sm border px-3 py-1.5 rounded-lg hover:bg-zinc-50 text-red-600 border-red-300"
          >
            خروج
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 text-sm">
        <button
          onClick={() => setTab("orders")}
          className={`px-3 py-1.5 rounded-lg border ${tab === "orders" ? "bg-pink-600 text-white border-pink-600" : "hover:bg-zinc-50"}`}
        >
          سفارش‌ها
        </button>
        <button
          onClick={() => setTab("profile")}
          className={`px-3 py-1.5 rounded-lg border ${tab === "profile" ? "bg-pink-600 text-white border-pink-600" : "hover:bg-zinc-50"}`}
        >
          پروفایل
        </button>
        <button
          onClick={() => setTab("addresses")}
          className={`px-3 py-1.5 rounded-lg border ${tab === "addresses" ? "bg-pink-600 text-white border-pink-600" : "hover:bg-zinc-50"}`}
        >
          آدرس‌ها
        </button>
        <button
          onClick={() => setTab("notifications")}
          className={`px-3 py-1.5 rounded-lg border ${tab === "notifications" ? "bg-pink-600 text-white border-pink-600" : "hover:bg-zinc-50"}`}
        >
          اعلان‌ها
        </button>
        <button
          onClick={() => setTab("support")}
          className={`px-3 py-1.5 rounded-lg border ${tab === "support" ? "bg-pink-600 text-white border-pink-600" : "hover:bg-zinc-50"}`}
        >
          پشتیبانی
        </button>
      </div>

      {/* Orders Tab */}
      {tab === "orders" && (
        <section className="space-y-4">
          <div className="p-3 rounded-xl border bg-white flex flex-wrap items-center gap-2">
            <select
              className="h-10 rounded-lg border px-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="پرداخت شد">{USER_LABEL["پرداخت شد"]}</option>
              <option value="در حال پردازش">{USER_LABEL["در حال پردازش"]}</option>
              <option value="در حال ارسال">{USER_LABEL["در حال ارسال"]}</option>
              <option value="تحویل داده شد">{USER_LABEL["تحویل داده شد"]}</option>
              <option value="لغو شده">{USER_LABEL["لغو شده"]}</option>
            </select>

            <input
              placeholder="جست‌وجو در شماره سفارش یا نام کالا..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-lg border px-3 grow min-w-[220px]"
            />
          </div>

          {!hasOrders && (
            <div className="p-4 rounded-xl border bg-white">سفارشی ندارید.</div>
          )}

          <ul className="space-y-4">
            {filteredOrders.map((o) => (
              <li key={o.id} className="p-4 rounded-xl border bg-white">
                <div className="flex flex-wrap items-center justify_between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">سفارش #{o.id}</span>
                    <span className="px-2 py-0.5 rounded-md text-xs bg-zinc-100 text-zinc-700">
                      {USER_LABEL[o.status]}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    {new Date(o.createdAt).toLocaleString("fa-IR")}
                  </div>
                </div>

                <Progress status={o.status} />

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <div>روش ارسال: {o.shippingMethod === "post" ? "پست" : "ماهکس"}</div>
                    <div>هزینه ارسال: {nf.format(o.shippingCost)} تومان</div>
                  </div>
                  <div>
                    <div>جمع اقلام: {nf.format(o.itemsSubtotal)} تومان</div>
                    <div className="font-semibold">مبلغ نهایی: {nf.format(o.total)} تومان</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleDetails(o.id)}
                      className="px-3 py-1.5 rounded-lg border hover:bg-zinc-50 text-sm"
                    >
                      {expanded[o.id] ? "بستن جزئیات" : "جزئیات سفارش"}
                    </button>

                    {/* لغو سفارش حذف شد */}

                    <button
                      onClick={() => reorder(o)}
                      className="px-3 py-1.5 rounded-lg border border-pink-600 text-pink-600 hover:bg-pink-50 text-sm"
                    >
                      سفارش مجدد
                    </button>
                    <button
                      onClick={() => printInvoice(o)}
                      className="px-3 py-1.5 rounded-lg border hover:bg-zinc-50 text-sm"
                    >
                      دریافت فاکتور
                    </button>
                  </div>
                </div>

                {expanded[o.id] && (
                  <div className="mt-4 border-t pt-3">
                    <ul className="space-y-1 text-sm">
                      {o.items.map((it, idx) => (
                        <li key={`${it.kind}-${it.id}-${idx}`} className="flex justify-between">
                          <span className="truncate max-w-[60%]">
                            {it.kind === "bundle" ? `باندل: ${it.title}` : it.name}
                            {it.qty > 1 ? ` × ${it.qty}` : ""}
                          </span>
                          <span>{nf.format(it.price * it.qty)} تومان</span>
                        </li>
                      ))}
                    </ul>
                    {o.address && (
                      <div className="mt-2 text-xs text-zinc-600">
                        آدرس: {o.address}
                        {o.postalCode ? ` — کدپستی: ${o.postalCode}` : ""}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Profile Tab */}
      {tab === "profile" && (
        <section className="p-4 rounded-xl border bg-white max-w-3xl">
          <h2 className="font-semibold mb-4">اطلاعات کاربر</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm">نام و نام خانوادگی</span>
              <input
                className="mt-1 w-full h-11 rounded-lg border px-3"
                value={user.fullName || ""}
                onChange={(e) => setUser((u) => ({ ...u, fullName: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-sm">ایمیل</span>
              <input
                className="mt-1 w-full h-11 rounded-lg border px-3"
                placeholder="example@mail.com"
                value={user.email || ""}
                onChange={(e) => setUser((u) => ({ ...u, email: e.target.value }))}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm">شماره موبایل</span>
              <input
                className="mt-1 w-full h-11 rounded-lg border px-3 bg-zinc-50"
                value={user.phone || ""}
                readOnly
              />
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => saveUser(user)}
              className="px-4 h-10 rounded-lg bg-pink-600 text-white hover:bg-pink-700"
            >
              ذخیره تغییرات
            </button>
            <button
              onClick={() => {
                alert("برای تغییر رمز، به‌زودی اتصال به بک‌اند افزوده می‌شود.");
              }}
              className="px-4 h-10 rounded-lg border hover:bg-zinc-50"
            >
              تغییر رمز عبور
            </button>
          </div>
        </section>
      )}

      {/* Addresses Tab */}
      {tab === "addresses" && (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">دفترچه آدرس‌ها</h2>
            <button
              className="px-3 h-10 rounded-lg border hover:bg-zinc-50 text-sm"
              onClick={() => openAddrModal()}
            >
              افزودن آدرس
            </button>
          </div>

          {!addresses.length && (
            <div className="p-4 rounded-xl border bg-white text-sm">
              آدرسی ثبت نشده است.
            </div>
          )}

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((a) => (
              <li key={a.id} className="p-4 rounded-xl border bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{a.fullName}</div>
                  {a.isDefault && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                      پیش‌فرض
                    </span>
                  )}
                </div>
                <div className="text-sm text-zinc-600">
                  {a.province}، {a.city}، {a.street}
                  {a.plaque ? `، پلاک ${a.plaque}` : ""}
                  {a.unit ? `، واحد ${a.unit}` : ""}
                  {a.postalCode ? ` — کدپستی ${a.postalCode}` : ""}
                </div>
                <div className="text-sm">موبایل: {a.phone}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openAddrModal(a)}
                    className="px-3 h-9 rounded-lg border hover:bg-zinc-50 text-sm"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => removeAddress(a.id)}
                    className="px-3 h-9 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 text-sm"
                  >
                    حذف
                  </button>
                  {!a.isDefault && (
                    <button
                      onClick={() => {
                        saveAddresses(
                          addresses.map((x) => ({ ...x, isDefault: x.id === a.id }))
                        );
                      }}
                      className="px-3 h-9 rounded-lg border border-pink-600 text-pink-600 hover:bg-pink-50 text-sm"
                    >
                      انتخاب به‌عنوان پیش‌فرض
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* modal */}
          {addrModalOpen && addrDraft && (
            <div className="fixed inset-0 bg-black/30 grid place-items-center p-4 z-50">
              <div className="w-full max-w-xl rounded-2xl bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">آدرس</h3>
                  <button
                    className="h-9 px-3 rounded-lg border hover:bg-zinc-50"
                    onClick={() => setAddrModalOpen(false)}
                  >
                    بستن
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm">نام و نام خانوادگی</span>
                    <input
                      className="mt-1 w-full h-10 rounded-lg border px-3"
                      value={addrDraft?.fullName ?? ""}
                      onChange={(e) =>
                        setAddrDraft((d) => (d ? { ...d, fullName: e.target.value } : d))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm">شماره موبایل</span>
                    <input
                      className="mt-1 w-full h-10 rounded-lg border px-3"
                      value={addrDraft?.phone ?? ""}
                      onChange={(e) =>
                        setAddrDraft((d) => (d ? { ...d, phone: e.target.value } : d))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm">استان</span>
                    <input
                      className="mt-1 w-full h-10 rounded-lg border px-3"
                      value={addrDraft?.province ?? ""}
                      onChange={(e) =>
                        setAddrDraft((d) => (d ? { ...d, province: e.target.value } : d))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm">شهر</span>
                    <input
                      className="mt-1 w-full h-10 rounded-lg border px-3"
                      value={addrDraft?.city ?? ""}
                      onChange={(e) =>
                        setAddrDraft((d) => (d ? { ...d, city: e.target.value } : d))
                      }
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-sm">آدرس</span>
                    <input
                      className="mt-1 w-full h-10 rounded-lg border px-3"
                      value={addrDraft?.street ?? ""}
                      onChange={(e) =>
                        setAddrDraft((d) => (d ? { ...d, street: e.target.value } : d))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm">پلاک</span>
                    <input
                      className="mt-1 w-full h-10 rounded-lg border px-3"
                      value={addrDraft?.plaque ?? ""}
                      onChange={(e) =>
                        setAddrDraft((d) => (d ? { ...d, plaque: e.target.value } : d))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm">واحد</span>
                    <input
                      className="mt-1 w-full h-10 rounded-lg border px-3"
                      value={addrDraft?.unit ?? ""}
                      onChange={(e) =>
                        setAddrDraft((d) => (d ? { ...d, unit: e.target.value } : d))
                      }
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-sm">کد پستی</span>
                    <input
                      className="mt-1 w-full h-10 rounded-lg border px-3"
                      value={addrDraft?.postalCode ?? ""}
                      onChange={(e) =>
                        setAddrDraft((d) =>
                          (d ? { ...d, postalCode: e.target.value } : d)
                        )
                      }
                    />
                  </label>
                  <label className="flex items-center gap-2 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={!!addrDraft?.isDefault}
                      onChange={(e) =>
                        setAddrDraft((d) =>
                          d ? { ...d, isDefault: e.target.checked } : d
                        )
                      }
                    />
                    <span className="text-sm">علامت‌گذاری به‌عنوان آدرس پیش‌فرض</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setAddrModalOpen(false)}
                    className="px-4 h-10 rounded-lg border hover:bg-zinc-50"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={saveAddrDraft}
                    className="px-4 h-10 rounded-lg bg-pink-600 text-white hover:bg-pink-700"
                  >
                    ذخیره
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Notifications Tab */}
      {tab === "notifications" && (
        <section className="p-4 rounded-xl border bg-white max-w-3xl">
          <h2 className="font-semibold mb-4">تنظیمات اعلان‌ها</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.orderUpdates}
                onChange={() => togglePref("orderUpdates")}
              />
              <span>اطلاع‌رسانی وضعیت سفارش‌ها</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.promos}
                onChange={() => togglePref("promos")}
              />
              <span>تخفیف‌ها و پیشنهادهای ویژه</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={prefs.newsletter}
                onChange={() => togglePref("newsletter")}
              />
              <span>خبرنامه ایمیلی</span>
            </label>
          </div>

          <div className="mt-4">
            <button
              onClick={() => savePrefs(prefs)}
              className="px-4 h-10 rounded-lg bg-pink-600 text-white hover:bg-pink-700"
            >
              ذخیره تنظیمات
            </button>
          </div>
        </section>
      )}

      {/* Support Tab (demo) */}
      {tab === "support" && (
        <section className="p-4 rounded-xl border bg-white max-w-3xl">
          <h2 className="font-semibold mb-4">درخواست پشتیبانی</h2>
          <p className="text-sm text-zinc-600 mb-3">
            هر سوال یا مشکلی دارید برای ما ارسال کنید. در اولین فرصت پاسخ می‌دهیم.
          </p>
          <SupportForm />
        </section>
      )}
    </main>
  );
}

/* =========================
   Support Form (Demo)
========================= */
function SupportForm() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !body.trim()) return alert("موضوع و توضیحات را کامل کنید.");
    try {
      setBusy(true);
      await new Promise((r) => setTimeout(r, 600));
      const prev = JSON.parse(localStorage.getItem("tickets") || "[]");
      const ticket = {
        id: `TK-${Date.now()}`,
        subject,
        body,
        createdAt: new Date().toISOString(),
        status: "ثبت شد",
      };
      localStorage.setItem("tickets", JSON.stringify([ticket, ...prev]));
      setSubject("");
      setBody("");
      alert("درخواست شما ثبت شد.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        className="w-full h-11 rounded-lg border px-3"
        placeholder="موضوع"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <textarea
        className="w-full min-h-[120px] rounded-lg border px-3 py-2"
        placeholder="توضیحات مشکل/سوال..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button
        disabled={busy}
        onClick={submit}
        className="px-4 h-10 rounded-lg bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60"
      >
        ارسال
      </button>
    </div>
  );
}
