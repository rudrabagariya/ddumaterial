/**
 * Admin API for managing files in the D1 database.
 * POST   = Add a file/folder
 * DELETE = Remove a file/folder
 * PUT    = Rename a file/folder
 */
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { filesTable } from '../../../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { invalidateCache } from '../../../lib/files';

function isAdmin(locals: any): boolean {
  const user = locals.user;
  return user && user.email === env.ADMIN_EMAIL;
}

/** Add a new file or folder */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!isAdmin(locals)) {
    return new Response('Unauthorized', { status: 403 });
  }

  const body = await request.json();
  const { id, type, name, parent, url, size, mimeType } = body;

  if (!id || !type || !name || !parent) {
    return new Response(JSON.stringify({ error: 'Missing required fields: id, type, name, parent' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = drizzle(env.DB as any);

  try {
    await db.insert(filesTable).values({
      id,
      type,
      name,
      parent,
      url: url || null,
      size: size || null,
      mimeType: mimeType || null,
      addedAt: Date.now()
    });

    invalidateCache();

    return new Response(JSON.stringify({ success: true, message: `Added ${type}: ${name}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/** Delete a file or folder (and all its children recursively) */
export const DELETE: APIRoute = async ({ request, locals }) => {
  if (!isAdmin(locals)) {
    return new Response('Unauthorized', { status: 403 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing required field: id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = drizzle(env.DB as any);

  console.log(`[DELETE API] Received request to delete ID: ${id}`);

  try {
    // Recursively find all children to delete
    const allFiles = await db.select().from(filesTable).all();
    const toDelete = new Set<string>();
    
    function collectChildren(parentId: string) {
      toDelete.add(parentId);
      allFiles.filter(f => f.parent === parentId).forEach(f => collectChildren(f.id));
    }
    collectChildren(id);

    // Delete all collected IDs in batches of 500
    const deleteIds = Array.from(toDelete);
    
    for (let i = 0; i < deleteIds.length; i += 500) {
      const batch = deleteIds.slice(i, i + 500);
      await db.delete(filesTable).where(inArray(filesTable.id, batch));
    }

    console.log(`[DELETE API] Successfully deleted ${deleteIds.length} items.`);
    invalidateCache();

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Deleted ${toDelete.size} item(s)` 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/** Rename a file or folder */
export const PUT: APIRoute = async ({ request, locals }) => {
  if (!isAdmin(locals)) {
    return new Response('Unauthorized', { status: 403 });
  }

  const body = await request.json();
  const { id, name } = body;

  if (!id || !name) {
    return new Response(JSON.stringify({ error: 'Missing required fields: id, name' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = drizzle(env.DB as any);

  try {
    await db.update(filesTable).set({ name }).where(eq(filesTable.id, id));
    
    invalidateCache();

    return new Response(JSON.stringify({ success: true, message: `Renamed to: ${name}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
