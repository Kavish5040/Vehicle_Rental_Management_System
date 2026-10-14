import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from server/.env if present
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  neo4j: {
    uri: (process.env.NEO4J_URI || '').trim(),
    username: (process.env.NEO4J_USERNAME || '').trim(),
    password: (process.env.NEO4J_PASSWORD || '').trim(),
    database: (process.env.NEO4J_DATABASE || 'neo4j').trim(),
  },
  isConfigured(): boolean {
    return Boolean(this.neo4j.uri && this.neo4j.username && this.neo4j.password);
  }
};
