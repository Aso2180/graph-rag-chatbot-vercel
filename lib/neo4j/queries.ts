import { getSession } from './client';

export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
}

export interface GraphRelationship {
  id: string;
  type: string;
  startNode: string;
  endNode: string;
  properties: Record<string, any>;
}

export interface GraphContext {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

export async function searchGraph(query: string): Promise<GraphContext> {
  const session = await getSession();
  
  try {
    // Search for nodes containing the query text
    const nodeResult = await session.run(
      `
      MATCH (n)
      WHERE ANY(prop IN keys(n) WHERE toString(n[prop]) CONTAINS $query)
      RETURN n
      LIMIT 20
      `,
      { query }
    );

    const nodes: GraphNode[] = nodeResult.records.map((record: any) => {
      const node = record.get('n');
      return {
        id: node.identity.toString(),
        labels: node.labels,
        properties: node.properties
      };
    });

    if (nodes.length === 0) {
      return { nodes: [], relationships: [] };
    }

    // Get relationships between found nodes
    const nodeIds = nodes.map(n => n.id);
    const relResult = await session.run(
      `
      MATCH (a)-[r]->(b)
      WHERE id(a) IN $nodeIds AND id(b) IN $nodeIds
      RETURN r, id(a) as startId, id(b) as endId
      `,
      { nodeIds: nodeIds.map(id => parseInt(id)) }
    );

    const relationships: GraphRelationship[] = relResult.records.map((record: any) => {
      const rel = record.get('r');
      return {
        id: rel.identity.toString(),
        type: rel.type,
        startNode: record.get('startId').toString(),
        endNode: record.get('endId').toString(),
        properties: rel.properties
      };
    });

    return { nodes, relationships };
  } finally {
    await session.close();
  }
}

export async function getNodeContext(nodeId: string): Promise<GraphContext> {
  const session = await getSession();
  
  try {
    // Get the node and its neighbors
    const result = await session.run(
      `
      MATCH (n)
      WHERE id(n) = $nodeId
      OPTIONAL MATCH (n)-[r]-(neighbor)
      RETURN n, collect(DISTINCT neighbor) as neighbors, collect(DISTINCT r) as relationships
      `,
      { nodeId: parseInt(nodeId) }
    );

    if (result.records.length === 0) {
      return { nodes: [], relationships: [] };
    }

    const record = result.records[0];
    const mainNode = record.get('n');
    const neighbors = record.get('neighbors');
    const relationships = record.get('relationships');

    const nodes: GraphNode[] = [
      {
        id: mainNode.identity.toString(),
        labels: mainNode.labels,
        properties: mainNode.properties
      }
    ];

    neighbors.forEach((neighbor: any) => {
      if (neighbor) {
        nodes.push({
          id: neighbor.identity.toString(),
          labels: neighbor.labels,
          properties: neighbor.properties
        });
      }
    });

    const graphRelationships: GraphRelationship[] = relationships.map((rel: any) => ({
      id: rel.identity.toString(),
      type: rel.type,
      startNode: rel.start.toString(),
      endNode: rel.end.toString(),
      properties: rel.properties
    }));

    return { nodes, relationships: graphRelationships };
  } finally {
    await session.close();
  }
}