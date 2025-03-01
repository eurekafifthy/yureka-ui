const fs = require("fs-extra");
const path = require("path");

/**
 * Detects whether the project uses TypeScript.
 * @returns {Promise<boolean>}
 */
async function detectTypeScript() {
  try {
    // Check if tsconfig.json exists
    const hasTsConfig = await fs.pathExists(
      path.join(process.cwd(), "tsconfig.json")
    );
    if (hasTsConfig) return true;

    // Read package.json to check if TypeScript is a dependency
    const packageJsonPath = path.join(process.cwd(), "package.json");
    if (!(await fs.pathExists(packageJsonPath))) return false;

    const packageJson = await fs.readJson(packageJsonPath);
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    return !!deps.typescript;
  } catch (error) {
    return false; // Assume JS if there's an error
  }
}

module.exports = detectTypeScript;
