import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { donationsTable } from '../../db/schema';
import { env } from 'cloudflare:workers';
import { generateIdFromEntropySize } from 'lucia';

export const POST: APIRoute = async (context) => {
  const { request, locals } = context;
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const formData = await request.formData();
    const materialName = formData.get('materialName')?.toString();
    const driveLink = formData.get('driveLink')?.toString();
    const description = formData.get('description')?.toString() || '';

    if (!materialName || !driveLink) {
      return new Response('Missing required fields', { status: 400 });
    }

    const db = drizzle(env.DB as any);
    
    await db.insert(donationsTable).values({
      id: generateIdFromEntropySize(10),
      userId: user.id,
      materialName: materialName.trim(),
      driveLink: driveLink.trim(),
      description: description.trim(),
      status: 'pending',
      submittedAt: Date.now()
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Donation submission error:", error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
