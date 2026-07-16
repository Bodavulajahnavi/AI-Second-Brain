import { Note } from "./types";

export const initialNotes: Note[] = [
  {
    id: "1",
    title: "AI Second Brain Concepts",
    content: `An AI Second Brain acts as an external neocortex. By feeding custom local notes directly to Large Language Models (like Gemini or Claude), we bypass context limitations and construct powerful personal RAG (Retrieval-Augmented Generation) pipelines. 

To make your Second Brain highly effective:
- Keep notes highly atomic (focus on a single topic)
- Interlink notes frequently using double bracket notation like [[Obsidian Workspace Setup]]
- Apply clear tags for semantic clustering
- Let the AI Assistant suggest connections you might have missed!`,
    tags: ["workflow", "productivity", "ai"],
    createdAt: "2026-07-15T10:00:00Z",
    updatedAt: "2026-07-15T12:00:00Z",
  },
  {
    id: "2",
    title: "Deep Learning Foundations",
    content: `Deep learning forms the core mathematical foundation of modern sequence models and generative neural systems. 

Key concepts to master:
- Backpropagation and Gradient Descent
- Vector Embeddings and Cosine Similarity
- Sequence-to-Sequence architectures
- The attention heads used inside modern transformers.

These foundations are critical to understand before deep diving into [[Transformer Architecture]] details.`,
    tags: ["neural-networks", "ai", "research"],
    createdAt: "2026-07-15T10:15:00Z",
    updatedAt: "2026-07-15T10:15:00Z",
  },
  {
    id: "3",
    title: "Transformer Architecture",
    content: `The Transformer attention mechanism (originally introduced in "Attention Is All You Need") allows complete parallelization of sequence processing. It serves as the primary backbone of state-of-the-art LLMs including Claude and Gemini.

Key innovations:
- Multi-Head Self-Attention: captures dependencies regardless of positional distance.
- Positional Encoding: injects word order back into parallel embeddings.
- Layer Normalization and Residual Connections.

These transformers are what allow the integrated Assistant to make sense of your connected vault notes in [[AI Second Brain Concepts]].`,
    tags: ["ai", "research", "machine-learning"],
    createdAt: "2026-07-15T10:30:00Z",
    updatedAt: "2026-07-15T11:45:00Z",
  },
  {
    id: "4",
    title: "Obsidian Workspace Setup",
    content: `Obsidian is a powerful, local-first markdown editor that stores files in plain-text folders (vaults). It is the perfect visual knowledge base for organizing your Second Brain.

Recommended vault configuration:
- Use standard folder-less structures; let [[Personal Knowledge Management (PKM)]] link topics instead of deep folders.
- Enable the native Graph View to visualize connection clusters in real-time.
- Configure hotkeys for quick note creation and linking.
- Keep your notes synchronized to power AI Assistant context injection!`,
    tags: ["obsidian", "productivity", "workflow"],
    createdAt: "2026-07-15T11:00:00Z",
    updatedAt: "2026-07-15T11:00:00Z",
  },
  {
    id: "5",
    title: "Personal Knowledge Management (PKM)",
    content: `PKM is the disciplined practice of collecting, curating, synthesizing, and creating knowledge. 

Unlike traditional folder hierarchies that isolate ideas, modern bi-directional link graphs encourage unexpected associations:
- Bidirectional Links: links from Note A to Note B automatically record backlinks from B to A.
- Emergent Structure: hierarchies emerge organically through 'Map of Content' (MOC) index notes rather than forced folders.

This workflow is highly synergized with [[Obsidian Workspace Setup]] and makes your prompt context much cleaner.`,
    tags: ["workflow", "organization", "pkm"],
    createdAt: "2026-07-15T11:20:00Z",
    updatedAt: "2026-07-15T11:30:00Z",
  },
];
