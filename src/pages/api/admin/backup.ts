/**
 * Admin API to backup the entire files database as a JSON file.
 */
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { filesTable } from '../../../db/schema';
import { env } from 'cloudflare:workers';

function isAdmin(locals: any): boolean {
  const user = locals.user;
  return user && user.email === env.ADMIN_EMAIL;
}

export const GET: APIRoute = async ({ locals }) => {
  if (!isAdmin(locals)) {
    return new Response('Unauthorized', { status: 403 });
  }

  try {
    const db = drizzle(env.DB as any);
    const allFiles = await db.select().from(filesTable).all();

    // Reconstruct into a flat array just like materials.json
    const backupData = JSON.stringify(allFiles, null, 2);

    return new Response(backupData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="materials_backup_${new Date().toISOString().split('T')[0]}.json"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
