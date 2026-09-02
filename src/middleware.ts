import { defineMiddleware } from "astro:middleware";
import { initializeLucia } from "./auth";
import { env } from "cloudflare:workers";

const maintenanceHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DDU MATERIAL - Maintenance</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e0e0e0; display: flex; justify-content: center; align-items: center; min-height: 100vh; text-align: center; padding: 2rem; }
    .container { max-width: 500px; }
    h1 { font-size: 2rem; margin-bottom: 1rem; color: #fff; }
    p { font-size: 1.1rem; line-height: 1.7; color: #9aa0a6; margin-bottom: 1rem; }
    .badge { display: inline-block; background: #f4b400; color: #000; padding: 0.3rem 0.8rem; border-radius: 4px; font-weight: 700; font-size: 0.85rem; margin-bottom: 1.5rem; }
    .timer { font-size: 1.3rem; color: #4285f4; font-weight: 600; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <div style="font-size: 4rem; margin-bottom: 1rem;">🔧</div>
    <span class="badge">TEMPORARY</span>
    <h1>DDU MATERIAL is taking a short break</h1>
    <p>We've hit our daily database limit due to high traffic today. The site will automatically recover soon.</p>
    <p>Come back in a few hours and everything will be back to normal!</p>
    <div class="timer" id="timer"></div>
  </div>
  <script>
    function update() {
      const now = new Date();
      const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const diff = utcMidnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      document.getElementById('timer').textContent = 'Estimated recovery: ' + h + 'h ' + m + 'm';
    }
    update(); setInterval(update, 60000);
  </script>
</body>
</html>`;

export const onRequest = defineMiddleware(async (context, next) => {
	try {
		if (!env || !env.DB) {
			console.warn("Cloudflare runtime is not available!");
			context.locals.user = null;
			context.locals.session = null;
			return next();
		}
		
		const lucia = initializeLucia(env.DB as any);
		
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
			session = null;
			user = null;
		}
		
		context.locals.session = session;
		context.locals.user = user;

		const protectedPaths = ["/folder/", "/view/"];
		const isProtected = protectedPaths.some(p => context.url.pathname.startsWith(p));
		if (isProtected && !context.locals.user) {
			return context.redirect("/");
		}

		return await next();
	} catch (error) {
		console.error("MIDDLEWARE/PAGE ERROR CAUGHT:", error);
		
		const errorStr = String(error);
		if (errorStr.includes("Failed query") || errorStr.includes("D1") || errorStr.includes("7500")) {
			return new Response(maintenanceHTML, { 
				status: 503, 
				headers: { 
					"Content-Type": "text/html",
					"Retry-After": "3600"
				} 
			});
		}
		
		return new Response("Internal Server Error: " + errorStr, { status: 500 });
	}
});
