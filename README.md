# Expense Tracker - Clean Structure

Backend follows:
Request -> Route -> Controller -> Database

## Backend
- controllers/: business/application logic
- routes/: endpoint definitions
- middleware/: authentication
- utils/: database connection

## Frontend
Existing HTML/JS files are preserved. Premium and leaderboard logic remain separated where applicable.

## Run
1. Put your local backend/.env file in backend/
2. cd backend
3. npm install
4. node app.js

Do not commit .env or node_modules.
