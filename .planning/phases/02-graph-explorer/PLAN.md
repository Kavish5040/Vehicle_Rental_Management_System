# Phase 2 Plan: Graph Explorer & Connected Entity Traversal

## Objective
Build a fast, interactive, and visually stunning Graph Explorer for the Vehicle Rental Graph Intelligence System.
The explorer lets users select any of the 10 core entity labels (`Customer`, `VehicleType`, `Branch`, `Vehicle`, `Booking`, `Rental`, `Payment`, `Employee`, `Maintenance`, `Review`), browse and search real nodes from Neo4j, inspect their exact properties and element IDs, navigate their immediate graph neighborhood (1-hop connected entities and relationship types), and explore the connected graph interactively via a clean graph visualization.

## Verified Data Model & Schema
Relationships verified directly in live Neo4j database:
- `(Customer)-[:MADE]->(Booking)`
- `(Booking)-[:RESERVES]->(Vehicle)`
- `(Booking)-[:GENERATES]->(Rental)`
- `(Rental)-[:HANDLED_BY]->(Employee)`
- `(Rental)-[:HAS_PAYMENT]->(Payment)`
- `(Branch)-[:EMPLOYS]->(Employee)`
- `(Vehicle)-[:OF_TYPE]->(VehicleType)`
- `(Vehicle)-[:LOCATED_AT]->(Branch)`
- `(Vehicle)-[:HAS_MAINTENANCE]->(Maintenance)`
- `(Customer)-[:WROTE]->(Review)`
- `(Review)-[:REVIEWS]->(Vehicle)`

## Tasks Breakdown

### Task 1: Backend Explorer APIs & dbService Extensions (`server/`)
- Add strictly allowlisted entity query functions in `server/src/dbService.ts`:
  - `getEntitiesByLabel(label: CoreLabel, search?: string, limit?: number, skip?: number)`: Parameterized Cypher query with safe allowlist label checking, text search across key attributes (e.g. `full_name`, `email`, `brand`, `model`, `reg_number`, `branch_name`, IDs), and pagination (`SKIP`, `LIMIT`).
  - `getEntityById(label: CoreLabel, idProp: string, idVal: string) | getEntityByElementId(elementId: string)`: Fetch single entity and properties.
  - `getEntityNeighborhood(elementId: string, limit?: number)`: Queries incoming and outgoing relationships `(n)-[r]-(m)` returning connected nodes (elementId, labels, properties) and edges (elementId, type, direction, properties).
- Add REST endpoints in `server/src/index.ts`:
  - `GET /api/explorer/entities?label=:label&search=:query&limit=:limit&skip=:skip`
  - `GET /api/explorer/node/:elementId`
  - `GET /api/explorer/neighborhood/:elementId?limit=:limit`
- Ensure all queries use read-only sessions and explicit allowlist validation.

### Task 2: Frontend Explorer State, API Services & Types (`client/`)
- Extend `client/src/types.ts` with explorer types:
  - `GraphNode`: elementId, label, properties, displayTitle, displaySubtitle.
  - `GraphEdge`: elementId, type, sourceId, targetId, direction ('OUTGOING' | 'INCOMING'), properties.
  - `NeighborhoodResponse`: centerNode, nodes, edges.
  - `EntityListResponse`: items, total, label.
- Create API client helpers for explorer endpoints.

### Task 3: Interactive Graph Visualization Component (`client/src/components/GraphCanvas.tsx`)
- Implement a responsive, lightweight, physics/force-directed SVG graph canvas:
  - Custom canvas or React SVG force layout tailored for 1-hop and 2-hop neighborhoods.
  - Renders nodes with distinct label color coding, icons, and labels.
  - Renders directional arrows and relationship type labels (e.g. `[:RESERVES]`, `[:GENERATES]`, `[:LOCATED_AT]`).
  - Interactive: click on node to inspect/navigate, pan, zoom, fit to view, drag nodes.
  - Handles loading states, empty graph, and neighborhood expansion smoothly without heavy external package friction.

### Task 4: Explorer UI Assembly & Navigation (`client/`)
- Add tabbed or view-switch navigation in header (`[Overview]`, `[Graph Explorer]`).
- Left Column / Panel:
  - Label Selector (10 entity chips with counts and badges).
  - Search input with clear button.
  - Entity List / Table with pagination, primary identifiers, and status tags.
- Center / Right Panel:
  - Breadcrumb / history trail for multi-hop graph traversal (e.g. `Customer (Arjun Kumar) > Booking (BK301) > Vehicle (Creta)`).
  - Visual Graph View (`GraphCanvas`) displaying center node and connected neighbors with relationship labels.
  - Entity Detail Drawer / Inspector:
    - Label and primary ID badge.
    - All node properties formatted cleanly (Dates, Numbers, Currency, License, etc.).
    - Connected Entities grouped by relationship type with "Traverse to node" action button.
- Comprehensive empty, loading, and error states.

### Task 5: Verification & Testing
- Test TypeScript compilation on server (`npm run build`).
- Test TypeScript compilation and Vite build on client (`npm run build`).
- Test API endpoints and UI integration against live Neo4j AuraDB.
- Document Phase 2 completion in `.planning/phases/02-graph-explorer/SUMMARY.md` and update `.planning/STATE.md`.
