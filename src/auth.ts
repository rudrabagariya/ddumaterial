import { Lucia } from "lucia";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { drizzle } from "drizzle-orm/d1";
import { sessionTable, userTable } from "./db/schema";
import { Google } from "arctic";

export function initializeLucia(D1: D1Database) {
	const db = drizzle(D1);
	const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);
	return new Lucia(adapter, {
		sessionCookie: {
			attributes: {
				secure: import.meta.env.PROD
			}
		},
		getUserAttributes: (attributes) => {
			return {
				googleId: attributes.googleId,
				email: attributes.email,
				name: attributes.name,
				avatarUrl: attributes.avatarUrl
			};
		}
	});
}

export function initializeGoogle(clientId: string, clientSecret: string, origin: string) {
	return new Google(clientId, clientSecret, `${origin}/api/auth/callback/google`);
}

declare module "lucia" {
	interface Register {
		Lucia: ReturnType<typeof initializeLucia>;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	googleId: string;
	email: string;
	name: string;
	avatarUrl: string;
}
