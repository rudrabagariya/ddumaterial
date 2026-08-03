/**
 * Generate a SQL file from materials.json, then execute it via wrangler.
 * This is MUCH faster than individual wrangler commands.
 * 
 * Run: node scripts/seed-local-db.cjs
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const materials = require('../src/data/materials.json');

const DB_NAME = 'ddumaterial_db';
const SQL_FILE = path.join(__dirname, '_seed.sql');

// Escape single quotes for SQL
function esc(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "''");
}

// 1. Build the SQL
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
const now = Date.now();

console.log(`📚 Generating SQL for ${allNodes.length} entries...`);

// Insert in batches of 100 for safety
const batchSize = 100;
for (let i = 0; i < allNodes.length; i += batchSize) {
  const batch = allNodes.slice(i, i + batchSize);
  const values = batch.map(node => {
    return `('${esc(node.id)}', '${esc(node.type)}', '${esc(node.name)}', '${esc(node.parent)}', '${esc(node.url)}', '${esc(node.size)}', '${esc(node.mimeType)}', ${now})`;
  }).join(',\n');

  sql += `INSERT OR IGNORE INTO files (id, type, name, parent, url, size, mime_type, added_at) VALUES\n${values};\n\n`;
}

// 2. Write SQL file
fs.writeFileSync(SQL_FILE, sql);
console.log(`📝 SQL file written (${(sql.length / 1024).toFixed(0)} KB)`);

// 3. Execute via wrangler
console.log('🚀 Executing SQL against local D1...');
try {
  execSync(`npx wrangler d1 execute ${DB_NAME} --local --file="${SQL_FILE}"`, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log(`\n✅ Done! Seeded ${allNodes.length} entries into local D1.`);
} catch (e) {
  console.error('❌ Failed to execute SQL:', e.message);
}

// 4. Cleanup
fs.unlinkSync(SQL_FILE);
console.log('🧹 Cleaned up temp SQL file.');
