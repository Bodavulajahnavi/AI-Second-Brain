import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy-initialize Gemini client to prevent crashing on startup if the key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Context-aware AI Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, notesContext } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      const client = getGeminiClient();

      const systemInstruction = `You are "Claude AI Assistant" (represented inside the AI Second Brain workspace), an incredibly powerful, intuitive assistant that has perfect, instant recall of the user's notes and intellectual connections.

Here is the exact state of the user's Obsidian Second Brain Notes:
==================================================
${notesContext ? notesContext : "No notes have been added to the knowledge base yet."}
==================================================

Guidelines for your response:
1. Synthesize information from the user's notes above to answer their prompt with perfect relevance.
2. If notes contain references to other notes using Obsidian syntax like [[Note Name]], highlight these connections and make references clear.
3. If the user's prompt is not covered in their notes, explain the concept clearly but state: "*(Note: This is synthesized from my global knowledge base, as it wasn't found in your active notes)*".
4. Format your response beautifully in Markdown. Use clean bullet points, bold key terms, and code blocks if appropriate.
5. Proactively suggest useful tags or conceptual connections with existing notes. E.g., "This relates closely to your research on [[Artificial Intelligence]]".
6. Keep your tone sleek, modern, highly encouraging, and intellectual. You are their secondary neocortex.`;

      // Map incoming standard chat format to GoogleGenAI SDK format:
      // { role: 'user' | 'model', parts: [{ text: string }] }
      const contents = messages.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ content: response.text || "I was unable to synthesize a response." });
    } catch (error: any) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: error.message || "Failed to communicate with Gemini API." });
    }
  });

  // AI Connection Suggestion / Smart Note Recommender
  app.post("/api/suggest-note", async (req, res) => {
    try {
      const { noteTitle, noteContent, allNotes } = req.body;
      const client = getGeminiClient();

      const systemInstruction = `You are an Obsidian Second Brain ideation engine.
Analyze the user's selected note (title, content) and other notes in their vault. Suggest a brand-new note that would expand their second brain in a highly valuable way.

You MUST respond strictly with a valid JSON object matching this TypeScript type:
{
  title: string;       // Creative, concise title of the recommended note
  tags: string;        // Comma-separated list of 2-4 tags
  content: string;     // Full markdown content of the suggested note, containing at least one bracketed link back to the source note e.g. [[Source Title]]
  reason: string;      // A single sentence explaining why this note is a valuable connection
}

Do not include any backticks or markdown wrapping in your response (e.g. do NOT wrap in \`\`\`json). Return the pure JSON text only.`;

      const prompt = `Selected Source Note:
Title: "${noteTitle}"
Content:
${noteContent}

Other notes in vault to connect with:
${allNotes && allNotes.length > 0 ? JSON.stringify(allNotes) : "None"}`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      const resultText = response.text || "{}";
      res.json(JSON.parse(resultText.trim()));
    } catch (error: any) {
      console.error("Suggest Note Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate smart suggestion." });
    }
  });

  // Mount Vite development middleware vs production static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
