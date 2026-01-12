# Glorious Study Point - Online Examination Platform

A comprehensive, secure, and scalable online examination system built with Node.js, Express, and MongoDB.

## 🚀 Features
- **User Roles**: Admin, Student.
- **Secure Exams**: Anti-copy, anti-screenshot, and tab-switch detection.
- **Dashboard**: Analytics, progress tracking, and leaderboards.
- **Admin Panel**: Manage students, exams, questions, and results.
- **Performance**: Optimized with caching and clean architecture.

## 🛠️ Tech Stack
- **Frontend**: HTML5, Tailwind CSS, Vanilla JS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Security**: Helmet, CORS, XSS-Clean, JWT Authentication

## 🐳 Quick Start (Docker)

**Note:** Agar `docker` command error de raha hai, toh neeche diya gaya **"Manual Run"** tarika use karein.

1. Project ke root folder mein terminal open karein.
2. Command run karein:
   ```bash
   docker compose up --build
   ```

## ⚡ Manual Run (Recommended if Docker fails)

Agar Docker installed nahi hai, toh yeh tarika sabse fast hai:

1. Terminal mein `backend` folder mein jayein:
   ```bash
   cd backend
   ```
2. Server start karein:
   ```bash
   npm run dev
   ```
3. Browser mein open karein: `http://localhost:5000`

## 🌍 Deployment Guide (How to make it Live for Free)

You can deploy this application for free using **Render** (for hosting) and **MongoDB Atlas** (for database).

### Step 1: Setup Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up.
2. Create a **FREE** cluster (Shared).
3. Create a database user (username/password) and allow access from anywhere (`0.0.0.0/0`) in Network Access.
4. Get your connection string:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/glorious-study-point?retryWrites=true&w=majority`

### Step 2: Prepare for Deployment
1. Ensure your project is pushed to **GitHub**.
2. Make sure your `backend/package.json` has a start script (e.g., `"start": "node src/server.js"`).

### Step 3: Deploy on Render
1. Sign up at Render.com.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Name**: `glorious-study-point-app`
   - **Region**: Closest to you (e.g., Singapore, Frankfurt).
   - **Branch**: `main` (or master).
   - **Root Directory**: Leave empty (defaults to `.`)
   - **Runtime**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
5. **Environment Variables** (Advanced Section):
   Add the following keys:
   - `MONGO_URI`: *Paste your MongoDB Atlas connection string*
   - `JWT_SECRET`: *Enter a strong secret key*
   - `NODE_ENV`: `production`
6. Click **Create Web Service**.

### Step 4: Access Your App
Once the build finishes, Render will provide a URL (e.g., `https://edusecure-app.onrender.com`). Open it to see your live app!

## 💻 Local Installation

1. Clone the repo:
   ```bash
   git clone <repo-url>
   cd board/backend
   ```
2. Install Backend Dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Setup Environment:
   Create `.env` file inside the `backend` folder:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/glorious-study-point
   JWT_SECRET=your_local_secret
   ```
4. Run Server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5000` in your browser.

## 🔐 API Endpoints

- **Auth**: `/api/auth/register`, `/api/auth/login`
- **Exams**: `/api/exams`, `/api/exams/:id/start`
- **Admin**: `/api/admin/questions`, `/api/admin/exams`

## ❓ Troubleshooting

### Common Deployment Errors

**Error: `Could not connect to any servers... IP that isn't whitelisted`**
This means MongoDB Atlas is blocking the connection. Follow **Step 1: Setup Database** above and ensure you selected **"Allow Access from Anywhere"** (`0.0.0.0/0`) in Network Access.

**Error: `operation users.find() buffering timed out`**
This means the server cannot connect to MongoDB. To fix this:

1. **Whitelist IP in MongoDB Atlas**:
   - Go to **Network Access** in MongoDB Atlas.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Click **Confirm**.

2. **Check Connection String**:
   - Ensure `MONGO_URI` in your hosting dashboard (Render/Vercel) is correct.
   - Ensure the password inside the URI does not contain special characters like `@` (unless encoded) and brackets `< >` are removed.