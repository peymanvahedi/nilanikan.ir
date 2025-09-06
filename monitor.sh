#!/bin/bash

while true
do
  echo "=============================="
  date

  echo "Frontend (Next.js):"
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000

  echo "Backend (Django):"
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/health/

  echo "Database (Postgres):"
  docker compose exec -T db pg_isready -U shopuser -d shop

  sleep 10
done
