import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) return new Response('Missing File ID', { status: 400 });

  try {
    const driveUrl = `https://drive.google.com/uc?export=download&id=${id}`;
    const response = await fetch(driveUrl);

    if (!response.ok) {
      return new Response('Failed to fetch from Google Drive', { status: response.status });
    }

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        // Optional: Ensure browsers don't cache this proxy response too aggressively
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response('Internal Proxy Error', { status: 500 });
  }
};
