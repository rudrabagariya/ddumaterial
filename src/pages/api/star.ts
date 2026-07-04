import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { starredTable } from '../../db/schema';
import { and, eq } from 'drizzle-orm';

export const POST: APIRoute = async (context) => {
  const { request, locals } = context;
  const user = locals.user;

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const fileId = formData.get('fileId')?.toString();
  const redirectUrl = formData.get('redirect')?.toString() || '/';

  if (!fileId) {
    return new Response('Missing fileId', { status: 400 });
  }

  const db = drizzle(context.locals.runtime.env.DB);

  // Check if already starred
  const existing = await db.select().from(starredTable)
    .where(and(eq(starredTable.userId, user.id), eq(starredTable.fileId, fileId)))
    .get();

  if (existing) {
    // Unstar
    await db.delete(starredTable)
      .where(and(eq(starredTable.userId, user.id), eq(starredTable.fileId, fileId)))
      .run();
  } else {
    // Star
    await db.insert(starredTable).values({
      id: crypto.randomUUID(),
      userId: user.id,
      fileId: fileId,
      starredAt: Date.now()
    }).run();
  }

  return context.redirect(redirectUrl);
};
