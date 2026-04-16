import axios from 'axios';

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
    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('[JDoodle] API credentials missing in environment variables');
      return { success: false, error: 'Compiler API credentials not configured.' };
    }

    // Map common names to JDoodle-specific language identifiers and version indexes.
    const languageConfig = {
      java: { language: 'java', versionIndex: '4' }, // JDK 17
      python: { language: 'python3', versionIndex: '4' }, // Python 3.10.0
      python3: { language: 'python3', versionIndex: '4' },
    };

    const config = languageConfig[language.toLowerCase()];
    if (!config) {
      console.error(`[JDoodle] Unsupported language: ${language}`);
      return { success: false, error: `Unsupported language: ${language}` };
    }

    try {
      console.log(`[JDoodle] Sending request for ${language}...`);
      const response = await axios.post('https://api.jdoodle.com/v1/execute', {
        clientId: clientId,
        clientSecret: clientSecret,
        script: script,
        stdin: stdin,
        language: config.language,
        versionIndex: config.versionIndex,
      }, {
        timeout: 15000 // 15 second timeout for production
      });

      if (response.data.error) {
        console.error(`[JDoodle API Result Error] ${response.data.error}`);
        return {
          success: false,
          error: response.data.error
        };
      }

      console.log(`[JDoodle] Execution successful for ${language}`);
      return {
        success: true,
        output: response.data.output,
        statusCode: response.data.statusCode,
        memory: response.data.memory,
        cpuTime: response.data.cpuTime,
      };
    } catch (error) {
      const errorDetail = error.response?.data?.error || error.message;
      console.error(`[JDoodle Connection Error] ${errorDetail}`);
      
      let friendlyError = 'An error occurred while connecting to the online compiler.';
      if (error.code === 'ECONNABORTED') {
        friendlyError = 'The online compiler took too long to respond. Please try again.';
      } else if (errorDetail.includes('Unauthorized')) {
        friendlyError = 'Invalid API credentials. Please check server configuration.';
      } else if (errorDetail.includes('Daily limit reached')) {
        friendlyError = 'Daily compiler limit reached. Please try again tomorrow.';
      }
      
      return {
        success: false,
        error: friendlyError,
      };
    }
  }

  /**
   * Check how many credits are remaining on the JDoodle account.
   */
  async getCreditUsage() {
    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('JDoodle API credentials are not configured.');
    }

    try {
      const response = await axios.post('https://api.jdoodle.com/v1/credit-spent', {
        clientId: clientId,
        clientSecret: clientSecret,
      });
      return response.data;
    } catch (error) {
      console.error('JDoodle Credit API error:', error.message);
      throw error;
    }
  }
}

export default new JDoodleService();
