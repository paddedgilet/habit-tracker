# Habit Tracker PWA

A Progressive Web App for tracking daily fitness and wellness habits with Google Sheets backend.

## ✅ Features

- ✓ Track 15 daily habits
- ✓ Visual progress circle showing completion
- ✓ Two input types: Yes/No toggles and number inputs
- ✓ Historic data storage in Google Sheets
- ✓ View past logs and trends
- ✓ Installable on phone as PWA
- ✓ Works offline (cached)
- ✓ Push notification support (foundation ready)
- ✓ Clean, modern dark UI

## 📋 What You Already Have Set Up

✅ Google Sheet created with Habits and Logs sheets
✅ Google Cloud Project with Sheets API enabled
✅ API Key configured and restricted
✅ 15 habits defined in your spreadsheet

## 🚀 Deployment Options

### Option 1: GitHub Pages (Recommended - FREE & Easy)

**Steps:**

1. **Create a GitHub account** (if you don't have one)
   - Go to https://github.com
   - Sign up for free

2. **Create a new repository**
   - Click "+" in top right → "New repository"
   - Name: `habit-tracker`
   - Set to "Public"
   - Click "Create repository"

3. **Upload files**
   - Click "uploading an existing file"
   - Drag and drop ALL 5 files:
     - index.html
     - styles.css
     - app.js
     - manifest.json
     - service-worker.js
   - Click "Commit changes"

4. **Enable GitHub Pages**
   - Go to Settings → Pages (left sidebar)
   - Under "Source", select "main" branch
   - Click "Save"
   - Wait 1-2 minutes

5. **Access your app**
   - Your app will be at: `https://YOUR-USERNAME.github.io/habit-tracker/`
   - GitHub will show you the URL in the Pages settings


## 📱 Installing on Your Phone

### iPhone (iOS)

1. Open Safari (must use Safari)
2. Navigate to your deployed URL
3. Tap the Share button (box with arrow)
4. Scroll down and tap "Add to Home Screen"
5. Tap "Add"
6. App will appear on your home screen like a native app

**Note:** iOS has limited PWA features. Push notifications may not work, but the app itself will work perfectly.

### Android

1. Open Chrome browser
2. Navigate to your deployed URL
3. You'll see a popup "Add Habit Tracker to Home screen"
   - OR tap the three dots menu → "Install app"
4. Tap "Install"
5. App will appear on your home screen

**Full PWA features available on Android including push notifications!**

## 🔧 How to Use

### Daily Tracking

1. **View Progress**
   - Home screen shows X/15 habits completed
   - Progress circle updates in real-time

2. **Log a Habit**
   - Click any habit card
   - For Yes/No habits: Select Yes or No
   - For number habits: Enter the current value
   - Click "Save"

3. **View History**
   - Click "View History" button
   - Filter by specific habit or time range
   - See all your past logs

### Understanding the Data

**Habits Sheet:**
- Each row is one of your 15 habits
- `habit_type`: "yes_no" or "number"
- `target_value`: Your daily goal

**Logs Sheet:**
- Every time you log a habit, a new row is added
- Contains: timestamp, date, habit ID, habit name, value
- This is your historic data - NEVER DELETE THIS SHEET

## 🔮 Phase 2: Polar API Integration (Coming Soon)

Once you're comfortable with the app, we'll add:
- Automatic step count syncing from Polar
- Auto-import of active minutes, calories, sleep
- Scheduled syncs (no manual entry needed)

## ⚠️ Important Notes

### Google Sheets Permissions

Your spreadsheet MUST be set to "Anyone with the link can edit":
1. Open your Google Sheet
2. Click "Share" button
3. Change from "Restricted" to "Anyone with the link"
4. Set permission to "Editor"

### API Key Security

⚠️ Your API key is visible in the code. This is intentional for this setup:
- The key is restricted to ONLY access Google Sheets API
- For personal use, this is acceptable
- If you want extra security, you can set up OAuth (more complex)

### Data Backup

Your data is stored in Google Sheets, which means:
- ✅ Automatic cloud backup
- ✅ You can always access raw data in Sheets
- ✅ Easy to export to Excel/CSV
- ✅ Can create charts/analysis in Sheets

## 🐛 Troubleshooting

### "Failed to load habits" error

**Fix:** Check your Google Sheet permissions
- Make sure it's set to "Anyone with the link can edit"
- Verify the spreadsheet URL is correct in app.js

### Habits not showing up

**Fix:** Check your Habits sheet
- Make sure you have data in rows 2-16
- Column A should have habit IDs (1-15)
- No empty rows in the middle

### Can't save logs

**Fix:** Check the Logs sheet
- Make sure the sheet is named exactly "Logs"
- Make sure it has column headers in row 1
- Sheet should be editable (not protected)

### App not installing on phone

**Fix:** 
- iOS: Must use Safari browser (Chrome won't work)
- Android: Must use Chrome browser
- Must be deployed (doesn't work on local files)

## 📊 Viewing Your Data

You can always view/analyze your data directly in Google Sheets:

1. **Daily Summary:** 
   - Filter Logs sheet by date

2. **Habit Trends:**
   - Create a pivot table
   - Add charts to visualize progress

3. **Export Data:**
   - File → Download → CSV or Excel

## 🎯 Tips for Success

1. **Log at the same time each day** (e.g., before bed)
2. **Start small** - don't try to complete all 15 habits perfectly on day 1
3. **Check your streak** - try to maintain it!
4. **Review history weekly** - see what's working and what's not
5. **Adjust targets** - if a target is too easy/hard, edit the Habits sheet

## 🆘 Need Help?

If you run into issues:

1. Check this README first
2. Verify your Google Sheet setup
3. Check browser console for errors (F12 key)
4. Make sure you're using the deployed URL (not file://)

## 📝 Files Included

- `index.html` - Main app structure
- `styles.css` - All styling (dark theme, animations)
- `app.js` - Core functionality and Google Sheets integration
- `manifest.json` - PWA configuration
- `service-worker.js` - Offline support and notification foundation

## 🚀 Next Steps

1. Deploy the app using one of the options above
2. Install it on your phone
3. Start logging your habits daily!
4. After a week, we can add Polar API integration

---

**Ready to deploy?** Choose GitHub Pages (easiest) and follow the steps above!
