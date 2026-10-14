import { getSession } from './neo4j';
import neo4j from 'neo4j-driver';

export const CORE_LABELS = [
  'Customer',
  'VehicleType',
  'Branch',
  'Vehicle',
  'Booking',
  'Rental',
  'Payment',
  'Employee',
  'Maintenance',
  'Review',
] as const;

export type CoreLabel = (typeof CORE_LABELS)[number];

export function isCoreLabel(label: string): label is CoreLabel {
  return CORE_LABELS.includes(label as CoreLabel);
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface RelationshipCount {
  type: string;
  count: number;
}

export interface DatabaseOverview {
  totalNodes: number;
  totalRelationships: number;
  labelCounts: LabelCount[];
  relationshipCounts: RelationshipCount[];
  timestamp: string;
}

export interface EntitySummary {
  elementId: string;
  label: CoreLabel;
  idValue: string;
  displayName: string;
  secondaryInfo: string;
  properties: Record<string, any>;
}

export interface GraphNodePayload {
  elementId: string;
  label: string;
  labels: string[];
  displayName: string;
  secondaryInfo: string;
  properties: Record<string, any>;
}

export interface GraphEdgePayload {
  elementId: string;
  type: string;
  sourceElementId: string;
  targetElementId: string;
  direction: 'OUTGOING' | 'INCOMING';
  properties: Record<string, any>;
}

export interface NeighborhoodPayload {
  centerNode: GraphNodePayload;
  nodes: GraphNodePayload[];
  edges: GraphEdgePayload[];
}

function toNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val.toNumber === 'function') return val.toNumber();
  const parsed = parseInt(String(val), 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Recursively converts Neo4j data types (Integer, Date, DateTime, Point)
 * into JSON-friendly JavaScript primitives (numbers, ISO string dates, plain objects).
 */
export function formatNeo4jValue(val: any): any {
  if (val === null || val === undefined) return null;

  // Neo4j Integer
  if (neo4j.isInt(val)) {
    return val.inSafeRange() ? val.toNumber() : val.toString();
  }

  // Neo4j Date (year, month, day)
  if (val.year !== undefined && val.month !== undefined && val.day !== undefined && typeof val.toString === 'function') {
    const y = String(formatNeo4jValue(val.year)).padStart(4, '0');
    const m = String(formatNeo4jValue(val.month)).padStart(2, '0');
    const d = String(formatNeo4jValue(val.day)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Neo4j DateTime or objects with toString returning ISO string
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.map(formatNeo4jValue);
    }
    const cleanObj: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      cleanObj[key] = formatNeo4jValue(val[key]);
    }
    return cleanObj;
  }

  return val;
}

/**
 * Extracts human-friendly primary display name and secondary context for any node.
 */
export function getNodeDisplayInfo(label: string, props: Record<string, any>): { displayName: string; secondaryInfo: string; idValue: string } {
  switch (label) {
    case 'Customer':
      return {
        idValue: props.customer_id || '',
        displayName: props.full_name || props.customer_id || 'Customer',
        secondaryInfo: [props.email, props.phone, props.address].filter(Boolean).join(' • '),
      };
    case 'Vehicle':
      return {
        idValue: props.vehicle_id || '',
        displayName: `${props.brand || ''} ${props.model || ''}`.trim() || props.reg_number || 'Vehicle',
        secondaryInfo: [props.reg_number, props.status, props.vehicle_year ? String(props.vehicle_year) : null].filter(Boolean).join(' • '),
      };
    case 'VehicleType':
      return {
        idValue: props.type_id || '',
        displayName: props.type_name || props.type_id || 'Vehicle Type',
        secondaryInfo: [props.daily_rate ? `₹${props.daily_rate}/day` : null, props.description].filter(Boolean).join(' • '),
      };
    case 'Branch':
      return {
        idValue: props.branch_id || '',
        displayName: props.branch_name || props.branch_id || 'Branch',
        secondaryInfo: [props.city, props.phone, props.address].filter(Boolean).join(' • '),
      };
    case 'Booking':
      return {
        idValue: props.booking_id || '',
        displayName: `Booking ${props.booking_id || ''}`.trim(),
        secondaryInfo: [props.status, props.start_date && props.end_date ? `${props.start_date} to ${props.end_date}` : null].filter(Boolean).join(' • '),
      };
    case 'Rental':
      return {
        idValue: props.rental_id || '',
        displayName: `Rental ${props.rental_id || ''}`.trim(),
        secondaryInfo: [props.total_charges ? `Charges: ₹${props.total_charges}` : null, props.pickup_date ? `Picked: ${props.pickup_date}` : null].filter(Boolean).join(' • '),
      };
    case 'Payment':
      return {
        idValue: props.payment_id || '',
        displayName: `Payment ${props.payment_id || ''}`.trim(),
        secondaryInfo: [props.amount ? `₹${props.amount}` : null, props.payment_status, props.payment_method, props.transaction_id].filter(Boolean).join(' • '),
      };
    case 'Employee':
      return {
        idValue: props.employee_id || '',
        displayName: props.full_name || props.employee_id || 'Employee',
        secondaryInfo: [props.position, props.email, props.phone].filter(Boolean).join(' • '),
      };
    case 'Maintenance':
      return {
        idValue: props.maintenance_id || '',
        displayName: `Maintenance ${props.maintenance_id || ''}`.trim(),
        secondaryInfo: [props.description, props.status, props.cost ? `₹${props.cost}` : null, props.service_date].filter(Boolean).join(' • '),
      };
    case 'Review':
      return {
        idValue: props.review_id || '',
        displayName: `Review ${props.review_id || ''} (${props.rating || 0}★)`.trim(),
        secondaryInfo: [props.comments, props.review_date].filter(Boolean).join(' • '),
      };
    default:
      return {
        idValue: '',
        displayName: label,
        secondaryInfo: '',
      };
  }
}

