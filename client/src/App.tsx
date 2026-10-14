import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  Compass,
  Code2,
  CalendarClock,
  LineChart,
  Database,
  Layers,
  GitFork,
  Activity,
  CheckCircle2,
  RefreshCw,
  Server,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import type { HealthStatus, DatabaseOverview, CoreLabel } from './types';
import { ENTITY_STYLES, CORE_LABELS } from './theme';
import { apiFetch } from './api';
import { GraphExplorerView } from './components/GraphExplorerView';
import { CypherLabView } from './components/CypherLabView';
import { SmartAvailabilityView } from './components/SmartAvailabilityView';
import { GraphAnalyticsView } from './components/GraphAnalyticsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'explorer' | 'cypher-lab' | 'availability' | 'analytics'
  >('overview');
  const [explorerInitialLabel, setExplorerInitialLabel] = useState<CoreLabel>('Customer');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [overview, setOverview] = useState<DatabaseOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setApiError(null);
      // 1. Health check
      const { ok: healthOk, data: healthData } = await apiFetch<HealthStatus>('/api/health');
      setHealth(healthData);

      // 2. Database Overview stats
      if (healthOk && healthData.status === 'connected') {
        const { data: ovData } = await apiFetch<{ success: boolean; data?: DatabaseOverview; error?: string }>('/api/overview');
        if (ovData.success && ovData.data) {
          setOverview(ovData.data);
        } else {
          setApiError(ovData.error || 'Failed to fetch database overview');
        }
      } else {
        setOverview(null);
      }
    } catch (err: any) {
      setApiError(err?.message || 'Unable to connect to backend server');
      setHealth(null);
      setOverview(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const navigateToExplorer = (label?: CoreLabel) => {
    if (label) {
      setExplorerInitialLabel(label);
    }
    setActiveTab('explorer');
  };

  const isConnected = health?.status === 'connected';

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#262B27] flex flex-col md:flex-row antialiased selection:bg-[#DCE6D9] selection:text-[#262B27]">
      {/* ──────────────────────────────────────────────
          SIDEBAR NAVIGATION (Clean editorial aesthetic)
          ────────────────────────────────────────────── */}
      <aside className="w-full md:w-64 bg-[#FFFDF8] border-b md:border-b-0 md:border-r border-[#E4DFD4] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Brand Header */}
          <div className="p-6 border-b border-[#E4DFD4]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#426B52] flex items-center justify-center text-[#FFFDF8] shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-[#262B27] leading-snug">
                  Vehicle Rental
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-semibold text-[#74776F]">
                    Graph Intelligence
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#EBF1EA] text-[#426B52] border border-[#C8D8C4]">
                    DA3
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#9B9990] px-3 mb-2">
                Active Modules
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'overview'
                      ? 'bg-[#EBF1EA] text-[#426B52] shadow-xs'
                      : 'text-[#74776F] hover:text-[#262B27] hover:bg-[#F7F5EF]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Database Overview</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#426B52]" />
                </button>

                <button
                  onClick={() => setActiveTab('explorer')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'explorer'
                      ? 'bg-[#EBF1EA] text-[#426B52] shadow-xs'
                      : 'text-[#74776F] hover:text-[#262B27] hover:bg-[#F7F5EF]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4" />
                    <span>Graph Explorer</span>
                  </div>
                  <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-[#F7F5EF] text-[#74776F] border border-[#E4DFD4]">
                    Full Graph
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('cypher-lab')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'cypher-lab'
                      ? 'bg-[#EBF1EA] text-[#426B52] shadow-xs'
                      : 'text-[#74776F] hover:text-[#262B27] hover:bg-[#F7F5EF]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Code2 className="w-4 h-4" />
                    <span>Cypher Query Lab</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#EBF1EA] text-[#426B52]">
                    Phase 3
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('availability')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'availability'
                      ? 'bg-[#EBF1EA] text-[#426B52] shadow-xs'
                      : 'text-[#74776F] hover:text-[#262B27] hover:bg-[#F7F5EF]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarClock className="w-4 h-4" />
                    <span>Smart Availability</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#EBF1EA] text-[#426B52]">
                    Phase 4
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-[#EBF1EA] text-[#426B52] shadow-xs'
                      : 'text-[#74776F] hover:text-[#262B27] hover:bg-[#F7F5EF]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LineChart className="w-4 h-4" />
                    <span>Graph Analytics</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#EBF1EA] text-[#426B52]">
                    Phase 5
                  </span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer: Neo4j Live Connection Card */}
        <div className="p-4 border-t border-[#E4DFD4]">
          <div className="p-3.5 rounded-xl bg-[#F7F5EF] border border-[#E4DFD4] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected ? 'bg-[#2D6A4F] animate-pulse' : 'bg-[#991B1B]'
                  }`}
                />
                <span className="font-semibold text-[#262B27]">
                  {isConnected ? 'Neo4j AuraDB' : 'Database Offline'}
                </span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="p-1 text-[#74776F] hover:text-[#262B27] hover:bg-[#EEE9DE] rounded-md transition-colors disabled:opacity-40"
                title="Refresh live connection"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#426B52]' : ''}`} />
              </button>
            </div>

            <div className="text-[11px] text-[#74776F] space-y-0.5">
              <div className="flex items-center justify-between">
                <span>Instance:</span>
                <span className="font-mono text-[#262B27] font-medium">
                  {health?.database || 'Free Cluster'}
                </span>
              </div>
              {isConnected && health?.latencyMs !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Latency:</span>
                  <span className="font-mono text-[#2D6A4F] font-semibold">
                    {health.latencyMs} ms
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ──────────────────────────────────────────────
          MAIN APPLICATION VIEWPORT
          ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-[#FFFDF8] border-b border-[#E4DFD4] px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h2 className="text-base font-bold text-[#262B27]">
              {activeTab === 'overview'
                ? 'System Overview & Graph Topology'
                : activeTab === 'explorer'
                ? 'Interactive Graph Explorer'
                : activeTab === 'cypher-lab'
                ? 'Cypher Query Laboratory'
                : activeTab === 'availability'
                ? 'Smart Availability & Conflict Detection'
                : 'Graph Analytics & Intelligence'}
            </h2>
            <p className="text-xs text-[#74776F]">
              {activeTab === 'overview'
                ? 'Live structural metrics, entity distributions, and relationship breakdown from Neo4j AuraDB'
                : activeTab === 'explorer'
                ? 'Traverse multi-hop relationships or explore the complete connected graph'
                : activeTab === 'cypher-lab'
                ? 'Curated allowlisted queries demonstrating graph traversals, chains, and performance'
                : activeTab === 'availability'
                ? 'Temporal collision detection across reservation schedules and fleet inventory'
                : 'Operational metrics, fleet utilization, and network topology statistics'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4DFD4] bg-[#F7F5EF] hover:bg-[#EEE9DE] text-xs font-semibold text-[#262B27] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#426B52]' : ''}`} />
              <span className="hidden sm:inline">Refresh Stats</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6 lg:p-8 space-y-8 flex-1">
          {/* Disconnected / Setup Guidance Banner */}
          {!isConnected && !loading && (
            <div className="rounded-2xl border border-[#FECACA] bg-[#FEE2E2]/60 p-5 text-[#991B1B]">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold">
                      Neo4j AuraDB Connection Unreachable
                    </h3>
                    <p className="text-xs text-[#7F1D1D] mt-1 max-w-xl leading-relaxed">
                      {health?.error || apiError || 'No active connection could be established to the Neo4j instance.'}
                    </p>
                    <p className="text-[11px] text-[#7F1D1D] mt-1.5 font-medium">
                      Ensure valid credentials exist in <code className="font-mono bg-[#FECACA] px-1 py-0.5 rounded">server/.env</code>. All data is queried live without artificial mocks.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#FFFDF8] rounded-xl border border-[#FECACA] text-[11px] font-mono text-[#74776F] min-w-[240px]">
                  <div className="text-[#991B1B] font-semibold mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>server/.env requirements:</span>
                  </div>
                  <div>NEO4J_URI=neo4j+s://...</div>
                  <div>NEO4J_USERNAME=neo4j</div>
                  <div>NEO4J_PASSWORD=***</div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────
              PAGE 1: OVERVIEW & SYSTEM ARCHITECTURE
              ────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Four Restrained Key Question Metrics */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Total Nodes */}
                <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-[#74776F] font-semibold uppercase tracking-wider">
                    <span>Total Graph Nodes</span>
                    <Layers className="w-4 h-4 text-[#426B52]" />
                  </div>
                  <div className="mt-3">
                    <div className="text-3xl font-extrabold text-[#262B27] tracking-tight">
                      {overview ? overview.totalNodes.toLocaleString() : isConnected ? '...' : '—'}
                    </div>
                    <p className="text-xs text-[#74776F] mt-1">
                      10 verified entity categories
                    </p>
                  </div>
                </div>

                {/* Metric 2: Total Relationships */}
                <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-[#74776F] font-semibold uppercase tracking-wider">
                    <span>Total Relationships</span>
                    <GitFork className="w-4 h-4 text-[#426B52]" />
                  </div>
                  <div className="mt-3">
                    <div className="text-3xl font-extrabold text-[#262B27] tracking-tight">
                      {overview ? overview.totalRelationships.toLocaleString() : isConnected ? '...' : '—'}
                    </div>
                    <p className="text-xs text-[#74776F] mt-1">
                      {overview ? `${overview.relationshipCounts.length} relationship types` : 'Connected edges'}
                    </p>
                  </div>
                </div>

                {/* Metric 3: Neo4j AuraDB Status */}
                <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-[#74776F] font-semibold uppercase tracking-wider">
                    <span>AuraDB Connection</span>
                    <Activity className="w-4 h-4 text-[#426B52]" />
                  </div>
                  <div className="mt-3">
                    <div className="text-xl font-bold text-[#262B27] flex items-center gap-2">
                      {isConnected ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-[#2D6A4F]" />
                          <span className="text-[#2D6A4F]">Connected</span>
                        </>
                      ) : (
                        <>
                          <Server className="w-5 h-5 text-[#991B1B]" />
                          <span className="text-[#991B1B]">Disconnected</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-[#74776F] mt-1 truncate">
                      {health?.database ? `DB: ${health.database}` : 'Neo4j AuraDB'}
                    </p>
                  </div>
                </div>

                {/* Metric 4: Explorer CTA */}
                <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-[#74776F] font-semibold uppercase tracking-wider">
                    <span>Visual Traversal</span>
                    <Compass className="w-4 h-4 text-[#426B52]" />
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={() => setActiveTab('explorer')}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#426B52] hover:bg-[#31523E] text-[#FFFDF8] rounded-xl text-xs font-semibold transition-all shadow-xs"
                    >
                      <span>Open Graph Explorer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-[11px] text-[#74776F] text-center mt-1.5">
                      Full Graph + Neighborhood modes
                    </p>
                  </div>
                </div>
              </section>

              {/* 10 Core Node Labels Distribution */}
              <section className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4DFD4] pb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#262B27] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#426B52]" />
                      <span>10 Core Entity Types in Graph Database</span>
                    </h3>
                    <p className="text-xs text-[#74776F] mt-0.5">
                      Click any entity card to inspect its relationships in the Graph Explorer
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#74776F] bg-[#F7F5EF] px-2.5 py-1 rounded-md border border-[#E4DFD4] self-start sm:self-auto">
                    MATCH (n:Label) RETURN count(n)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {CORE_LABELS.map((label) => {
                    const style = ENTITY_STYLES[label];
                    const Icon = style.icon;
                    const countItem = overview?.labelCounts.find((item) => item.label === label);
                    const count = countItem ? countItem.count : null;

                    return (
                      <div
                        key={label}
                        onClick={() => navigateToExplorer(label)}
                        className="rounded-xl border border-[#E4DFD4] p-4 bg-[#F7F5EF] hover:bg-[#EEE9DE] cursor-pointer transition-all hover:border-[#426B52] group shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#262B27] group-hover:text-[#426B52] transition-colors">
                            {style.name}
                          </span>
                          <div
                            className="p-1 rounded-md"
                            style={{
                              backgroundColor: style.bgSoft,
                              color: style.textColor,
                            }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="text-2xl font-extrabold text-[#262B27] tracking-tight">
                            {count !== null ? count.toLocaleString() : isConnected ? '0' : '—'}
                          </div>
                          <p className="text-[11px] text-[#74776F] mt-0.5 line-clamp-2 leading-relaxed">
                            {style.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Relationship Breakdown & Academic DBMS DA3 Notes */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Relationship Breakdown */}
                <div className="lg:col-span-2 bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E4DFD4] pb-3.5">
                    <div>
                      <h3 className="font-bold text-base text-[#262B27] flex items-center gap-2">
                        <GitFork className="w-4 h-4 text-[#426B52]" />
                        <span>Relationship Distribution Breakdown</span>
                      </h3>
                      <p className="text-xs text-[#74776F] mt-0.5">
                        Directed relationships connecting bookings, rentals, fleets, and maintenance
                      </p>
                    </div>
                    <span className="text-xs font-mono text-[#74776F] bg-[#F7F5EF] px-2 py-1 rounded border border-[#E4DFD4]">
                      MATCH ()-[r]-&gt;() RETURN type(r)
                    </span>
                  </div>

                  {overview && overview.relationshipCounts.length > 0 ? (
                    <div className="space-y-3.5">
                      {overview.relationshipCounts.map((rel) => {
                        const percentage =
                          overview.totalRelationships > 0
                            ? Math.round((rel.count / overview.totalRelationships) * 100)
                            : 0;

                        return (
                          <div key={rel.type} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-[#426B52] font-semibold">
                                [:{rel.type}]
                              </span>
                              <span className="text-[#262B27] font-medium">
                                {rel.count.toLocaleString()}{' '}
                                <span className="text-[#74776F] font-normal">
                                  ({percentage}%)
                                </span>
                              </span>
                            </div>
                            <div className="w-full bg-[#F7F5EF] h-2 rounded-full overflow-hidden border border-[#E4DFD4]">
                              <div
                                className="bg-[#426B52] h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(percentage, 3)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-44 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#E4DFD4] rounded-xl text-[#74776F]">
                      <GitFork className="w-7 h-7 mb-2 opacity-50 text-[#74776F]" />
                      <p className="text-xs font-medium text-[#262B27]">
                        {isConnected
                          ? 'No relationships found in the active graph'
                          : 'Connect Neo4j AuraDB to inspect real relationship counts'}
                      </p>
                      <p className="text-[11px] text-[#74776F] mt-0.5">
                        Queries are executed live without synthetic mock data.
                      </p>
                    </div>
                  )}
                </div>

                {/* Academic DBMS Explanation Card */}
                <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-[#262B27] flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-[#426B52]" />
                      <span>Academic DBMS Context</span>
                    </h3>
                    <p className="text-xs text-[#74776F] leading-relaxed">
                      This system models vehicle rental operations natively as an index-free graph:
                    </p>

                    <div className="mt-4 space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-[#F7F5EF] border border-[#E4DFD4]">
                        <div className="font-semibold text-[#262B27] text-xs">
                          Index-Free Adjacency
                        </div>
                        <p className="text-[#74776F] mt-0.5 text-[11px] leading-relaxed">
                          Traditional SQL requires expensive multi-table JOINs across Bookings, Fleet, and Customers. Neo4j navigates memory pointers directly in O(1) time per relationship hop.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#F7F5EF] border border-[#E4DFD4]">
                        <div className="font-semibold text-[#262B27] text-xs">
                          Read-Only Security
                        </div>
                        <p className="text-[#74776F] mt-0.5 text-[11px] leading-relaxed">
                          All backend endpoints execute allowlisted, parameterized Cypher statements. The seed database remains strictly preserved and tamper-free.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#F7F5EF] border border-[#E4DFD4]">
                        <div className="font-semibold text-[#262B27] text-xs">
                          Multi-Hop Traversal
                        </div>
                        <p className="text-[#74776F] mt-0.5 text-[11px] leading-relaxed">
                          Switch to Graph Explorer to follow traversals such as Customer → Booking → Vehicle → Branch natively.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E4DFD4] text-[11px] text-[#74776F] flex items-center justify-between">
                    <span>Phase 2 Verified</span>
                    <span className="font-mono text-[#426B52] font-semibold">Neo4j AuraDB</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ──────────────────────────────────────────────
              PAGE 2: INTERACTIVE GRAPH EXPLORER
              ────────────────────────────────────────────── */}
          {activeTab === 'explorer' && (
            <GraphExplorerView initialLabel={explorerInitialLabel} />
          )}

          {/* ──────────────────────────────────────────────
              PAGE 3: CYPHER QUERY LAB (Phase 3)
              ────────────────────────────────────────────── */}
          {activeTab === 'cypher-lab' && <CypherLabView />}

          {/* ──────────────────────────────────────────────
              PAGE 4: SMART VEHICLE AVAILABILITY (Phase 4)
              ────────────────────────────────────────────── */}
          {activeTab === 'availability' && <SmartAvailabilityView />}

          {/* ──────────────────────────────────────────────
              PAGE 5: GRAPH ANALYTICS (Phase 5)
              ────────────────────────────────────────────── */}
          {activeTab === 'analytics' && <GraphAnalyticsView />}
        </main>

        {/* Editorial Footer */}
        <footer className="border-t border-[#E4DFD4] bg-[#FFFDF8] py-4 px-8 text-center text-xs text-[#74776F]">
          Vehicle Rental Graph Intelligence System • DBMS Digital Assignment 3 • Neo4j-first Architecture
        </footer>
      </div>
    </div>
  );
}
