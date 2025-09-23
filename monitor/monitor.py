# monitor/monitor.py
import os, time, requests

ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")

def load_env(path):
    data = {}
    if not os.path.exists(path):
        return data
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            data[k.strip()] = v.strip()
    return data

cfg = load_env(ENV_PATH)

TOKEN   = cfg.get("TELEGRAM_TOKEN", "")
CHAT_ID = cfg.get("TELEGRAM_CHAT_ID", "")
API_URL = cfg.get("API_URL", "http://localhost:8000/healthz")
FRONT_URL = cfg.get("FRONT_URL", "http://localhost:3000/")
MAX_LAT = int(cfg.get("MAX_LATENCY_MS", "800"))
INTERVAL = int(cfg.get("CHECK_INTERVAL_SEC", "30"))

def tg(msg: str):
    if not TOKEN or not CHAT_ID:
        print("Telegram config missing")
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{TOKEN}/sendMessage",
            json={"chat_id": CHAT_ID, "text": msg, "parse_mode": "HTML"},
            timeout=10
        )
    except Exception as e:
        print("Telegram send failed:", e)

def check_url(name, url):
    t0 = time.time()
    try:
        r = requests.get(url, timeout=10)
        ms = int((time.time() - t0) * 1000)
        if r.status_code >= 500:
            tg(f"❌ <b>{name}</b> 5xx: {r.status_code} — {url}")
        elif r.status_code >= 400:
            tg(f"⚠️ <b>{name}</b> 4xx: {r.status_code} — {url}")
        elif ms > MAX_LAT:
            tg(f"🐢 <b>{name}</b> کند ({ms}ms) — {url}")
        return True
    except Exception as e:
        tg(f"🔥 <b>{name}</b> DOWN — {url}\n<code>{e}</code>")
        return False

if __name__ == "__main__":
    tg("🟢 مانیتور شروع شد")
    while True:
        check_url("API", API_URL)
        check_url("FRONT", FRONT_URL)
        time.sleep(INTERVAL)