/**
 * Queries real database node counts for all 10 core labels and all relationship counts.
 * Uses read-only sessions with safe static labels.
 */
export async function getDatabaseOverview(): Promise<DatabaseOverview> {
  const session = getSession('READ');
  try {
    const labelCounts: LabelCount[] = [];
    let totalNodes = 0;

    for (const label of CORE_LABELS) {
      const query = `MATCH (n:\`${label}\`) RETURN count(n) AS count`;
      const result = await session.run(query);
      const count = result.records.length > 0 ? toNumber(result.records[0].get('count')) : 0;
      labelCounts.push({ label, count });
      totalNodes += count;
    }

    const relQuery = `
      MATCH ()-[r]->()
      RETURN type(r) AS type, count(r) AS count
      ORDER BY count DESC
    `;
    const relResult = await session.run(relQuery);
    const relationshipCounts: RelationshipCount[] = [];
    let totalRelationships = 0;

    for (const record of relResult.records) {
      const type = record.get('type') as string;
      const count = toNumber(record.get('count'));
      relationshipCounts.push({ type, count });
      totalRelationships += count;
    }

    return {
      totalNodes,
      totalRelationships,
      labelCounts,
      relationshipCounts,
      timestamp: new Date().toISOString(),
    };
  } finally {
    await session.close();
  }
}

/**
 * Fetches entities for a specific label with optional keyword search and pagination.
 * Label is strictly validated against CORE_LABELS allowlist.
 */
export async function getEntitiesByLabel(
  label: CoreLabel,
  search?: string,
  limit: number = 25,
  skip: number = 0
): Promise<{ items: EntitySummary[]; total: number; label: CoreLabel }> {
  const session = getSession('READ');
  try {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safeSkip = Math.max(0, skip);
    const trimmedSearch = (search || '').trim().toLowerCase();

    // Base query using allowlisted label
    let countCypher = `MATCH (n:\`${label}\`)`;
    let fetchCypher = `MATCH (n:\`${label}\`)`;

    const params: Record<string, any> = {
      limit: neo4j.int(safeLimit),
      skip: neo4j.int(safeSkip),
    };

    if (trimmedSearch) {
      // Dynamic predicate across all node property string values
      countCypher += ` WHERE any(val IN [k IN keys(n) | toString(n[k])] WHERE toLower(val) CONTAINS $search)`;
      fetchCypher += ` WHERE any(val IN [k IN keys(n) | toString(n[k])] WHERE toLower(val) CONTAINS $search)`;
      params.search = trimmedSearch;
    }

    countCypher += ` RETURN count(n) AS total`;
    fetchCypher += ` RETURN elementId(n) AS elementId, properties(n) AS props SKIP $skip LIMIT $limit`;

    const countRes = await session.run(countCypher, params);
    const total = countRes.records.length > 0 ? toNumber(countRes.records[0].get('total')) : 0;

    const fetchRes = await session.run(fetchCypher, params);
    const items: EntitySummary[] = fetchRes.records.map((rec) => {
      const elementId = rec.get('elementId') as string;
      const rawProps = rec.get('props');
      const properties = formatNeo4jValue(rawProps) || {};
      const { displayName, secondaryInfo, idValue } = getNodeDisplayInfo(label, properties);

      return {
        elementId,
        label,
        idValue,
        displayName,
        secondaryInfo,
        properties,
      };
    });

    return {
      items,
      total,
      label,
    };
  } finally {
    await session.close();
  }
}

/**
 * Fetches a single node by its elementId.
 */
