#!/usr/bin/env node

/**
 * Hook: Validate status transitions in package.md files.
 * Each agent type has its own set of valid transitions.
 *
 * Usage: node validate-transition.js --agent=shaper|executor|verifier
 *
 * Exit 0 = OK, Exit 2 = invalid transition (blocks the tool use).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getConfig } = require('./lib/config');
const { parseFrontmatter } = require('./lib/parse-frontmatter');

const VALID_TRANSITIONS = {
  shaper: [
    [null, 'pending'],
    [null, 'shaping'],
    ['pending', 'shaping'],
    ['shaping', 'shaped'],
  ],
  executor: [
    ['shaped', 'executing'],
    ['executing', 'executed'],
  ],
  verifier: [
    ['executed', 'verifying'],
    ['verifying', 'done'],
    ['verifying', 'executing'],
  ],
};

function getAgentArg() {
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--agent=')) {
      return arg.split('=')[1];
    }
  }
  return null;
}

function getOldStatus(filePath) {
  try {
    // Get the file content from HEAD (last committed version)
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    const oldContent = execSync(`git show HEAD:${relativePath}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const fm = parseFrontmatter(oldContent);
    return fm ? fm.status || null : null;
  } catch {
    // File is new (not in git yet)
    return null;
  }
}

async function main() {
  const agent = getAgentArg();
  if (!agent || !VALID_TRANSITIONS[agent]) {
    process.exit(0); // Unknown agent, skip
  }

  // Read stdin (PostToolUse JSON)
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let data;
  try {
    data = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const filePath = data.tool_input?.file_path || data.tool_input?.path || null;
  if (!filePath) {
    process.exit(0);
  }

  // Check if this is a package.md in the project
  const config = getConfig();
  if (!config) {
    process.exit(0);
  }

  const packagesDir = path.join(config.projectPath, 'packages');
  const normalizedFile = path.resolve(filePath);
  const normalizedPackages = path.resolve(packagesDir);

  if (!normalizedFile.startsWith(normalizedPackages)) {
    process.exit(0);
  }

  if (path.basename(normalizedFile) !== 'package.md') {
    process.exit(0);
  }

  if (!fs.existsSync(normalizedFile)) {
    process.exit(0);
  }

  // Get old and new status
  const oldStatus = getOldStatus(normalizedFile);
  const content = fs.readFileSync(normalizedFile, 'utf-8');
  const newFm = parseFrontmatter(content);
  const newStatus = newFm ? newFm.status || null : null;

  // If status hasn't changed, it's fine
  if (oldStatus === newStatus) {
    process.exit(0);
  }

  // Check if transition is valid
  const transitions = VALID_TRANSITIONS[agent];
  const isValid = transitions.some(([from, to]) => from === oldStatus && to === newStatus);

  if (!isValid) {
    const fromLabel = oldStatus || 'null';
    const toLabel = newStatus || 'null';
    const allowed = transitions.map(([f, t]) => `${f || 'null'} → ${t}`).join(', ');
    process.stderr.write(
      `Transition de status invalide pour ${agent}: ${fromLabel} → ${toLabel}\n` +
      `Transitions autorisees: ${allowed}\n`
    );
    process.exit(2);
  }

  process.exit(0);
}

main();
