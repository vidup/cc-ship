const fs = require('fs');
const path = require('path');

/**
 * Reads cc-ship.json and resolves the project path.
 * Returns { projectsDir, currentProject, projectPath } or null if not configured.
 */
function getConfig() {
  const configPath = path.join(process.cwd(), 'cc-ship.json');

  if (!fs.existsSync(configPath)) {
    return null;
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }

  const projectsDir = config.projectsDir || '.ship';
  const currentProject = config.currentProject || null;

  if (!currentProject) {
    return null;
  }

  const projectPath = path.join(process.cwd(), projectsDir, currentProject);

  return { projectsDir, currentProject, projectPath };
}

module.exports = { getConfig };
