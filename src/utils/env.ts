export function getPlatformEnv(context: any) {
  // In Cloudflare, environment variables and bindings are in context.locals.runtime.env
  const runtimeEnv = context.locals?.runtime?.env || {};

  const DB = runtimeEnv.DB;
  const GOOGLE_CLIENT_ID = runtimeEnv.GOOGLE_CLIENT_ID || (typeof process !== 'undefined' ? process.env.GOOGLE_CLIENT_ID : undefined);
  const GOOGLE_CLIENT_SECRET = runtimeEnv.GOOGLE_CLIENT_SECRET || (typeof process !== 'undefined' ? process.env.GOOGLE_CLIENT_SECRET : undefined);

  return {
    DB,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  };
}
