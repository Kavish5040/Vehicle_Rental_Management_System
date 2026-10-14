export interface HealthStatus {
  status: 'connected' | 'disconnected';
  uri: string | null;
  database: string;
  latencyMs?: number;
  error?: string | null;
  isConfigured: boolean;
  timestamp: string;
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

// Phase 2 Explorer Types
export type CoreLabel =
  | 'Customer'
  | 'VehicleType'
  | 'Branch'
  | 'Vehicle'
  | 'Booking'
  | 'Rental'
  | 'Payment'
  | 'Employee'
  | 'Maintenance'
  | 'Review';

export interface EntitySummary {
  elementId: string;
  label: CoreLabel;
  idValue: string;
  displayName: string;
  secondaryInfo: string;
  properties: Record<string, any>;
}

export interface EntityListResponse {
  items: EntitySummary[];
  total: number;
  label: CoreLabel;
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

export interface FullGraphPayload {
  nodes: GraphNodePayload[];
  edges: GraphEdgePayload[];
  nodeCount: number;
  edgeCount: number;
}

// ──────────────────────────────────────────────
// Phase 3: Cypher Query Lab Types
// ──────────────────────────────────────────────
export interface CuratedQueryDefinition {
  id: string;
  title: string;
  category: 'traversal' | 'bookings' | 'vehicles' | 'payments' | 'maintenance' | 'analytics';
  concept: string;
  description: string;
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

// ──────────────────────────────────────────────
// Phase 4: Smart Vehicle Availability Types
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

// ──────────────────────────────────────────────
// Phase 5: Graph Analytics Types
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
