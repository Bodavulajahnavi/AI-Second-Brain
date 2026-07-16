# 🧠 AI Second Brain

An interactive, personal knowledge management system and digital second brain. It allows you to organize your thoughts, link notes using Obsidian-style double-bracket links `[[Like This]]`, visualize your knowledge network in an interactive dynamic graph, and chat with an intelligent **AI Copilot** that has full contextual recall of your entire note library.

---

## ✨ Features

- **🌐 Interactive Knowledge Graph**: Visualize your personal thoughts as a network. Nodes represent your notes, and connections (edges) represent links, rendered dynamically.
- **🔗 Double-Bracket Linking**: Create relationships between notes instantly by typing `[[Note Name]]` directly in your note content (e.g., `[[Artificial Intelligence]]`).
- **🔍 Deep Inspector & Backlinks**:
  - **Outgoing Connections**: See which notes the current note points to.
  - **Backlinks (Incoming Connections)**: Automatically index and display every note that links *to* the current note for bidirectional navigation.
- **🤖 Contextual AI Copilot**: Engage with an integrated assistant powered by Google Gemini. The copilot reads and reasons over the context of your notes to answer queries and find hidden insights.
- **📝 Markdown Editor**: Easily write and revise your notes, complete with titles, custom tags, and rich Markdown representation.

---

## 🛠️ Local Installation & Setup

Follow these steps to set up and run **AI Second Brain** on your local machine:

### Prerequisite

Ensure you have **Node.js** (v18 or higher) installed. You can also use **Bun** if preferred.

### 1. Clone the Repository

```bash
git clone https://github.com/Bodavulajahnavi/AI-Second-Brain.git
cd AI-Second-Brain
```

### 2. Install Dependencies

Install the required npm packages using your package manager:

```bash
npm install
```

*(Or if you use Bun)*
```bash
bun install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory. You can copy the template provided in `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and set your **Gemini API Key**:

```env
# Get a free API key from https://aistudio.google.com/
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

### 4. Run the Development Server

Start the full-stack development server (Express backend + Vite frontend):

```bash
npm run dev
```

The application will be running locally at:
👉 **http://localhost:3000**

---

## 🚀 Production Deployment

To build and run the application in production mode:

1. **Build the Application**:
   ```bash
   npm run build
   ```
   This compiles your frontend into static assets and bundles the custom Express backend into `dist/server.cjs` using `esbuild`.

2. **Start the Production Server**:
   ```bash
   npm run start
   ```

---

## 🔑 How to Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key**.
3. Create a new key (free tier available) and copy it.
4. Add it to your `.env` file as `GEMINI_API_KEY="your-key"`.

---

## 💻 Technical Stack

- **Frontend**: React, Tailwind CSS (v4), Motion (for fluid animations), Lucide React (Icons).
- **Backend**: Express, Node.js (bundled with `esbuild`).
- **AI Integration**: `@google/genai` (Official Google GenAI SDK).
- **Language**: TypeScript.
