from dotenv import load_dotenv, find_dotenv
import os

load_dotenv(find_dotenv())  # .env رو لود می‌کنه
print("HOLOO_ENABLED =", os.getenv("HOLOO_ENABLED"))
