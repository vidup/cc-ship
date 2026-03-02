#!/usr/bin/env node

/**
 * Hook: Verify agent completion state (SubagentStop).
 * Checks that agents left packages in a consistent state.
 *
 * - ship-executor: at least one package should have status "executed"
 * - ship-verifier: no package should still have status "verifying"
 *
 * Exit 0 = OK, Exit 2 = inconsistent state (warns the user).
 */

const { findPackages } = require('./lib/find-packages');

async function main() {
  // Read stdin (SubagentStop JSON)
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

  const agentName = data.agent_name || data.subagent_type || '';

  const packages = findPackages();
  if (!packages || packages.length === 0) {
    process.exit(0); // No packages to check
  }

  // Check executor completion
  if (agentName === 'ship-executor') {
    const hasExecuted = packages.some(p => p.metadata.status === 'executed');
    if (!hasExecuted) {
      process.stderr.write(
        "L'executor a termine sans mettre a jour le status d'aucun package a \"executed\".\n" +
        "Verifiez que le frontmatter du package.md a ete mis a jour correctement.\n"
      );
      process.exit(2);
    }
  }

  // Check verifier completion
  if (agentName === 'ship-verifier') {
    const stillVerifying = packages.filter(p => p.metadata.status === 'verifying');
    if (stillVerifying.length > 0) {
      const names = stillVerifying.map(p => p.name).join(', ');
      process.stderr.write(
        `Le verifier a termine sans conclure pour: ${names}\n` +
        'Le status est encore "verifying" au lieu de "done" ou "executing".\n'
      );
      process.exit(2);
    }
  }

  process.exit(0);
}

main();
