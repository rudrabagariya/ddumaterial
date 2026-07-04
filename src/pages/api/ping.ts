import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { userTable } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async (context) => {
  const { locals } = context;
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const db = drizzle(env.DB as any);
    
    // Update the lastActiveAt timestamp for the current user
    await db.update(userTable)
      .set({ lastActiveAt: Date.now() })
      .where(eq(userTable.id, user.id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Ping error:", error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