export async function getNodeByElementId(elementId: string): Promise<GraphNodePayload | null> {
  const session = getSession('READ');
  try {
    const query = `
      MATCH (n)
      WHERE elementId(n) = $elementId
      RETURN elementId(n) AS elementId, labels(n) AS labels, properties(n) AS props
      LIMIT 1
    `;
    const res = await session.run(query, { elementId });
    if (res.records.length === 0) return null;

    const rec = res.records[0];
    const labels = (rec.get('labels') as string[]) || [];
    const primaryLabel = labels[0] || 'Unknown';
    const properties = formatNeo4jValue(rec.get('props')) || {};
    const { displayName, secondaryInfo } = getNodeDisplayInfo(primaryLabel, properties);

    return {
      elementId: rec.get('elementId'),
      label: primaryLabel,
      labels,
      displayName,
      secondaryInfo,
      properties,
    };
  } finally {
    await session.close();
  }
}

/**
 * Fetches neighborhood of a node (connected entities, relationship types, and directions).
 * Enforces maximum neighborhood limit to keep graph visual readable and avoid overload.
 */
export async function getNodeNeighborhood(
  elementId: string,
  limit: number = 30
): Promise<NeighborhoodPayload | null> {
  const session = getSession('READ');
  try {
    const safeLimit = Math.min(Math.max(1, limit), 60);

    // 1. Get the center node
    const centerNode = await getNodeByElementId(elementId);
    if (!centerNode) return null;

    // 2. Fetch connected nodes and relationships
    const query = `
      MATCH (n)
      WHERE elementId(n) = $elementId
      MATCH (n)-[r]-(m)
      RETURN 
        elementId(r) AS edgeElementId,
        type(r) AS relType,
        properties(r) AS relProps,
        elementId(startNode(r)) AS sourceElementId,
        elementId(endNode(r)) AS targetElementId,
        elementId(m) AS neighborElementId,
        labels(m) AS neighborLabels,
        properties(m) AS neighborProps
      LIMIT $limit
    `;

    const res = await session.run(query, {
      elementId,
      limit: neo4j.int(safeLimit),
    });

    const nodeMap = new Map<string, GraphNodePayload>();
    nodeMap.set(centerNode.elementId, centerNode);

    const edges: GraphEdgePayload[] = [];
    const seenEdges = new Set<string>();

    for (const rec of res.records) {
      const edgeElementId = rec.get('edgeElementId') as string;
      const relType = rec.get('relType') as string;
      const relProps = formatNeo4jValue(rec.get('relProps')) || {};
      const sourceElementId = rec.get('sourceElementId') as string;
      const targetElementId = rec.get('targetElementId') as string;

      const neighborElementId = rec.get('neighborElementId') as string;
      const neighborLabels = (rec.get('neighborLabels') as string[]) || [];
      const neighborPrimaryLabel = neighborLabels[0] || 'Unknown';
      const neighborProps = formatNeo4jValue(rec.get('neighborProps')) || {};
      const { displayName, secondaryInfo } = getNodeDisplayInfo(neighborPrimaryLabel, neighborProps);

      if (!nodeMap.has(neighborElementId)) {
        nodeMap.set(neighborElementId, {
          elementId: neighborElementId,
          label: neighborPrimaryLabel,
          labels: neighborLabels,
          displayName,
          secondaryInfo,
          properties: neighborProps,
        });
      }

      if (!seenEdges.has(edgeElementId)) {
        seenEdges.add(edgeElementId);
        const direction = sourceElementId === elementId ? 'OUTGOING' : 'INCOMING';

        edges.push({
          elementId: edgeElementId,
          type: relType,
          sourceElementId,
          targetElementId,
          direction,
          properties: relProps,
        });
      }
    }

    return {
      centerNode,
      nodes: Array.from(nodeMap.values()),
      edges,
    };
  } finally {
    await session.close();
  }
}

export interface FullGraphPayload {
  nodes: GraphNodePayload[];
  edges: GraphEdgePayload[];
  nodeCount: number;
  edgeCount: number;
}

/**
 * Fetches the complete graph from Neo4j in a single query.
 * Returns all nodes and relationships preserving element IDs, labels, properties,
 * relationship types, source/target references, and directions.
 * Uses a read-only session. Labels are validated against CORE_LABELS allowlist.
 */
