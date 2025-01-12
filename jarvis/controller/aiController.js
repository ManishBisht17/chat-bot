import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import readline from 'readline';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Generate concise ideas
const generateIdeas = async (query) => {
  try {
    const result = await model.generateContent(query);
    return result.response
      .text()
      .split('\n')
      .filter((line) => line.trim())
      .slice(0, 3);
  } catch (error) {
    console.error("Error generating ideas:", error);
    throw new Error("Failed to generate ideas");
  }
};

// Handle user input from the terminal
const handleUserChoice = (ideas) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("Generated ideas:");
  ideas.forEach((idea, i) => console.log(`${i + 1}. ${idea}`));

  rl.question("Choose an idea by typing its number: ", async (input) => {
    const choice = parseInt(input, 10) - 1;
    if (choice < 0 || choice >= ideas.length) {
      console.error("Invalid choice.");
      rl.close();
      return;
    }

    try {
      const result = await model.generateContent(`Provide a detailed suggestion for: "${ideas[choice]}"`);
      console.log("\nDetailed Suggestion:\n", result.response.text());
    } catch (error) {
      console.error("Error generating suggestion:", error);
    } finally {
      rl.close();
    }
  });
};

// AI Controller for API endpoint
const aiController = async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ error: "Invalid input." });

  const query = `Generate three concise app ideas based on: '${userMessage}'`;

  try {
    const ideas = await generateIdeas(query);
    console.log("Ideas generated. Awaiting user selection...");
    handleUserChoice(ideas);
    res.status(200).json({ message: "Ideas generated. Check terminal for details." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default aiController;
