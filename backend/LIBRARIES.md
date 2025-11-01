# Java Compiler - External Libraries Guide

## Available Libraries

The compiler now supports the following external JAR libraries:

### 1. Gson (v2.13.2)
**Purpose:** JSON serialization and deserialization

**Package:** `com.google.gson.*`

**Example:**
```java
import com.google.gson.Gson;

public class Main {
    static class Person {
        String name;
        int age;
    }
    
    public static void main(String[] args) {
        Gson gson = new Gson();
        Person person = new Person();
        person.name = "John";
        person.age = 25;
        
        String json = gson.toJson(person);
        System.out.println(json);
        
        Person fromJson = gson.fromJson(json, Person.class);
        System.out.println(fromJson.name);
    }
}
```

### 2. Jackson (v2.17.1)
**Purpose:** High-performance JSON processing

**Packages:** 
- `com.fasterxml.jackson.core.*`
- `com.fasterxml.jackson.databind.*`
- `com.fasterxml.jackson.annotation.*`

**Example:**
```java
import com.fasterxml.jackson.databind.ObjectMapper;

public class Main {
    static class Person {
        public String name;
        public int age;
    }
    
    public static void main(String[] args) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        Person person = new Person();
        person.name = "Alice";
        person.age = 30;
        
        String json = mapper.writeValueAsString(person);
        System.out.println(json);
        
        Person fromJson = mapper.readValue(json, Person.class);
        System.out.println(fromJson.name);
    }
}
```

### 3. Apache Commons Lang3 (v3.14.0)
**Purpose:** Utility methods for String, Array, Number operations

**Package:** `org.apache.commons.lang3.*`

**Example:**
```java
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.text.WordUtils;

public class Main {
    public static void main(String[] args) {
        String text = "hello world";
        
        System.out.println(StringUtils.capitalize(text));
        System.out.println(WordUtils.capitalizeFully(text));
        System.out.println(StringUtils.reverse(text));
        System.out.println(StringUtils.repeat("*", 10));
        
        String[] words = StringUtils.split(text);
        for (String word : words) {
            System.out.println(word);
        }
    }
}
```

### 4. Apache Commons IO (v2.16.1)
**Purpose:** File and stream utilities

**Package:** `org.apache.commons.io.*`

**Example:**
```java
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import java.io.*;

public class Main {
    public static void main(String[] args) throws Exception {
        String content = "Hello from Commons IO!";
        
        System.out.println("File operations:");
        System.out.println("Content length: " + content.length());
        
        String[] lines = {"Line 1", "Line 2", "Line 3"};
        for (String line : lines) {
            System.out.println(line);
        }
    }
}
```

### 5. Apache Commons Math3 (v3.6.1)
**Purpose:** Mathematical and statistical operations

**Package:** `org.apache.commons.math3.*`

**Example:**
```java
import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;
import org.apache.commons.math3.util.FastMath;

public class Main {
    public static void main(String[] args) {
        DescriptiveStatistics stats = new DescriptiveStatistics();
        stats.addValue(10);
        stats.addValue(20);
        stats.addValue(30);
        stats.addValue(40);
        stats.addValue(50);
        
        System.out.println("Mean: " + stats.getMean());
        System.out.println("Median: " + stats.getPercentile(50));
        System.out.println("Std Dev: " + stats.getStandardDeviation());
        
        System.out.println("Fast Math:");
        System.out.println("Sin(45°): " + FastMath.sin(FastMath.toRadians(45)));
        System.out.println("Cos(45°): " + FastMath.cos(FastMath.toRadians(45)));
    }
}
```

### 6. Apache HttpClient5 (v5.3.1)
**Purpose:** HTTP client operations

**Package:** `org.apache.hc.client5.*`

**Note:** HTTP operations may not work in the compiler due to security restrictions.

### 7. JUnit Jupiter (v5.10.2)
**Purpose:** Unit testing framework

**Package:** `org.junit.jupiter.api.*`

**Example:**
```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("Testing calculator:");
        testAddition();
        testSubtraction();
    }
    
    static void testAddition() {
        int result = 2 + 2;
        if (result == 4) {
            System.out.println("✓ Addition test passed");
        } else {
            System.out.println("✗ Addition test failed");
        }
    }
    
    static void testSubtraction() {
        int result = 5 - 3;
        if (result == 2) {
            System.out.println("✓ Subtraction test passed");
        } else {
            System.out.println("✗ Subtraction test failed");
        }
    }
}
```

### 8. SLF4J (v2.0.13)
**Purpose:** Logging facade

**Package:** `org.slf4j.*`

**Example:**
```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Main {
    public static void main(String[] args) {
        System.out.println("Application started");
        System.out.println("Processing data...");
        System.out.println("Application completed");
    }
}
```

## Complete Example Using Multiple Libraries

```java
import com.google.gson.Gson;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;
import java.util.*;

public class Main {
    static class Student {
        String name;
        List<Double> grades;
        
        Student(String name, List<Double> grades) {
            this.name = name;
            this.grades = grades;
        }
    }
    
    public static void main(String[] args) {
        List<Double> grades = Arrays.asList(85.5, 90.0, 78.5, 92.0, 88.5);
        Student student = new Student("Alice", grades);
        
        System.out.println("Student Analysis");
        System.out.println("================");
        
        String formattedName = StringUtils.capitalize(student.name.toLowerCase());
        System.out.println("Name: " + formattedName);
        
        DescriptiveStatistics stats = new DescriptiveStatistics();
        for (double grade : student.grades) {
            stats.addValue(grade);
        }
        
        System.out.println("Average Grade: " + String.format("%.2f", stats.getMean()));
        System.out.println("Highest Grade: " + stats.getMax());
        System.out.println("Lowest Grade: " + stats.getMin());
        
        Gson gson = new Gson();
        String json = gson.toJson(student);
        System.out.println("\nJSON Representation:");
        System.out.println(json);
    }
}
```

## How It Works

1. All JAR files in `backend/libs/` are automatically included in the classpath
2. The compiler loads these libraries during compilation and execution
3. You can import and use any classes from these libraries
4. No additional configuration needed

## Viewing Available Libraries

Click the "Libraries" button in the compiler header to see all loaded libraries and their versions.

## Adding More Libraries

To add more JAR files:

1. Download the JAR file
2. Place it in `backend/libs/` directory
3. Restart the backend server
4. The library will be automatically available

## Limitations

- Single file compilation only
- Some features requiring external resources (HTTP, file system access) may be restricted
- No Maven dependency resolution (manual JAR management only)
- Execution timeout of 10 seconds

## Troubleshooting

**Issue:** Class not found error
- Verify the JAR file is in `backend/libs/`
- Check the import statement matches the package name
- Restart the backend server

**Issue:** NoClassDefFoundError
- Some libraries require additional dependencies
- Check if dependent JARs are also in `backend/libs/`

**Issue:** Library not showing in the list
- Ensure the file has `.jar` extension
- Restart the backend server
- Check backend console for errors
