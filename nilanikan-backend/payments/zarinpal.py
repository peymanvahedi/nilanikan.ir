# nilanikan-backend/payments/zarinpal.py
import os
import requests
from decimal import Decimal

# ========= تنظیمات =========
MERCHANT_ID = os.getenv("ZARINPAL_MERCHANT_ID", "7be9a33e-e18b-4731-9320-99c4a1053e92")
MODE = os.getenv("ZARINPAL_MODE", "sandbox").lower()  # "production" | "sandbox"
TIMEOUT = 12

API_BASE = (
    "https://api.zarinpal.com/pg/v4/payment"
    if MODE == "production" else
    "https://sandbox.zarinpal.com/pg/v4/payment"
)
STARTPAY_BASE = (
    "https://www.zarinpal.com/pg/StartPay/"
    if MODE == "production" else
    "https://sandbox.zarinpal.com/pg/StartPay/"
)

# جهت ساده‌سازی، مقدار پرداخت را با authority نگه می‌داریم تا در verify الزامیِ زرین‌پال استفاده شود
_pending_amounts = {}

def _to_int_amount(amount):
    """
    زرین‌پال مبلغ را به صورت عدد صحیح (تومان/IRT) می‌خواهد.
    این تابع هر Decimal/float/str را به int تبدیل می‌کند.
    """
    if amount is None:
        raise ValueError("amount is required")
    if isinstance(amount, Decimal):
        return int(amount.quantize(Decimal("1")))
    return int(Decimal(str(amount)).quantize(Decimal("1")))

def request_payment(amount, description, callback_url, email=None, mobile=None):
    """
    amount: عدد صحیح تومان (IRT) – مثال: 50000
    description: توضیح پرداخت
    callback_url: آدرس بازگشت
    """
    amt = _to_int_amount(amount)

    payload = {
        "merchant_id": MERCHANT_ID,
        "amount": amt,
        "description": description or "Payment",
        "callback_url": callback_url,
        "metadata": {}
    }
    if email:
        payload["metadata"]["email"] = email
    if mobile:
        payload["metadata"]["mobile"] = mobile

    try:
        r = requests.post(f"{API_BASE}/request.json", json=payload, timeout=TIMEOUT)
        data = r.json()
    except Exception as e:
        return {"ok": False, "error": "NETWORK_ERROR", "detail": str(e)}

    # پاسخ v4: {'data': {...}, 'errors': {...}}
    if data.get("data", {}).get("code") == 100:
        authority = data["data"]["authority"]
        _pending_amounts[authority] = amt  # برای verify نیاز است
        return {
            "ok": True,
            "authority": authority,
            "url": STARTPAY_BASE + authority,
            "code": 100,
            "message": "Payment request created"
        }

    # خطا
    return {
        "ok": False,
        "error": "REQUEST_FAILED",
        "code": data.get("errors", {}).get("code"),
        "message": data.get("errors", {}).get("message"),
        "raw": data
    }

def verify_payment(authority):
    """
    توجه: در v4، verify نیاز به amount دارد.
    این تابع مقدار را از کش موقت ما برمی‌دارد (که در request_payment ذخیره شده).
    اگر در جریان واقعی مقدار را از DB نگه می‌دارید، بهتر است verify_payment_with_amount را صدا بزنید.
    """
    amt = _pending_amounts.get(authority)
    if not amt:
        return {"ok": False, "error": "AMOUNT_NOT_FOUND", "message": "Amount for this authority not found. Store amount per order and use verify_payment_with_amount(authority, amount)."}

    return verify_payment_with_amount(authority, amt)

def verify_payment_with_amount(authority, amount):
    """
    اگر مقدار را از سفارش/DB دارید، از این استفاده کنید.
    """
    amt = _to_int_amount(amount)

    payload = {
        "merchant_id": MERCHANT_ID,
        "amount": amt,
        "authority": authority,
    }

    try:
        r = requests.post(f"{API_BASE}/verify.json", json=payload, timeout=TIMEOUT)
        data = r.json()
    except Exception as e:
        return {"ok": False, "error": "NETWORK_ERROR", "detail": str(e)}

    # موفق: code == 100 (پرداخت موفق) یا 101 (تراکنش قبلاً تأیید شده)
    d = data.get("data", {})
    code = d.get("code")
    if code in (100, 101):
        ref_id = d.get("ref_id")
        card_pan = d.get("card_pan")
        fee_type = d.get("fee_type")
        fee = d.get("fee")
        # پاک کردن کش موقت
        _pending_amounts.pop(authority, None)
        return {
            "ok": True,
            "code": code,
            "ref_id": ref_id,
            "card_pan": card_pan,
            "fee_type": fee_type,
            "fee": fee,
            "message": "Verified" if code == 100 else "Already Verified"
        }

    # خطا
    return {
        "ok": False,
        "error": "VERIFY_FAILED",
        "code": data.get("errors", {}).get("code"),
        "message": data.get("errors", {}).get("message"),
        "raw": data
    }
