# Django Backend Starter for Next.js Shop

## Quick start
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Create .env from example and edit as needed
cp .env.example .env

# Migrate and create superuser
python manage.py migrate
python manage.py createsuperuser

# Run
python manage.py runserver 0.0.0.0:8000
```

Admin panel: http://localhost:8000/admin  
API root: http://localhost:8000/api/

Auth:
- `POST /api/auth/register/` {username, email, password}
- `POST /api/auth/login/` {username, password} -> {access, refresh}
- Use `Authorization: Bearer <access>` for protected APIs.
- `GET /api/auth/me/`

Core endpoints:
- Categories: `/api/categories/`
- Products: `/api/products/`
- Bundles: `/api/bundles/`
- Cart: `/api/cart/` (+ `POST /api/cart/clear/`)
- Orders: `/api/orders/` (+ `POST /api/orders/checkout/`)
- Coupons: `/api/coupons/` (+ `POST /api/coupons/apply/`)
- Tickets: `/api/tickets/` (+ `POST /api/tickets/{id}/reply/`)

CORS is enabled. Set `CORS_ALLOWED_ORIGINS` in `.env` to your Next.js URL (e.g., http://localhost:3000).
