import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import type { GraphNodePayload, GraphEdgePayload, CoreLabel } from '../types';
import { ENTITY_STYLES } from '../theme';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Tag,
  Eye,
  EyeOff,
} from 'lucide-react';

// ──────────────────────────────────────────────
// Component Props
// ──────────────────────────────────────────────
interface GraphCanvasProps {
  nodes: GraphNodePayload[];
  edges: GraphEdgePayload[];
  onSelectNode: (elementId: string) => void;
  selectedElementId?: string | null;
  centerElementId?: string | null;
  loading?: boolean;
  mode?: 'full' | 'neighborhood';
}

interface SimNode extends GraphNodePayload {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pinned: boolean;
}

// ──────────────────────────────────────────────
// Layout & Physics Constants (Enhanced spacing & collision prevention)
// ──────────────────────────────────────────────
const NODE_RADIUS = 22;
const SELECTED_NODE_RADIUS = 26;
const COLLISION_PADDING = 38; // Minimum center-to-center distance = 2*RADIUS + PADDING ~ 82px
const FORCE_REPULSION = 24000;
const FORCE_LINK_DISTANCE = 190;
const FORCE_LINK_STRENGTH = 0.22;
const FORCE_GRAVITY = 0.012;
const FORCE_DAMPING = 0.76;
const SIMULATION_ITERATIONS = 240;

// ──────────────────────────────────────────────
// Simulation Function with Hard Collision Resolution
// ──────────────────────────────────────────────
function runStableLayout(
  nodes: SimNode[],
  edges: GraphEdgePayload[],
  width: number,
  height: number,
  iterations: number
): SimNode[] {
  const nodeMap = new Map<string, SimNode>();
  nodes.forEach((n) => nodeMap.set(n.elementId, { ...n }));
  const ns = Array.from(nodeMap.values());
  const cx = width / 2;
  const cy = height / 2;

  for (let iter = 0; iter < iterations; iter++) {
    // 1. Repulsion (n^2 with distance-squared falloff)
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const a = ns[i];
        const b = ns[j];
        if (a.pinned && b.pinned) continue;

        let dx = b.x - a.x;
        let dy = b.y - a.y;
        if (dx === 0 && dy === 0) {
          dx = (Math.random() - 0.5) * 2;
          dy = (Math.random() - 0.5) * 2;
        }

        const dist2 = dx * dx + dy * dy;
        const dist = Math.sqrt(dist2) || 1;
        const force = FORCE_REPULSION / Math.max(dist2, 400);

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (!a.pinned) { a.vx -= fx; a.vy -= fy; }
        if (!b.pinned) { b.vx += fx; b.vy += fy; }
      }
    }

    // 2. Spring Attraction along Edges
    for (const edge of edges) {
      const src = nodeMap.get(edge.sourceElementId);
      const tgt = nodeMap.get(edge.targetElementId);
      if (!src || !tgt) continue;

      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - FORCE_LINK_DISTANCE) * FORCE_LINK_STRENGTH;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (!src.pinned) { src.vx += fx; src.vy += fy; }
      if (!tgt.pinned) { tgt.vx -= fx; tgt.vy -= fy; }
    }

    // 3. Gentle Centering Gravity
    for (const n of ns) {
      if (n.pinned) continue;
      n.vx += (cx - n.x) * FORCE_GRAVITY;
      n.vy += (cy - n.y) * FORCE_GRAVITY;
    }

    // 4. Update Positions & Damping
    for (const n of ns) {
      if (n.pinned) continue;
      n.vx *= FORCE_DAMPING;
      n.vy *= FORCE_DAMPING;
      n.x += n.vx;
      n.y += n.vy;
    }

    // 5. Strict Geometric Collision Resolution (prevents overlapping nodes and labels)
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const a = ns[i];
        const b = ns[j];
        const minDist = a.radius + b.radius + COLLISION_PADDING;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;

        if (dist < minDist) {
          const overlap = minDist - dist;
          const shiftX = (dx / dist) * (overlap * 0.52);
          const shiftY = (dy / dist) * (overlap * 0.52);

          if (!a.pinned && !b.pinned) {
            a.x -= shiftX;
            a.y -= shiftY;
            b.x += shiftX;
            b.y += shiftY;
          } else if (!a.pinned) {
            a.x -= shiftX * 2;
            a.y -= shiftY * 2;
          } else if (!b.pinned) {
            b.x += shiftX * 2;
            b.y += shiftY * 2;
          }
        }
      }
    }
  }

  return ns;
}

