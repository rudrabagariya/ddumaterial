import { defineMiddleware } from "astro:middleware";
import { initializeLucia } from "./auth";
import { getPlatformEnv } from "./utils/env";

export const onRequest = defineMiddleware(async (context, next) => {
	try {
		const { DB } = getPlatformEnv(context);
		
		if (!DB) {
			console.warn("Cloudflare runtime DB is not available!");
			context.locals.user = null;
			context.locals.session = null;
			return next();
		}
		
		// Initialize Lucia using the Cloudflare D1 binding from the request runtime
		const lucia = initializeLucia(DB as any);
		
		const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
		if (!sessionId) {
			context.locals.user = null;
			context.locals.session = null;
			// Redirect unauthenticated users from protected pages
			const protectedPaths = ["/folder/", "/view/"];
			const isProtected = protectedPaths.some(p => context.url.pathname.startsWith(p));
			if (isProtected) {
				return context.redirect("/");
			}
			return next();
		}

		const { session, user } = await lucia.validateSession(sessionId);
		if (session && session.fresh) {
			const sessionCookie = lucia.createSessionCookie(session.id);
			context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		}
		if (!session) {
			const sessionCookie = lucia.createBlankSessionCookie();
			context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		}
		
		context.locals.session = session;
		context.locals.user = user;

		// Route protection: redirect unauthenticated users away from content pages
		const protectedPaths = ["/folder/", "/view/"];
		const isProtected = protectedPaths.some(p => context.url.pathname.startsWith(p));
		if (isProtected && !context.locals.user) {
			return context.redirect("/");
		}

		return await next();
	} catch (error) {
		console.error("MIDDLEWARE ERROR CAUGHT:", error);
		// Return a safe fallback so Astro logger doesn't crash on 'process is not defined'
		return new Response("Internal Server Error: " + String(error), { status: 500 });
	}
});
