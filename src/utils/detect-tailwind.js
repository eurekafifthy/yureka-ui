const fs = require("fs-extra");
const path = require("path");

/**
 * Detects if the project uses Tailwind CSS
 * @returns {Promise<boolean>} True if Tailwind CSS is detected
 */
async function detectTailwind() {
  const packageJsonPath = path.join(process.cwd(), "package.json");

  try {
    // Check if package.json exists
    if (!fs.existsSync(packageJsonPath)) {
      return false;
    }

    // Read package.json
    const packageJson = require(packageJsonPath);
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check if tailwindcss is in dependencies
    if (allDependencies.tailwindcss) {
      return true;
    }

    // Check for common Tailwind config files
    const tailwindConfigFiles = [
      "tailwind.config.js",
      "tailwind.config.cjs",
      "tailwind.config.ts",
      "tailwind.config.mjs",
    ];

    for (const configFile of tailwindConfigFiles) {
      if (fs.existsSync(path.join(process.cwd(), configFile))) {
        return true;
      }
    }

    // Check for Tailwind directives in CSS files
    const cssFiles = [
      path.join(process.cwd(), "src", "styles", "globals.css"),
      path.join(process.cwd(), "styles", "globals.css"),
      path.join(process.cwd(), "app", "globals.css"),
    ];

    for (const cssFile of cssFiles) {
      if (fs.existsSync(cssFile)) {
        const content = await fs.readFile(cssFile, "utf8");
        if (content.includes("@tailwind") || content.includes("@apply")) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error(`Error detecting Tailwind CSS: ${error.message}`);
    return false;
  }
}

module.exports = detectTailwind;
