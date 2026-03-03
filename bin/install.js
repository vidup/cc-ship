#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Parse arguments
const args = process.argv.slice(2);
const isGlobal = args.includes('--global') || args.includes('-g');
const isHelp = args.includes('--help') || args.includes('-h');

if (isHelp) {
  console.log(`
cc-ship - Architecture 3 couches pour Claude Code

Usage:
  npx cc-ship              Installe dans ./.claude/ (projet local)
  npx cc-ship --global     Installe dans ~/.claude/ (global)
  npx cc-ship --help       Affiche cette aide

Mode recommande:
  claude plugin install     Plugin Claude Code (mise a jour automatique)

Structure installee:
  commands/ship/        Commandes de workflow (/ship:xxx)
  agents/                Agents specialises
  skills/                Connaissances et techniques reutilisables
  hooks/                 Hooks de validation (frontmatter, transitions)
`);
  process.exit(0);
}

// Plugin root placeholder used in source files
const PLUGIN_ROOT_VAR = '${CLAUDE_PLUGIN_ROOT}';

// Determine target directory
const targetDir = isGlobal
  ? path.join(os.homedir(), '.claude')
  : path.join(process.cwd(), '.claude');

// Source directory (where the package is installed)
const sourceDir = path.join(__dirname, '..');

console.log(`\n🚀 Installation de cc-ship (standalone mode)...`);
console.log(`   Destination: ${targetDir}\n`);

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`✓ Cree ${targetDir}`);
}

// --- Step 1: Clean ship-specific files ---
console.log(`\n🧹 Nettoyage des fichiers ship existants...`);

function removeIfExists(p) {
  if (!fs.existsSync(p)) return false;
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    fs.rmSync(p, { recursive: true, force: true });
  } else {
    fs.unlinkSync(p);
  }
  console.log(`  ✗ Supprime: ${path.relative(targetDir, p)}`);
  return true;
}

// Clean ship commands directory
removeIfExists(path.join(targetDir, 'commands', 'ship'));

// Clean ship agent files
const agentsDir = path.join(targetDir, 'agents');
if (fs.existsSync(agentsDir)) {
  for (const file of fs.readdirSync(agentsDir)) {
    if (file.startsWith('ship-') && file.endsWith('.md')) {
      removeIfExists(path.join(agentsDir, file));
    }
  }
}

// Clean ship skills directories
const skillsDir = path.join(targetDir, 'skills');
if (fs.existsSync(skillsDir)) {
  for (const dir of fs.readdirSync(skillsDir)) {
    if (dir.startsWith('ship-')) {
      removeIfExists(path.join(skillsDir, dir));
    }
  }
}

// Clean ship hook files
const hookFiles = [
  'validate-frontmatter.js',
  'check-agent-completion.js',
  'validate-transition.js',
];
for (const file of hookFiles) {
  removeIfExists(path.join(targetDir, 'hooks', file));
}
removeIfExists(path.join(targetDir, 'hooks', 'lib'));

// --- Step 2: Copy with transforms ---

/**
 * Recursively copy a directory
 */
function copyDir(src, dest, options = {}) {
  const { preserveExisting = false, transformContent = null, skipFiles = [] } = options;

  if (!fs.existsSync(src)) {
    console.log(`  ⚠ Source non trouvee: ${src}`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (skipFiles.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, options);
    } else {
      if (fs.existsSync(destPath) && preserveExisting) {
        console.log(`  ○ Preserve: ${path.relative(targetDir, destPath)}`);
      } else if (transformContent) {
        let content = fs.readFileSync(srcPath, 'utf-8');
        content = transformContent(content);
        fs.writeFileSync(destPath, content);
        console.log(`  ✓ Copie (transforme): ${path.relative(targetDir, destPath)}`);
      } else {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✓ Copie: ${path.relative(targetDir, destPath)}`);
      }
    }
  }
}

/**
 * Transform ${CLAUDE_PLUGIN_ROOT} -> .claude in content
 */
function transformPluginPaths(content) {
  return content.replaceAll(PLUGIN_ROOT_VAR, '.claude');
}

// Copy commands (direct copy)
console.log(`\n📁 Installation de commands/`);
copyDir(
  path.join(sourceDir, 'commands', 'ship'),
  path.join(targetDir, 'commands', 'ship')
);

// Copy agents (transform paths in frontmatter, preserve existing)
console.log(`\n📁 Installation de agents/`);
const srcAgentsDir = path.join(sourceDir, 'agents');
if (fs.existsSync(srcAgentsDir)) {
  if (!fs.existsSync(path.join(targetDir, 'agents'))) {
    fs.mkdirSync(path.join(targetDir, 'agents'), { recursive: true });
  }
  for (const file of fs.readdirSync(srcAgentsDir)) {
    if (!file.startsWith('ship-') || !file.endsWith('.md')) continue;
    const destPath = path.join(targetDir, 'agents', file);
    if (fs.existsSync(destPath)) {
      console.log(`  ○ Preserve: agents/${file}`);
    } else {
      let content = fs.readFileSync(path.join(srcAgentsDir, file), 'utf-8');
      content = transformPluginPaths(content);
      fs.writeFileSync(destPath, content);
      console.log(`  ✓ Copie (transforme): agents/${file}`);
    }
  }
}

// Copy skills (direct copy)
console.log(`\n📁 Installation de skills/`);
const srcSkillsDir = path.join(sourceDir, 'skills');
if (fs.existsSync(srcSkillsDir)) {
  for (const dir of fs.readdirSync(srcSkillsDir)) {
    if (!dir.startsWith('ship-')) continue;
    copyDir(
      path.join(srcSkillsDir, dir),
      path.join(targetDir, 'skills', dir)
    );
  }
}

// Copy hooks (direct copy, skip hooks.json)
console.log(`\n📁 Installation de hooks/`);
copyDir(
  path.join(sourceDir, 'hooks'),
  path.join(targetDir, 'hooks'),
  { skipFiles: ['hooks.json'] }
);

// --- Step 3: Generate hook settings from hooks/hooks.json ---
const hooksJsonPath = path.join(sourceDir, 'hooks', 'hooks.json');
if (fs.existsSync(hooksJsonPath)) {
  const settingsPath = path.join(targetDir, 'settings.local.json');
  let settings = {};

  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
      console.log(`  ⚠ settings.local.json existant non parseable, hooks non injectes`);
      settings = null;
    }
  }

  if (settings !== null) {
    const hooksConfig = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf-8'));
    // Transform plugin root paths to .claude for standalone mode
    const transformed = JSON.parse(
      JSON.stringify(hooksConfig.hooks).replaceAll(PLUGIN_ROOT_VAR, '.claude')
    );
    settings.hooks = transformed;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    console.log(`\n🔧 Hooks injectes dans settings.local.json`);
  }
}

// Summary
console.log(`
✅ Installation terminee! (standalone mode)

Commandes disponibles dans Claude Code:
  /ship:help         Liste des commandes ship
  /ship:init         Initialise un nouveau projet
  /ship:next         Demarre ou reprend le workflow
  /ship:status       Affiche l'etat du projet

💡 Mode plugin recommande:
   Pour une mise a jour automatique, utilisez plutot:
   claude plugin install cc-ship

Pour commencer:
  1. Ouvre Claude Code dans ce repertoire
  2. Tape /ship:init mon-projet pour initialiser un projet
  3. Tape /ship:next pour lancer le workflow
`);
