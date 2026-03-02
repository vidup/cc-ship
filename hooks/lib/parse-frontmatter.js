/**
 * Minimal YAML-like frontmatter parser (no npm dependencies).
 * Supports: key: value, key: ~, simple arrays, one level of nested objects.
 */

/**
 * Parse frontmatter from markdown content.
 * Finds the first block between --- delimiters (may appear after a H1).
 * @param {string} content - The markdown file content
 * @returns {object|null} Parsed frontmatter object, or null if not found
 */
function parseFrontmatter(content) {
  const lines = content.split('\n');

  let startIdx = -1;
  let endIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (startIdx === -1) {
        startIdx = i;
      } else {
        endIdx = i;
        break;
      }
    }
  }

  if (startIdx === -1 || endIdx === -1) {
    return null;
  }

  const yamlLines = lines.slice(startIdx + 1, endIdx);
  return parseYaml(yamlLines);
}

/**
 * Minimal YAML parser supporting:
 * - key: value (strings, numbers, booleans)
 * - key: ~ (null)
 * - arrays (- item)
 * - one level of nested objects
 */
function parseYaml(lines) {
  const result = {};
  let currentKey = null;
  let currentArray = null;
  let currentObject = null;
  let inNestedObject = false;

  for (const line of lines) {
    // Skip empty lines and comments
    if (line.trim() === '' || line.trim().startsWith('#')) {
      continue;
    }

    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    // Array item at indent level 2+ (belongs to current key)
    if (trimmed.startsWith('- ') && indent >= 2 && currentKey) {
      if (!currentArray) {
        currentArray = [];
      }
      if (inNestedObject) {
        inNestedObject = false;
        currentObject = null;
      }
      currentArray.push(parseValue(trimmed.slice(2).trim()));
      result[currentKey] = currentArray;
      continue;
    }

    // Nested object key: value at indent level 2+
    if (indent >= 2 && trimmed.includes(':') && currentKey && !trimmed.startsWith('- ')) {
      if (!currentObject) {
        currentObject = {};
        inNestedObject = true;
      }
      const colonIdx = trimmed.indexOf(':');
      const nestedKey = trimmed.slice(0, colonIdx).trim();
      const nestedVal = trimmed.slice(colonIdx + 1).trim();
      if (nestedVal !== '') {
        currentObject[nestedKey] = parseValue(nestedVal);
      }
      result[currentKey] = currentObject;
      continue;
    }

    // Top-level key: value
    if (indent === 0 && trimmed.includes(':')) {
      // Flush previous array/object
      currentArray = null;
      currentObject = null;
      inNestedObject = false;

      const colonIdx = trimmed.indexOf(':');
      const key = trimmed.slice(0, colonIdx).trim();
      const val = trimmed.slice(colonIdx + 1).trim();

      currentKey = key;

      if (val === '') {
        // Could be followed by array or nested object — will be set by next lines
        result[key] = null;
      } else {
        result[key] = parseValue(val);
      }
    }
  }

  return result;
}

/**
 * Parse a single YAML value.
 */
function parseValue(val) {
  if (val === '~' || val === 'null') return null;
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  // Remove surrounding quotes if present
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  // Handle inline arrays like [item1, item2]
  if (val.startsWith('[') && val.endsWith(']')) {
    return val.slice(1, -1).split(',').map(s => parseValue(s.trim()));
  }
  return val;
}

module.exports = { parseFrontmatter };
