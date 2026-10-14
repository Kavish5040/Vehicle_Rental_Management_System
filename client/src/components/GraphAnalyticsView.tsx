import React, { useState, useEffect, useCallback } from 'react';
import type { GraphAnalyticsPayload } from '../types';
import {
  Users,
  Car,
  MapPin,
  Wrench,
  Activity,
  RefreshCw,
  AlertCircle,
  Network,
} from 'lucide-react';

export const GraphAnalyticsView: React.FC = () => {
  const [data, setData] = useState<GraphAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/analytics/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to fetch graph analytics');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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
                Graph Analytics & Fleet Intelligence
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#EBF1EA] text-[#426B52] border border-[#C8D8C4]">
                Phase 5 Verified
              </span>
            </div>
            <p className="text-xs text-[#74776F] mt-1">
              Multi-dimensional operational aggregation computed directly over Neo4j relationships without artificial sampling.
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4DFD4] bg-[#F7F5EF] hover:bg-[#EEE9DE] text-xs font-semibold text-[#262B27] transition-all disabled:opacity-50 self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#426B52]' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#FEE2E2] text-[#991B1B] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-2.5 py-1 bg-[#991B1B] text-white rounded-lg font-semibold text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* ──────────────────────────────────────────────
          NETWORK TOPOLOGY KPIS
          ────────────────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#74776F] font-semibold uppercase tracking-wider">
              <span>Graph In-Degree Density</span>
              <Network className="w-4 h-4 text-[#426B52]" />
            </div>
            <div className="text-2xl font-bold text-[#262B27] mt-1 font-mono">
              {data.graphDensityMetrics.density.toFixed(4)}
            </div>
            <p className="text-[11px] text-[#74776F] mt-0.5">
              Ratio of verified edges to max possible
            </p>
          </div>

          <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#74776F] font-semibold uppercase tracking-wider">
              <span>Average Node Degree</span>
              <Activity className="w-4 h-4 text-[#426B52]" />
            </div>
            <div className="text-2xl font-bold text-[#262B27] mt-1 font-mono">
              {data.graphDensityMetrics.averageDegree} edges/node
            </div>
            <p className="text-[11px] text-[#74776F] mt-0.5">
              Across 20 nodes and 22 relationships
            </p>
          </div>

          <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#74776F] font-semibold uppercase tracking-wider">
              <span>Active Customer Profiles</span>
              <Users className="w-4 h-4 text-[#426B52]" />
            </div>
            <div className="text-2xl font-bold text-[#262B27] mt-1 font-mono">
              {data.customerActivity.length} registered
            </div>
            <p className="text-[11px] text-[#74776F] mt-0.5">
              With linked bookings & review chains
            </p>
          </div>

          <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#74776F] font-semibold uppercase tracking-wider">
              <span>Branch Depots Monitored</span>
              <MapPin className="w-4 h-4 text-[#426B52]" />
            </div>
            <div className="text-2xl font-bold text-[#262B27] mt-1 font-mono">
              {data.branchDistribution.length} hubs
            </div>
            <p className="text-[11px] text-[#74776F] mt-0.5">
              Staffed and dispatching fleet assets
            </p>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────
          SECTION 1 & 2: FLEET UTILIZATION & CUSTOMER ACTIVITY
          ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Utilization Card */}
        <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E4DFD4] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#262B27] flex items-center gap-2">
                <Car className="w-4 h-4 text-[#426B52]" />
                <span>Fleet Utilization & Reservation Demand</span>
              </h3>
              <p className="text-[11px] text-[#74776F] mt-0.5">
                Aggregated inbound [:RESERVES] edges per vehicle asset
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {data?.fleetUtilization.map((f) => (
              <div
                key={f.regNumber}
                className="p-3 rounded-xl bg-[#F7F5EF] border border-[#E4DFD4] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#262B27]">
                      {f.brand} {f.model}
                    </span>
                    <span className="text-[11px] font-mono text-[#74776F]">
                      ({f.regNumber})
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-[#EBF1EA] text-[#426B52] font-semibold">
                      {f.typeName}
                    </span>
                  </div>

                  <span className="font-mono text-xs font-bold text-[#426B52]">
                    {f.totalBookings} {f.totalBookings === 1 ? 'booking' : 'bookings'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#74776F] pt-1 border-t border-[#E4DFD4]/80">
                  <span>Current Inventory Status: <strong className="text-[#262B27]">{f.status}</strong></span>
                  <span>Revenue: <strong className="text-[#262B27]">₹{f.totalRevenueGenerated.toLocaleString()}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Activity Card */}
        <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E4DFD4] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#262B27] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#426B52]" />
                <span>Customer Loyalty & Engagement</span>
              </h3>
              <p className="text-[11px] text-[#74776F] mt-0.5">
                Traversal of Customer &rarr; Booking and Customer &rarr; Review paths
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {data?.customerActivity.map((c) => (
              <div
                key={c.customerId}
                className="p-3 rounded-xl bg-[#F7F5EF] border border-[#E4DFD4] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#262B27]">{c.fullName}</span>
                    <span className="text-[11px] text-[#74776F] ml-2 font-mono">{c.email}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#426B52]">
                    ₹{c.totalSpending.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#74776F] pt-1 border-t border-[#E4DFD4]/80">
                  <span>Reservations: <strong className="text-[#262B27]">{c.bookingsCount}</strong></span>
                  <span>Reviews Appraised: <strong className="text-[#262B27]">{c.reviewsCount}</strong></span>
                  <span>Contact: <span className="font-mono">{c.phone}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          SECTION 3 & 4: BRANCH DISTRIBUTION & MAINTENANCE SCHEDULE
          ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Distribution */}
        <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E4DFD4] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#262B27] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#426B52]" />
                <span>Branch Hub Fleet & Staffing Distribution</span>
              </h3>
              <p className="text-[11px] text-[#74776F] mt-0.5">
                Fleet inventory and dispatched employees across rental depots
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {data?.branchDistribution.map((b) => (
              <div
                key={b.branchId}
                className="p-3 rounded-xl bg-[#F7F5EF] border border-[#E4DFD4] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#262B27]">
                    {b.branchName} <span className="font-normal text-[#74776F]">({b.city})</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFFDF8] border border-[#E4DFD4] text-[#74776F]">
                    {b.branchId}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#E4DFD4]/80 text-center text-[11px]">
                  <div className="p-1.5 rounded-lg bg-[#FFFDF8] border border-[#E4DFD4]">
                    <div className="font-bold text-[#262B27] font-mono">{b.vehicleCount}</div>
                    <div className="text-[10px] text-[#74776F]">Fleet Assets</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#FFFDF8] border border-[#E4DFD4]">
                    <div className="font-bold text-[#262B27] font-mono">{b.employeeCount}</div>
                    <div className="text-[10px] text-[#74776F]">Staff Members</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#FFFDF8] border border-[#E4DFD4]">
                    <div className="font-bold text-[#426B52] font-mono">{b.totalDispatches}</div>
                    <div className="text-[10px] text-[#74776F]">Dispatches</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Schedule */}
        <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E4DFD4] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#262B27] flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#426B52]" />
                <span>Preventative Maintenance Tracker</span>
              </h3>
              <p className="text-[11px] text-[#74776F] mt-0.5">
                Service status, expenditures, and upcoming inspection dates
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {data?.maintenanceRecords.map((m) => (
              <div
                key={m.maintenanceId}
                className="p-3 rounded-xl bg-[#F7F5EF] border border-[#E4DFD4] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#262B27]">{m.vehicleName}</span>
                    <span className="font-mono text-[11px] text-[#74776F]">({m.vehiclePlate})</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-[#EBF1EA] text-[#426B52] border border-[#C8D8C4]">
                    {m.status}
                  </span>
                </div>

                <p className="text-[11px] text-[#74776F]">{m.description}</p>

                <div className="flex items-center justify-between text-[11px] text-[#74776F] pt-1 border-t border-[#E4DFD4]/80">
                  <span>Expenditure: <strong className="text-[#262B27]">₹{m.cost.toLocaleString()}</strong></span>
                  <span>Next Due: <strong className="text-[#426B52] font-mono">{m.nextServiceDate || 'Scheduled'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
