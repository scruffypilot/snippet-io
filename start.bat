@echo off

echo Starting backend...
cd backend
call venv\Scripts\activate
start cmd /k python -m uvicorn main:app --reload

echo Starting frontend...
cd ../frontend
start cmd /k npm run dev