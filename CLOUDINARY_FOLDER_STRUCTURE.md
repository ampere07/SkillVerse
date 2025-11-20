# Cloudinary Folder Structure Documentation

## Overview

Files uploaded to Cloudinary are now organized in a hierarchical folder structure based on the classroom and post (activity/module) names. This makes it easy to locate and manage files.

## Folder Structure

```
skillverse/
├── COSC_101/
│   ├── Java_Loops_Exercise/
│   │   ├── Java_Loops_Exercise_1234567890_1234.pdf
│   │   ├── Java_Loops_Exercise_1234567891_5678.png
│   │   └── Java_Loops_Exercise_1234567892_9012.docx
│   └── Introduction_to_Python/
│       ├── Introduction_to_Python_1234567893_3456.pdf
│       └── Introduction_to_Python_1234567894_7890.png
├── MATH_201/
│   └── Calculus_Module_1/
│       └── Calculus_Module_1_1234567895_1111.pdf
└── ENG_101/
    └── Essay_Guidelines/
        └── Essay_Guidelines_1234567896_2222.docx
```

## Naming Conventions

### 1. Classroom Folder Names
- Original: `"COSC 101"` → Sanitized: `"COSC_101"`
- Original: `"Math & Science!"` → Sanitized: `"Math_Science"`
- Original: `"English 101 - Writing"` → Sanitized: `"English_101_Writing"`

**Rules:**
- Special characters removed (except spaces and hyphens)
- Spaces converted to underscores
- Maximum 50 characters
- Empty/missing names default to `"General"`

### 2. Post (Activity/Module) Folder Names
- Original: `"Java Loops Exercise"` → Sanitized: `"Java_Loops_Exercise"`
- Original: `"Module #1: Variables"` → Sanitized: `"Module_1_Variables"`
- Original: `"Assignment 2 (Part A)"` → Sanitized: `"Assignment_2_Part_A"`

**Rules:**
- Same sanitization as classroom names
- Maximum 50 characters
- Empty/missing names default to `"Untitled"`

### 3. File Names
Format: `{PostTitle}_{Timestamp}_{RandomNumber}.{Extension}`

Example: `Java_Loops_Exercise_1701234567890_5432.pdf`

**Components:**
- **PostTitle**: Sanitized post name
- **Timestamp**: Unix timestamp (milliseconds)
- **RandomNumber**: Random 4-digit number (prevents conflicts)
- **Extension**: Original file extension

## How It Works

### When a Teacher Creates a Post

1. **Teacher fills out the form:**
   - Classroom: "COSC 101"
   - Post Title: "Java Loops Exercise"
   - Post Type: "Activity"
   - Attachments: `[lecture.pdf, example.png, code.zip]`

2. **Frontend uploads files:**
   ```javascript
   uploadAPI.uploadMultiple(files, {
     classroomName: "COSC 101",
     postTitle: "Java Loops Exercise",
     postType: "activity"
   })
   ```

3. **Backend processes upload:**
   - Sanitizes classroom name: `"COSC_101"`
   - Sanitizes post title: `"Java_Loops_Exercise"`
   - Creates folder: `skillverse/COSC_101/Java_Loops_Exercise/`
   
4. **Files are saved:**
   ```
   skillverse/COSC_101/Java_Loops_Exercise/
   ├── Java_Loops_Exercise_1701234567890_1234.pdf
   ├── Java_Loops_Exercise_1701234567891_5678.png
   └── Java_Loops_Exercise_1701234567892_9012.zip
   ```

## Benefits

### For Teachers
✅ **Organized Structure**: Easy to find files by classroom and assignment
✅ **No File Conflicts**: Unique timestamps and random numbers prevent overwrites
✅ **Clear Naming**: Files are automatically named after the assignment
✅ **Easy Management**: Delete entire folders when removing assignments

### For Students
✅ **Clear Organization**: Know which files belong to which assignment
✅ **Easy Downloads**: File names indicate their purpose
✅ **No Confusion**: Each assignment has its own folder

### For Administrators
✅ **Easy Monitoring**: See storage usage by classroom
✅ **Simple Cleanup**: Remove entire classroom folders when archiving
✅ **Better Analytics**: Track file usage by classroom and assignment

## Technical Details

### Cloudinary Configuration

The folder structure is created in `backend/config/cloudinary.js`:

```javascript
const folderPath = `skillverse/${sanitizedClassroom}/${sanitizedPostTitle}`;
const publicId = `${sanitizedPostTitle}_${timestamp}_${randomNum}`;
```

### Upload Flow

