import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { initializeLucia, initializeGoogle } from "../../../../auth";
import type { APIRoute } from "astro";
import { drizzle } from "drizzle-orm/d1";
import { userTable } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { getPlatformEnv } from "../../../../utils/env";

export const GET: APIRoute = async (context) => {
	const code = context.url.searchParams.get("code");
	const state = context.url.searchParams.get("state");
	const storedState = context.cookies.get("google_oauth_state")?.value ?? null;
	const storedCodeVerifier = context.cookies.get("google_code_verifier")?.value ?? null;

	if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	const { DB, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = getPlatformEnv(context);
	const origin = new URL(context.request.url).origin;
	const google = initializeGoogle(GOOGLE_CLIENT_ID as string, GOOGLE_CLIENT_SECRET as string, origin);
	const lucia = initializeLucia(DB as any);
	const db = drizzle(DB as any);

	try {
		const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
		const googleUserResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken()}`
			}
		});
		const googleUser: any = await googleUserResponse.json();

		const existingUser = await db.select().from(userTable).where(eq(userTable.googleId, googleUser.sub)).get();

		if (existingUser) {
			const session = await lucia.createSession(existingUser.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			return context.redirect("/");
		}

		const userId = generateIdFromEntropySize(10);
		
		await db.insert(userTable).values({
			id: userId,
			googleId: googleUser.sub,
			email: googleUser.email,
			name: googleUser.name,
			avatarUrl: googleUser.picture
		});

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		return context.redirect("/");
	} catch (e: any) {
		console.error("GOOGLE CALLBACK ERROR:", e?.message || e);
		if (e instanceof OAuth2RequestError) {
			return new Response("OAuth error: " + e.message, {
				status: 400
			});
		}
		return new Response("Server error: " + (e?.message || String(e)), {
			status: 500
		});
	}
};