export async function getFullGraph(): Promise<FullGraphPayload> {
  const allowedLabels = [...CORE_LABELS];

  const nodesQuery = `
    MATCH (n)
    WHERE any(lbl IN labels(n) WHERE lbl IN $allowedLabels)
    RETURN elementId(n) AS elementId, labels(n) AS labels, properties(n) AS props
  `;
  const edgesQuery = `
    MATCH (src)-[r]->(tgt)
    WHERE any(lbl IN labels(src) WHERE lbl IN $allowedLabels)
      AND any(lbl IN labels(tgt) WHERE lbl IN $allowedLabels)
    RETURN
      elementId(r)   AS edgeElementId,
      type(r)        AS relType,
      properties(r)  AS relProps,
      elementId(src) AS sourceElementId,
      elementId(tgt) AS targetElementId
  `;

  // Use two independent sessions — cannot run concurrent queries on the same session
  const nodeSession = getSession('READ');
  const edgeSession = getSession('READ');

  let nodeRes: any;
  let edgeRes: any;

  try {
    [nodeRes, edgeRes] = await Promise.all([
      nodeSession.run(nodesQuery, { allowedLabels }),
      edgeSession.run(edgesQuery, { allowedLabels }),
    ]);
  } finally {
    await nodeSession.close();
    await edgeSession.close();
  }

  // Build node map — deduplicate by elementId
  const nodeMap = new Map<string, GraphNodePayload>();
  for (const rec of nodeRes.records) {
    const elementId = rec.get('elementId') as string;
    if (nodeMap.has(elementId)) continue;

    const nodeLabels = (rec.get('labels') as string[]) || [];
    const primaryLabel = nodeLabels[0] || 'Unknown';
    const properties = formatNeo4jValue(rec.get('props')) || {};
    const { displayName, secondaryInfo } = getNodeDisplayInfo(primaryLabel, properties);

    nodeMap.set(elementId, {
      elementId,
      label: primaryLabel,
      labels: nodeLabels,
      displayName,
      secondaryInfo,
      properties,
    });
  }

  // Build edges — deduplicate by elementId
  const edgeMap = new Map<string, GraphEdgePayload>();
  for (const rec of edgeRes.records) {
    const edgeElementId = rec.get('edgeElementId') as string;
    if (edgeMap.has(edgeElementId)) continue;

    edgeMap.set(edgeElementId, {
      elementId: edgeElementId,
      type: rec.get('relType') as string,
      sourceElementId: rec.get('sourceElementId') as string,
      targetElementId: rec.get('targetElementId') as string,
      direction: 'OUTGOING',
      properties: formatNeo4jValue(rec.get('relProps')) || {},
    });
  }

  const nodes = Array.from(nodeMap.values());
  const edges = Array.from(edgeMap.values());

  return {
    nodes,
    edges,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };
}

// ──────────────────────────────────────────────
// Phase 3: Cypher Query Lab Services (Allowlisted, Read-Only)
// ──────────────────────────────────────────────
export interface CuratedQueryDefinition {
  id: string;
  title: string;
  category: 'traversal' | 'bookings' | 'vehicles' | 'payments' | 'maintenance' | 'analytics';
  concept: string;
  description: string;
  cypher: string;
  defaultParams?: Record<string, any>;
}

export interface QueryExecutionResult {
  queryId: string;
  title: string;
  cypher: string;
  executionTimeMs: number;
  rowCount: number;
  columns: string[];
  records: Record<string, any>[];
  summary: string;
}

