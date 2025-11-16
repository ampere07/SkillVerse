# Classroom & Assignment API Documentation

## 🎓 Classroom Endpoints

### Teacher Endpoints

#### 1. Get All Teacher's Classrooms
```
GET /api/classrooms/teacher
Headers: Authorization: Bearer <token>
```

#### 2. Create Classroom
```
POST /api/classrooms
Headers: Authorization: Bearer <token>
Body: {
  "name": "Java Programming 101",
  "description": "Introduction to Java",
  "settings": {
    "allowStudentPosts": false,
    "requireApprovalToJoin": false
  }
}
```

#### 3. Update Classroom
```
PUT /api/classrooms/:id
Headers: Authorization: Bearer <token>
Body: {
  "name": "Updated Classroom Name",
  "description": "Updated description"
}
```

#### 4. Delete Classroom
```
DELETE /api/classrooms/:id
Headers: Authorization: Bearer <token>
```

#### 5. Remove Student from Classroom
```
DELETE /api/classrooms/:id/students/:studentId
Headers: Authorization: Bearer <token>
```

### Student Endpoints

#### 6. Get All Student's Classrooms
```
GET /api/classrooms/student
Headers: Authorization: Bearer <token>
```

#### 7. Join Classroom with Code
```
POST /api/classrooms/join
Headers: Authorization: Bearer <token>
Body: {
  "code": "ABC12345"
}
```

### Common Endpoints

#### 8. Get Single Classroom
```
GET /api/classrooms/:id
Headers: Authorization: Bearer <token>
```

---

## 📚 Assignment Endpoints

### Teacher Endpoints

#### 1. Create Assignment
```
POST /api/assignments
Headers: Authorization: Bearer <token>
Body: {
  "classroomId": "classroom_id_here",
  "title": "Java Basics Assignment",
  "description": "Complete the following exercises",
  "type": "assignment",
  "dueDate": "2025-12-31T23:59:59Z",
  "points": 100,
  "instructions": "Detailed instructions here",
  "isPublished": true,
  "allowLateSubmission": false
}
```

Types: `assignment`, `module`, `quiz`, `project`, `announcement`

#### 2. Update Assignment
```
PUT /api/assignments/:id
Headers: Authorization: Bearer <token>
Body: {
  "title": "Updated Title",
  "dueDate": "2025-12-31T23:59:59Z"
}
```

#### 3. Delete Assignment
```
DELETE /api/assignments/:id
Headers: Authorization: Bearer <token>
```

#### 4. Grade Student Submission
```
POST /api/assignments/:id/grade/:studentId
Headers: Authorization: Bearer <token>
Body: {
  "grade": 95,
  "feedback": "Great work! Minor improvements needed."
}
```

### Student Endpoints

#### 5. Submit Assignment
```
POST /api/assignments/:id/submit
Headers: Authorization: Bearer <token>
Body: {
  "content": "My submission text or code",
  "attachments": [
    {
      "fileName": "solution.java",
      "fileUrl": "url_to_file",
      "fileType": "java"
    }
  ]
}
```

### Common Endpoints

#### 6. Get All Assignments for Classroom
```
GET /api/assignments/classroom/:classroomId
Headers: Authorization: Bearer <token>
```

#### 7. Get Single Assignment
```
GET /api/assignments/:id
Headers: Authorization: Bearer <token>
```

---

## 🧪 Testing Flow

### For Teachers:
1. Register/Login as teacher
2. Create a classroom → Get classroom code
3. Create assignments in the classroom
4. View submissions
5. Grade submissions

### For Students:
1. Register/Login as student
2. Join classroom using code
3. View assignments in classroom
4. Submit assignments
5. View grades and feedback

---

## ✅ What's Working:

- ✅ User authentication (teacher/student roles)
- ✅ Classroom creation with unique codes
- ✅ Student enrollment via codes
- ✅ Assignment creation and management
- ✅ Assignment submissions
- ✅ Grading system
- ✅ Role-based access control
- ✅ All existing features (auth, compiler, survey, courses)

---

## 🔒 Security Features:

- JWT authentication required for all endpoints
- Role-based authorization (teacher/student)
- Teachers can only manage their own classrooms
- Students can only access enrolled classrooms
- Submission deadlines enforced
- Published/unpublished assignment control

---

## 📝 Testing with Postman/Thunder Client:

1. **Get Token**: Login/Register → Save token
2. **Add to Headers**: `Authorization: Bearer <your_token>`
3. **Test Endpoints**: Start with classroom creation
4. **Check Database**: Verify data in MongoDB

---

## 🎯 Next Steps:

Frontend components needed:
- Teacher Dashboard (create/manage classrooms)
- Classroom List View
- Assignment Creation Form
- Assignment Card UI
- Student Classroom View
- Assignment Submission Form
