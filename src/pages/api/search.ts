import type { APIRoute } from 'astro';
import materials from '../../data/materials.json';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.toLowerCase() || '';

  if (!query) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const allNodes = Object.values(materials).flat() as any[];
  
  // Basic search matching folder or file names
  const results = allNodes.filter(node => 
    node.name && node.name.toLowerCase().includes(query)
  ).slice(0, 30); // limit to top 30 hits

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