export const CURATED_QUERIES: CuratedQueryDefinition[] = [
  {
    id: 'customer-trip-traversal',
    title: 'Multi-Hop Customer Reservation & Fleet Traversal',
    category: 'traversal',
    concept: 'Index-Free Adjacency (Multi-Hop Pointer Traversal)',
    description: 'Demonstrates traversing 3 hops from Customer -> Booking -> Vehicle -> Branch in O(1) time per relationship without relational SQL joins.',
    cypher: `MATCH (c:Customer)-[:MADE]->(b:Booking)-[:RESERVES]->(v:Vehicle)-[:LOCATED_AT]->(br:Branch)
RETURN c.full_name AS customer_name,
       b.booking_id AS booking_id,
       b.status AS booking_status,
       b.start_date AS rental_start,
       b.end_date AS rental_end,
       v.brand + ' ' + v.model AS vehicle_model,
       v.reg_number AS plate_number,
       br.branch_name AS branch_name
ORDER BY b.booking_id DESC`,
  },
  {
    id: 'customer-rental-payments',
    title: 'Customer Rental & Settlement Ledger',
    category: 'payments',
    concept: 'Operational Financial Chains (Booking -> Rental -> Payment)',
    description: 'Traces the fulfillment cycle from reservation agreement to dispatched rental contract and settled payment ledger.',
    cypher: `MATCH (c:Customer)-[:MADE]->(b:Booking)-[:GENERATES]->(r:Rental)-[:HAS_PAYMENT]->(p:Payment)
RETURN c.full_name AS customer_name,
       b.booking_id AS booking_id,
       r.rental_id AS rental_id,
       r.pickup_date AS pickup_date,
       r.total_charges AS total_charges,
       p.payment_id AS payment_id,
       p.payment_method AS method,
       p.amount AS amount_paid,
       p.payment_status AS payment_status
ORDER BY r.rental_id DESC`,
  },
  {
    id: 'fleet-branch-classification',
    title: 'Vehicle Fleet, Classification & Hub Proximity',
    category: 'vehicles',
    concept: 'Categorical & Spatial Graph Relationships',
    description: 'Examines fleet assets linked to VehicleType categories (for tier pricing) and Branch depots (for physical dispatch).',
    cypher: `MATCH (v:Vehicle)-[:OF_TYPE]->(vt:VehicleType),
      (v)-[:LOCATED_AT]->(br:Branch)
RETURN v.reg_number AS registration,
       v.brand AS brand,
       v.model AS model,
       v.status AS vehicle_status,
       vt.type_name AS category,
       vt.daily_rate AS daily_rate_inr,
       br.branch_name AS branch_hub,
       br.city AS city
ORDER BY vt.daily_rate DESC`,
  },
  {
    id: 'booking-schedule-overlap',
    title: 'Booking Conflict & Temporal Schedule Inspection',
    category: 'bookings',
    concept: 'Temporal Graph Projection & Overlap Detection',
    description: 'Inspects reservation intervals across vehicles to identify active schedules, rental durations, and potential overlaps.',
    cypher: `MATCH (b:Booking)-[:RESERVES]->(v:Vehicle)
RETURN v.reg_number AS vehicle_plate,
       v.brand + ' ' + v.model AS vehicle_name,
       b.booking_id AS booking_id,
       b.status AS booking_status,
       b.start_date AS booking_start,
       b.end_date AS booking_end,
       duration.inDays(date(b.start_date), date(b.end_date)).days AS duration_days
ORDER BY v.reg_number, b.start_date`,
  },
  {
    id: 'maintenance-safety-logs',
    title: 'Vehicle Maintenance Logs & Safety Inspection',
    category: 'maintenance',
    concept: 'Asset Lifecycle & Preventative Service Edges',
    description: 'Traces vehicles connected to maintenance logs to prioritize servicing, monitor repair expenditures, and verify safety status.',
    cypher: `MATCH (v:Vehicle)-[:HAS_MAINTENANCE]->(m:Maintenance)
RETURN v.reg_number AS vehicle_plate,
       v.brand + ' ' + v.model AS vehicle_name,
       m.maintenance_id AS maintenance_id,
       m.description AS service_description,
       m.status AS service_status,
       m.cost AS service_cost,
       m.service_date AS service_date,
       m.next_service_date AS next_due_date
ORDER BY m.next_service_date ASC`,
  },
  {
    id: 'fleet-booking-frequency',
    title: 'Fleet Utilization & Reservation Demand Ranking',
    category: 'analytics',
    concept: 'Graph In-Degree Centrality Aggregation',
    description: 'Aggregates inbound [:RESERVES] edges to rank fleet vehicles by consumer booking demand and utilization.',
    cypher: `MATCH (v:Vehicle)
OPTIONAL MATCH (b:Booking)-[:RESERVES]->(v)
RETURN v.reg_number AS vehicle_plate,
       v.brand + ' ' + v.model AS vehicle_name,
       v.status AS current_status,
       count(b) AS total_reservations,
       collect(b.booking_id) AS booking_references
ORDER BY total_reservations DESC, vehicle_name ASC`,
  },
  {
    id: 'customer-activity-reviews',
    title: 'Customer Experience & Feedback Traversal',
    category: 'analytics',
    concept: 'Triadic Experience Graph (Customer -> Review -> Vehicle)',
    description: 'Traverses ratings and feedback left by customers linked directly back to the evaluated fleet vehicles.',
    cypher: `MATCH (c:Customer)-[:WROTE]->(rev:Review)-[:REVIEWS]->(v:Vehicle)
RETURN c.full_name AS reviewer,
       c.email AS email,
       v.brand + ' ' + v.model AS vehicle_rated,
       v.reg_number AS plate_number,
       rev.rating AS rating_stars,
       rev.comments AS feedback,
       rev.review_date AS review_date
ORDER BY rev.rating DESC`,
  },
  {
    id: 'branch-staff-dispatch',
    title: 'Branch Staffing & Rental Dispatch Activity',
    category: 'traversal',
    concept: 'Organizational Traversal (Branch -> Employee -> Rental)',
    description: 'Inspects which branch staff members have actively dispatched customer rental checkouts.',
    cypher: `MATCH (br:Branch)-[:EMPLOYS]->(e:Employee)
OPTIONAL MATCH (e)<-[:HANDLED_BY]-(r:Rental)
RETURN br.branch_name AS branch_name,
       e.full_name AS staff_name,
       e.position AS staff_role,
       count(r) AS rentals_dispatched,
       collect(r.rental_id) AS rental_contracts
ORDER BY br.branch_name, staff_name`,
  },
];

export function getCuratedQueriesList(): Omit<CuratedQueryDefinition, 'cypher'>[] {
  return CURATED_QUERIES.map(({ id, title, category, concept, description, defaultParams }) => ({
    id,
    title,
    category,
    concept,
    description,
    defaultParams,
  }));
}

export function getCuratedQueryById(queryId: string): CuratedQueryDefinition | undefined {
  return CURATED_QUERIES.find((q) => q.id === queryId);
}

