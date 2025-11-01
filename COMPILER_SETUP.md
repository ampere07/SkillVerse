# Java Compiler Setup Guide

## Prerequisites

### 1. Install Java Development Kit (JDK)

**Windows:**
1. Download JDK from [Oracle](https://www.oracle.com/java/technologies/downloads/) or [OpenJDK](https://adoptium.net/)
2. Install JDK (recommended: JDK 11 or higher)
3. Add to PATH:
   - Right-click "This PC" → Properties → Advanced System Settings
   - Environment Variables → System Variables
   - Find "Path" → Edit → New
   - Add: `C:\Program Files\Java\jdk-XX\bin` (replace XX with your version)

**Verify Installation:**
```bash
javac -version
java -version
```

Both commands should show version information.

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start Backend Server
```bash
npm start
```

The server will run on `http://localhost:5000`

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Frontend
```bash
npm run dev
```

## Supported Java Features

### ✅ Standard Libraries (Included with JDK)
- **java.lang.*** - Core classes (String, Math, Object, Thread)
- **java.util.*** - Data structures (ArrayList, HashMap, Scanner)
- **java.io.*** - File I/O (FileReader, BufferedWriter)
- **java.net.*** - Networking (URL, Socket)
- **java.time.*** - Date/Time API
- **java.sql.*** - Database access (JDBC)
- **javax.swing.*** - GUI components
- **java.security.*** - Encryption/security
- **java.nio.*** - Fast file & buffer I/O
- **java.math.*** - Big numbers (BigDecimal, BigInteger)

### ❌ External Libraries (Not Supported Yet)
- Gson, Jackson (JSON)
- Spring Boot (Web framework)
- Hibernate (Database ORM)
- JUnit (Testing)
- etc.

## How It Works

1. **Frontend**: User writes Java code in the editor
2. **Backend**: Receives code via API
3. **Compilation**: 
   - Extracts public class name
   - Creates temporary directory
   - Writes `.java` file
   - Runs `javac` command to compile
4. **Execution**:
   - Runs `java` command to execute
   - Captures output/errors
5. **Cleanup**: Deletes temporary files
6. **Response**: Returns output to frontend

## File Structure

```
backend/
├── routes/
│   ├── auth.js
│   └── compiler.js        # Java compiler endpoint
├── middleware/
│   └── auth.js
├── temp/                  # Temporary compilation directory (auto-created)
└── server.js

frontend/
├── src/
│   ├── pages/
│   │   └── Compiler.tsx   # Compiler UI
│   └── components/
│       └── Dashboard.tsx  # Main dashboard
```

## API Endpoint

**POST** `/api/compiler/compile-java`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "code": "public class Main { ... }"
}
```

**Response:**
```json
{
  "success": true,
  "output": "Hello, World!\n",
  "error": null
}
```

## Limitations

- Single file compilation only
- No external JAR libraries
- 10-second timeout for compilation and execution
- Temporary files auto-cleaned after execution

## Security Notes

- User authentication required
- Isolated temporary directories per user
- Automatic cleanup of temporary files
- Execution timeout protection
- No access to server file system

## Troubleshooting

**Error: "javac is not recognized"**
- Solution: Install JDK and add to PATH

**Error: "No public class found"**
- Solution: Ensure code has `public class ClassName`

**Error: "Authentication failed"**
- Solution: Login again to refresh token

**Error: "Compilation timeout"**
- Solution: Simplify code or check for infinite loops

## Next Steps (Future Enhancements)

- [ ] Add Python compiler support
- [ ] Support multiple file compilation
- [ ] Add external library support (.jar files)
- [ ] Implement code execution limits (CPU/Memory)
- [ ] Add syntax error highlighting
- [ ] Code autocomplete suggestions
- [ ] Save and load code snippets
