# Deployment to Render.com - Quick Guide

## ✅ Your App is Ready for Deployment!

The following files have been set up:
- ✅ `Procfile` - Tells Render how to start your app
- ✅ `package.json` - Has `build` and `start` scripts
- ✅ `server.js` - Ready for production (uses PORT env variable)
- ✅ `.gitignore` - Excludes node_modules from Git

## 🚀 Next Steps

### 1. Install Git (if not already installed)
Download Git from: https://git-scm.com/

### 2. Create a GitHub Account
Go to: https://github.com/signup

### 3. Create a New GitHub Repository
1. Go to https://github.com/new
2. Name it: `iptv-player`
3. Click "Create repository"
4. **Don't add any files** - just create empty repo

### 4. Initialize Git in Your Project

Open **PowerShell** or **Command Prompt** and run:

```bash
cd "c:\Users\ariva\OneDrive\Desktop\IPTV PLAYER"
git init
git config user.name "YOUR_NAME"
git config user.email "YOUR_EMAIL"
git add .
git commit -m "Initial commit - IPTV Player with React + Express"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/iptv-player.git
git push -u origin main
```

⚠️ Replace:
- `YOUR_NAME` - Your GitHub username
- `YOUR_EMAIL` - Your GitHub email
- `YOUR_USERNAME` - Your GitHub username

### 5. Deploy on Render.com

1. Go to: https://render.com
2. Sign up with your GitHub account
3. Click "New +" → "Web Service"
4. Click "Connect Repository" → Select `iptv-player`
5. Fill in settings:
   - **Name**: `iptv-player`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
6. Click "Create Web Service"

### 6. Wait for Deployment
- Render will build and deploy (takes 3-5 minutes)
- You'll get a live URL like: `https://iptv-player.onrender.com`
- Check "Logs" if anything goes wrong

---

## 📝 Notes

- **Free tier auto-sleeps** after 15 min of inactivity
- **Upgrade to Hobby ($7/month)** to always stay online
- Your app will work exactly the same as localhost, just live!

---

## ❌ Troubleshooting

If deployment fails, check the "Logs" section for errors:

**Error: "Cannot find module"**
→ Missing dependency in package.json

**Error: "Port already in use"**
→ Render assigns PORT via environment variable (already handled)

**Error: "CORS issues"**
→ Already configured in server.js

---

Need help? Check the Render.com docs: https://render.com/docs

Good luck! 🎬
