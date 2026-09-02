/**
 * Script to add missing indexes to the D1 database to prevent rate limiting.
 */
const { execSync } = require('child_process');
const path = require('path');

const DB_NAME = 'ddumaterial_db';

const sql = `
CREATE INDEX IF NOT EXISTS idx_files_parent ON files (parent);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON recently_viewed (user_id);
`;

console.log('🚀 Adding indexes to LIVE REMOTE D1 database to fix rate limiting...');

try {
  execSync(`npx wrangler d1 execute ${DB_NAME} --remote --command="${sql}" --yes`, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log(`\n✅ Done! Indexes applied successfully.`);
} catch (e) {
  console.error('❌ Failed to add indexes:', e.message);
}
