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

Structure installée:
  commands/ship/        Commandes de workflow (/ship:xxx)
  agents/                Agents spécialisés
  skills/                Connaissances et techniques réutilisables
  hooks/                 Hooks de validation (frontmatter, transitions)
`);
  process.exit(0);
}

// Determine target directory
const targetDir = isGlobal
  ? path.join(os.homedir(), '.claude')
  : path.join(process.cwd(), '.claude');

// Source directory (where the package is installed)
const sourceDir = path.join(__dirname, '..');

console.log(`\n🚀 Installation de cc-ship...`);
console.log(`   Destination: ${targetDir}\n`);

// Directories to copy
const dirsToInstall = ['commands', 'agents', 'skills', 'hooks'];

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`✓ Créé ${targetDir}`);
}

/**
 * Recursively copy a directory, preserving existing files
 */
function copyDir(src, dest, options = { preserveExisting: false }) {
  if (!fs.existsSync(src)) {
    console.log(`⚠ Source non trouvée: ${src}`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, options);
    } else {
      // Check if file already exists
      if (fs.existsSync(destPath) && options.preserveExisting) {
        console.log(`  ○ Préservé: ${path.relative(targetDir, destPath)}`);
      } else {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✓ Copié: ${path.relative(targetDir, destPath)}`);
      }
    }
  }
}

// Install each directory
for (const dir of dirsToInstall) {
  const srcDir = path.join(sourceDir, dir);
  const destDir = path.join(targetDir, dir);

  if (fs.existsSync(srcDir)) {
    console.log(`\n📁 Installation de ${dir}/`);
    // For agents, preserve existing files (like GSD)
    const preserveExisting = dir === 'agents';
    copyDir(srcDir, destDir, { preserveExisting });
  }
}

// Merge hooks settings into settings.local.json
const hooksSettingsPath = path.join(sourceDir, 'hooks-settings.json');
if (fs.existsSync(hooksSettingsPath)) {
  const settingsPath = path.join(targetDir, 'settings.local.json');
  let settings = {};

  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
      console.log(`  ⚠ settings.local.json existant non parseable, hooks non injectés`);
      settings = null;
    }
  }

  if (settings !== null) {
    const hooksSettings = JSON.parse(fs.readFileSync(hooksSettingsPath, 'utf-8'));
    settings.hooks = hooksSettings.hooks;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    console.log(`\n🔧 Hooks injectés dans settings.local.json`);
  }
}

// Summary
console.log(`
✅ Installation terminée!

Commandes disponibles dans Claude Code:
  /ship:help         Liste des commandes ship
  /ship:init         Initialise un nouveau projet
  /ship:next         Démarre ou reprend le workflow
  /ship:status       Affiche l'état du projet

Pour commencer:
  1. Ouvre Claude Code dans ce répertoire
  2. Tape /ship:init mon-projet pour initialiser un projet
  3. Tape /ship:next pour lancer le workflow
`);
