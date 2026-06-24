import { initializeLucia } from "../../../auth";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async (context) => {
	if (!context.locals.session) {
		return new Response(null, {
			status: 401
		});
	}
	const lucia = initializeLucia(env.DB as any);
	await lucia.invalidateSession(context.locals.session.id);
	const sessionCookie = lucia.createBlankSessionCookie();
	context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	return context.redirect("/");
};