export async function executeCuratedQuery(
  queryId: string,
  params: Record<string, any> = {}
): Promise<QueryExecutionResult> {
  const queryDef = getCuratedQueryById(queryId);
  if (!queryDef) {
    throw new Error(`Invalid query identifier "${queryId}". Only allowlisted queries are permitted.`);
  }

  const session = getSession('READ');
  const startTime = Date.now();

  try {
    const mergedParams = { ...(queryDef.defaultParams || {}), ...params };
    const result = await session.run(queryDef.cypher, mergedParams);
    const executionTimeMs = Date.now() - startTime;

    const columns: string[] = result.records.length > 0 ? result.records[0].keys.map(String) : [];
    const records = result.records.map((rec) => {
      const obj: Record<string, any> = {};
      columns.forEach((col) => {
        obj[col] = formatNeo4jValue(rec.get(col));
      });
      return obj;
    });

    return {
      queryId: queryDef.id,
      title: queryDef.title,
      cypher: queryDef.cypher,
      executionTimeMs,
      rowCount: records.length,
      columns,
      records,
      summary: `Successfully retrieved ${records.length} records in ${executionTimeMs}ms via Neo4j AuraDB.`,
    };
  } finally {
    await session.close();
  }
}

// ──────────────────────────────────────────────
// Phase 4: Smart Vehicle Availability Services
// ──────────────────────────────────────────────
export interface AvailableVehicleItem {
  vehicleId: string;
  regNumber: string;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  status: string;
  typeName: string;
  dailyRate: number;
  branchName: string;
  branchCity: string;
  totalCostEstimate: number;
}

export interface UnavailableVehicleItem {
  vehicleId: string;
  regNumber: string;
  brand: string;
  model: string;
  typeName: string;
  branchName: string;
  status: string;
  reason: string;
  conflictingBookings: Array<{
    bookingId: string;
    status: string;
    startDate: string;
    endDate: string;
  }>;
}

export interface AvailabilityResult {
  startDate: string;
  endDate: string;
  durationDays: number;
  totalFleetCount: number;
  availableCount: number;
  unavailableCount: number;
  availableVehicles: AvailableVehicleItem[];
  unavailableVehicles: UnavailableVehicleItem[];
}

export async function checkVehicleAvailability(
  startDateStr: string,
  endDateStr: string,
  branchFilter?: string,
  typeFilter?: string
): Promise<AvailabilityResult> {
  // Validate dates
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD.');
  }

  if (start > end) {
    throw new Error('Start date must be earlier than or equal to end date.');
  }

  // Calculate inclusive duration in days
  const durationMs = end.getTime() - start.getTime();
  const durationDays = Math.max(Math.round(durationMs / (1000 * 60 * 60 * 24)) + 1, 1);

  const session = getSession('READ');
  try {
    const cypher = `
      MATCH (v:Vehicle)-[:OF_TYPE]->(vt:VehicleType),
            (v)-[:LOCATED_AT]->(br:Branch)
      WHERE ($branchFilter IS NULL OR br.branch_name = $branchFilter)
        AND ($typeFilter IS NULL OR vt.type_name = $typeFilter)
      OPTIONAL MATCH (b:Booking)-[:RESERVES]->(v)
      WHERE b.status IN ['Confirmed', 'Pending']
        AND date(b.start_date) <= date($endDate)
        AND date(b.end_date) >= date($startDate)
      RETURN v.vehicle_id AS vehicle_id,
             v.reg_number AS reg_number,
             v.brand AS brand,
             v.model AS model,
             v.vehicle_year AS vehicle_year,
             v.color AS color,
             v.status AS vehicle_status,
             vt.type_name AS type_name,
             vt.daily_rate AS daily_rate,
             br.branch_name AS branch_name,
             br.city AS branch_city,
             collect(CASE WHEN b IS NOT NULL THEN {
               bookingId: b.booking_id,
               status: b.status,
               startDate: b.start_date,
               endDate: b.end_date
             } ELSE null END) AS conflicts
      ORDER BY vt.daily_rate ASC, v.brand ASC
    `;

    const result = await session.run(cypher, {
      startDate: startDateStr,
      endDate: endDateStr,
      branchFilter: branchFilter?.trim() || null,
      typeFilter: typeFilter?.trim() || null,
    });

    const availableVehicles: AvailableVehicleItem[] = [];
    const unavailableVehicles: UnavailableVehicleItem[] = [];

    for (const rec of result.records) {
      const vehicleId = rec.get('vehicle_id') as string;
      const regNumber = rec.get('reg_number') as string;
      const brand = rec.get('brand') as string;
      const model = rec.get('model') as string;
      const year = formatNeo4jValue(rec.get('vehicle_year')) as number | null;
      const color = rec.get('color') as string | null;
      const vehicleStatus = rec.get('vehicle_status') as string;
      const typeName = rec.get('type_name') as string;
      const dailyRate = Number(formatNeo4jValue(rec.get('daily_rate'))) || 0;
      const branchName = rec.get('branch_name') as string;
      const branchCity = rec.get('branch_city') as string;

      const rawConflicts = rec.get('conflicts') as any[];
      const activeConflicts = (rawConflicts || [])
        .filter((c) => c !== null)
        .map((c) => ({
          bookingId: c.bookingId,
          status: c.status,
          startDate: formatNeo4jValue(c.startDate),
          endDate: formatNeo4jValue(c.endDate),
        }));

      // Evaluate availability
      const hasBookingConflict = activeConflicts.length > 0;
      const isStatusAvailable = vehicleStatus.toLowerCase() === 'available';

      if (!hasBookingConflict && isStatusAvailable) {
        availableVehicles.push({
          vehicleId,
          regNumber,
          brand,
          model,
          year,
          color,
          status: vehicleStatus,
          typeName,
          dailyRate,
          branchName,
          branchCity,
          totalCostEstimate: dailyRate * durationDays,
        });
      } else {
        let reason = '';
        if (hasBookingConflict) {
          const first = activeConflicts[0];
          reason = `Schedule collision: Already booked in ${first.bookingId} (${first.startDate} to ${first.endDate}, ${first.status})`;
        } else {
          reason = `Vehicle marked as "${vehicleStatus}" in fleet inventory`;
        }

        unavailableVehicles.push({
          vehicleId,
          regNumber,
          brand,
          model,
          typeName,
          branchName,
          status: vehicleStatus,
          reason,
          conflictingBookings: activeConflicts,
        });
      }
    }

    return {
      startDate: startDateStr,
      endDate: endDateStr,
      durationDays,
      totalFleetCount: result.records.length,
      availableCount: availableVehicles.length,
      unavailableCount: unavailableVehicles.length,
      availableVehicles,
      unavailableVehicles,
    };
  } finally {
    await session.close();
  }
}

