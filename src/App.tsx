import React, { useState, useEffect } from "react";
import { Note } from "./types";
import { initialNotes } from "./data";
import KnowledgeGraph from "./components/KnowledgeGraph";
import NoteInspector from "./components/NoteInspector";
import AICopilot from "./components/AICopilot";
import OverviewSection from "./components/OverviewSection";
import {
  Search,
  Plus,
  Compass,
  MessageSquare,
  Sparkles,
  Layers,
  BookOpen,
  Hash,
  X,
} from "lucide-react";

export default function App() {
  // Load notes from localStorage or fallback to defaults
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem("ai_second_brain_notes");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse notes from storage", e);
      }
    }
    return initialNotes;
  });

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    return notes.length > 0 ? notes[0].id : null;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<"inspector" | "chat">("inspector");

  // Note Creation Inline Form state
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("ai_second_brain_notes", JSON.stringify(notes));
  }, [notes]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  // Save modified note
  const handleSaveNote = (updatedNote: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
  };

  // Delete note
  const handleDeleteNote = (noteId: string) => {
    const remaining = notes.filter((n) => n.id !== noteId);
    setNotes(remaining);
    if (selectedNoteId === noteId) {
      setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Add new note (from creator or AI suggestion acceptance)
  const handleAddNote = (title: string, content: string, tags: string[]) => {
    const newNote: Note = {
      id: Math.random().toString(),
      title: title.trim() || "Untitled Note",
      content: content.trim() || "Empty note content.",
      tags: tags.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    setIsCreatingNote(false);
    setNewTitle("");
    setNewContent("");
    setNewTags("");
  };

  // Trigger creating standard note
  const handleCreateNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = newTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    handleAddNote(newTitle, newContent, tagsArray);
  };

  // Extract all unique tags in the system
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  // Filter notes based on search & tags
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || note.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] font-sans flex flex-col selection:bg-white/10 selection:text-white relative overflow-x-hidden">
      {/* Background radial highlight - Soft white and blue ambient glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[300px] bg-white/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Primary Container */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-grow flex flex-col gap-6">
        
        {/* Header Module */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1.5">
            {/* Top Badge matching the screenshot, using the theme styling */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
              <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.2em] text-white/60">
                AI Knowledge Orchestrator
              </span>
            </div>
            
            {/* Display Title - Serif Elegant pairing */}
            <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-white font-serif italic">
              AI Second Brain
            </h1>
            <p className="text-white/40 text-xs sm:text-sm max-w-2xl leading-relaxed">
              An intelligent context vault that indexes, connects, and supplies your local knowledge notes directly to Claude Desktop.
            </p>
          </div>

          {/* Connected Vault Status Indicators */}
          <div className="flex flex-wrap items-center gap-3 bg-[#0D0D0D] border border-white/10 rounded-2xl p-3.5 shadow-lg">
            <div className="flex items-center gap-2 pr-3.5 border-r border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
              </span>
              <div className="text-left leading-none">
                <p className="text-[9px] font-mono font-medium text-white/40 uppercase tracking-wider">Claude Desktop</p>
                <p className="text-xs font-semibold text-blue-400">Agent Connected</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/30 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.4)]"></span>
              </span>
              <div className="text-left leading-none">
                <p className="text-[9px] font-mono font-medium text-white/40 uppercase tracking-wider">Obsidian Vault</p>
                <p className="text-xs font-semibold text-white/80">Synced ({notes.length} notes)</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-grow">
          
          {/* COLUMN 1: Tools & Document List (lg:col-span-3) */}
          <section className="lg:col-span-3 flex flex-col gap-5 h-full">
            
            {/* Connected Tools section (Exactly like mockup left rails) */}
            <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 space-y-3.5 shadow-xl">
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/40 font-semibold">
                Connected Workspace Tools
              </p>

              <div className="space-y-2">
                {/* Claude Integration */}
                <div className="flex items-center gap-3 bg-[#141414] border border-white/5 rounded-xl p-3 hover:border-white/20 transition group cursor-pointer">
                  {/* Custom Claude Logo (Sophisticated dark) */}
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0 group-hover:bg-white/10 transition">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="text-xs font-semibold text-white group-hover:text-white transition">Claude Desktop</h3>
                    <p className="text-[10px] text-white/40 font-mono truncate">AI Context Assistant</p>
                  </div>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                </div>
                {/* Obsidian Integration */}
                <div className="flex items-center gap-3 bg-[#141414] border border-white/5 rounded-xl p-3 hover:border-white/20 transition group cursor-pointer">
                  {/* Custom Obsidian Logo (Sophisticated dark) */}
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0 group-hover:bg-white/10 transition">
                    <Layers className="w-4 h-4 text-white/80" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="text-xs font-semibold text-white group-hover:text-white transition">Obsidian Vault</h3>
                    <p className="text-[10px] text-white/40 font-mono truncate">Knowledge Base</p>
                  </div>
                  <span className="w-1.5 h-1.5 bg-white/60 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]"></span>
                </div>
              </div>
            </div>

            {/* Obsidian Notes List */}
            <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 flex-grow flex flex-col gap-4 shadow-xl min-h-[350px]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/40 font-semibold">
                  Indexed Notes ({filteredNotes.length})
                </p>
                <button
                  onClick={() => setIsCreatingNote(true)}
                  className="p-1 hover:bg-white/5 text-white hover:text-white border border-white/10 rounded-lg transition"
                  title="Create New Note"
                  id="btn-create-note-trigger"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Search note bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter vault..."
                  className="w-full bg-[#141414] border border-white/10 text-xs text-white rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-white/30 transition font-sans"
                  id="search-notes-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-3 text-white/40 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Tag filters section */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1 py-1 max-h-[70px] overflow-y-auto">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`text-[9px] font-mono px-2.5 py-1 rounded-full border transition-all duration-200 cursor-pointer ${
                      !selectedTag
                        ? "bg-white/10 border-white/25 text-white font-medium shadow-sm"
                        : "bg-[#141414] border-white/5 text-white/40 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    #all
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                      className={`text-[9px] font-mono px-2.5 py-1 rounded-full border transition-all duration-200 flex items-center gap-0.5 cursor-pointer ${
                        tag === selectedTag
                          ? "bg-white/10 border-white/25 text-white font-medium shadow-sm"
                          : "bg-[#141414] border-white/5 text-white/40 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Hash className="w-2.5 h-2.5 text-white/30" />
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Active list container */}
              <div className="flex-grow overflow-y-auto space-y-2 max-h-[350px]">
                {isCreatingNote ? (
                  /* Creator Inline Form */
                  <form
                    onSubmit={handleCreateNoteSubmit}
                    className="bg-[#141414] border border-white/15 rounded-xl p-3 space-y-3 shadow-lg"
                    id="form-create-note"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-[9px] font-mono text-white/80 font-semibold uppercase tracking-wider">
                        New Note
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCreatingNote(false)}
                        className="text-white/40 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Title e.g. Quantum Physics"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 transition"
                      id="input-new-title"
                    />

                    <input
                      type="text"
                      placeholder="Tags e.g. tech, science"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 transition"
                      id="input-new-tags"
                    />

                    <textarea
                      required
                      placeholder="Content (use [[Link]] to link notes)"
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      rows={4}
                      className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-white/30 resize-none font-mono"
                      id="input-new-content"
                    />

                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsCreatingNote(false)}
                        className="text-[10px] text-white/55 px-2 py-1 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="text-[10px] bg-white hover:bg-white/90 text-black font-semibold rounded px-3 py-1 cursor-pointer transition-colors"
                      >
                        Create Note
                      </button>
                    </div>
                  </form>
                ) : filteredNotes.length > 0 ? (
                  /* Standard note listing */
                  filteredNotes.map((note) => {
                    const isSelected = note.id === selectedNoteId;
                    return (
                      <div
                        key={note.id}
                        onClick={() => setSelectedNoteId(note.id)}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-white/5 border-white/20 shadow-md"
                            : "bg-[#141414] border-white/5 hover:bg-white/5 hover:border-white/10"
                        }`}
                        id={`note-item-${note.id}`}
                      >
                        <h4 className={`text-xs font-semibold truncate ${isSelected ? "text-white font-serif italic" : "text-white/80"}`}>
                          {note.title}
                        </h4>
                        <p className="text-[10px] text-white/40 mt-1 line-clamp-2 leading-relaxed">
                          {note.content.replace(/\[\[(.*?)\]\]/g, "$1")}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-[8px] font-mono text-white/30">
                          <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                          <span className="bg-[#0D0D0D] px-1.5 py-0.5 rounded border border-white/5">
                            Tags: {note.tags.length}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-white/30 font-mono italic text-center py-4">
                    No matching notes found.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* COLUMN 2: Knowledge Graph Visualizer (lg:col-span-5) */}
          <section className="lg:col-span-5 h-[400px] lg:h-full">
            <KnowledgeGraph
              notes={notes}
              selectedNoteId={selectedNoteId}
              onSelectNote={(id) => {
                setSelectedNoteId(id);
                setActiveRightTab("inspector");
              }}
            />
          </section>

          {/* COLUMN 3: Right Action panel (Editor or AI Chat) (lg:col-span-4) */}
          <section className="lg:col-span-4 flex flex-col h-full min-h-[450px]">
            {/* Tab switch bar */}
            <div className="flex bg-[#0D0D0D] border border-white/10 rounded-xl p-1 mb-4 shadow-md">
              <button
                onClick={() => setActiveRightTab("inspector")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  activeRightTab === "inspector"
                    ? "bg-white/5 border border-white/10 text-white shadow font-medium"
                    : "text-white/40 hover:text-white"
                }`}
                id="tab-inspector"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Note Editor
              </button>
              <button
                onClick={() => setActiveRightTab("chat")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  activeRightTab === "chat"
                    ? "bg-white/5 border border-white/10 text-white shadow font-medium"
                    : "text-white/40 hover:text-white"
                }`}
                id="tab-ai-chat"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                AI Assistant
              </button>
            </div>

            {/* Active Tab Panel */}
            <div className="flex-grow">
              {activeRightTab === "inspector" ? (
                <NoteInspector
                  note={selectedNote}
                  allNotes={notes}
                  onSave={handleSaveNote}
                  onDelete={handleDeleteNote}
                  onSelectNote={(id) => setSelectedNoteId(id)}
                  onAddNote={handleAddNote}
                />
              ) : (
                <AICopilot
                  notes={notes}
                  selectedNote={selectedNote}
                  onSelectNote={(id) => {
                    setSelectedNoteId(id);
                    setActiveRightTab("inspector");
                  }}
                />
              )}
            </div>
          </section>

        </main>

        {/* Benefits Overview grid matching the screenshot */}
        <section className="mt-4">
          <OverviewSection />
        </section>

        {/* Footer containing the STACK banner */}
        <footer className="mt-8 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/30">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50">STACK</span>
            <span className="text-white/10">|</span>
            <span className="text-white/40">Powerful together</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-white/60 font-semibold">Claude Desktop</span>
              <span className="text-[10px] text-white/80 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                AI Assistant
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-white/70 shrink-0" />
              <span className="text-white/60 font-semibold">Obsidian</span>
              <span className="text-[10px] text-white/80 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                Knowledge Base
              </span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
