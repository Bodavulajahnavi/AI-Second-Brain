import { useState, useEffect } from "react";
import { Note } from "../types";
import {
  FileText,
  Tag,
  Clock,
  Sparkles,
  Save,
  Trash2,
  Plus,
  ArrowRight,
  Link as LinkIcon,
} from "lucide-react";

interface NoteInspectorProps {
  note: Note | null;
  allNotes: Note[];
  onSave: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onSelectNote: (noteId: string) => void;
  onAddNote: (title: string, content: string, tags: string[]) => void;
}

export default function NoteInspector({
  note,
  allNotes,
  onSave,
  onDelete,
  onSelectNote,
  onAddNote,
}: NoteInspectorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    title: string;
    tags: string;
    content: string;
    reason: string;
  } | null>(null);

  // Sync state with selected note
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTagsInput(note.tags.join(", "));
      setIsEditing(false);
      setAiSuggestion(null);
    } else {
      setTitle("");
      setContent("");
      setTagsInput("");
      setAiSuggestion(null);
    }
  }, [note]);

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-[#0D0D0D] border border-white/10 rounded-2xl">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
          <FileText className="w-8 h-8 text-white/80" />
        </div>
        <h3 className="text-lg font-serif italic text-white mb-1">No Note Selected</h3>
        <p className="text-sm text-white/40 max-w-xs mb-6">
          Select a node on the knowledge graph or pick from the vault side panel to view, edit, or get AI connection suggestions.
        </p>
      </div>
    );
  }

  // Handle Save
  const handleSave = () => {
    const updatedTags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    onSave({
      ...note,
      title,
      content,
      tags: updatedTags,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  // Find backlinks (notes that contain references to [[This Title]])
  const backlinks = allNotes.filter((n) => {
    if (n.id === note.id) return false;
    const regex = new RegExp(`\\[\\[${note.title.toLowerCase().trim()}\\]\\]`, "i");
    return regex.test(n.content.toLowerCase());
  });

  // Find outgoing links (bracketed titles mentioned in this note)
  const outgoingLinks: Note[] = [];
  const outgoingRegex = /\[\[(.*?)\]\]/g;
  let match;
  const seenOutgoing = new Set<string>();

  while ((match = outgoingRegex.exec(content)) !== null) {
    const linkedTitle = match[1].toLowerCase().trim();
    const foundNote = allNotes.find(
      (n) => n.title.toLowerCase().trim() === linkedTitle && n.id !== note.id
    );
    if (foundNote && !seenOutgoing.has(foundNote.id)) {
      seenOutgoing.add(foundNote.id);
      outgoingLinks.push(foundNote);
    }
  }

  // AI Connection Suggestion (RAG based note generation)
  const handleGetAiSuggestion = async () => {
    setIsAiSuggesting(true);
    setAiSuggestion(null);
    try {
      const response = await fetch("/api/suggest-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteTitle: note.title,
          noteContent: note.content,
          allNotes: allNotes.map((n) => ({ title: n.title, tags: n.tags })),
        }),
      });

      if (!response.ok) throw new Error("Suggestion api failed");
      const data = await response.json();
      setAiSuggestion(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (!aiSuggestion) return;
    const parsedTags = aiSuggestion.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    onAddNote(aiSuggestion.title, aiSuggestion.content, parsedTags);
    setAiSuggestion(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Editor Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-[#141414] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-white/50" />
          <span className="text-xs font-mono font-medium text-white/40 tracking-[0.1em]">NOTE INSPECTOR</span>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs px-2.5 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-medium transition cursor-pointer"
              id="btn-edit-note"
            >
              Edit Note
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="text-xs px-2.5 py-1.5 bg-white hover:bg-white/90 text-black font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              id="btn-save-note"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          )}
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition cursor-pointer"
            title="Delete Note"
            id="btn-delete-note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-grow overflow-y-auto p-5 space-y-5">
        {isEditing ? (
          <div className="space-y-4">
            {/* Editing Title */}
            <div>
              <label className="block text-[10px] font-mono text-white/40 uppercase tracking-[0.15em] mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30 transition"
                id="edit-note-title"
              />
            </div>

            {/* Editing Tags */}
            <div>
              <label className="block text-[10px] font-mono text-white/40 uppercase tracking-[0.15em] mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30 transition"
                placeholder="productivity, tech, study"
                id="edit-note-tags"
              />
            </div>

            {/* Editing Content */}
            <div>
              <label className="block text-[10px] font-mono text-white/40 uppercase tracking-[0.15em] mb-1">
                Markdown Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm font-mono focus:outline-none focus:border-white/30 transition resize-none leading-relaxed"
                placeholder="Type markdown content. Use [[Note Title]] to link pages."
                id="edit-note-content"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* View Mode Title */}
            <div>
              <h1 className="text-xl font-serif italic font-medium text-white tracking-tight" id="view-note-title">
                {note.title}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-[11px] text-white/40 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-white/30" />
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-white/30" />
                  {note.tags.length > 0 ? note.tags.join(", ") : "No tags"}
                </span>
              </div>
            </div>

            {/* View Tags */}
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 py-1">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono bg-white/5 text-white/80 border border-white/10 px-2.5 py-0.5 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* View Content (Styled Plain-text / Basic Markdown Preview) */}
            <div className="prose prose-invert max-w-none text-white/70 text-sm leading-relaxed whitespace-pre-wrap bg-[#141414]/60 border border-white/10 rounded-xl p-4 font-sans">
              {content.split(/(\[\[.*?\]\])/g).map((part, i) => {
                if (part.startsWith("[[") && part.endsWith("]]")) {
                  const targetTitle = part.slice(2, -2).trim();
                  const targetNote = allNotes.find(
                    (n) => n.title.toLowerCase().trim() === targetTitle.toLowerCase()
                  );
                  return targetNote ? (
                    <button
                      key={i}
                      onClick={() => onSelectNote(targetNote.id)}
                      className="text-white underline hover:text-white/80 font-medium cursor-pointer"
                    >
                      {targetTitle}
                    </button>
                  ) : (
                    <span key={i} className="text-white/30 line-through">
                      {targetTitle}
                    </span>
                  );
                }
                return <span key={i}>{part}</span>;
              })}
            </div>
          </div>
        )}

        {/* Bi-directional links and Backlinks section */}
        {!isEditing && (
          <div className="border-t border-white/10 pt-4 space-y-4">
            {/* Outgoing Links */}
            <div>
              <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-white/50" />
                Outgoing Connections ({outgoingLinks.length})
              </h4>
              {outgoingLinks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {outgoingLinks.map((out) => (
                    <button
                      key={out.id}
                      onClick={() => onSelectNote(out.id)}
                      className="text-left bg-[#141414] hover:bg-white/5 border border-white/5 rounded-xl p-2.5 flex items-center justify-between text-xs transition-colors duration-200 group cursor-pointer"
                    >
                      <span className="text-white/80 truncate group-hover:text-white font-medium">
                        {out.title}
                      </span>
                      <ArrowRight className="w-3 h-3 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-white/30 font-mono block italic">
                  No outgoing note references found.
                </span>
              )}
            </div>

            {/* Backlinks */}
            <div>
              <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-white/50 rotate-90" />
                Backlinks / References ({backlinks.length})
              </h4>
              {backlinks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {backlinks.map((back) => (
                    <button
                      key={back.id}
                      onClick={() => onSelectNote(back.id)}
                      className="text-left bg-[#141414] hover:bg-white/5 border border-white/5 rounded-xl p-2.5 flex items-center justify-between text-xs transition-colors duration-200 group cursor-pointer"
                    >
                      <span className="text-white/80 truncate group-hover:text-white font-medium">
                        {back.title}
                      </span>
                      <ArrowRight className="w-3 h-3 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-white/30 font-mono block italic">
                  No backlinks reference this document.
                </span>
              )}
            </div>
          </div>
        )}

        {/* AI Recommendations Hub (RAG suggested notes) */}
        {!isEditing && (
          <div className="border-t border-white/10 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.15em] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                AI Connection Assistant
              </h4>
              <button
                onClick={handleGetAiSuggestion}
                disabled={isAiSuggesting}
                className="text-[11px] font-medium text-blue-400 hover:text-blue-300 disabled:text-white/20 cursor-pointer flex items-center gap-1"
                id="btn-ai-suggest"
              >
                {isAiSuggesting ? "Generating..." : "Get Note Idea"}
              </button>
            </div>

            {aiSuggestion && (
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 space-y-3">
                <div>
                  <span className="text-[9px] font-mono uppercase bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                    Recommended Synthesis Note
                  </span>
                  <h5 className="text-white font-semibold text-sm mt-1.5">
                    {aiSuggestion.title}
                  </h5>
                  <p className="text-xs text-white/40 font-mono mt-0.5">
                    Tags: {aiSuggestion.tags}
                  </p>
                </div>

                <div className="bg-[#141414] border border-white/5 rounded-xl p-2.5">
                  <p className="text-xs text-white/60 italic">"{aiSuggestion.reason}"</p>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setAiSuggestion(null)}
                    className="text-xs text-white/40 hover:text-white px-2.5 py-1"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={handleAcceptSuggestion}
                    className="text-xs bg-white hover:bg-white/90 text-black font-semibold rounded-xl px-3 py-1.5 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Create & Link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
