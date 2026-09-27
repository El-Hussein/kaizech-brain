#!/usr/bin/env bash

echo "==========================================================="
echo "🚀 Starting Kaizech Brain Locally (with Production DB)"
echo "==========================================================="

echo "Shutting down any interfering Docker containers..."
docker compose down

echo ""
echo "1️⃣ Starting Backend API (Connected to Railway Production DB)..."
# We run it in the background
pnpm start:dev &
API_PID=$!

echo "2️⃣ Starting Tenant Dashboard (Connected to Local Backend API)..."
# We set VITE_API_URL so it hits your local API (which has the new Decision Tree code) instead of the production API.
export VITE_API_URL=http://localhost:3000
pnpm start:dashboard &
DASH_PID=$!

echo ""
echo "✅ Everything is running natively!"
echo "- API: http://localhost:3000"
echo "- Dashboard: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait for user to exit
wait $API_PID $DASH_PID
