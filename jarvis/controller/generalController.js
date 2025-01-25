import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

// Constants
const MODEL_NAME = "gemini-1.5-flash";

// Error messages
const ERROR_MESSAGES = {
  GENERAL: "Failed to generate response",
  API_KEY: "Missing Gemini API key",
  INVALID_QUERY: "This query should be handled by the app controller.",
};

// Prompts
const PROMPTS = {
  GENERAL: (query) => `Pretend you are a helpful chat-bot. Respond to the following query in a friendly and informative manner: '${query}'`,
};

// Initialize Google Generative AI
if (!process.env.GEMINI_API_KEY) {
  throw new Error(ERROR_MESSAGES.API_KEY);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

/**
 * Generates a general response for non-app-related queries
 * @param {string} query - User's input query
 * @returns {Promise<string>} General response
 */
const generateGeneralResponse = async (query) => {
  try {
    const result = await model.generateContent(PROMPTS.GENERAL(query));
    return result.response.text();
  } catch (error) {
    console.error("Error generating general response:", error);
    throw new Error(ERROR_MESSAGES.GENERAL);
  }
};

/**
 * Main controller for handling general conversations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generalController = async (req, res) => {
  try {
    const { message } = req.body;

    // Check if the query contains the word "app"
   

    // Handle general queries
    const generalResponse = await generateGeneralResponse(message);
    return res.status(200).json({ response: generalResponse });
  } catch (error) {
    console.error("Controller error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export default generalController;