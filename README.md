# Secure User Dashboard

An Express and EJS web application demonstrating:

- User registration and login with bcrypt password hashing
- JWT-based authentication for the dashboard and profile endpoint
- MongoDB persistence through Mongoose
- API rate limiting for `/api/*` routes
- External weather API integration using OpenWeather
- A browser dashboard for profile, users, and weather information

## Requirements

- Node.js 18 or newer (the server uses the built-in `fetch` API)
- MongoDB running locally, or a MongoDB connection string
- An OpenWeather API key for the weather feature

## Setup

From this directory:

```powershell
npm install
Copy-Item .env.example .env
```

Open `.env` and replace the example values. Keep `.env` private; it is ignored by Git. Start MongoDB before starting the application.

## Run

```powershell
npm start
```

Open <http://localhost:3000>. Register a user, log in, and use the dashboard to load profile, users, and weather data.

The API is organized around these routes:

- `POST /api/users` - register a user
- `POST /api/login` - log in and receive a JWT
- `GET /api/profile` - get the authenticated user's profile
- `GET /api/users` - list registered users
- `GET /api/weather?city=London` - retrieve weather from OpenWeather

## Publish to GitHub

Check that secrets and dependencies are not staged:

```powershell
git status
git check-ignore .env node_modules
```

If this folder is not already a Git repository:

```powershell
git init
git add .
git status
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repository>.git
git push -u origin main
```

Do not commit `.env`, `node_modules`, API keys, database credentials, or generated logs. Commit `package.json`, `package-lock.json`, source files, views, `.gitignore`, `.env.example`, and this README.

If a real secret was ever committed previously, rotate it before making the repository public; adding it to `.gitignore` does not remove it from Git history.