// ──────────────────────────────────────────────
// Initial Node Seeding (Spreads nodes broadly)
// ──────────────────────────────────────────────
function initializeNodes(
  nodes: GraphNodePayload[],
  centerElementId: string | null | undefined,
  width: number,
  height: number
): SimNode[] {
  const cx = width / 2;
  const cy = height / 2;
  const count = nodes.length;

  return nodes.map((n, idx) => {
    const isCenter = !!centerElementId && n.elementId === centerElementId;
    let x: number;
    let y: number;

    if (isCenter) {
      x = cx;
      y = cy;
    } else {
      // Deterministic spiral/orbital distribution to spread nodes across viewport
      const angle = (idx / Math.max(count, 1)) * 2 * Math.PI;
      const radius = count <= 6 ? 160 : 220 + (idx % 3) * 60;
      x = cx + Math.cos(angle) * radius;
      y = cy + Math.sin(angle) * radius;
    }

    return {
      ...n,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: NODE_RADIUS,
      pinned: isCenter,
    };
  });
}

// ──────────────────────────────────────────────
// Graph Canvas Component
// ──────────────────────────────────────────────
export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  onSelectNode,
  selectedElementId = null,
  centerElementId = null,
  loading = false,
  mode = 'full',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [filterLabels, setFilterLabels] = useState<Set<string>>(new Set());
  const [showAllEdgeLabels, setShowAllEdgeLabels] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Pan & Zoom transform state
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Node drag interaction
  const draggedNodeRef = useRef<SimNode | null>(null);

  // Resize observer to track container size
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute bounding box and fit graph to viewport
  const fitGraphToView = useCallback(
    (nodeList: SimNode[], width: number, height: number) => {
      if (nodeList.length === 0 || width <= 0 || height <= 0) return;

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      nodeList.forEach((n) => {
        const r = n.radius + 35; // margin for label text
        if (n.x - r < minX) minX = n.x - r;
        if (n.x + r > maxX) maxX = n.x + r;
        if (n.y - r < minY) minY = n.y - r;
        if (n.y + r > maxY) maxY = n.y + r;
      });

      const graphWidth = maxX - minX || 1;
      const graphHeight = maxY - minY || 1;
      const graphCx = (minX + maxX) / 2;
      const graphCy = (minY + maxY) / 2;

      const padding = 70;
      const scaleX = (width - padding * 2) / graphWidth;
      const scaleY = (height - padding * 2) / graphHeight;
      const k = Math.min(Math.max(Math.min(scaleX, scaleY), 0.45), 1.25);

      const x = width / 2 - graphCx * k;
      const y = height / 2 - graphCy * k;

      setTransform({ x, y, k });
    },
    []
  );

  // Run physics layout whenever input nodes or edges change
  useEffect(() => {
    if (nodes.length === 0) {
      setSimNodes([]);
      return;
    }

    const { width, height } = dimensions;
    const initial = initializeNodes(nodes, centerElementId, width, height);
    const settled = runStableLayout(initial, edges, width, height, SIMULATION_ITERATIONS);
    setSimNodes(settled);
    fitGraphToView(settled, width, height);
  }, [nodes, edges, centerElementId, dimensions.width, dimensions.height, fitGraphToView]);

  // Node Map for fast coordinate lookup
  const nodePositionMap = useMemo(() => {
    const map = new Map<string, SimNode>();
    simNodes.forEach((n) => map.set(n.elementId, n));
    return map;
  }, [simNodes]);

  // Labels present in current graph
  const availableLabels = useMemo(() => {
    const s = new Set<string>();
    nodes.forEach((n) => s.add(n.label));
    return Array.from(s);
  }, [nodes]);

  // Filtered nodes based on label toggles
  const visibleNodes = useMemo(() => {
    if (filterLabels.size === 0) return simNodes;
    return simNodes.filter((n) => filterLabels.has(n.label));
  }, [simNodes, filterLabels]);

  const visibleElementIds = useMemo(() => {
    return new Set(visibleNodes.map((n) => n.elementId));
  }, [visibleNodes]);

  // Filtered edges where both source and target are visible
  const visibleEdges = useMemo(() => {
    return edges.filter(
      (e) =>
        visibleElementIds.has(e.sourceElementId) &&
        visibleElementIds.has(e.targetElementId)
    );
  }, [edges, visibleElementIds]);

  // Toggle label filter
  const toggleLabelFilter = (label: string) => {
    setFilterLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  // Zoom helpers
  const handleZoomIn = () => {
    setTransform((t) => ({ ...t, k: Math.min(t.k * 1.25, 3) }));
  };

  const handleZoomOut = () => {
    setTransform((t) => ({ ...t, k: Math.max(t.k * 0.8, 0.3) }));
  };

  const handleReset = () => {
    fitGraphToView(simNodes, dimensions.width, dimensions.height);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    const nextK = Math.min(Math.max(transform.k * factor, 0.3), 3);

    // Zoom centered on cursor
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const nextX = mouseX - (mouseX - transform.x) * (nextK / transform.k);
    const nextY = mouseY - (mouseY - transform.y) * (nextK / transform.k);

    setTransform({ x: nextX, y: nextY, k: nextK });
  };

  // Canvas Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof SVGElement && e.target.closest('[data-node-id]')) {
      // Clicked on a node, handle in node mouse down
      return;
    }
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - transform.x,
      y: e.clientY - transform.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeRef.current) {
      // Dragging a node in canvas coordinates
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const canvasX = (e.clientX - rect.left - transform.x) / transform.k;
      const canvasY = (e.clientY - rect.top - transform.y) / transform.k;

      setSimNodes((prev) =>
        prev.map((n) =>
          n.elementId === draggedNodeRef.current?.elementId
            ? { ...n, x: canvasX, y: canvasY, vx: 0, vy: 0 }
            : n
        )
      );
      return;
    }

    if (!isDraggingRef.current) return;
    setTransform((t) => ({
      ...t,
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    }));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    draggedNodeRef.current = null;
  };

  // Node Drag Start
  const handleNodeMouseDown = (e: React.MouseEvent, node: SimNode) => {
    e.stopPropagation();
    draggedNodeRef.current = node;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[520px] bg-[#FFFDF8] rounded-2xl border border-[#E4DFD4] overflow-hidden select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDraggingRef.current ? 'grabbing' : 'default' }}
    >
      {/* Subtle Dot Grid Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dot-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#D5CEBE" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-pattern)" />
      </svg>

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-10">
        {/* Mode & Stats Pill */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-[#FFFDF8]/95 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-[#E4DFD4] shadow-xs text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              mode === 'full' ? 'bg-[#426B52]' : 'bg-[#93581D]'
            }`}
          />
          <span className="font-semibold text-[#262B27]">
            {mode === 'full' ? 'Full Database Graph' : 'Neighborhood Traversal'}
          </span>
          <span className="text-[#74776F] border-l border-[#E4DFD4] pl-2 font-mono">
            {visibleNodes.length} nodes • {visibleEdges.length} edges
          </span>
        </div>

        {/* Action Controls & Edge Label Toggle */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#FFFDF8]/95 backdrop-blur-sm p-1 rounded-xl border border-[#E4DFD4] shadow-xs">
          <button
            onClick={() => setShowAllEdgeLabels((v) => !v)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              showAllEdgeLabels
                ? 'bg-[#EBF1EA] text-[#426B52] font-semibold'
                : 'text-[#74776F] hover:text-[#262B27] hover:bg-[#EEE9DE]'
            }`}
            title="Toggle relationship label visibility"
          >
            {showAllEdgeLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Edge Labels</span>
          </button>

          <div className="w-[1px] h-4 bg-[#E4DFD4] mx-0.5" />

          <button
            onClick={handleZoomIn}
            className="p-1.5 text-[#74776F] hover:text-[#262B27] hover:bg-[#EEE9DE] rounded-lg transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-[#74776F] hover:text-[#262B27] hover:bg-[#EEE9DE] rounded-lg transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 text-[#74776F] hover:text-[#262B27] hover:bg-[#EEE9DE] rounded-lg transition-colors"
            title="Fit graph to view"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 text-[#74776F] hover:text-[#262B27] hover:bg-[#EEE9DE] rounded-lg transition-colors"
            title="Reset layout"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Filter & Entity Legend Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#FFFDF8]/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-[#E4DFD4] shadow-xs overflow-x-auto max-w-full">
          <span className="text-[11px] font-semibold text-[#74776F] flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3 text-[#426B52]" />
            <span>Filter:</span>
          </span>
          {availableLabels.map((label) => {
            const style = ENTITY_STYLES[label as CoreLabel];
            const isSelected = filterLabels.has(label);
            const isFaded = filterLabels.size > 0 && !isSelected;

            return (
              <button
                key={label}
                onClick={() => toggleLabelFilter(label)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                  isSelected
                    ? 'ring-1 ring-[#426B52] bg-[#EBF1EA] text-[#426B52]'
                    : isFaded
                    ? 'opacity-40 hover:opacity-80 bg-transparent text-[#74776F]'
                    : 'bg-[#F7F5EF] text-[#262B27] hover:bg-[#EEE9DE]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: style?.color || '#74776F' }}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="pointer-events-auto bg-[#FFFDF8]/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-[#E4DFD4] shadow-xs text-xs text-[#426B52] font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#426B52] animate-ping" />
            <span>Simulating layout...</span>
          </div>
        )}
      </div>

      {/* Main SVG Graph Layer */}
      <svg
        className="w-full h-full"
        style={{ cursor: isDraggingRef.current ? 'grabbing' : 'default' }}
      >
        <defs>
          {/* Subtle Directional Arrow Markers */}
          <marker
            id="arrow-subtle"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#B4ABA0" />
          </marker>

          <marker
            id="arrow-highlight"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#426B52" />
          </marker>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* ──────────────────────────────────────────────
              LAYER 1: RELATIONSHIP EDGES (Drawn Behind Nodes)
              ────────────────────────────────────────────── */}
          <g id="graph-edges">
            {visibleEdges.map((edge) => {
              const src = nodePositionMap.get(edge.sourceElementId);
              const tgt = nodePositionMap.get(edge.targetElementId);
              if (!src || !tgt) return null;

              // Check if edge is active (connected to hovered or selected node)
              const isSrcSelected = src.elementId === selectedElementId;
              const isTgtSelected = tgt.elementId === selectedElementId;
              const isSrcHovered = src.elementId === hoveredNodeId;
              const isTgtHovered = tgt.elementId === hoveredNodeId;
              const isEdgeHovered = edge.elementId === hoveredEdgeId;
              const isHighlighted =
                isSrcSelected || isTgtSelected || isSrcHovered || isTgtHovered || isEdgeHovered;

              // Compute clean vector and offset so arrowheads terminate precisely at target boundary
              const dx = tgt.x - src.x;
              const dy = tgt.y - src.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;

              const srcRadius = (isSrcSelected ? SELECTED_NODE_RADIUS : NODE_RADIUS) + 2;
              const tgtRadius = (isTgtSelected ? SELECTED_NODE_RADIUS : NODE_RADIUS) + 6;

              const x1 = src.x + (dx / dist) * srcRadius;
              const y1 = src.y + (dy / dist) * srcRadius;
              const x2 = tgt.x - (dx / dist) * tgtRadius;
              const y2 = tgt.y - (dy / dist) * tgtRadius;

              // Midpoint for relationship label
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              const showLabel = showAllEdgeLabels || isHighlighted;

              return (
                <g
                  key={edge.elementId}
                  onMouseEnter={() => setHoveredEdgeId(edge.elementId)}
                  onMouseLeave={() => setHoveredEdgeId(null)}
                  className="cursor-pointer"
                >
                  {/* Invisible thicker hit-box line for easy hover */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="transparent"
                    strokeWidth="14"
                  />

                  {/* Visible Edge Line */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isHighlighted ? '#426B52' : '#CFC8BC'}
                    strokeWidth={isHighlighted ? 2.2 : 1.4}
                    strokeOpacity={isHighlighted ? 1 : 0.85}
                    markerEnd={isHighlighted ? 'url(#arrow-highlight)' : 'url(#arrow-subtle)'}
                    className="transition-colors duration-200"
                  />

                  {/* Relationship Label Badge (Restrained, uncluttered) */}
                  {showLabel && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-36"
                        y="-10"
                        width="72"
                        height="20"
                        rx="10"
                        fill="#FFFDF8"
                        stroke={isHighlighted ? '#426B52' : '#E4DFD4'}
                        strokeWidth="1"
                        className="shadow-xs"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        className={`text-[9.5px] font-mono select-none ${
                          isHighlighted ? 'fill-[#426B52] font-bold' : 'fill-[#5A5C56]'
                        }`}
                      >
                        {edge.type}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* ──────────────────────────────────────────────
              LAYER 2: GRAPH NODES (Sleek, legible, warm)
              ────────────────────────────────────────────── */}
          <g id="graph-nodes">
            {visibleNodes.map((node) => {
              const isSelected = node.elementId === selectedElementId;
              const isCenter = node.elementId === centerElementId;
              const isHovered = node.elementId === hoveredNodeId;
              const style = ENTITY_STYLES[node.label as CoreLabel];
              const r = isSelected ? SELECTED_NODE_RADIUS : NODE_RADIUS;

              return (
                <g
                  key={node.elementId}
                  data-node-id={node.elementId}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(node.elementId);
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onMouseEnter={() => setHoveredNodeId(node.elementId)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className="cursor-pointer"
                >
                  {/* Active Center Subtle Ring */}
                  {isCenter && (
                    <circle
                      r={r + 6}
                      fill="none"
                      stroke="#426B52"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      className="opacity-70 animate-spin-slow"
                    />
                  )}

                  {/* Selection Outer Halo */}
                  {isSelected && (
                    <circle
                      r={r + 4}
                      fill="none"
                      stroke="#426B52"
                      strokeWidth="2"
                    />
                  )}

                  {/* Primary Node Body */}
                  <circle
                    r={r}
                    fill={style?.color || '#262B27'}
                    stroke={isSelected ? '#1D4532' : style?.borderColor || '#E4DFD4'}
                    strokeWidth={isSelected ? 2 : 1}
                    className="transition-all duration-150 filter drop-shadow-xs"
                  />

                  {/* Inner Label Icon / Text */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#FFFDF8"
                    className="text-[10px] font-bold select-none pointer-events-none"
                  >
                    {node.label.slice(0, 2).toUpperCase()}
                  </text>

                  {/* Primary Node Text Label with Readability Halo */}
                  <g transform={`translate(0, ${r + 14})`}>
                    {/* Background halo for crisp text over edges */}
                    <text
                      textAnchor="middle"
                      stroke="#FFFDF8"
                      strokeWidth="3.5"
                      strokeLinejoin="round"
                      fill="none"
                      className="text-[11px] font-semibold select-none pointer-events-none"
                    >
                      {node.displayName.length > 20
                        ? `${node.displayName.slice(0, 18)}...`
                        : node.displayName}
                    </text>
                    <text
                      textAnchor="middle"
                      fill="#262B27"
                      className={`text-[11px] select-none pointer-events-none ${
                        isSelected || isHovered ? 'font-bold fill-[#426B52]' : 'font-medium'
                      }`}
                    >
                      {node.displayName.length > 20
                        ? `${node.displayName.slice(0, 18)}...`
                        : node.displayName}
                    </text>
                  </g>

                  {/* Subtitle / Entity Type */}
                  <text
                    y={r + 26}
                    textAnchor="middle"
                    fill="#74776F"
                    className="text-[9.5px] select-none pointer-events-none"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
};
