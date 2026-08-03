/**
 * Migration script: Imports all data from materials.json into the D1 'files' table.
 * 
 * Usage: This runs as an API endpoint at /api/admin/migrate
 * Only accessible by the admin user. Clears existing data and re-imports.
 */
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { filesTable } from '../../../db/schema';
import { env } from 'cloudflare:workers';
import materials from '../../../data/materials.json';

export const POST: APIRoute = async ({ locals }) => {
  const user = locals.user;
  const adminEmail = env.ADMIN_EMAIL;
  
  if (!user || user.email !== adminEmail) {
    return new Response('Unauthorized', { status: 403 });
  }

  const db = drizzle(env.DB as any);

  try {
    // 1. Create the files table if it doesn't exist
    await (env.DB as any).exec(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        parent TEXT NOT NULL,
        url TEXT,
        size TEXT,
        mime_type TEXT,
        added_at INTEGER NOT NULL
      )
    `);

    // 2. Clear existing data
    await (env.DB as any).exec(`DELETE FROM files`);

    // 3. Flatten all materials and insert in batches
    const allNodes: any[] = Object.values(materials).flat();
    const now = Date.now();
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < allNodes.length; i += batchSize) {
      const batch = allNodes.slice(i, i + batchSize);
      const values = batch.map(node => ({
        id: node.id,
        type: node.type,
        name: node.name,
        parent: node.parent,
        url: node.url || null,
        size: node.size || null,
        mimeType: node.mimeType || null,
        addedAt: now  // All existing files get "now" as addedAt (won't show as NEW)
      }));
      
      await db.insert(filesTable).values(values).onConflictDoNothing();
      inserted += batch.length;
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Migrated ${inserted} files/folders into D1`,
      total: allNodes.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
