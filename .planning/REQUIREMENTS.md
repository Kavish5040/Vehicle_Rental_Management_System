# System Requirements & Acceptance Criteria

## Functional Requirements

### FR1: Database Health & Overview (Phase 1)
- Verify live connectivity to Neo4j AuraDB Free instance.
- Safely report system status (connected, disconnected, error details without exposing credentials).
- Query and return exact counts for all 10 core node labels (`Customer`, `VehicleType`, `Branch`, `Vehicle`, `Booking`, `Rental`, `Payment`, `Employee`, `Maintenance`, `Review`).
- Query total relationship count and relationship counts grouped by type (`type(r)`).
- Provide responsive, modern UI showing real-time stats, label distribution, and relationship metrics.

### FR2: Graph Explorer (Phase 2)
- Inspect nodes and connected entities (Customer -> Booking -> Vehicle, Vehicle -> Branch, Rental -> Payment, etc.).
- Safe parameterized queries with pagination and filtering.

### FR3: Cypher Query Lab (Phase 3)
- Curated collection of academic & practical Cypher queries demonstrating graph traversal advantages.
- Explanations, execution timing, and formatted table/graph output.
- Disallow unrestricted arbitrary query execution.

### FR4: Smart Vehicle Availability (Phase 4)
- Date-range conflict detection via relationship graph traversal.
- Alternative vehicle recommendations based on VehicleType and branch proximity.

### FR5: Graph Analytics & Intelligence (Phase 5)
- Customer rental history and loyalty patterns.
- High-frequency booking vehicles and maintenance hot-spots.
- Multi-hop traversal analytics (Branch-Vehicle-Employee performance).

## Non-Functional & Security Requirements
- **NFR1 - Security:** Neo4j credentials must strictly reside in backend `.env` (gitignored). Frontend never accesses database directly.
- **NFR2 - Integrity:** No destructive Cypher operations (`DROP`, `DELETE`, `DETACH DELETE`). Zero reseeding/overwriting.
- **NFR3 - Truthfulness:** No mocked or fake statistics. Handle database downtime or connection errors gracefully with clear user feedback.
- **NFR4 - Performance & Code Quality:** TypeScript strict mode, clean modular architecture, production build verification.
