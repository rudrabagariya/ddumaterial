import { initializeLucia } from "../../../auth";
import type { APIRoute } from "astro";
import { getPlatformEnv } from "../../../utils/env";

export const POST: APIRoute = async (context) => {
	if (!context.locals.session) {
		return new Response(null, {
			status: 401
		});
	}
	const { DB } = getPlatformEnv(context);
	const lucia = initializeLucia(DB as any);
	await lucia.invalidateSession(context.locals.session.id);
	const sessionCookie = lucia.createBlankSessionCookie();
	context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	return context.redirect("/");
};
