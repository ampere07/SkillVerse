import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID;
const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET;

/**
 * Service for interacting with the JDoodle API to compile and execute code online.
 */
class JDoodleService {
  /**
   * Executing code on JDoodle.
   * @param {string} script - The source code to execute.
   * @param {string} language - The programming language ('java', 'python3', etc.)
   * @param {string} stdin - Optional input for the program.
   * @returns {Promise<Object>} The API response from JDoodle.
   */
  async execute(script, language, stdin = '') {
    if (!JDOODLE_CLIENT_ID || !JDOODLE_CLIENT_SECRET) {
      throw new Error('JDoodle API credentials are not configured in .env file.');
    }

    // Map common names to JDoodle-specific language identifiers and version indexes.
    const languageConfig = {
      java: { language: 'java', versionIndex: '4' }, // JDK 17
      python: { language: 'python3', versionIndex: '4' }, // Python 3.10.0
      python3: { language: 'python3', versionIndex: '4' },
    };

    const config = languageConfig[language.toLowerCase()];
    if (!config) {
      throw new Error(`Unsupported language for JDoodle: ${language}`);
    }

    try {
      const response = await axios.post('https://api.jdoodle.com/v1/execute', {
        clientId: JDOODLE_CLIENT_ID,
        clientSecret: JDOODLE_CLIENT_SECRET,
        script: script,
        stdin: stdin,
        language: config.language,
        versionIndex: config.versionIndex,
      });

      return {
        success: true,
        output: response.data.output,
        statusCode: response.data.statusCode,
        memory: response.data.memory,
        cpuTime: response.data.cpuTime,
      };
    } catch (error) {
      console.error('JDoodle API error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Check how many credits are remaining on the JDoodle account.
   */
  async getCreditUsage() {
    if (!JDOODLE_CLIENT_ID || !JDOODLE_CLIENT_SECRET) {
      throw new Error('JDoodle API credentials are not configured.');
    }

    try {
      const response = await axios.post('https://api.jdoodle.com/v1/credit-spent', {
        clientId: JDOODLE_CLIENT_ID,
        clientSecret: JDOODLE_CLIENT_SECRET,
      });
      return response.data;
    } catch (error) {
      console.error('JDoodle Credit API error:', error.message);
      throw error;
    }
  }
}

export default new JDoodleService();
