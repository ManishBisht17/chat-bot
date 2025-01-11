import dotenv from 'dotenv';
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper function to generate AI ideas
const  generateIdeas = async(query) =>{
  try {
    const result = await model.generateContent(query);
    const ideas = result.response.text().split('\n').filter((line) => line.trim() !== '');
    return ideas.slice(0, 3); // Return the first 3 ideas
  } catch (error) {
    console.error("Error generating ideas:", error);
    throw new Error("Failed to generate ideas");
  }
}

// Endpoint to query AI
app.post('/query', async (req, res) => {
  const userQuery =` Prented Your are a helper chat-bot, when user says greets response plitely like  and start with your response not identify what ever you tell to pretent to' Hi , i am Jarvis the chat-bot what can i help you ' ${req.body.message}`  ;
  
  try {
    // Step 1: Generate three ideas
    const ideas = await generateIdeas(userQuery);

    // Send the ideas to the user
    if(req.body.message=='hi' || 'hello' || 'jarvis'){

      return  res.json({
        ideas: ideas.map((idea) => ({ text: idea })),
      });
    }else{
    res.json({
      message: "Choose two ideas by typing their numbers (e.g., '1 and 3'):",
      ideas: ideas.map((idea, index) => ({ id: index + 1, text: idea })),
    });
  }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to receive user choices and give detailed suggestions
app.post('/choose', async (req, res) => {
  const { choices, ideas } = req.body; // Choices: e.g., "1 and 3", Ideas: Array of generated ideas
  
  if (!choices || !ideas || !Array.isArray(ideas)) {
    return res.status(400).json({ error: "Invalid input. Please provide valid choices and ideas." });
  }

  const chosenIndices = choices.split(' and ').map(Number).map((num) => num - 1);
  const chosenIdeas = chosenIndices.map((index) => ideas[index]);

  if (chosenIdeas.some((idea) => !idea)) {
    return res.status(400).json({ error: "Invalid choice. Please ensure your choices match the given ideas." });
  }

  try {
    // Generate detailed suggestions for each chosen idea
    const detailedSuggestions = await Promise.all(
      chosenIdeas.map(async (idea) => {
        const result = await model.generateContent(`Provide a detailed suggestion for: ${idea}`);
        return { idea, suggestion: result.response.text() };
      })
    );

    res.json({ detailedSuggestions });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate detailed suggestions" });
  }
});

app.listen(PORT, () => {
  console.log(`SERVER IS RUNNING ON PORT ${PORT}`);
});
