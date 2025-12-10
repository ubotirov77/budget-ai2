// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ---------- MIDDLEWARE ----------
app.use(cors());                   // allow all origins (GitHub Pages, etc.)
app.use(express.json());           // parse JSON body

// ---------- OPENAI CLIENT ----------
if (!process.env.OPENAI_API_KEY) {
  console.warn("WARNING: OPENAI_API_KEY is not set!");
}
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ---------- ROUTES ----------

// Health check
app.get("/", (req, res) => {
  res.send("Budget AI backend is alive.");
});

// Main analyze route
app.post("/analyze", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ analysis: "Invalid prompt." });
    }

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    const text =
      completion.output?.[0]?.content?.[0]?.text ||
      "No analysis generated.";

    res.json({ analysis: text });
  } catch (err) {
    console.error("OpenAI error:", err);
    res.status(500).json({
      analysis: "Server error while talking to AI. Check backend logs."
    });
  }
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