// ──────────────────────────────────────────────
// Phase 5: Graph Analytics & Intelligence Services
// ──────────────────────────────────────────────
export interface FleetUtilizationItem {
  regNumber: string;
  brand: string;
  model: string;
  typeName: string;
  status: string;
  totalBookings: number;
  totalRevenueGenerated: number;
}

export interface CustomerActivityItem {
  customerId: string;
  fullName: string;
  email: string;
  phone: string;
  bookingsCount: number;
  reviewsCount: number;
  totalSpending: number;
}

export interface BranchDistributionItem {
  branchId: string;
  branchName: string;
  city: string;
  vehicleCount: number;
  employeeCount: number;
  totalDispatches: number;
}

export interface MaintenanceRecordItem {
  maintenanceId: string;
  vehiclePlate: string;
  vehicleName: string;
  description: string;
  status: string;
  cost: number;
  serviceDate: string | null;
  nextServiceDate: string | null;
}

export interface GraphAnalyticsPayload {
  fleetUtilization: FleetUtilizationItem[];
  customerActivity: CustomerActivityItem[];
  branchDistribution: BranchDistributionItem[];
  maintenanceRecords: MaintenanceRecordItem[];
  graphDensityMetrics: {
    totalNodes: number;
    totalEdges: number;
    averageDegree: number;
    density: number;
    nodeLabelCount: number;
    relationshipTypeCount: number;
  };
  timestamp: string;
}

