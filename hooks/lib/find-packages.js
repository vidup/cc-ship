const fs = require('fs');
const path = require('path');
const { getConfig } = require('./config');
const { parseFrontmatter } = require('./parse-frontmatter');

// Scans {projectPath}/packages/*/package.md and returns parsed metadata.
// Returns null if config is not available, otherwise array of packages.
function findPackages() {
  const config = getConfig();
  if (!config) return null;

  const packagesDir = path.join(config.projectPath, 'packages');
  if (!fs.existsSync(packagesDir)) return [];

  const entries = fs.readdirSync(packagesDir, { withFileTypes: true });
  const packages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const packageMdPath = path.join(packagesDir, entry.name, 'package.md');
    if (!fs.existsSync(packageMdPath)) continue;

    const content = fs.readFileSync(packageMdPath, 'utf-8');
    const metadata = parseFrontmatter(content) || {};

    packages.push({
      path: packageMdPath,
      name: entry.name,
      metadata,
    });
  }

  return packages;
}

module.exports = { findPackages };
