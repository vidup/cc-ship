#!/usr/bin/env node

/**
 * Hook: Validate frontmatter of package.md files after Write/Edit.
 * Checks that status and other fields are valid.
 *
 * Exit 0 = OK, Exit 2 = validation error (blocks the tool use).
 */

const fs = require('fs');
const path = require('path');
const { getConfig } = require('./lib/config');
const { parseFrontmatter } = require('./lib/parse-frontmatter');

const VALID_STATUSES = ['pending', 'shaping', 'shaped', 'executing', 'executed', 'verifying', 'done'];

async function main() {
  // Read stdin (PostToolUse JSON)
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let data;
  try {
    data = JSON.parse(input);
  } catch {
    process.exit(0); // Can't parse input, skip
  }

  const filePath = data.tool_input?.file_path || data.tool_input?.path || null;
  if (!filePath) {
    process.exit(0);
  }

  // Check if this is a package.md in the project
  const config = getConfig();
  if (!config) {
    process.exit(0); // No config, skip
  }

  const packagesDir = path.join(config.projectPath, 'packages');
  const normalizedFile = path.resolve(filePath);
  const normalizedPackages = path.resolve(packagesDir);

  // Must be inside {projectPath}/packages/*/package.md
  if (!normalizedFile.startsWith(normalizedPackages)) {
    process.exit(0);
  }

  if (path.basename(normalizedFile) !== 'package.md') {
    process.exit(0);
  }

  // Read and parse the file
  if (!fs.existsSync(normalizedFile)) {
    process.exit(0);
  }

  const content = fs.readFileSync(normalizedFile, 'utf-8');
  const frontmatter = parseFrontmatter(content);

  if (!frontmatter) {
    process.stderr.write('Frontmatter invalide : aucun bloc --- trouve dans package.md\n');
    process.exit(2);
  }

  const errors = [];

  // Validate status
  if (!frontmatter.status) {
    errors.push('Le champ "status" est absent du frontmatter');
  } else if (!VALID_STATUSES.includes(frontmatter.status)) {
    errors.push(`Status invalide: "${frontmatter.status}". Valeurs acceptees: ${VALID_STATUSES.join(', ')}`);
  }

  // Validate current_scope (string or null)
  if (frontmatter.current_scope !== undefined && frontmatter.current_scope !== null && typeof frontmatter.current_scope !== 'string') {
    errors.push(`current_scope doit etre une string ou null, recu: ${typeof frontmatter.current_scope}`);
  }

  // Validate scopes_completed (array or absent)
  if (frontmatter.scopes_completed !== undefined && frontmatter.scopes_completed !== null && !Array.isArray(frontmatter.scopes_completed)) {
    errors.push('scopes_completed doit etre un tableau');
  }

  // Validate last_verification (object with date/result/failed_criteria or absent)
  if (frontmatter.last_verification !== undefined && frontmatter.last_verification !== null) {
    if (typeof frontmatter.last_verification !== 'object') {
      errors.push('last_verification doit etre un objet avec date/result/failed_criteria');
    }
  }

  // Validate verification_attempts (integer >= 0 or absent)
  if (frontmatter.verification_attempts !== undefined && frontmatter.verification_attempts !== null) {
    if (typeof frontmatter.verification_attempts !== 'number' || frontmatter.verification_attempts < 0 || !Number.isInteger(frontmatter.verification_attempts)) {
      errors.push('verification_attempts doit etre un entier >= 0');
    }
  }

  if (errors.length > 0) {
    process.stderr.write(`Frontmatter invalide dans package.md:\n${errors.map(e => `  - ${e}`).join('\n')}\n`);
    process.exit(2);
  }

  process.exit(0);
}

main();
