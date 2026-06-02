import jdoodleService from './services/jdoodleService.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const code = `a = input("Enter first number: ")\nb = input("Enter second number: ")\nprint(a+b)`;
  console.log('--- Run 1 (no input) ---');
  let res1 = await jdoodleService.execute(code, 'python3', '');
  console.log(JSON.stringify(res1.output));
  
  console.log('--- Run 2 (input 13) ---');
  let res2 = await jdoodleService.execute(code, 'python3', '13\n');
  console.log(JSON.stringify(res2.output));
}

test();
