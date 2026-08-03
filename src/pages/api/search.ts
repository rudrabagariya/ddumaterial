import type { APIRoute } from 'astro';
import { getAllNodes } from '../../lib/files';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.toLowerCase() || '';

  if (!query) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const allNodes = await getAllNodes(env.DB as any);
  
  // Basic search matching folder or file names
  const results = allNodes.filter(node => 
    node.name && node.name.toLowerCase().includes(query)
  ).slice(0, 30); // limit to top 30 hits

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
