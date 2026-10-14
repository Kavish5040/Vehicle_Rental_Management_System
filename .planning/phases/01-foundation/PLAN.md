# Phase 1 Plan: Foundation, Secure Neo4j Integration, and Live Database Overview

## Objective
Establish a clean, secure project architecture with Express + TypeScript backend and React + Vite frontend. Integrate the official Neo4j driver with connection verification. Expose safe backend endpoints to fetch live counts for all 10 labels and relationships grouped by type. Build a polished, responsive dashboard displaying connection health, counts, and metrics with proper loading/error states.

## Tasks Breakdown

### Task 1: Environment & Root Setup
- Configure root `.gitignore` ensuring `.env`, `node_modules`, and build artifacts are strictly ignored.
- Create root orchestration scripts (`package.json`) if helpful to run both client and server.

### Task 2: Backend Implementation (`server/`)
- Setup `server/package.json` and `tsconfig.json`.
- Implement `neo4j.ts`: Connection pool management using `neo4j-driver`, graceful shutdown, and connectivity verification (`driver.verifyConnectivity()`).
- Implement safe database query services:
  - Label count query: safely count nodes for each label in `['Customer', 'VehicleType', 'Branch', 'Vehicle', 'Booking', 'Rental', 'Payment', 'Employee', 'Maintenance', 'Review']`.
  - Relationship count query: query total relationships and breakdown by `type(r)`.
- Implement Express routes:
  - `GET /api/health`: reports `{ status: 'connected' | 'disconnected', uri, database, latencyMs, error }` without exposing credentials.
  - `GET /api/overview`: reports total nodes, total relationships, label breakdown, relationship type breakdown, and query execution timestamp.
- Create `.env.example` with clear instructions (`NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE`, `PORT`).

### Task 3: Frontend Implementation (`client/`)
- Setup React + Vite + TypeScript with Tailwind CSS.
- Build clean, modern UI components:
  - Header with system title, DBMS DA3 context, and live Neo4j status indicator (pulsing badge, latency).
  - Stat summary cards: Total Nodes, Total Relationships, Registered Labels, Relationship Types.
  - 10 Node Labels Grid: Displays live count, icon, and description for each core entity.
  - Relationships Breakdown: List/visual bar distribution of relationship types.
  - Connection Config / Status Drawer/Banner: Explains how connection is established, instructions if `.env` is unconfigured, and error messages when disconnected.
  - Manual Refresh button with loading animation.

### Task 4: Verification & Testing
- Run TypeScript type checks (`tsc`) on both server and client.
- Run frontend production build (`npm run build`).
- Verify error handling when credentials are unconfigured or invalid (graceful disconnected state, clear actionable message, zero fabricated data).
