import React, { useState, useEffect, useRef } from "react";
import { Note, GraphNode, GraphLink } from "../types";
import { Share2, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

interface KnowledgeGraphProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
}

export default function KnowledgeGraph({
  notes,
  selectedNoteId,
  onSelectNote,
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 350 });
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Node being dragged
  const draggedNodeId = useRef<string | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Resize listener
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 300),
          height: Math.max(height, 350),
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Parse links and generate nodes when notes list changes
  useEffect(() => {
    // 1. Generate Nodes (preserve position if they already exist, else place near center)
    const currentNodesMap = new Map<string, GraphNode>(nodes.map((n) => [n.id, n]));
    const center = { x: dimensions.width / 2, y: dimensions.height / 2 };

    const newNodes: GraphNode[] = notes.map((note, index) => {
      const existing = currentNodesMap.get(note.id);
      if (existing) {
        return { ...existing, label: note.title, tags: note.tags };
      }

      // Arrange initial nodes in a circle
      const angle = (index / Math.max(notes.length, 1)) * 2 * Math.PI;
      const radius = 100 + Math.random() * 40;
      return {
        id: note.id,
        label: note.title,
        tags: note.tags,
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });

    // 2. Generate Links
    const newLinks: GraphLink[] = [];

    // Map titles to note IDs for quick bracket link parsing
    const titleToId = new Map(notes.map((n) => [n.title.toLowerCase().trim(), n.id]));

    notes.forEach((note) => {
      // Find explicit Obsidian-style [[Note Title]] links
      const regex = /\[\[(.*?)\]\]/g;
      let match;
      const seenExplicit = new Set<string>();

      while ((match = regex.exec(note.content)) !== null) {
        const targetTitle = match[1].toLowerCase().trim();
        const targetId = titleToId.get(targetTitle);
        if (targetId && targetId !== note.id && !seenExplicit.has(targetId)) {
          seenExplicit.add(targetId);
          newLinks.push({
            source: note.id,
            target: targetId,
            type: "explicit",
          });
        }
      }

      // Find tag-based semantic similarities (if they share tags and don't already have an explicit link)
      notes.forEach((otherNote) => {
        if (note.id >= otherNote.id) return; // Prevent duplicate pairs
        const hasExplicit = newLinks.some(
          (l) =>
            (l.source === note.id && l.target === otherNote.id) ||
            (l.source === otherNote.id && l.target === note.id)
        );

        if (!hasExplicit) {
          const sharedTags = note.tags.filter((t) => otherNote.tags.includes(t));
          if (sharedTags.length > 0) {
            newLinks.push({
              source: note.id,
              target: otherNote.id,
              type: "tag-match",
            });
          }
        }
      });
    });

    setNodes(newNodes);
    setLinks(newLinks);
  }, [notes, dimensions.width, dimensions.height]);

  // Force-Directed Simulation Loop
  useEffect(() => {
    const runSimulation = () => {
      setNodes((prevNodes) => {
        if (prevNodes.length === 0) return prevNodes;

        // Clone nodes to update positions
        const nextNodes = prevNodes.map((n) => ({ ...n }));
        const nodeMap = new Map<string, GraphNode>(nextNodes.map((n) => [n.id, n]));

        const center = { x: dimensions.width / 2, y: dimensions.height / 2 };

        // Configuration constants for forces
        const kRepulsion = 1500; // Force repelling nodes from each other
        const kAttraction = 0.05; // Force pulling connected nodes together
        const kCenter = 0.015; // Force pulling nodes to the center
        const damping = 0.85; // Air resistance

        // 1. Repulsion force between all node pairs (Coulomb's Law)
        for (let i = 0; i < nextNodes.length; i++) {
          const nodeA = nextNodes[i];
          for (let j = i + 1; j < nextNodes.length; j++) {
            const nodeB = nextNodes[j];
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const distSq = dx * dx + dy * dy + 0.1; // avoid divide by zero
            const dist = Math.sqrt(distSq);

            if (dist < 300) {
              const force = kRepulsion / distSq;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              // Don't apply to a dragged node
              if (nodeA.id !== draggedNodeId.current) {
                nodeA.vx -= fx;
                nodeA.vy -= fy;
              }
              if (nodeB.id !== draggedNodeId.current) {
                nodeB.vx += fx;
                nodeB.vy += fy;
              }
            }
          }
        }

        // 2. Attraction force along connected links (Hooke's Law)
        links.forEach((link) => {
          const sourceNode = nodeMap.get(link.source);
          const targetNode = nodeMap.get(link.target);
          if (!sourceNode || !targetNode) return;

          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;

          // Ideal link distance
          const idealDist = link.type === "explicit" ? 120 : 180;
          const delta = dist - idealDist;
          const force = delta * kAttraction;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (sourceNode.id !== draggedNodeId.current) {
            sourceNode.vx += fx;
            sourceNode.vy += fy;
          }
          if (targetNode.id !== draggedNodeId.current) {
            targetNode.vx -= fx;
            targetNode.vy -= fy;
          }
        });

        // 3. Central gravity and integration
        nextNodes.forEach((node) => {
          if (node.id === draggedNodeId.current) return;

          // Pull to center
          const dx = center.x - node.x;
          const dy = center.y - node.y;
          node.vx += dx * kCenter;
          node.vy += dy * kCenter;

          // Update position
          node.x += node.vx;
          node.y += node.vy;

          // Apply damping
          node.vx *= damping;
          node.vy *= damping;

          // Boundary collision prevention
          const padding = 20;
          if (node.x < padding) {
            node.x = padding;
            node.vx = 0;
          }
          if (node.x > dimensions.width - padding) {
            node.x = dimensions.width - padding;
            node.vx = 0;
          }
          if (node.y < padding) {
            node.y = padding;
            node.vy = 0;
          }
          if (node.y > dimensions.height - padding) {
            node.y = dimensions.height - padding;
            node.vy = 0;
          }
        });

        return nextNodes;
      });

      animationFrameId.current = requestAnimationFrame(runSimulation);
    };

    animationFrameId.current = requestAnimationFrame(runSimulation);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [links, dimensions]);

  // Mouse drag handlers
  const handleNodeMouseDown = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    draggedNodeId.current = node.id;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Translate screen coordinates to SVG coordinates taking pan and zoom into account
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const svgX = (screenX - pan.x) / zoom;
      const svgY = (screenY - pan.y) / zoom;

      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (n.id === draggedNodeId.current) {
            return { ...n, x: svgX, y: svgY, vx: 0, vy: 0 };
          }
          return n;
        })
      );
    } else if (isPanning) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      panStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    draggedNodeId.current = null;
    setIsPanning(false);
  };

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    // If we click the background, we pan
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoom = (factor: number) => {
    setZoom((z) => Math.max(0.4, Math.min(2.5, z * factor)));
  };

  // Node Map for quickly locating coordinates
  const nodeMap = new Map<string, GraphNode>(nodes.map((n) => [n.id, n]));

  // Is a node highlighted? (Either hovered or explicitly linked to selected/hovered)
  const isNodeHighlighted = (nodeId: string) => {
    const focusId = hoveredNodeId || selectedNoteId;
    if (!focusId) return true; // Default to full opacity
    if (nodeId === focusId) return true;

    // Check if there is a link connecting focusId with nodeId
    return links.some(
      (l) =>
        (l.source === focusId && l.target === nodeId) ||
        (l.source === nodeId && l.target === focusId)
    );
  };

  return (
    <div className="relative flex flex-col h-full bg-[#0D0D0D] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#141414]/80 backdrop-blur border border-white/10 rounded-lg shadow-lg">
          <Share2 className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/80">
            Real-time Graph View
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex gap-1 bg-[#141414]/80 backdrop-blur border border-white/10 rounded-lg p-1 shadow-lg pointer-events-auto">
          <button
            onClick={() => handleZoom(1.15)}
            className="p-1 hover:bg-white/5 text-white/40 hover:text-white rounded transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(0.85)}
            className="p-1 hover:bg-white/5 text-white/40 hover:text-white rounded transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 hover:bg-white/5 text-white/40 hover:text-white rounded transition cursor-pointer"
            title="Reset View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas wrapper */}
      <div
        ref={containerRef}
        className="w-full flex-grow cursor-grab active:cursor-grabbing outline-none select-none relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseDown={handleSvgMouseDown}
      >
        <svg
          id="knowledge-graph-svg"
          className="w-full h-full"
          style={{ backgroundColor: "#0A0A0A" }}
        >
          {/* Glowing Filter Definition */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-bright" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Graph group with Pan/Zoom applied */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Draw Links */}
            {links.map((link, idx) => {
              const source = nodeMap.get(link.source);
              const target = nodeMap.get(link.target);
              if (!source || !target) return null;

              // Determine if link should be highlighted
              const isSourceFocused = link.source === (hoveredNodeId || selectedNoteId);
              const isTargetFocused = link.target === (hoveredNodeId || selectedNoteId);
              const isLinkFocused = isSourceFocused || isTargetFocused;
              const hasActiveFocus = !!(hoveredNodeId || selectedNoteId);

              let strokeColor = "rgba(255, 255, 255, 0.1)";
              let strokeOpacity = 0.2;
              let strokeDash = "";

              if (link.type === "explicit") {
                strokeColor = isLinkFocused
                  ? "#3b82f6"
                  : hasActiveFocus
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(255, 255, 255, 0.2)";
                strokeOpacity = isLinkFocused ? 0.8 : hasActiveFocus ? 0.08 : 0.4;
              } else {
                // Tag match is dotted/fainter
                strokeColor = isLinkFocused
                  ? "#60a5fa"
                  : hasActiveFocus
                  ? "rgba(255, 255, 255, 0.03)"
                  : "rgba(96, 165, 250, 0.15)";
                strokeOpacity = isLinkFocused ? 0.7 : hasActiveFocus ? 0.05 : 0.25;
                strokeDash = "3, 3";
              }

              return (
                <line
                  key={`link-${idx}`}
                  id={`link-${link.source}-${link.target}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={strokeColor}
                  strokeWidth={isLinkFocused ? 2 : 1.2}
                  strokeOpacity={strokeOpacity}
                  strokeDasharray={strokeDash}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Draw Nodes */}
            {nodes.map((node) => {
              const isSelected = node.id === selectedNoteId;
              const isHovered = node.id === hoveredNodeId;
              const isDimmed = !isNodeHighlighted(node.id);

              // Colors - Sophisticated Dark palette (White, Silver, soft active Blue)
              let nodeColor = "#a1a1aa"; // Zinc silver for standard note
              let glowColor = "rgba(255, 255, 255, 0.15)";

              if (isSelected) {
                nodeColor = "#ffffff"; // Pure white
                glowColor = "rgba(59, 130, 246, 0.7)"; // Blue active halo
              } else if (isHovered) {
                nodeColor = "#f4f4f5";
                glowColor = "rgba(255, 255, 255, 0.4)";
              } else if (node.tags.includes("research")) {
                nodeColor = "#60a5fa"; // Elegant blue for research
                glowColor = "rgba(96, 165, 250, 0.3)";
              } else if (node.tags.includes("productivity")) {
                nodeColor = "#e4e4e7"; // Soft light zinc for workflow/productivity
                glowColor = "rgba(228, 228, 231, 0.25)";
              }

              return (
                <g
                  key={`node-${node.id}`}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNote(node.id);
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Outer Pulsing Glow */}
                  {(isSelected || isHovered) && (
                    <circle
                      r={isSelected ? 18 : 14}
                      fill="none"
                      stroke={isSelected ? "#3b82f6" : "#ffffff"}
                      strokeWidth="2"
                      strokeOpacity="0.4"
                      className="animate-ping"
                      style={{ animationDuration: "3s" }}
                    />
                  )}

                  {/* Core Interactive Node */}
                  <circle
                    r={isSelected ? 10 : isHovered ? 8 : 6}
                    fill={nodeColor}
                    filter={isSelected || isHovered ? "url(#glow-bright)" : "url(#glow)"}
                    opacity={isDimmed ? 0.25 : 1}
                    onMouseDown={(e) => handleNodeMouseDown(e, node)}
                    className="transition-all duration-300"
                    style={{
                      boxShadow: `0 0 15px ${glowColor}`,
                    }}
                  />

                  {/* Node Title Label */}
                  <text
                    id={`node-label-${node.id}`}
                    y={isSelected ? -16 : -12}
                    textAnchor="middle"
                    fill={isSelected ? "#ffffff" : isHovered ? "#f4f4f5" : "#a1a1aa"}
                    fontSize={isSelected ? "11px" : "9px"}
                    fontWeight={isSelected ? "600" : "500"}
                    fontFamily="Inter, sans-serif"
                    opacity={isDimmed ? 0.2 : 1}
                    className="pointer-events-none select-none transition-all duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Help/Stats overlay */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none text-xs font-mono text-white/40">
          <span className="bg-[#0D0D0D]/85 backdrop-blur px-2.5 py-1 rounded-xl border border-white/10 shadow-lg">
            Nodes: {nodes.length} | Connections: {links.length}
          </span>
          <span className="bg-[#0D0D0D]/85 backdrop-blur px-2.5 py-1 rounded-xl border border-white/10 hidden sm:inline shadow-lg">
            Drag nodes to reorganize | Pan to browse
          </span>
        </div>
      </div>
    </div>
  );
}
