// Fallback project templates when AI generation fails or times out
export const generateFallbackProjects = (language, roadmapPhase1) => {
  const lang = language.toLowerCase();
  
  const javaTemplates = [
    {
      concept: roadmapPhase1[0] || 'Variables and data types',
      title: 'Student Grade Calculator',
      description: 'Build a console application that stores and calculates student grades. Practice working with variables, basic math operations, and displaying formatted output.',
      requirements: `- Create variables to store student name and scores for 3 subjects
- Calculate the average score
- Display the student name, individual scores, and average
- Use appropriate data types (String, int, double)`,
      rubrics: `- Correctly declares and initializes variables (2 pts)
- Performs accurate average calculation (2 pts)
- Displays output in a clear, formatted way (1 pt)`
    },
    {
      concept: roadmapPhase1[1] || 'Conditional statements',
      title: 'Temperature Converter',
      description: 'Create a program that converts temperatures between Celsius and Fahrenheit. Use conditional statements to determine which conversion to perform based on user input.',
      requirements: `- Prompt user to choose conversion type (C to F or F to C)
- Read temperature value from user
- Use if-else statements to perform the correct conversion
- Display the converted temperature with proper unit`,
      rubrics: `- Correctly implements conditional logic (2 pts)
- Accurate conversion formulas (2 pts)
- Handles user input properly (1 pt)`
    },
    {
      concept: roadmapPhase1[2] || 'Loops and iteration',
      title: 'Multiplication Table Generator',
      description: 'Build a program that generates multiplication tables using loops. Practice loop control, formatting output, and working with nested loops.',
      requirements: `- Ask user which number's multiplication table to generate
- Use a for loop to calculate and display products (1 through 10)
- Format output in a readable table format
- Include proper column headers`,
      rubrics: `- Correctly implements loop structure (2 pts)
- Accurate calculations in each iteration (2 pts)
- Well-formatted table output (1 pt)`
    },
    {
      concept: roadmapPhase1[3] || 'Methods and functions',
      title: 'Simple Calculator',
      description: 'Create a calculator with separate methods for each operation. Practice method creation, parameters, return values, and organizing code into reusable functions.',
      requirements: `- Create methods for add, subtract, multiply, and divide operations
- Each method should accept two parameters and return the result
- Main method should call appropriate method based on user choice
- Handle division by zero with appropriate message`,
      rubrics: `- Correctly defines methods with parameters and return types (2 pts)
- Properly calls methods and uses return values (2 pts)
- Handles edge cases like division by zero (1 pt)`
    },
    {
      concept: roadmapPhase1[4] || 'Arrays and collections',
      title: 'Student Name Manager',
      description: 'Build a program that manages a list of student names using arrays. Practice array declaration, initialization, traversal, and basic array operations.',
      requirements: `- Create an array to store 5 student names
- Use Scanner to get names from user input
- Display all names in the array
- Find and display the longest name in the list`,
      rubrics: `- Correctly declares and populates array (2 pts)
- Successfully iterates through array to display all names (2 pts)
- Implements logic to find longest name (1 pt)`
    },
    {
      concept: roadmapPhase1[5] || 'String manipulation',
      title: 'Word Counter and Analyzer',
      description: 'Create a program that analyzes text input. Practice string methods, character manipulation, and string processing techniques.',
      requirements: `- Prompt user to enter a sentence
- Count total number of characters (excluding spaces)
- Count number of words in the sentence
- Convert sentence to uppercase and display it`,
      rubrics: `- Correctly counts characters and words (2 pts)
- Properly uses string methods (length, split, toUpperCase) (2 pts)
- Handles input and displays results clearly (1 pt)`
    }
  ];
  
  const pythonTemplates = [
    {
      concept: roadmapPhase1[0] || 'Variables and data types',
      title: 'Personal Budget Tracker',
      description: 'Build a console application that tracks personal expenses. Practice working with variables, basic math operations, and displaying formatted output.',
      requirements: `- Create variables to store income and expenses for different categories
- Calculate total expenses and remaining balance
- Display all financial information in a formatted way
- Use appropriate data types (str, int, float)`,
      rubrics: `- Correctly declares and initializes variables (2 pts)
- Performs accurate calculations (2 pts)
- Displays output in a clear, formatted way (1 pt)`
    },
    {
      concept: roadmapPhase1[1] || 'Conditional statements',
      title: 'Movie Ticket Price Calculator',
      description: 'Create a program that calculates movie ticket prices based on age and day. Use conditional statements to apply different pricing rules.',
      requirements: `- Prompt user for age and day of week
- Use if-elif-else statements to determine ticket price
- Apply discounts for children (< 12) and seniors (>= 65)
- Show final price with applied discount information`,
      rubrics: `- Correctly implements conditional logic (2 pts)
- Accurate price calculations with discounts (2 pts)
- Handles user input and displays results properly (1 pt)`
    },
    {
      concept: roadmapPhase1[2] || 'Loops (for/while)',
      title: 'Number Pattern Generator',
      description: 'Build a program that generates various number patterns using loops. Practice loop control, formatting output, and working with nested loops.',
      requirements: `- Generate a right triangle pattern of numbers
- Use nested loops to create the pattern
- Ask user for pattern height
- Display numbers incrementing in each row`,
      rubrics: `- Correctly implements loop structure (2 pts)
- Creates accurate pattern output (2 pts)
- Properly formats the display (1 pt)`
    },
    {
      concept: roadmapPhase1[3] || 'Functions and parameters',
      title: 'BMI Calculator',
      description: 'Create a BMI calculator with separate functions for calculations and categorization. Practice function creation, parameters, return values, and organizing code.',
      requirements: `- Create a function to calculate BMI from weight and height
- Create another function to categorize BMI (underweight, normal, overweight)
- Main program should call both functions
- Display BMI value and category to user`,
      rubrics: `- Correctly defines functions with parameters and return statements (2 pts)
- Accurate BMI calculation formula (2 pts)
- Proper function calls and result handling (1 pt)`
    },
    {
      concept: roadmapPhase1[4] || 'Lists and tuples',
      title: 'Shopping List Manager',
      description: 'Build a program that manages a shopping list using lists. Practice list operations including adding items, removing items, and displaying list contents.',
      requirements: `- Create an empty list to store shopping items
- Add at least 5 items to the list using input()
- Display all items in the list
- Count and display total number of items`,
      rubrics: `- Correctly creates and populates list (2 pts)
- Successfully adds items and displays list contents (2 pts)
- Implements item counting logic (1 pt)`
    },
    {
      concept: roadmapPhase1[5] || 'String operations',
      title: 'Username Validator',
      description: 'Create a program that validates usernames based on specific rules. Practice string methods, character checks, and string validation techniques.',
      requirements: `- Prompt user to enter a username
- Check if username length is between 6 and 12 characters
- Verify username contains only letters and numbers (no spaces)
- Display whether username is valid or invalid with reason`,
      rubrics: `- Correctly checks string length (2 pts)
- Properly validates character types using string methods (2 pts)
- Provides clear validation feedback to user (1 pt)`
    }
  ];
  
  const templates = lang === 'java' ? javaTemplates : pythonTemplates;
  
  return templates.map((template, index) => ({
    title: template.title,
    description: template.description,
    language: language,
    requirements: template.requirements,
    rubrics: template.rubrics
  }));
};
