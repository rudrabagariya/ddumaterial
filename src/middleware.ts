import { defineMiddleware } from "astro:middleware";
import { initializeLucia } from "./auth";
import { env } from "cloudflare:workers";
import { setFallbackMode, isFallbackMode } from "./lib/files";

export const onRequest = defineMiddleware(async (context, next) => {
	// Reset fallback mode for each request
	setFallbackMode(false);

	try {
		if (!env || !env.DB) {
			console.warn("Cloudflare runtime is not available!");
			context.locals.user = null;
			context.locals.session = null;
			setFallbackMode(true);
			return next();
		}
		
		const lucia = initializeLucia(env.DB as any);
		
		const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
		if (!sessionId) {
			context.locals.user = null;
			context.locals.session = null;
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
			// D1 is down — activate fallback mode and treat user as logged out
			setFallbackMode(true);
			session = null;
			user = null;
		}
		
		context.locals.session = session;
		context.locals.user = user;

		// Route protection is now handled at the page level so we can test D1 availability first

		return await next();
	} catch (error) {
		console.error("MIDDLEWARE/PAGE ERROR CAUGHT:", error);
		
		const errorStr = String(error);
		if (errorStr.includes("Failed query") || errorStr.includes("D1") || errorStr.includes("7500")) {
			// D1 is completely down — activate fallback and retry the page
			setFallbackMode(true);
			
			try {
				context.locals.user = null;
				context.locals.session = null;
				return await next();
			} catch (retryError) {
				console.error("Fallback also failed:", retryError);
			}
		}
		
		return new Response("Internal Server Error: " + errorStr, { status: 500 });
	}
});
