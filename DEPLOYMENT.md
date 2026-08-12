# GRABB-IT Clothing — Production Deployment Guide

This guide provides step-by-step deployment instructions for hosting **Frontend on Vercel**, **Backend on Render**, **Database on Managed PostgreSQL**, **Images on Cloudinary**, and **Email via SMTP**.

---

## 1. Deploy Backend to Render

1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository `Grabb-it-clothing`.
4. Set the following settings:
   - **Name**: `grabb-it-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `FRONTEND_URL` = `https://your-app.vercel.app`
   - `JWT_SECRET` = `[Generate a secure 64-character random string]`
   - `DATABASE_URL` = `[Your Managed PostgreSQL Connection URI]`
   - `CLOUDINARY_CLOUD_NAME` = `[Your Cloudinary Cloud Name]`
   - `CLOUDINARY_API_KEY` = `[Your Cloudinary API Key]`
   - `CLOUDINARY_API_SECRET` = `[Your Cloudinary API Secret]`
   - `RAZORPAY_KEY_ID` = `[Your Razorpay Key ID]`
   - `RAZORPAY_KEY_SECRET` = `[Your Razorpay Key Secret]`
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `[Your SMTP Email]`
   - `SMTP_PASSWORD` = `[Your SMTP Password]`
6. Click **Create Web Service**. Note your backend URL (e.g. `https://grabb-it-backend.onrender.com`).

---

## 2. Deploy Frontend to Vercel

1. Log into [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository `Grabb-it-clothing`.
4. Set the Framework Preset to **Vite**.
5. Set Root Directory to `client`.
6. Add Environment Variable:
   - `VITE_API_URL` = `https://grabb-it-backend.onrender.com` (Your Render Backend URL)
7. Click **Deploy**.

---

## 3. Post-Deployment Verification

1. Access your Vercel URL (e.g. `https://grabb-it-clothing.vercel.app`).
2. Test `/api/health` on Render backend: `https://grabb-it-backend.onrender.com/api/health`. Should return `{"status":"ok","database":"connected"}`.
3. Test Customer Registration, Login, Browsing, and Order Placement.
4. Test Admin Login at `https://grabb-it-clothing.vercel.app/admin/login` (`admin@grabb-it.com` / `Admin@123456`).
