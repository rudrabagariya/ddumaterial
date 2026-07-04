import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { feedbackTable } from '../../db/schema';
import { env } from 'cloudflare:workers';
import { generateIdFromEntropySize } from 'lucia';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.formData();
    const category = data.get('category')?.toString();
    const message = data.get('message')?.toString();
    const user = locals.user;

    if (!category || !message) {
      return new Response('Category and message are required', { status: 400 });
    }

    if (message.length > 2000) {
      return new Response('Message is too long (max 2000 characters)', { status: 400 });
    }

    const db = drizzle(env.DB as any);
    
    await db.insert(feedbackTable).values({
      id: generateIdFromEntropySize(10),
      userId: user ? user.id : null,
      category,
      message,
      submittedAt: Date.now(),
      status: 'new'
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/feedback?success=true'
      }
    });

  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
