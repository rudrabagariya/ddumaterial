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

		// D1 health check — runs on EVERY request regardless of cookies.
		// This is a zero-row read that reliably detects rate limiting.
		try {
			await env.DB.prepare("SELECT 1").first();
		} catch {
			// D1 is down — activate fallback mode for all visitors
			console.warn("D1 health check failed — activating fallback mode");
			setFallbackMode(true);
			context.locals.user = null;
			context.locals.session = null;
			return await next();
		}
		
		const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
		if (!sessionId) {
			context.locals.user = null;
			context.locals.session = null;
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
