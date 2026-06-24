const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

// 1. Clean wrangler.json - remove Pages-incompatible fields
const wranglerPath = path.join(distDir, 'server', 'wrangler.json');
if (fs.existsSync(wranglerPath)) {
  const config = JSON.parse(fs.readFileSync(wranglerPath, 'utf8'));
  config.kv_namespaces = [];
  delete config.assets;
  delete config.main;
  delete config.rules;
  config.previews = {};
  fs.writeFileSync(wranglerPath, JSON.stringify(config));
  console.log('✅ Cleaned wrangler.json');
}

// 2. Create _worker.js directory in dist/ (Pages expects this)
const workerDir = path.join(distDir, '_worker.js');
if (!fs.existsSync(workerDir)) {
  fs.mkdirSync(workerDir, { recursive: true });
}

// Copy server entry and chunks into _worker.js/
const serverDir = path.join(distDir, 'server');
const filesToCopy = fs.readdirSync(serverDir);
for (const file of filesToCopy) {
  const src = path.join(serverDir, file);
  const dest = path.join(workerDir, file);
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    // Copy directory recursively
    copyDirSync(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Create the _worker.js index entry point
fs.writeFileSync(
  path.join(workerDir, 'index.js'),
  `import handler from './entry.mjs';\nexport default handler;\n`
);

console.log('✅ Created _worker.js directory');

// 3. Move static assets from client/ to dist root for Pages
const clientDir = path.join(distDir, 'client');
if (fs.existsSync(clientDir)) {
  const clientFiles = fs.readdirSync(clientDir);
  for (const file of clientFiles) {
    const src = path.join(clientDir, file);
    const dest = path.join(distDir, file);
    if (!fs.existsSync(dest)) {
      const stat = fs.statSync(src);
      if (stat.isDirectory()) {
        copyDirSync(src, dest);
      } else {
        fs.copyFileSync(src, dest);
      }
    }
  }
  console.log('✅ Copied static assets to dist root');
}

// 4. Create _routes.json so Pages knows what goes to the worker
const routesJson = {
  version: 1,
  include: ["/*"],
  exclude: ["/favicon.ico", "/favicon.svg", "/_astro/*", "/_headers"]
};
fs.writeFileSync(path.join(distDir, '_routes.json'), JSON.stringify(routesJson, null, 2));
console.log('✅ Created _routes.json');

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src);
  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
