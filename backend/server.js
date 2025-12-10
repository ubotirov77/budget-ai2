// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 1000;

// Allow requests from anywhere (you can restrict later if you stop being lazy)
app.use(cors());
app.use(express.json());

// ---------- OPENAI CLIENT ----------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple health check
app.get("/", (req, res) => {
  res.send("Budget Tracker AI backend is running.");
});

// ---------- /analyze ENDPOINT ----------
app.post("/analyze", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Missing 'prompt' in request body (must be a string).",
      });
    }

    // Call OpenAI Responses API
    const response = await client.responses.create({
      model: "gpt-5.1-mini",
      input: prompt,
    });

    // Safely extract text (output_text is the helper)
    const text =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text?.value ||
      "";

    return res.json({
      analysis: text.trim() || "No analysis generated.",
    });
  } catch (err) {
    console.error("Error in /analyze:", err);

    return res.status(500).json({
      error: "AI analysis failed on the server.",
      details: process.env.NODE_ENV === "development" ? String(err) : undefined,
    });
  }
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
