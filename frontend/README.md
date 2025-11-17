# SkillVerse

Educational platform for learning Java and Python programming with interactive compiler, AI-powered skill assessment, and comprehensive course management.

## Features

- **Interactive Compiler**
  - Java and Python support
  - Real-time code execution
  - Interactive terminal (stdin/stdout)
  - Syntax highlighting and auto-complete
  - Error detection with line highlighting
  - External libraries (12 Java JARs, 12 Python packages)

- **Role-Based Access**
  - Student dashboard: courses, assignments, compiler
  - Teacher dashboard: course management, analytics, assignment creation

- **AI-Powered Assessment**
  - Skill evaluation using Qwen2.5-Coder-7B-Instruct
  - Onboarding survey for students
  - Multi-difficulty question testing

## Prerequisites

### Required Software

1. **Node.js** (v16 or higher)
   - Download: https://nodejs.org/

2. **Python** (v3.8 or higher)
   - Download: https://www.python.org/downloads/
   - **IMPORTANT:** Check "Add Python to PATH" during installation sa environmnental variables

3. **Eclipse Temurin JDK** (Java 11 or higher)
   - Download: https://adoptium.net/
   - **IMPORTANT:** Set JAVA_HOME environment variable

### Verify Installations

```bash
# Check Node.js
node --version
npm --version

# Check Python
python --version
pip --version

# Check Java
java -version
javac -version
```

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-username/SkillVerse.git
cd SkillVerse
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file in `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Backend Setup

```bash
cd backend
npm install
pip install -r requirements.txt
```

Create `.env` file in `backend` directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://skillverse:skillverse2025@thesis2025.2ammtbq.mongodb.net/?appName=thesis2025
JWT_SECRET=your_jwt_secret_key_here_change_in_production
HUGGINGFACE_API_KEY=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
```

### 4. Java Libraries Setup

Place JAR files in `backend/libs/` directory:
- gson-2.10.1.jar
- jackson-core-2.15.2.jar
- jackson-databind-2.15.2.jar
- jackson-annotations-2.15.2.jar
- commons-lang3-3.13.0.jar
- commons-io-2.13.0.jar
- commons-collections4-4.4.jar
- junit-4.13.2.jar
- hamcrest-core-1.3.jar
- slf4j-api-2.0.9.jar
- slf4j-simple-2.0.9.jar
- guava-32.1.2-jre.jar

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

## Python Libraries Installed

The following libraries are available in the compiler:

- **numpy** - Scientific computing
- **pandas** - Data analysis
- **matplotlib** - Visualization
- **seaborn** - Statistical visualization
- **scipy** - Scientific computing
- **scikit-learn** - Machine learning
- **requests** - HTTP library
- **beautifulsoup4** - Web scraping
- **pillow** - Image processing
- **openpyxl** - Excel handling
- **python-dateutil** - Date utilities
- **pytz** - Timezone handling

## Project Structure

```
SkillVerse/
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── utils/           # Utilities (javaUtils, pythonUtils)
│   │   └── App.tsx
│   ├── .env                 # Environment variables
│   └── package.json
│
├── backend/                  # Node.js + Express + MongoDB
│   ├── routes/              # API routes
│   │   ├── auth.js
│   │   ├── compiler.js
│   │   ├── compilerSocket.js
│   │   ├── pythonCompilerSocket.js
│   │   ├── courses.js
│   │   ├── miniProjects.js
│   │   └── survey.js
│   ├── models/              # MongoDB schemas
│   ├── middleware/          # Authentication middleware
│   ├── services/            # Business logic
│   ├── config/              # Database configuration
│   ├── libs/                # Java JAR files
│   ├── temp/                # Temporary execution files
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables
│   └── package.json
│
└── README.md
```

## Testing the Compiler

### Test Java Compiler

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.print("Enter your name: ");
        String name = scanner.nextLine();
        
        System.out.println("Hello, " + name + "!");
        
        scanner.close();
    }
}
```

### Test Python Compiler

```python
name = input("Enter your name: ")
age = int(input("Enter your age: "))
print(f"Hello {name}, you are {age} years old!")

# Test libraries
import numpy as np
arr = np.array([1, 2, 3, 4, 5])
print(f"NumPy Mean: {arr.mean()}")
```

## Troubleshooting

### Python Not Found
```bash
# Windows: Add Python to PATH
# Verify installation:
python --version
pip --version
```

### Java Not Found
```bash
# Set JAVA_HOME environment variable
# Windows: System Properties → Environment Variables
# Add to PATH: %JAVA_HOME%\bin
```

### Module Not Found (Python)
```bash
cd backend
pip install -r requirements.txt
```

### Port Already in Use
```bash
# Change PORT in backend/.env
# Update VITE_API_URL in frontend/.env accordingly
```

### MongoDB Connection Error
- Check MONGODB_URI in backend/.env
- Verify network connection
- Check MongoDB Atlas whitelist

## Security Notes

**IMPORTANT:** Change these before production:

1. Generate new JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. Secure MongoDB credentials
3. Update HUGGINGFACE_API_KEY
4. Enable CORS restrictions
5. Add rate limiting

## Environment Variables Reference

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:5000/api |

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb+srv://... |
| JWT_SECRET | JWT signing secret | your_secret_here |
| HUGGINGFACE_API_KEY | HuggingFace API key | hf_... |

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is part of a thesis project.

## Authors

- **Raven** - Thesis Developer

## Acknowledgments

- Eclipse Adoptium for Temurin JDK
- Hugging Face for AI models
- MongoDB Atlas for database hosting
- All open-source library contributors
