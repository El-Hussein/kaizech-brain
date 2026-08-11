import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { DataSource } from 'typeorm';

export const createGraphSearchTool = (
  tenantId: string,
  dataSource: DataSource
) => {
  return new DynamicStructuredTool({
    name: 'graph_search',
    description: 'Search the knowledge graph for relationships between entities. Use this to find connections, people, organizations, or concepts that are linked together.',
    schema: z.object({
      entityName: z.string().describe('The name of the entity to search for in the graph.'),
    }),
    func: async ({ entityName }) => {
      try {
        // Find edges where the source or target matches the entity (case insensitive)
        const edges = await dataSource.query(`
          SELECT 
            sn.name as "sourceName", sn.type as "sourceType",
            e.relation_type as "relation",
            tn.name as "targetName", tn.type as "targetType"
          FROM knowledge_edges e
          JOIN knowledge_nodes sn ON e.source_node_id = sn.id
          JOIN knowledge_nodes tn ON e.target_node_id = tn.id
          WHERE (e.tenant_id = $1)
            AND (sn.name ILIKE $2 OR tn.name ILIKE $2)
          LIMIT 20
        `, [tenantId, `%${entityName}%`]);

        if (!edges || edges.length === 0) {
          return `No relationships found in the graph for entity '${entityName}'.`;
        }

        const results = edges.map((e: any) => 
          `[${e.sourceName} (${e.sourceType})] --${e.relation}--> [${e.targetName} (${e.targetType})]`
        );

        return `Graph relationships found:\n` + results.join('\n');
      } catch (err: any) {
        return `Error searching graph store: ${err.message}`;
      }
    },
  }) as any;
};