```
Frontend (CreatePostModal)
    ↓
    Sends: files + metadata (classroomName, postTitle, postType)
    ↓
Upload API (/api/upload/multiple)
    ↓
Cloudinary Config (processes metadata)
    ↓
    Creates folder: skillverse/{classroom}/{post}/
    Renames file: {post}_{timestamp}_{random}.{ext}
    ↓
Cloudinary Storage
    ↓
Returns file URLs and metadata
    ↓
Saved in Activity/Module database
```

## File Metadata Stored

Each uploaded file stores:
```javascript
{
  fileName: "lecture.pdf",           // Original name
  fileUrl: "https://res.cloudinary.com/...",
  fileType: "application/pdf",
  fileSize: 1024567,                 // Bytes
  publicId: "skillverse/COSC_101/Java_Loops_Exercise/Java_Loops_Exercise_1701234567890_1234",
  uploadedAt: "2025-01-20T10:30:00.000Z"
}
```

## Example Scenarios

### Scenario 1: Multiple Classes, Same Assignment Name

**Class 1:**
```
skillverse/COSC_101/Variables_Exercise/
└── Variables_Exercise_1701234567890_1234.pdf
```

**Class 2:**
```
skillverse/COSC_102/Variables_Exercise/
└── Variables_Exercise_1701234567891_5678.pdf
```

✅ No conflicts! Each class has its own folder.

### Scenario 2: Same Class, Similar Assignment Names

**Assignment 1:**
```
skillverse/COSC_101/Quiz_1/
└── Quiz_1_1701234567890_1234.pdf
```

**Assignment 2:**
```
skillverse/COSC_101/Quiz_2/
└── Quiz_2_1701234567891_5678.pdf
```

✅ Separate folders for each assignment.

### Scenario 3: Uploading Multiple Files at Once

**Upload:**
- Files: `[part1.pdf, part2.pdf, part3.pdf]`
- Post: "Final Project"

**Result:**
```
skillverse/COSC_101/Final_Project/
├── Final_Project_1701234567890_1234.pdf  (part1)
├── Final_Project_1701234567890_5678.pdf  (part2)
└── Final_Project_1701234567890_9012.pdf  (part3)
```

✅ All files grouped together in one folder.

## Viewing Files in Cloudinary

1. Login to Cloudinary Dashboard
2. Click **Media Library**
3. Navigate folders:
   - Click `skillverse` folder
   - Click desired classroom (e.g., `COSC_101`)
   - Click desired assignment (e.g., `Java_Loops_Exercise`)
   - View all files for that assignment

## Console Logs

When files are uploaded, the backend logs:

```
Files uploaded to: skillverse/COSC_101/Java_Loops_Exercise
Total files: 3
  - Java_Loops_Exercise_1701234567890_1234
  - Java_Loops_Exercise_1701234567891_5678
  - Java_Loops_Exercise_1701234567892_9012
```

This helps track uploads and debug any issues.

## Troubleshooting

### Files Not in Expected Folder

**Check:**
1. Classroom name is being passed correctly
2. Post title is not empty
3. Backend console logs show correct folder path
4. Cloudinary dashboard reflects the structure

### Special Characters in Names

**Issue:** Classroom name has special characters like `"Math & Science!"`

**Solution:** Automatically sanitized to `"Math_Science"`

**Note:** This is by design to ensure valid folder names.

### Long Names Truncated

**Issue:** Very long assignment names are cut off

**Solution:** Names are limited to 50 characters to prevent issues.

**Best Practice:** Keep assignment names concise (under 40 characters).

## Best Practices

### For Teachers

1. ✅ Use clear, descriptive assignment names
2. ✅ Keep names under 40 characters
3. ✅ Avoid excessive special characters
4. ✅ Use consistent naming across similar assignments

### For Developers

1. ✅ Always pass metadata when uploading
2. ✅ Validate classroom and post names exist
3. ✅ Handle empty/null values gracefully
4. ✅ Log upload paths for debugging

## Security Notes

1. **Folder names are sanitized** - Prevents injection attacks
2. **Unique file names** - Prevents overwriting existing files
3. **Authentication required** - Only logged-in users can upload
4. **File type validation** - Only allowed file types accepted
5. **Size limits enforced** - Maximum 10MB per file

## Future Enhancements

Potential improvements:
- [ ] Add year/semester folders (e.g., `2025_Spring`)
- [ ] Support for student submission folders
- [ ] Automatic folder cleanup for old assignments
- [ ] Folder size tracking and alerts
- [ ] Batch rename functionality
- [ ] Download entire folder as ZIP

## Support

If you need to:
- **Find a specific file**: Check Cloudinary → Media Library → Navigate folders
- **Delete files**: Use the delete endpoint (coming soon)
- **Reorganize folders**: Contact administrator
- **Report issues**: Check backend console logs first
