import React, { useState, useEffect, useCallback } from 'react';
import type { AvailabilityResult } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Info,
  Search,
  RefreshCw,
} from 'lucide-react';

export const SmartAvailabilityView: React.FC = () => {
  const [startDate, setStartDate] = useState('2026-08-21');
  const [endDate, setEndDate] = useState('2026-08-24');
  const [branchFilter, setBranchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(async (start: string, end: string, branch?: string, type?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate: start,
        endDate: end,
      });
      if (branch) params.append('branch', branch);
      if (type) params.append('type', type);

      const res = await fetch(`/api/availability/check?${params}`);
      const data = await res.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to check availability');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error evaluating availability');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAvailability(startDate, endDate, branchFilter, typeFilter);
  }, [checkAvailability, startDate, endDate, branchFilter, typeFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkAvailability(startDate, endDate, branchFilter, typeFilter);
  };

  const handleApplyPreset = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    checkAvailability(start, end, branchFilter, typeFilter);
  };

  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────
          HEADER & CONTEXT
          ────────────────────────────────────────────── */}
      <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#262B27] tracking-tight">
                Smart Vehicle Availability & Conflict Engine
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#EBF1EA] text-[#426B52] border border-[#C8D8C4]">
                Phase 4 Verified
              </span>
            </div>
            <p className="text-xs text-[#74776F] mt-1">
              Evaluates date-range schedule collisions across reservation relationships and checks vehicle operational status in real time.
            </p>
          </div>

          {/* Quick Academic Test Presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#74776F] font-semibold hidden sm:inline">
              Test Windows:
            </span>
            <button
              onClick={() => handleApplyPreset('2026-08-21', '2026-08-24')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#FAF3EB] text-[#93581D] border border-[#E8D2B7] hover:bg-[#F3E6D5] transition-colors"
              title="Known collision with bookings BK301 and BK302"
            >
              Peak Collision (Aug 21-24)
            </button>
            <button
              onClick={() => handleApplyPreset('2026-08-26', '2026-08-30')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#EBF1EA] text-[#426B52] border border-[#C8D8C4] hover:bg-[#DCE6D9] transition-colors"
              title="Open rental window with Available fleet"
            >
              Open Window (Aug 26-30)
            </button>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          SEARCH CONTROLS FORM
          ────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
      >
        <div>
          <label className="block text-xs font-semibold text-[#74776F] mb-1.5">
            Start Date (Pickup)
          </label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#F7F5EF] text-xs font-mono text-[#262B27] px-3 py-2 rounded-xl border border-[#E4DFD4] focus:outline-none focus:border-[#426B52]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#74776F] mb-1.5">
            End Date (Return)
          </label>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#F7F5EF] text-xs font-mono text-[#262B27] px-3 py-2 rounded-xl border border-[#E4DFD4] focus:outline-none focus:border-[#426B52]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#74776F] mb-1.5">
            Branch Location
          </label>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full bg-[#F7F5EF] text-xs text-[#262B27] px-3 py-2 rounded-xl border border-[#E4DFD4] focus:outline-none focus:border-[#426B52]"
          >
            <option value="">All Branches</option>
            <option value="Chennai Central">Chennai Central</option>
            <option value="Bengaluru East">Bengaluru East</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#74776F] mb-1.5">
            Vehicle Category
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-[#F7F5EF] text-xs text-[#262B27] px-3 py-2 rounded-xl border border-[#E4DFD4] focus:outline-none focus:border-[#426B52]"
          >
            <option value="">All Categories</option>
            <option value="SUV">SUV</option>
            <option value="Hatchback">Hatchback</option>
          </select>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#426B52] hover:bg-[#31523E] text-[#FFFDF8] rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
          >
            <Search className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Evaluating...' : 'Check Availability'}</span>
          </button>
        </div>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-[#FEE2E2] text-[#991B1B] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => checkAvailability(startDate, endDate, branchFilter, typeFilter)}
            className="px-2.5 py-1 bg-[#991B1B] text-white rounded-lg font-semibold text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* ──────────────────────────────────────────────
          RESULTS SUMMARY STATS
          ────────────────────────────────────────────── */}
      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-4 shadow-xs">
            <div className="text-xs text-[#74776F] font-semibold uppercase tracking-wider">
              Requested Window
            </div>
            <div className="text-xl font-bold text-[#262B27] mt-1 font-mono">
              {result.startDate} → {result.endDate}
            </div>
            <p className="text-xs text-[#74776F] mt-0.5">
              Duration: {result.durationDays} {result.durationDays === 1 ? 'day' : 'days'} (inclusive)
            </p>
          </div>

          <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-4 shadow-xs">
            <div className="text-xs text-[#74776F] font-semibold uppercase tracking-wider">
              Fleet Units Evaluated
            </div>
            <div className="text-xl font-bold text-[#262B27] mt-1 font-mono">
              {result.totalFleetCount} vehicles
            </div>
            <p className="text-xs text-[#74776F] mt-0.5">
              Matching active branch & category filters
            </p>
          </div>

          <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-4 shadow-xs">
            <div className="text-xs text-[#2D6A4F] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Available Vehicles</span>
            </div>
            <div className="text-2xl font-bold text-[#2D6A4F] mt-1">
              {result.availableCount} available
            </div>
            <p className="text-xs text-[#74776F] mt-0.5">
              Ready for reservation with zero conflicts
            </p>
          </div>

          <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-4 shadow-xs">
            <div className="text-xs text-[#B45309] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Conflicting / Occupied</span>
            </div>
            <div className="text-2xl font-bold text-[#B45309] mt-1">
              {result.unavailableCount} unavailable
            </div>
            <p className="text-xs text-[#74776F] mt-0.5">
              Schedule collisions or status locks
            </p>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────
          AVAILABLE VEHICLES SECTION
          ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#262B27] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
            <span>Available Fleet for Selected Window</span>
          </h3>
          <span className="text-xs font-mono text-[#74776F] bg-[#FFFDF8] px-2.5 py-1 rounded-md border border-[#E4DFD4]">
            {result?.availableVehicles.length || 0} match
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#74776F] bg-[#FFFDF8] rounded-2xl border border-[#E4DFD4] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#426B52]" />
            <span>Checking availability graph...</span>
          </div>
        ) : !result || result.availableVehicles.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#74776F] bg-[#FFFDF8] rounded-2xl border border-dashed border-[#E4DFD4]">
            <p className="font-semibold text-[#262B27]">No vehicles available for this date window.</p>
            <p className="mt-1 text-[#74776F]">
              All vehicles matching your criteria have schedule conflicts with confirmed bookings or are currently marked as rented.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.availableVehicles.map((v) => (
              <div
                key={v.vehicleId}
                className="bg-[#FFFDF8] border border-[#C8D8C4] rounded-2xl p-5 shadow-xs hover:border-[#426B52] transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#EBF1EA] text-[#426B52] border border-[#C8D8C4]">
                        {v.typeName}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#262B27]">
                        {v.regNumber}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-[#262B27] mt-1.5">
                      {v.brand} {v.model}
                    </h4>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-extrabold text-[#426B52]">
                      ₹{v.dailyRate.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-[#74776F]">per day</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E4DFD4] flex items-center justify-between text-xs text-[#74776F]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#426B52]" />
                    <span>{v.branchName}, {v.branchCity}</span>
                  </div>

                  <div className="font-semibold text-[#262B27]">
                    Est. Total: <span className="font-bold text-[#426B52]">₹{v.totalCostEstimate.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────
          UNAVAILABLE & CONFLICT EXPLANATIONS SECTION
          ────────────────────────────────────────────── */}
      {result && result.unavailableVehicles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#262B27] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#B45309]" />
              <span>Collision & Unavailability Inspector</span>
            </h3>
            <span className="text-xs font-mono text-[#74776F] bg-[#FFFDF8] px-2.5 py-1 rounded-md border border-[#E4DFD4]">
              {result.unavailableVehicles.length} locked
            </span>
          </div>

          <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl divide-y divide-[#E4DFD4] overflow-hidden text-xs">
            {result.unavailableVehicles.map((uv) => (
              <div key={uv.vehicleId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7F5EF]/60 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#262B27]">
                      {uv.brand} {uv.model}
                    </span>
                    <span className="font-mono text-[11px] text-[#74776F]">
                      ({uv.regNumber})
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-[#FAF3EB] text-[#93581D] font-semibold border border-[#E8D2B7]">
                      {uv.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#B45309] font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uv.reason}</span>
                  </p>
                </div>

                <div className="text-right sm:self-center shrink-0">
                  <span className="text-[11px] text-[#74776F] flex items-center gap-1 justify-end">
                    <MapPin className="w-3 h-3" />
                    <span>{uv.branchName}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────
          GRAPH THEORY NOTE FOR FACULTY
          ────────────────────────────────────────────── */}
      <div className="bg-[#FFFDF8] border border-[#E4DFD4] rounded-2xl p-5 shadow-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-[#426B52] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed space-y-1">
          <h4 className="font-bold text-[#262B27]">
            Academic DBMS Context: Graph-Native Temporal Overlap Detection
          </h4>
          <p className="text-[#74776F]">
            In relational database systems, checking vehicle booking availability across thousands of records requires expensive multi-table joins and table-wide interval scans. In Neo4j, the engine traverses directly along <code className="font-mono text-[#426B52]">(:Vehicle)&lt;-[:RESERVES]-(:Booking)</code> edges in $O(1)$ time per relationship, evaluating interval overlap condition <code className="font-mono text-[#426B52]">b.start_date &lt;= $requested_end AND b.end_date &gt;= $requested_start</code> with zero relational join overhead.
          </p>
        </div>
      </div>
    </div>
  );
};
