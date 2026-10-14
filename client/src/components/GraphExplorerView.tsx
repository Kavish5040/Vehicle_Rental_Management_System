import React, { useState, useEffect, useCallback } from 'react';
import type {
  CoreLabel,
  EntitySummary,
  NeighborhoodPayload,
  FullGraphPayload,
  GraphNodePayload,
} from '../types';
import { ENTITY_STYLES, CORE_LABELS } from '../theme';
import { GraphCanvas } from './GraphCanvas';
import { EntityDetailPanel } from './EntityDetailPanel';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  GitFork,
  Network,
  RotateCcw,
} from 'lucide-react';

type GraphMode = 'full' | 'neighborhood';

interface GraphExplorerViewProps {
  initialLabel?: CoreLabel;
}

export const GraphExplorerView: React.FC<GraphExplorerViewProps> = ({
  initialLabel = 'Customer',
}) => {
  // ── Mode ───────────────────────────────────────
  const [graphMode, setGraphMode] = useState<GraphMode>('full');

  // ── Full Graph state ───────────────────────────
  const [fullGraph, setFullGraph] = useState<FullGraphPayload | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [fullGraphError, setFullGraphError] = useState<string | null>(null);

  // ── Neighborhood state ─────────────────────────
  const [selectedLabel, setSelectedLabel] = useState<CoreLabel>(initialLabel);
  const [searchQuery, setSearchQuery] = useState('');
  const [entities, setEntities] = useState<EntitySummary[]>([]);
  const [totalEntities, setTotalEntities] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const pageSize = 10;

  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState<NeighborhoodPayload | null>(null);
  const [historyStack, setHistoryStack] = useState<GraphNodePayload[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingNeighborhood, setLoadingNeighborhood] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [neighborhoodError, setNeighborhoodError] = useState<string | null>(null);

  // ── Shared selection (node clicked in canvas) ──
  const [inspectedElementId, setInspectedElementId] = useState<string | null>(null);

  // ── Fetch full graph ───────────────────────────
  const fetchFullGraph = useCallback(async () => {
    try {
      setLoadingFull(true);
      setFullGraphError(null);
      const res = await fetch('/api/graph/full');
      const data = await res.json();
      if (data.success) {
        setFullGraph(data.data);
      } else {
        setFullGraphError(data.error || 'Failed to fetch full graph');
      }
    } catch (err: any) {
      setFullGraphError(err?.message || 'Cannot connect to backend server');
    } finally {
      setLoadingFull(false);
    }
  }, []);

  // ── Fetch entity list ──────────────────────────
  const fetchEntityList = useCallback(async () => {
    try {
      setLoadingList(true);
      setListError(null);
      const params = new URLSearchParams({
        label: selectedLabel,
        limit: String(pageSize),
        skip: String(page * pageSize),
      });
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/explorer/entities?${params}`);
      const data = await res.json();

      if (data.success) {
        setEntities(data.data.items);
        setTotalEntities(data.data.total);
      } else {
        setListError(data.error || 'Failed to fetch entities');
      }
    } catch (err: any) {
      setListError(err?.message || 'Error connecting to server');
    } finally {
      setLoadingList(false);
    }
  }, [selectedLabel, searchQuery, page]);

  // ── Fetch neighborhood ─────────────────────────
  const fetchNeighborhood = useCallback(async (elementId: string) => {
    try {
      setLoadingNeighborhood(true);
      setNeighborhoodError(null);
      const res = await fetch(`/api/explorer/neighborhood/${encodeURIComponent(elementId)}`);
      const data = await res.json();

      if (data.success) {
        setNeighborhood(data.data);
        setActiveElementId(elementId);
        setInspectedElementId(elementId);

        // Update history stack
        setHistoryStack((prev) => {
          const existsIdx = prev.findIndex((n) => n.elementId === elementId);
          if (existsIdx >= 0) {
            return prev.slice(0, existsIdx + 1);
          }
          return [...prev, data.data.centerNode];
        });
      } else {
        setNeighborhoodError(data.error || 'Failed to load entity neighborhood');
      }
    } catch (err: any) {
      setNeighborhoodError(err?.message || 'Network error fetching neighborhood');
    } finally {
      setLoadingNeighborhood(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchFullGraph();
  }, [fetchFullGraph]);

  useEffect(() => {
    if (graphMode === 'neighborhood') {
      fetchEntityList();
    }
  }, [graphMode, fetchEntityList]);

  // Switch to neighborhood for a specific node
  const handleSelectEntity = (elementId: string) => {
    setGraphMode('neighborhood');
    fetchNeighborhood(elementId);
  };

  const handleTraverseToNode = (elementId: string) => {
    fetchNeighborhood(elementId);
  };

  const handleBackToFullGraph = () => {
    setGraphMode('full');
    setInspectedElementId(null);
    if (!fullGraph) {
      fetchFullGraph();
    }
  };

  const handlePopHistory = (idx: number) => {
    const targetNode = historyStack[idx];
    if (targetNode && targetNode.elementId !== activeElementId) {
      fetchNeighborhood(targetNode.elementId);
    }
  };

  // Resolve currently inspected node object
  const inspectedNode = inspectedElementId
    ? graphMode === 'full'
      ? fullGraph?.nodes.find((n) => n.elementId === inspectedElementId) || null
      : neighborhood?.nodes.find((n) => n.elementId === inspectedElementId) ||
        (neighborhood?.centerNode.elementId === inspectedElementId
          ? neighborhood.centerNode
          : null)
    : null;

  const currentEdges =
    graphMode === 'full' ? fullGraph?.edges || [] : neighborhood?.edges || [];
  const currentNodes =
    graphMode === 'full' ? fullGraph?.nodes || [] : neighborhood?.nodes || [];

  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────
          1. HEADER & MODE SWITCHER
          ────────────────────────────────────────────── */}
      <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#262B27] tracking-tight">
                Graph Explorer & Entity Traversal
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#EBF1EA] text-[#426B52] border border-[#C8D8C4]">
                Neo4j Live
              </span>
            </div>
            <p className="text-xs text-[#74776F] mt-1">
              Explore how customers connect to bookings, vehicles, rentals, and payments through Neo4j relationships.
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2 bg-[#F7F5EF] p-1.5 rounded-xl border border-[#E4DFD4]">
            <button
              onClick={() => {
                setGraphMode('full');
                if (!fullGraph && !loadingFull) fetchFullGraph();
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                graphMode === 'full'
                  ? 'bg-[#FFFDF8] text-[#426B52] shadow-xs border border-[#E4DFD4]'
                  : 'text-[#74776F] hover:text-[#262B27]'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Full Graph</span>
              {fullGraph && (
                <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-[#EBF1EA] text-[#426B52] font-mono">
                  {fullGraph.nodeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setGraphMode('neighborhood');
                if (!neighborhood && entities.length > 0 && !activeElementId) {
                  fetchNeighborhood(entities[0].elementId);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                graphMode === 'neighborhood'
                  ? 'bg-[#FFFDF8] text-[#426B52] shadow-xs border border-[#E4DFD4]'
                  : 'text-[#74776F] hover:text-[#262B27]'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Neighborhood</span>
              {neighborhood && (
                <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-[#FAF3EB] text-[#93581D] font-mono">
                  {neighborhood.nodes.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Neighborhood Traversal Breadcrumb History */}
        {graphMode === 'neighborhood' && (
          <div className="mt-4 pt-3.5 border-t border-[#E4DFD4] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <span className="font-semibold text-[#74776F] shrink-0 mr-1 flex items-center gap-1">
                <span>Hop History:</span>
              </span>
              {historyStack.length === 0 ? (
                <span className="text-[#9B9990] italic">Select an entity below to start graph traversal</span>
              ) : (
                historyStack.map((step, idx) => {
                  const isCurrent = idx === historyStack.length - 1;
                  const stepStyle = ENTITY_STYLES[step.label as CoreLabel];

                  return (
                    <React.Fragment key={step.elementId}>
                      {idx > 0 && <ArrowRight className="w-3 h-3 text-[#9B9990] shrink-0 mx-0.5" />}
                      <button
                        onClick={() => handlePopHistory(idx)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
                          isCurrent
                            ? 'bg-[#426B52] text-[#FFFDF8] shadow-xs'
                            : 'bg-[#F7F5EF] text-[#262B27] hover:bg-[#EEE9DE]'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: stepStyle?.color || '#74776F' }}
                        />
                        <span className="font-semibold">{step.label}:</span>
                        <span>{step.displayName}</span>
                      </button>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            <button
              onClick={handleBackToFullGraph}
              className="text-xs font-semibold text-[#426B52] hover:text-[#31523E] flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-[#EBF1EA] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Back to Full Graph</span>
            </button>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────
          2. MAIN CANVAS + SIDE INSPECTOR LAYOUT
          ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column in Neighborhood Mode: Entity Browser */}
        {graphMode === 'neighborhood' && (
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-4 shadow-xs space-y-3">
              {/* Header & Count */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#262B27] uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#426B52]" />
                  <span>Entity Selector</span>
                </span>
                <span className="text-[11px] font-mono text-[#74776F]">
                  {totalEntities} in DB
                </span>
              </div>

              {/* Label Selector Grid */}
              <div className="grid grid-cols-5 gap-1.5">
                {CORE_LABELS.map((lbl) => {
                  const isSelected = selectedLabel === lbl;
                  const lblStyle = ENTITY_STYLES[lbl];
                  const Icon = lblStyle.icon;

                  return (
                    <button
                      key={lbl}
                      onClick={() => {
                        setSelectedLabel(lbl);
                        setPage(0);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] transition-all ${
                        isSelected
                          ? 'bg-[#EBF1EA] border-[#426B52] text-[#426B52] font-bold shadow-xs'
                          : 'bg-[#F7F5EF] border-[#E4DFD4] text-[#74776F] hover:text-[#262B27] hover:bg-[#EEE9DE]'
                      }`}
                      title={lblStyle.name}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <span className="truncate w-full text-center">{lbl.slice(0, 4)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#9B9990] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${selectedLabel}...`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  className="w-full bg-[#F7F5EF] text-xs text-[#262B27] pl-8 pr-3 py-2 rounded-xl border border-[#E4DFD4] focus:outline-none focus:border-[#426B52] transition-colors placeholder:text-[#9B9990]"
                />
              </div>

              {/* Entity List */}
              <div className="space-y-1.5 max-h-[290px] overflow-y-auto pr-1">
                {loadingList ? (
                  <div className="py-8 text-center text-xs text-[#74776F] flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#426B52]" />
                    <span>Loading entities...</span>
                  </div>
                ) : listError ? (
                  <div className="p-3 rounded-xl bg-[#FEE2E2] text-[#991B1B] text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{listError}</span>
                  </div>
                ) : entities.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#74776F]">
                    No {selectedLabel} entities match search.
                  </div>
                ) : (
                  entities.map((item) => {
                    const isActive = item.elementId === activeElementId;

                    return (
                      <div
                        key={item.elementId}
                        onClick={() => handleSelectEntity(item.elementId)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isActive
                            ? 'bg-[#EBF1EA] border-[#426B52] shadow-xs'
                            : 'bg-[#F7F5EF] border-[#E4DFD4] hover:bg-[#EEE9DE]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${isActive ? 'text-[#426B52]' : 'text-[#262B27]'}`}>
                            {item.displayName}
                          </span>
                          <span className="text-[10px] font-mono text-[#74776F]">
                            {item.idValue}
                          </span>
                        </div>
                        {item.secondaryInfo && (
                          <p className="text-[11px] text-[#74776F] mt-0.5 truncate">
                            {item.secondaryInfo}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E4DFD4] text-xs text-[#74776F]">
                <span>
                  Page {page + 1} of {Math.max(Math.ceil(totalEntities / pageSize), 1)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 0))}
                    disabled={page === 0 || loadingList}
                    className="p-1 rounded-lg border border-[#E4DFD4] hover:bg-[#EEE9DE] disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={(page + 1) * pageSize >= totalEntities || loadingList}
                    className="p-1 rounded-lg border border-[#E4DFD4] hover:bg-[#EEE9DE] disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Center / Right Canvas Area */}
        <div
          className={`${
            graphMode === 'neighborhood'
              ? inspectedNode
                ? 'lg:col-span-5'
                : 'lg:col-span-8'
              : inspectedNode
              ? 'lg:col-span-8'
              : 'lg:col-span-12'
          } transition-all duration-300`}
        >
          {fullGraphError && graphMode === 'full' && (
            <div className="p-4 mb-4 rounded-xl bg-[#FEE2E2] text-[#991B1B] text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{fullGraphError}</span>
              </div>
              <button
                onClick={fetchFullGraph}
                className="px-2.5 py-1 bg-[#991B1B] text-white rounded-lg font-semibold text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {neighborhoodError && graphMode === 'neighborhood' && (
            <div className="p-4 mb-4 rounded-xl bg-[#FEE2E2] text-[#991B1B] text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{neighborhoodError}</span>
              </div>
              <button
                onClick={() => activeElementId && fetchNeighborhood(activeElementId)}
                className="px-2.5 py-1 bg-[#991B1B] text-white rounded-lg font-semibold text-xs"
              >
                Retry
              </button>
            </div>
          )}

          <div className="h-[620px] w-full">
            <GraphCanvas
              nodes={currentNodes}
              edges={currentEdges}
              onSelectNode={(elementId) => setInspectedElementId(elementId)}
              selectedElementId={inspectedElementId}
              centerElementId={graphMode === 'neighborhood' ? activeElementId : null}
              loading={loadingFull || loadingNeighborhood}
              mode={graphMode}
            />
          </div>
        </div>

        {/* Slide-out / Side Inspector Column */}
        {inspectedNode && (
          <div
            className={`${
              graphMode === 'neighborhood' ? 'lg:col-span-3' : 'lg:col-span-4'
            } transition-all duration-300`}
          >
            <EntityDetailPanel
              node={inspectedNode}
              edges={currentEdges}
              allNodes={currentNodes}
              onTraverseToNode={handleTraverseToNode}
              centerElementId={graphMode === 'neighborhood' ? activeElementId : null}
              onClose={() => setInspectedElementId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
