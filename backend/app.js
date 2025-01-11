import dotenv from 'dotenv';
import express from 'express';
import {GoogleGenerativeAI} from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Endpoint to query AI
app.post('/query', async (req, res) => {
  const message = req.body.message || "Explain how AI works"; // Default prompt if not provided
  try {
    const result = await model.generateContent(message);
    const responseText = result.response.text();
    res.json({ message: responseText });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating response');
  }
});

app.listen(PORT, () => {
  console.log(`SERVER IS RUNNING ON PORT ${PORT}`);
});
