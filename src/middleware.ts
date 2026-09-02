import { defineMiddleware } from "astro:middleware";
import { initializeLucia } from "./auth";
import { env } from "cloudflare:workers";

export const onRequest = defineMiddleware(async (context, next) => {
	try {
		if (!env || !env.DB) {
			console.warn("Cloudflare runtime is not available!");
			context.locals.user = null;
			context.locals.session = null;
			return next();
		}
		
		// Initialize Lucia using the Cloudflare D1 binding from the request runtime
		const lucia = initializeLucia(env.DB as any);
		
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

		let session = null;
		let user = null;
		
		try {
			const result = await lucia.validateSession(sessionId);
			session = result.session;
			user = result.user;
			
			if (session && session.fresh) {
				const sessionCookie = lucia.createSessionCookie(session.id);
				context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			}
			if (!session) {
				const sessionCookie = lucia.createBlankSessionCookie();
				context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			}
		} catch (dbError) {
			console.error("Session validation failed (D1 may be rate-limited):", dbError);
			// Gracefully degrade: treat user as logged out instead of crashing
			session = null;
			user = null;
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
