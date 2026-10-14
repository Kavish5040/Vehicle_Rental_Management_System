import neo4j, { Driver, Session } from 'neo4j-driver';
import { config } from './config';

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!config.isConfigured()) {
    throw new Error('Neo4j credentials are not fully configured in server/.env');
  }

  if (!driver) {
    driver = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.username, config.neo4j.password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 20000,
      }
    );
  }

  return driver;
}

export function getSession(mode: 'READ' | 'WRITE' = 'READ'): Session {
  const d = getDriver();
  return d.session({
    database: config.neo4j.database || undefined,
    defaultAccessMode: mode === 'WRITE' ? neo4j.session.WRITE : neo4j.session.READ,
  });
}

export async function verifyConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  if (!config.isConfigured()) {
    return {
      connected: false,
      error: 'Missing required configuration: NEO4J_URI, NEO4J_USERNAME, or NEO4J_PASSWORD in server/.env',
    };
  }

  const start = Date.now();
  try {
    const d = getDriver();
    await d.verifyConnectivity();
    const latencyMs = Date.now() - start;
    return { connected: true, latencyMs };
  } catch (err: any) {
    return {
      connected: false,
      error: err?.message || 'Failed to connect to Neo4j instance',
      latencyMs: Date.now() - start,
    };
  }
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
