import React, { useState, useEffect, useCallback } from 'react';
import type { CuratedQueryDefinition, QueryExecutionResult } from '../types';
import {
  Code2,
  Play,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Filter,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Table as TableIcon,
} from 'lucide-react';

export const CypherLabView: React.FC = () => {
  const [queries, setQueries] = useState<CuratedQueryDefinition[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeQueryId, setActiveQueryId] = useState<string>('customer-trip-traversal');
  const [result, setResult] = useState<QueryExecutionResult | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCypher, setCopiedCypher] = useState(false);

  // Fetch curated query definitions
  const fetchQueries = useCallback(async () => {
    try {
      setLoadingList(true);
      setError(null);
      const res = await fetch('/api/lab/queries');
      const data = await res.json();
      if (data.success) {
        setQueries(data.data);
      } else {
        setError(data.error || 'Failed to load queries');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to server');
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Execute active query
  const runQuery = useCallback(async (queryId: string) => {
    try {
      setExecuting(true);
      setError(null);
      const res = await fetch('/api/lab/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Query execution failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error executing query');
    } finally {
      setExecuting(false);
    }
  }, []);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  // Run initial default query on load
  useEffect(() => {
    if (activeQueryId) {
      runQuery(activeQueryId);
    }
  }, [activeQueryId, runQuery]);

  const activeQuery = queries.find((q) => q.id === activeQueryId);

  const categories = [
    { id: 'all', label: 'All Queries' },
    { id: 'traversal', label: 'Multi-Hop Traversal' },
    { id: 'bookings', label: 'Bookings & Schedule' },
    { id: 'vehicles', label: 'Fleet & Types' },
    { id: 'payments', label: 'Settlement Ledger' },
    { id: 'maintenance', label: 'Maintenance Logs' },
    { id: 'analytics', label: 'Graph Analytics' },
  ];

  const filteredQueries =
    selectedCategory === 'all'
      ? queries
      : queries.filter((q) => q.category === selectedCategory);

  const handleCopyCypher = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCypher(true);
    setTimeout(() => setCopiedCypher(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────
          HEADER
          ────────────────────────────────────────────── */}
      <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#262B27] tracking-tight">
                Cypher Query Lab
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#EBF1EA] text-[#426B52] border border-[#C8D8C4]">
                Phase 3 Verified
              </span>
            </div>
            <p className="text-xs text-[#74776F] mt-1">
              Curated, read-only graph queries demonstrating native index-free traversal, operational chains, and aggregation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#74776F] bg-[#F7F5EF] px-3 py-1.5 rounded-xl border border-[#E4DFD4]">
              Security: Server-Side Allowlist Only
            </span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="mt-4 pt-3.5 border-t border-[#E4DFD4] flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-xs font-semibold text-[#74776F] flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#426B52]" />
            <span>Category:</span>
          </span>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#426B52] text-[#FFFDF8] shadow-xs'
                  : 'bg-[#F7F5EF] text-[#74776F] hover:text-[#262B27] hover:bg-[#EEE9DE]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          QUERY PICKER + WORKBENCH LAYOUT
          ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Query Catalog */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#74776F] px-1 flex items-center justify-between">
            <span>Curated Query Catalog</span>
            <span className="font-mono text-[11px] text-[#9B9990]">
              {filteredQueries.length} available
            </span>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {loadingList ? (
              <div className="p-8 text-center text-xs text-[#74776F] bg-[#FFFDF8] rounded-2xl border border-[#E4DFD4] flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#426B52]" />
                <span>Loading query catalog...</span>
              </div>
            ) : (
              filteredQueries.map((q) => {
                const isActive = q.id === activeQueryId;
                return (
                  <div
                    key={q.id}
                    onClick={() => setActiveQueryId(q.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#FFFDF8] border-[#426B52] shadow-xs ring-1 ring-[#426B52]/20'
                        : 'bg-[#FFFDF8] border-[#E4DFD4] hover:bg-[#F7F5EF] hover:border-[#D5CEBE]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-bold text-xs leading-snug ${isActive ? 'text-[#426B52]' : 'text-[#262B27]'}`}>
                        {q.title}
                      </h4>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isActive ? 'text-[#426B52]' : 'text-[#9B9990]'}`} />
                    </div>

                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F7F5EF] text-[#74776F] border border-[#E4DFD4]">
                        {q.category}
                      </span>
                      <span className="text-[10.5px] text-[#74776F] truncate">
                        {q.concept}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Query Details, Cypher Code, and Live Results */}
        <div className="lg:col-span-8 space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-[#FEE2E2] text-[#991B1B] text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => activeQueryId && runQuery(activeQueryId)}
                className="px-2.5 py-1 bg-[#991B1B] text-white rounded-lg font-semibold text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {activeQuery && (
            <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-5 shadow-xs space-y-4">
              {/* Query Title & Concept Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4DFD4] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#EBF1EA] text-[#426B52] border border-[#C8D8C4]">
                      {activeQuery.category.toUpperCase()}
                    </span>
                    <span className="text-xs font-medium text-[#74776F]">
                      {activeQuery.concept}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#262B27] mt-1.5">
                    {activeQuery.title}
                  </h3>
                  <p className="text-xs text-[#74776F] mt-0.5 leading-relaxed">
                    {activeQuery.description}
                  </p>
                </div>

                <button
                  onClick={() => runQuery(activeQuery.id)}
                  disabled={executing}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#426B52] hover:bg-[#31523E] text-[#FFFDF8] rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50 shrink-0 self-start sm:self-auto"
                >
                  <Play className={`w-3.5 h-3.5 ${executing ? 'animate-spin' : ''}`} />
                  <span>{executing ? 'Executing...' : 'Run Query'}</span>
                </button>
              </div>

              {/* Cypher Code Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#74776F] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#426B52]" />
                    <span>Cypher Statement</span>
                  </span>
                  {result && (
                    <button
                      onClick={() => handleCopyCypher(result.cypher)}
                      className="flex items-center gap-1 text-[11px] text-[#74776F] hover:text-[#262B27] transition-colors"
                    >
                      {copiedCypher ? <Check className="w-3 h-3 text-[#426B52]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCypher ? 'Copied' : 'Copy Cypher'}</span>
                    </button>
                  )}
                </div>

                <div className="bg-[#F7F5EF] rounded-xl border border-[#E4DFD4] p-3.5 text-xs font-mono text-[#262B27] overflow-x-auto whitespace-pre leading-relaxed">
                  {result ? result.cypher : 'Click "Run Query" to inspect full Cypher statement and results.'}
                </div>
              </div>

              {/* Execution Summary Bar */}
              {result && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F7F5EF] border border-[#E4DFD4] text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[#426B52] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{result.rowCount} records returned</span>
                    </span>
                    <span className="text-[#9B9990]">•</span>
                    <span className="flex items-center gap-1 text-[#74776F] font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{result.executionTimeMs} ms</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-[#74776F] font-mono">
                    Neo4j AuraDB • Read Session
                  </span>
                </div>
              )}

              {/* Results Table */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-[#74776F] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <TableIcon className="w-3.5 h-3.5 text-[#426B52]" />
                    <span>Result Table</span>
                  </span>
                  {result && (
                    <span className="text-[11px] font-mono text-[#9B9990]">
                      {result.columns.length} columns
                    </span>
                  )}
                </div>

                {executing ? (
                  <div className="py-12 text-center text-xs text-[#74776F] flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#426B52]" />
                    <span>Executing Cypher query against AuraDB...</span>
                  </div>
                ) : !result || result.records.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#74776F] bg-[#F7F5EF] rounded-xl border border-dashed border-[#E4DFD4]">
                    No records found for this query in the active database.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E4DFD4]">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-[#F7F5EF] text-[#262B27] font-bold border-b border-[#E4DFD4]">
                        <tr>
                          {result.columns.map((col) => (
                            <th key={col} className="p-2.5 font-mono text-[11px] whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4DFD4] bg-[#FFFDF8]">
                        {result.records.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-[#F7F5EF]/60 transition-colors">
                            {result.columns.map((col) => {
                              const val = row[col];
                              const displayVal =
                                val === null || val === undefined
                                  ? '—'
                                  : typeof val === 'object'
                                  ? JSON.stringify(val)
                                  : String(val);

                              return (
                                <td key={col} className="p-2.5 text-[#262B27] font-mono text-[11px] whitespace-nowrap">
                                  {displayVal}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
