FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
    gunicorn==21.2.0 psycopg2-binary==2.9.9 \
    -i https://pypi.tuna.tsinghua.edu.cn/simple --default-timeout=120

COPY . /app

ENV STATIC_ROOT=/app/staticfiles \
    MEDIA_ROOT=/app/media
RUN mkdir -p "$STATIC_ROOT" "$MEDIA_ROOT"

EXPOSE 8000
CMD ["sh","-lc","python manage.py migrate && gunicorn shop_backend.wsgi:application --bind 0.0.0.0:8000 --workers=4"]
