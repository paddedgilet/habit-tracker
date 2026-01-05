# 🔐 OAuth2 Update Instructions

Your app now uses OAuth2 authentication to write to Google Sheets. This is more secure and reliable.

## 📦 Files to Update

You need to replace **2 files** in your GitHub repository:

1. **index.html** → Replace with `index-oauth.html` (rename it to `index.html`)
2. **app.js** → Replace with `app-oauth.js` (rename it to `app.js`)

---

## 🚀 Step-by-Step Update Process

### Method 1: GitHub Web Interface (Easiest)

#### Update index.html:

1. Go to: `https://github.com/paddedgilet/habit-tracker`
2. Click on `index.html`
3. Click the **pencil icon** (Edit)
4. **Delete all content**
5. Open the `index-oauth.html` file I provided
6. **Copy ALL the content** and paste it
7. Scroll down, click "Commit changes"

#### Update app.js:

1. Back in your repository, click on `app.js`
2. Click the **pencil icon** (Edit)
3. **Delete all content**
4. Open the `app-oauth.js` file I provided
5. **Copy ALL the content** and paste it
6. Scroll down, click "Commit changes"

### Method 2: Re-upload Files

1. Download both files: `index-oauth.html` and `app-oauth.js`
2. Rename them:
   - `index-oauth.html` → `index.html`
   - `app-oauth.js` → `app.js`
3. Go to your GitHub repository
4. Click "Add file" → "Upload files"
5. Upload both renamed files (they'll replace the old ones)
6. Click "Commit changes"

---

## ✅ What Changed

**index.html:**
- Added Google API library imports
- Added Google Identity Services library
- These enable OAuth2 sign-in

**app.js:**
- Removed API key usage for writing
- Added OAuth2 authentication flow
- Added "Sign in with Google" functionality
- Stores access token securely in browser
- Token auto-refreshes (expires after 1 hour)

---

## 🎯 How It Works Now

### First Time:
1. Open your app: `https://paddedgilet.github.io/habit-tracker/`
2. You'll see "Sign in with Google" button
3. Click it
4. Google will ask you to authorize the app
5. **Click "Continue" or "Allow"**
6. App loads your habits!

### After First Sign-In:
- App remembers you for 1 hour
- No need to sign in again during that time
- After 1 hour, you'll need to sign in again

### Sign Out:
- Click the "Sign Out" button in the header
- This clears your stored token
- You'll need to sign in again next time

---

## 🔒 Security Notes

**What the app can access:**
- ✅ Your Google Sheets (read and write)
- ❌ Nothing else! (No Gmail, no Drive, no other data)

**Your data:**
- All habit data stays in YOUR Google Sheet
- Nothing is sent to external servers
- OAuth token is stored in your browser only
- Token expires after 1 hour

---

## 🧪 Testing

After updating the files:

1. **Hard refresh** your app:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. You should see "Sign in with Google" button

3. Click it and authorize

4. Try logging a habit

5. **Check your Google Sheet** → "Logs" tab should have a new row!

---

## 🐛 Troubleshooting

### "Sign in with Google" button doesn't appear
→ Clear browser cache and hard refresh

### "Popup blocked" error
→ Allow popups for your site in browser settings

### "Authorization failed" error
→ Make sure you added your email as a test user in Google Cloud Console

### Still getting API key errors
→ Make sure you replaced BOTH files (index.html AND app.js)

### Can't authorize
→ Check that your OAuth redirect URI in Google Cloud is exactly:
   `https://paddedgilet.github.io/habit-tracker/`
   (with trailing slash!)

---

## 📱 Mobile Installation

OAuth works on mobile too!

**After signing in once on desktop:**
1. Open the app on your phone
2. You'll need to sign in again on mobile
3. After that, install to home screen
4. Works just like before!

---

## ✨ What You'll Love

**Benefits of OAuth:**
- ✅ No more API key errors!
- ✅ More secure
- ✅ Industry-standard authentication
- ✅ Can revoke access anytime from Google Account settings
- ✅ Works perfectly with PWA installation

---

## 🎉 You're Almost There!

Just replace those 2 files and you'll be tracking habits in no time!

**Questions?** Let me know if you hit any issues during the update.
