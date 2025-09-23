"""
holoo_client.py
ماژول ساده برای اتصال به وب‌سرویس هلو (TncHolooWebService)

- با HOLOO_ENABLED=false فقط پیام «Skipped» می‌دهد (برای تست بدون سرور هلو)
- تابع holoo_login() توکن را می‌گیرد و کش می‌کند
- تابع holoo_request() هر endpoint را صدا می‌زند (GET / POST / PUT / DELETE)
"""

from dotenv import load_dotenv, find_dotenv
import os
import requests
from typing import Optional, Any, Dict

load_dotenv(find_dotenv())

HOLOO_ENABLED = os.getenv("HOLOO_ENABLED", "false").lower() == "true"
BASE  = os.getenv("HOLOO_ADDRESS")
DB    = os.getenv("HOLOO_DBNAME")
USR   = os.getenv("HOLOO_USERNAME")
PWD64 = os.getenv("HOLOO_PASSWORD_BASE64")

# متغیر برای نگهداری توکن بعد از اولین لاگین
_cached_token: Optional[str] = None


def holoo_login() -> Optional[str]:
    """
    Login به وب‌سرویس هلو و برگرداندن توکن Bearer.
    اگر HOLOO_ENABLED=false باشد، فقط پیام می‌دهد و None برمی‌گرداند.
    """
    global _cached_token

    if not HOLOO_ENABLED:
        print("[Holoo] Skipped (HOLOO_ENABLED=false). Would call:", f"{BASE}/Login")
        return None

    # اگر قبلاً لاگین کرده‌ایم، همان توکن را برگردان
    if _cached_token:
        return _cached_token

    url = f"{BASE}/Login"
    body = {
        "userinfo": {
            "username": USR,
            "userpass": PWD64,
            "dbname":   DB
        }
    }
    headers = {"Content-Type": "application/json"}

    r = requests.post(url, json=body, headers=headers, timeout=20)
    r.raise_for_status()
    data = r.json()

    ok = str(data.get("Login", {}).get("State", "")).lower() == "true"
    token = data.get("Login", {}).get("Token")

    if not ok or not token:
        err = data.get("Login", {}).get("Error") or "Login failed"
        raise RuntimeError(f"[Holoo] {err}")

    _cached_token = token
    return token


def holoo_request(method: str, path: str,
                  *, params: Dict[str, Any] = None,
                  data: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
    """
    متد عمومی برای صدا زدن هر endpoint هلو
    مثال:
        holoo_request("GET", "/Product")
    """
    if not HOLOO_ENABLED:
        print(f"[Holoo] Skipped ({method}) {path}")
        return None

    token = holoo_login()
    headers = {
        "Authorization": token,
        "Content-Type": "application/json"
    }
    url = f"{BASE}{path}"
    r = requests.request(method, url, headers=headers, params=params, json=data, timeout=20)
    r.raise_for_status()
    return r.json()


# ---- تست سریع وقتی مستقیم اجرا می‌شود ----
if __name__ == "__main__":
    print("HOLOO_ENABLED =", HOLOO_ENABLED)
    t = holoo_login()
    print("Token =", t)
    if HOLOO_ENABLED:
        # نمونه درخواست: لیست محصولات (وقتی سرور هلو در دسترس است)
        products = holoo_request("GET", "/Product")
        print("Products:", products)


def holoo_products(params=None):
    return holoo_request("GET", "/Product", params=params or {})

def holoo_customers(params=None):
    return holoo_request("GET", "/Customer", params=params or {})


def holoo_invoice_create(invoiceinfo: dict):
    """
    ثبت فاکتور فروش در هلو.
    ساختار بدنه طبق مستند: POST {Address}/Invoice/Invoice  
    انتظار ورودی: دیکشنری invoiceinfo (ما آن را داخل آرایه می‌گذاریم).
    """
    payload = {"invoiceinfo": [invoiceinfo]}
    return holoo_request("POST", "/Invoice/Invoice", data=payload)

def holoo_preinvoice_create(invoiceinfo: dict):
    payload = {"invoiceinfo": [invoiceinfo]}
    return holoo_request("POST", "/Invoice/PreInvoice", data=payload)

def holoo_order_create(invoiceinfo: dict):
    payload = {"invoiceinfo": [invoiceinfo]}
    return holoo_request("POST", "/Invoice/Order", data=payload)