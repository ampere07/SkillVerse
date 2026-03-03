# Student Progress Analyzer

This script analyzes all students' performance data and populates the Progress model with comprehensive analytics.

## Features

- Analyzes assignment submissions and scores
- Processes mini-project completion and performance
- Tracks code execution statistics
- Calculates language-specific metrics (Java/Python)
- Updates job readiness scores
- Maintains learning streaks
- Generates time spent metrics

## How to Run

### Option 1: Using npm script (Recommended)
```bash
cd backend
npm run analyze-students
```

### Option 2: Direct execution
```bash
cd backend
node scripts/runAnalysis.js
```

## What it does

1. **Fetches all students** from the User model
2. **For each student:**
   - Gets all enrolled classrooms
   - Analyzes assignment performance (on-time, late, average scores)
   - Analyzes mini-project completion and scores
   - Categorizes projects by language (Java/Python)
   - Counts code executions by language
   - Calculates job readiness score using the existing algorithm
   - Updates learning streaks based on activity
   - Estimates time spent on learning

3. **Updates Progress model** with:
   - Activities data (assignments, projects, code executions, bug hunt)
   - Skills data (language-specific metrics)
   - Job readiness scores
   - Streak information
   - Time tracking

## Output

The script provides:
- Real-time progress updates in the console
- Summary report with:
  - Number of students analyzed
  - Number of students updated
  - Any errors encountered

## Notes

- The script only analyzes students (not teachers)
- Students must be enrolled in at least one classroom
- Existing progress records are updated, not replaced
- The script handles missing data gracefully

## Customization

You can modify the `analyzeStudentProgress.js` file to:
- Add new metrics
- Change calculation methods
- Include additional data sources
- Modify the job readiness algorithm
