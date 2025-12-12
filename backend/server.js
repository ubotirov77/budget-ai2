import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is missing");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (req, res) => {
  res.send("Budget AI backend is alive.");
});

app.post("/analyze", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ analysis: "Invalid prompt." });
    }

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt
    });

    const text = response.output_text || "No analysis generated.";

    res.json({ analysis: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      analysis: "Server error while talking to AI."
    });
  }
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
