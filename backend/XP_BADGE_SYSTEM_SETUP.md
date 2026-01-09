# XP and Badge System - Complete Setup

## ✅ What Was Done:

### 1. **Updated User Model** (`backend/models/User.js`)
Added fields for XP and badges:
- `xp` - Current XP (0-499)
- `level` - Current level  
- `badges` - Array of unlocked badge IDs
- `demoXP`, `demoLevel`, `demoBadges` - Separate demo fields for presentations

### 2. **Created Progress Routes** (`backend/routes/progress.js`)
New API endpoints:
- `GET /api/progress/stats` - Get user's XP, level, and badges
- `POST /api/progress/add-xp` - Add XP (auto-levels up at 500 XP)
- `POST /api/progress/unlock-badge` - Unlock a specific badge

### 3. **Updated Demo Routes** (`backend/routes/demo.js`)
Demo commands now update BOTH demo fields AND real fields so changes appear in the frontend immediately.

### 4. **Updated Frontend** (`frontend/src/pages/MiniProjects.tsx`)
- Added `fetchUserProgress()` function to load XP/badges from backend
- Removed local badge calculation (now uses backend data)
- XP and badges now reflect database values

## 🚀 How To Use:

### **Step 1: Restart Backend Server**
```bash
cd backend
npm start
```

### **Step 2: Run Demo Commands**
```bash
node demoCommands.js
```

### **Step 3: Test the System**

#### Add 200 XP:
```
Select command (1-6): 1
Enter user email: ravenampere0123@gmail.com
Enter XP amount: 200
```

#### Unlock "High Achiever" Badge:
```
Select command (1-6): 3
Enter user email: ravenampere0123@gmail.com
Enter badge ID: high_achiever
```

#### Level Up:
```
Select command (1-6): 2
Enter user email: ravenampere0123@gmail.com
```

### **Step 4: Refresh Frontend**
- Navigate to Mini Projects page
- You should see:
  - XP bar updated with your XP (e.g., "200 / 500 XP")
  - Level updated (e.g., "Level 1" or "Level 2")
  - Unlocked badges showing in color

## 📊 Available Badges:

- `first_steps` - Complete your first project
- `getting_started` - Complete 3 projects
- `halfway_hero` - Complete 50 projects
- `almost_there` - Complete 100 projects
- `perfectionist` - Complete 250 projects
- `streak_3` - 3-day streak
- `streak_7` - 7-day streak
- `streak_30` - 30-day streak
- `high_achiever` - Get 90+ score on 5 projects ⭐
- `perfect_execution` - Get a perfect 100 score

## 🎯 For New Students:

When a new student account is created, they automatically start with:
- `xp: 0`
- `level: 1`
- `badges: []` (empty array)

## 🔧 Troubleshooting:

**Changes not showing on frontend?**
1. Make sure backend server is restarted
2. Hard refresh the frontend (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser console for any errors
4. Verify the API call in Network tab

**Backend errors?**
1. Check if MongoDB is connected
2. Verify all routes are imported in `server.js`
3. Check terminal logs for specific errors

## 📝 Notes:

- The demo commands update both `demoXP`/`demoLevel`/`demoBadges` AND `xp`/`level`/`badges`
- This ensures the frontend always shows the correct data
- Real user progress (from completing projects) uses the `xp`/`level`/`badges` fields
- Demo/presentation data uses the `demoXP`/`demoLevel`/`demoBadges` fields
- The frontend automatically uses whichever has data
