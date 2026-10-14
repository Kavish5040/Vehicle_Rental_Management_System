import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { verifyConnection, closeDriver } from './neo4j';
import {
  getDatabaseOverview,
  CORE_LABELS,
  isCoreLabel,
  getEntitiesByLabel,
  getNodeByElementId,
  getNodeNeighborhood,
  getFullGraph,
  getCuratedQueriesList,
  executeCuratedQuery,
  checkVehicleAvailability,
  getGraphAnalytics,
} from './dbService';

const app = express();

app.use(cors());
app.use(express.json());

// 1. Health check & live connection status
app.get('/api/health', async (_req: Request, res: Response) => {
  const result = await verifyConnection();

  res.status(result.connected ? 200 : 503).json({
    status: result.connected ? 'connected' : 'disconnected',
    uri: config.neo4j.uri ? config.neo4j.uri.replace(/\/\/.*@/, '//***@') : null, // Mask credentials
    database: config.neo4j.database || 'neo4j',
    latencyMs: result.latencyMs,
    error: result.error || null,
    isConfigured: config.isConfigured(),
    timestamp: new Date().toISOString(),
  });
});

// 2. Overview statistics for all 10 labels & relationships
app.get('/api/overview', async (_req: Request, res: Response) => {
  try {
    const overview = await getDatabaseOverview();
    res.json({
      success: true,
      data: overview,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch database overview from Neo4j',
      hint: config.isConfigured()
        ? 'Please check network connectivity or Neo4j AuraDB credentials in server/.env'
        : 'Neo4j credentials are not configured in server/.env',
    });
  }
});

// 3. Schema reference endpoint
app.get('/api/schema', (_req: Request, res: Response) => {
  res.json({
    labels: CORE_LABELS,
    count: CORE_LABELS.length,
    description: '10 Core node labels for Vehicle Rental Graph Intelligence System',
  });
});

// 4. Explorer: Paginated & searchable entity list by label (strictly allowlisted)
app.get('/api/explorer/entities', async (req: Request, res: Response) => {
  try {
    const label = req.query.label as string;
    if (!label || !isCoreLabel(label)) {
      res.status(400).json({
        success: false,
        error: `Invalid or missing label parameter. Allowed labels: ${CORE_LABELS.join(', ')}`,
      });
      return;
    }

    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
    const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;

    const data = await getEntitiesByLabel(label, search, limit, skip);
    res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to query entities from Neo4j',
    });
  }
});

// 5. Explorer: Single node lookup by elementId
app.get('/api/explorer/node/:elementId', async (req: Request, res: Response) => {
  try {
    const { elementId } = req.params;
    if (!elementId) {
      res.status(400).json({ success: false, error: 'Element ID parameter is required' });
      return;
    }

    const node = await getNodeByElementId(elementId);
    if (!node) {
      res.status(404).json({ success: false, error: `Node with elementId '${elementId}' not found` });
      return;
    }

    res.json({
      success: true,
      data: node,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to retrieve node details',
    });
  }
});

// 6. Explorer: Node neighborhood graph traversal (connected nodes & directed relationships)
app.get('/api/explorer/neighborhood/:elementId', async (req: Request, res: Response) => {
  try {
    const { elementId } = req.params;
    if (!elementId) {
      res.status(400).json({ success: false, error: 'Element ID parameter is required' });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
    const neighborhood = await getNodeNeighborhood(elementId, limit);

    if (!neighborhood) {
      res.status(404).json({ success: false, error: `Node with elementId '${elementId}' not found` });
      return;
    }

    res.json({
      success: true,
      data: neighborhood,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to retrieve node neighborhood',
    });
  }
});

// 7. Full Graph: returns every node and relationship in the database (read-only, allowlisted)
app.get('/api/graph/full', async (_req: Request, res: Response) => {
  try {
    const graph = await getFullGraph();
    res.json({
      success: true,
      data: graph,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to retrieve full graph from Neo4j',
      hint: config.isConfigured()
        ? 'Check network connectivity or Neo4j AuraDB credentials in server/.env'
        : 'Neo4j credentials are not configured in server/.env',
    });
  }
});

// ──────────────────────────────────────────────
// Phase 3: Curated Cypher Query Lab Endpoints
// ──────────────────────────────────────────────
app.get('/api/lab/queries', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: getCuratedQueriesList(),
  });
});

app.post('/api/lab/execute', async (req: Request, res: Response) => {
  try {
    const { queryId, params } = req.body;
    if (!queryId || typeof queryId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid queryId parameter',
      });
      return;
    }

    const result = await executeCuratedQuery(queryId, params);
    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to execute curated Cypher query',
    });
  }
});

// ──────────────────────────────────────────────
// Phase 4: Smart Vehicle Availability Endpoints
// ──────────────────────────────────────────────
app.get('/api/availability/check', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, branch, type } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'Both startDate and endDate are required query parameters (YYYY-MM-DD)',
      });
      return;
    }

    const result = await checkVehicleAvailability(
      String(startDate),
      String(endDate),
      branch ? String(branch) : undefined,
      type ? String(type) : undefined
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err?.message || 'Failed to evaluate vehicle availability',
    });
  }
});

// ──────────────────────────────────────────────
// Phase 5: Graph Analytics Endpoints
// ──────────────────────────────────────────────
app.get('/api/analytics/dashboard', async (_req: Request, res: Response) => {
  try {
    const analytics = await getGraphAnalytics();
    res.json({
      success: true,
      data: analytics,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to calculate graph analytics',
    });
  }
});

const server = app.listen(config.port, () => {
  console.log(`[Neo4j Backend API] Listening on port ${config.port}`);
  console.log(`[Neo4j Backend API] Configured URI: ${config.neo4j.uri || '(None - configure in server/.env)'}`);
});

process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down...');
  await closeDriver();
  server.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  await closeDriver();
  server.close(() => process.exit(0));
});
