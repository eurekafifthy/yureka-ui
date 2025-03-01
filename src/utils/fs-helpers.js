const fs = require("fs-extra");
const path = require("path");

/**
 * Ensures a file exists and creates it with content if it doesn't
 * @param {string} filePath - Path to the file
 * @param {string} content - Content to write if file doesn't exist
 * @returns {Promise<void>}
 */
async function ensureFileWithContent(filePath, content) {
  try {
    const exists = await fs.pathExists(filePath);

    if (!exists) {
      await fs.ensureFile(filePath);
      await fs.writeFile(filePath, content);
    }
  } catch (error) {
    throw new Error(`Failed to ensure file ${filePath}: ${error.message}`);
  }
}

/**
 * Adds an export statement to an index file
 * @param {string} indexPath - Path to the index file
 * @param {string} componentName - Name of the component to export
 * @returns {Promise<void>}
 */
async function addExportToIndex(indexPath, componentName) {
  try {
    let content = "";

    if (await fs.pathExists(indexPath)) {
      content = await fs.readFile(indexPath, "utf8");
    }

    const exportStatement = `export { default as ${componentName} } from './${componentName}';\n`;

    if (!content.includes(exportStatement)) {
      await fs.writeFile(indexPath, content + exportStatement);
    }
  } catch (error) {
    throw new Error(
      `Failed to update index file ${indexPath}: ${error.message}`
    );
  }
}

module.exports = {
  ensureFileWithContent,
  addExportToIndex,
};
