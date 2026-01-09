# SkillVerse Demo Commands

## Overview
This CLI tool allows you to manipulate XP, levels, and badges for demo/presentation purposes.

## Setup
Make sure your backend server is running on `http://localhost:5000`

## Running the Demo Commands

### Option 1: Interactive Menu
```bash
cd backend
node demoCommands.js
```

This will show you an interactive menu with these options:
1. Add XP
2. Level Up
3. Unlock Badge
4. View Stats
5. Reset Demo Data
6. Exit

### Option 2: Direct API Calls (using curl)

#### Add XP
```bash
curl -X POST http://localhost:5000/api/demo/add-xp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"student@example.com\",\"amount\":100}"
```

#### Level Up Automatically
```bash
curl -X POST http://localhost:5000/api/demo/level-up \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"student@example.com\"}"
```

#### Unlock a Badge
```bash
curl -X POST http://localhost:5000/api/demo/unlock-badge \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"student@example.com\",\"badgeId\":\"high_achiever\"}"
```

#### View User Stats
```bash
curl http://localhost:5000/api/demo/stats/student@example.com
```

#### Reset Demo Data
```bash
curl -X POST http://localhost:5000/api/demo/reset \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"student@example.com\"}"
```

## Available Badges

- `first_steps` - Complete your first project
- `getting_started` - Complete 3 projects
- `halfway_hero` - Complete 50 projects
- `almost_there` - Complete 100 projects
- `perfectionist` - Complete 250 projects
- `streak_3` - Use the system for 3 days in a row
- `streak_7` - Use the system for 7 days in a row
- `streak_30` - Use the system for 30 days in a row
- `high_achiever` - Get 90+ score on 5 projects
- `perfect_execution` - Get a perfect 100 score

## Example Workflow for Presentation

1. **Start the demo CLI:**
   ```bash
   node demoCommands.js
   ```

2. **Unlock "High Achiever" badge:**
   - Select option 3 (Unlock Badge)
   - Enter user email: `ravenampere0123@gmail.com`
   - Enter badge ID: `high_achiever`

3. **Add 100 XP:**
   - Select option 1 (Add XP)
   - Enter user email: `ravenampere0123@gmail.com`
   - Enter XP amount: `100`

4. **Level Up:**
   - Select option 2 (Level Up)
   - Enter user email: `ravenampere0123@gmail.com`

5. **View Stats:**
   - Select option 4 (View Stats)
   - Enter user email: `ravenampere0123@gmail.com`

6. **Refresh the frontend** to see the changes!

## Notes

- Changes are stored in the database and persist across sessions
- Use "Reset Demo Data" to clear all demo XP, levels, and badges
- The demo data is separate from the actual user progress
- Always restart your server after modifying the code

## Troubleshooting

**Error: "connect ECONNREFUSED"**
- Make sure your backend server is running
- Verify the server is on port 5000

**Error: "User not found"**
- Double-check the email address
- Make sure the user exists in the database

**Badge not unlocking:**
- Check the badge ID spelling
- Use the exact badge IDs listed above (case-sensitive)
