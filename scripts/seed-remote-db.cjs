/**
 * Generate a SQL file from materials.json, then execute it via wrangler against the REMOTE live database.
 * Run: node scripts/seed-remote-db.cjs
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const materials = require('../src/data/materials.json');

const DB_NAME = 'ddumaterial_db';
const SQL_FILE = path.join(__dirname, '_seed_remote.sql');

function esc(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "''");
}

let sql = '';

sql += `CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  parent TEXT NOT NULL,
  url TEXT,
  size TEXT,
  mime_type TEXT,
  added_at INTEGER NOT NULL
);\n\n`;

sql += `DELETE FROM files;\n\n`;

const allNodes = Object.values(materials).flat();
// Set addedAt to 0 so they don't get the "NEW" badge
const addedAt = 0; 

console.log(`📚 Generating SQL for ${allNodes.length} entries for LIVE deployment...`);

const batchSize = 100;
for (let i = 0; i < allNodes.length; i += batchSize) {
  const batch = allNodes.slice(i, i + batchSize);
  const values = batch.map(node => {
    return `('${esc(node.id)}', '${esc(node.type)}', '${esc(node.name)}', '${esc(node.parent)}', '${esc(node.url)}', '${esc(node.size)}', '${esc(node.mimeType)}', ${addedAt})`;
  }).join(',\n');

  sql += `INSERT OR IGNORE INTO files (id, type, name, parent, url, size, mime_type, added_at) VALUES\n${values};\n\n`;
}

fs.writeFileSync(SQL_FILE, sql);
console.log(`📝 SQL file written (${(sql.length / 1024).toFixed(0)} KB)`);

console.log('🚀 Executing SQL against LIVE REMOTE D1 database...');
try {
  execSync(`npx wrangler d1 execute ${DB_NAME} --remote --file="${SQL_FILE}" --yes`, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log(`\n✅ Done! Successfully seeded ${allNodes.length} entries into the live D1 database.`);
} catch (e) {
  console.error('❌ Failed to execute SQL:', e.message);
}

fs.unlinkSync(SQL_FILE);
console.log('🧹 Cleaned up temp SQL file.');
