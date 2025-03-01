const { spawn } = require("child_process");
const ora = require("ora");
const chalk = require("chalk");

/**
 * Installs NPM dependencies
 * @param {string[]} packages - Packages to install
 * @param {boolean} isDev - Whether to install as dev dependencies
 * @returns {Promise<void>}
 */
function installDependencies(packages, isDev = false) {
  return new Promise((resolve, reject) => {
    const spinner = ora(
      `Installing dependencies: ${packages.join(", ")}...`
    ).start();

    // Determine package manager (npm or yarn)
    const useYarn = fs.existsSync(path.join(process.cwd(), "yarn.lock"));

    const command = useYarn ? "yarn" : "npm";
    const args = useYarn
      ? ["add", ...(isDev ? ["-D"] : []), ...packages]
      : ["install", ...(isDev ? ["--save-dev"] : []), ...packages];

    const child = spawn(command, args, { stdio: "pipe" });

    child.on("close", (code) => {
      if (code !== 0) {
        spinner.fail("Failed to install dependencies");
        reject(new Error(`${command} exited with code ${code}`));
        return;
      }

      spinner.succeed("Dependencies installed successfully");
      resolve();
    });

    child.on("error", (error) => {
      spinner.fail("Failed to install dependencies");
      reject(error);
    });
  });
}

module.exports = installDependencies;