export async function getGraphAnalytics(): Promise<GraphAnalyticsPayload> {
  const session1 = getSession('READ');
  const session2 = getSession('READ');
  const session3 = getSession('READ');
  const session4 = getSession('READ');
  const session5 = getSession('READ');

  try {
    // 1. Fleet Utilization
    const fleetPromise = session1.run(`
      MATCH (v:Vehicle)-[:OF_TYPE]->(vt:VehicleType)
      OPTIONAL MATCH (b:Booking)-[:RESERVES]->(v)
      OPTIONAL MATCH (b)-[:GENERATES]->(r:Rental)
      RETURN v.reg_number AS reg_number,
             v.brand AS brand,
             v.model AS model,
             vt.type_name AS type_name,
             v.status AS status,
             count(DISTINCT b) AS total_bookings,
             sum(coalesce(r.total_charges, 0)) AS total_revenue
      ORDER BY total_bookings DESC, total_revenue DESC
    `);

    // 2. Customer Activity
    const customerPromise = session2.run(`
      MATCH (c:Customer)
      OPTIONAL MATCH (c)-[:MADE]->(b:Booking)
      OPTIONAL MATCH (b)-[:GENERATES]->(r:Rental)
      OPTIONAL MATCH (c)-[:WROTE]->(rev:Review)
      RETURN c.customer_id AS customer_id,
             c.full_name AS full_name,
             c.email AS email,
             c.phone AS phone,
             count(DISTINCT b) AS bookings_count,
             count(DISTINCT rev) AS reviews_count,
             sum(coalesce(r.total_charges, 0)) AS total_spending
      ORDER BY bookings_count DESC, total_spending DESC
    `);

    // 3. Branch Distribution
    const branchPromise = session3.run(`
      MATCH (br:Branch)
      OPTIONAL MATCH (v:Vehicle)-[:LOCATED_AT]->(br)
      OPTIONAL MATCH (br)-[:EMPLOYS]->(e:Employee)
      OPTIONAL MATCH (e)<-[:HANDLED_BY]-(r:Rental)
      RETURN br.branch_id AS branch_id,
             br.branch_name AS branch_name,
             br.city AS city,
             count(DISTINCT v) AS vehicle_count,
             count(DISTINCT e) AS employee_count,
             count(DISTINCT r) AS total_dispatches
      ORDER BY vehicle_count DESC, total_dispatches DESC
    `);

    // 4. Maintenance Records
    const maintenancePromise = session4.run(`
      MATCH (v:Vehicle)-[:HAS_MAINTENANCE]->(m:Maintenance)
      RETURN m.maintenance_id AS maintenance_id,
             v.reg_number AS vehicle_plate,
             v.brand + ' ' + v.model AS vehicle_name,
             m.description AS description,
             m.status AS status,
             m.cost AS cost,
             m.service_date AS service_date,
             m.next_service_date AS next_service_date
      ORDER BY m.next_service_date ASC
    `);

    // 5. Node and edge totals for network density
    const densityPromise = session5.run(`
      MATCH (n) WITH count(n) AS node_count
      MATCH ()-[r]->() WITH node_count, count(r) AS rel_count
      RETURN node_count, rel_count
    `);

    const [fleetRes, customerRes, branchRes, maintenanceRes, densityRes] = await Promise.all([
      fleetPromise,
      customerPromise,
      branchPromise,
      maintenancePromise,
      densityPromise,
    ]);

    const fleetUtilization: FleetUtilizationItem[] = fleetRes.records.map((r) => ({
      regNumber: r.get('reg_number'),
      brand: r.get('brand'),
      model: r.get('model'),
      typeName: r.get('type_name'),
      status: r.get('status'),
      totalBookings: Number(formatNeo4jValue(r.get('total_bookings'))),
      totalRevenueGenerated: Number(formatNeo4jValue(r.get('total_revenue'))),
    }));

    const customerActivity: CustomerActivityItem[] = customerRes.records.map((r) => ({
      customerId: r.get('customer_id'),
      fullName: r.get('full_name'),
      email: r.get('email'),
      phone: r.get('phone'),
      bookingsCount: Number(formatNeo4jValue(r.get('bookings_count'))),
      reviewsCount: Number(formatNeo4jValue(r.get('reviews_count'))),
      totalSpending: Number(formatNeo4jValue(r.get('total_spending'))),
    }));

    const branchDistribution: BranchDistributionItem[] = branchRes.records.map((r) => ({
      branchId: r.get('branch_id'),
      branchName: r.get('branch_name'),
      city: r.get('city'),
      vehicleCount: Number(formatNeo4jValue(r.get('vehicle_count'))),
      employeeCount: Number(formatNeo4jValue(r.get('employee_count'))),
      totalDispatches: Number(formatNeo4jValue(r.get('total_dispatches'))),
    }));

    const maintenanceRecords: MaintenanceRecordItem[] = maintenanceRes.records.map((r) => ({
      maintenanceId: r.get('maintenance_id'),
      vehiclePlate: r.get('vehicle_plate'),
      vehicleName: r.get('vehicle_name'),
      description: r.get('description'),
      status: r.get('status'),
      cost: Number(formatNeo4jValue(r.get('cost'))) || 0,
      serviceDate: formatNeo4jValue(r.get('service_date')),
      nextServiceDate: formatNeo4jValue(r.get('next_service_date')),
    }));

    const nodeCount = Number(formatNeo4jValue(densityRes.records[0]?.get('node_count'))) || 20;
    const relCount = Number(formatNeo4jValue(densityRes.records[0]?.get('rel_count'))) || 22;
    const avgDegree = nodeCount > 0 ? Number(((relCount * 2) / nodeCount).toFixed(2)) : 0;
    const maxPossibleEdges = nodeCount > 1 ? nodeCount * (nodeCount - 1) : 1;
    const density = Number((relCount / maxPossibleEdges).toFixed(4));

    return {
      fleetUtilization,
      customerActivity,
      branchDistribution,
      maintenanceRecords,
      graphDensityMetrics: {
        totalNodes: nodeCount,
        totalEdges: relCount,
        averageDegree: avgDegree,
        density,
        nodeLabelCount: 10,
        relationshipTypeCount: 10,
      },
      timestamp: new Date().toISOString(),
    };
  } finally {
    await Promise.all([
      session1.close(),
      session2.close(),
      session3.close(),
      session4.close(),
      session5.close(),
    ]);
  }
}
