import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Constants
const MIN_IDEAS = 3;
const MODEL_NAME = "gemini-1.5-flash";
const PLACEHOLDER_IDEA = "Additional innovative app idea will be generated";

// prompts and md handling
const PROMPTS = {
  IDEAS: (query) =>
    `Pretend you are a helpful chat-bot. Provide three concise, one-liner app ideas based on the following query: '${query}'`,
  SUGGESTION: (idea) => `
    Provide a detailed suggestion for building an app based on the following idea: "${idea}".
    Format the response in markdown with the following sections:

    ## Technologies Required
    - List the required technologies
    
    ## Development Approach
    - Describe the recommended methodology
    
    ## Tools & Resources
    - List helpful tools, frameworks, and APIs
    
    ## Implementation Tips
    - Provide practical development advice

    ## Deploying Sites
    -  According to the app provide the deploying sites
    
    Please ensure each section is properly formatted with markdown headers and bullet points.
  `,
};

// Initialize Google Generative AI
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing Gemini API key");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

/**
 * Generates app ideas based on user query
 * @param {string} query - User's input query
 * @returns {Promise<string[]>} Array of generated ideas
 */
const generateIdeas = async (query) => {
  try {
    const result = await model.generateContent(PROMPTS.IDEAS(query));
    const generatedIdeas = result.response
      .text()
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((idea) => idea.replace(/^\d+\.\s*/, "")); // Remove any numbering

    // Ensure minimum number of ideas
    while (generatedIdeas.length < MIN_IDEAS) {
      generatedIdeas.push(PLACEHOLDER_IDEA);
    }

    return generatedIdeas.slice(0, MIN_IDEAS);
  } catch (error) {
    console.error("Error generating ideas:", error);
    throw new Error("Failed to generate ideas");
  }
};

/**
 * Generates detailed suggestion for an app idea
 * @param {string} idea - Selected app idea
 * @returns {Promise<string>} Detailed suggestion
 */
const generateDetailedSuggestion = async (idea) => {
  try {
    const result = await model.generateContent(PROMPTS.SUGGESTION(idea));
    return result.response.text();
  } catch (error) {
    console.error("Error generating detailed suggestion:", error);
    throw new Error("Failed to generate detailed suggestion");
  }
};

/**
 * Validates and sanitizes the selected ideas
 * @param {number[]} selectedIdeas - Array of selected idea indices
 * @param {string[]} choices - Available choices
 * @returns {boolean} Validation result
 */
const validateSelection = (selectedIdeas, choices) => {
  return (
    Array.isArray(selectedIdeas) &&
    selectedIdeas.every(
      (index) => Number.isInteger(index) && index > 0 && index <= choices.length
    )
  );
};

/**
 * Main controller for handling AI requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const aiController = async (req, res) => {
  try {
    const { message, selectedIdeas, choices } = req.body;

    // Handle initial query and the 3 ideas
    if (message && typeof message === "string") {
      const ideas = await generateIdeas(message);
      return res.status(200).json({
        query: message,
        choices: ideas.map((idea, index) => `${index + 1}. ${idea}`),
      });
    }

    // Handle idea selection
    if (selectedIdeas && choices) {
      if (!validateSelection(selectedIdeas, choices)) {
        return res.status(400).json({
          error: "Invalid input. Please provide a valid message or selection.",
        });
      }

      const detailedSuggestions = await Promise.all(
        selectedIdeas.map(async (selectedIndex) => ({
          idea: choices[selectedIndex - 1],
          suggestion: await generateDetailedSuggestion(
            choices[selectedIndex - 1]
          ),
        }))
      );

      return res.status(200).json({ detailedSuggestions });
    }

    return res
      .status(400)
      .json({
        error: "Invalid input. Please provide a valid message or selection.",
      });
  } catch (error) {
    console.error("Controller error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export default aiController;
