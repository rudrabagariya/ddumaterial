import { generateState, generateCodeVerifier } from "arctic";
import { initializeGoogle } from "../../../auth";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const GET: APIRoute = async (context) => {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	
	const origin = new URL(context.request.url).origin;
	const google = initializeGoogle(env.GOOGLE_CLIENT_ID as string, env.GOOGLE_CLIENT_SECRET as string, origin);

	const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"]);

	context.cookies.set("google_oauth_state", state, {
		path: "/",
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax"
	});

	context.cookies.set("google_code_verifier", codeVerifier, {
		path: "/",
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax"
	});

	return context.redirect(url.toString());
};
