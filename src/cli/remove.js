const path = require("path");
const fs = require("fs-extra");
const ora = require("ora");
const chalk = require("chalk");
const inquirer = require("inquirer");
const detectTypeScript = require("../utils/detect-typescript");

// List of available components - should match the ones in add.js
const AVAILABLE_COMPONENTS = {
  button: {
    name: "Button",
    description:
      "A customizable button component with various styles and states",
  },
  card: {
    name: "Card",
    description: "A container component for organizing related content",
  },
  input: {
    name: "Input",
    description: "Text input field with validation support",
  },
  select: {
    name: "Select",
    description: "Dropdown select component with various options",
  },
  checkbox: {
    name: "Checkbox",
    description: "Checkbox input component with customizable styles",
  },
  toggle: {
    name: "Toggle",
    description: "Switch/toggle component for boolean inputs",
  },
  modal: {
    name: "Modal",
    description: "Popup modal dialog component",
  },
  toast: {
    name: "Toast",
    description: "Notification toast component for alerts and messages",
  },
  // Add more components here as they become available
};

/**
 * Detect file extension for index file based on project setup
 */
async function detectIndexFileExtension() {
  const isTypeScript = await detectTypeScript();
  return isTypeScript ? ".tsx" : ".js";
}

/**
 * Main function to remove a component from the project
 */
async function removeCommand(componentName) {
  if (!componentName) {
    return await interactiveComponentRemoval();
  }

  // Validate project environment
  if (!(await validateProjectEnvironment())) {
    return;
  }

  const normalizedName = componentName.toLowerCase();

  // Check if component exists in the available components list
  if (!AVAILABLE_COMPONENTS[normalizedName]) {
    console.error(
      chalk.red(
        `Error: Component "${componentName}" is not available in Yureka UI.`
      )
    );
    return await interactiveComponentRemoval();
  }

  const componentInfo = AVAILABLE_COMPONENTS[normalizedName];
  const pascalCaseName = componentInfo.name;

  const yurekaDir = path.join(process.cwd(), "components", "yureka-ui");
  const componentDir = path.join(yurekaDir, pascalCaseName);

  // Check if the component is actually installed
  if (!fs.existsSync(componentDir)) {
    console.error(
      chalk.red(
        `Error: Component "${pascalCaseName}" is not installed in your project.`
      )
    );
    return await interactiveComponentRemoval();
  }

  // Ask for confirmation before removal
  const { confirmRemove } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmRemove",
      message: `Are you sure you want to remove the ${pascalCaseName} component?`,
      default: false,
    },
  ]);

  if (!confirmRemove) {
    console.log(chalk.yellow("Removal cancelled."));
    return;
  }

  const spinner = ora(`Removing ${pascalCaseName} component...`).start();

  try {
    // Remove the component directory
    await fs.remove(componentDir);

    // Update the index file
    const indexExtension = await detectIndexFileExtension();
    const indexPath = path.join(yurekaDir, `index${indexExtension}`);

    if (await fs.pathExists(indexPath)) {
      let indexContent = await fs.readFile(indexPath, "utf8");
      // Remove the export line for this component
      const exportPattern = new RegExp(
        `export\\s*{\\s*default\\s+as\\s+${pascalCaseName}\\s*}.*?;.*?\\n`,
        "g"
      );
      indexContent = indexContent.replace(exportPattern, "");
      await fs.writeFile(indexPath, indexContent);
    }

    spinner.succeed(`${pascalCaseName} component removed successfully`);

    // Check if the yureka-ui directory is now empty (except for config and index)
    const remainingFiles = await fs.readdir(yurekaDir);
    const nonEssentialFiles = remainingFiles.filter(
      (file) => !file.startsWith("index") && file !== "yureka.config.json"
    );

    if (nonEssentialFiles.length === 0) {
      const { removeAllYureka } = await inquirer.prompt([
        {
          type: "confirm",
          name: "removeAllYureka",
          message:
            "No more components left. Do you want to remove Yureka UI completely?",
          default: false,
        },
      ]);

      if (removeAllYureka) {
        await fs.remove(yurekaDir);
        spinner.succeed(
          "Yureka UI has been completely removed from your project"
        );
      }
    }

    // Show success message
    console.log(
      chalk.green(
        `\n✅ ${pascalCaseName} component has been removed from your project!`
      )
    );
  } catch (error) {
    spinner.fail(`Failed to remove ${pascalCaseName} component`);
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Interactive component selection for removal when no argument is provided
 */
async function interactiveComponentRemoval() {
  console.log(chalk.blue("Select a Yureka UI component to remove:"));

  const yurekaDir = path.join(process.cwd(), "components", "yureka-ui");

  // Get list of installed components
  let installedComponents = [];
  try {
    const files = await fs.readdir(yurekaDir, { withFileTypes: true });
    installedComponents = files
      .filter(
        (dirent) => dirent.isDirectory() && dirent.name !== "node_modules"
      )
      .map((dirent) => dirent.name);
  } catch (error) {
    console.error(
      chalk.red(
        "Error: Could not read installed components. Make sure Yureka UI is initialized."
      )
    );
    process.exit(1);
  }

  if (installedComponents.length === 0) {
    console.log(chalk.yellow("No Yureka UI components are installed."));
    process.exit(0);
  }

  // Map installed components to their descriptions
  const choices = installedComponents.map((componentName) => {
    const matchedKey = Object.entries(AVAILABLE_COMPONENTS).find(
      ([_, info]) => info.name === componentName
    );

    const description = matchedKey
      ? AVAILABLE_COMPONENTS[matchedKey[0]].description
      : "Custom component";

    return {
      name: `${componentName} - ${description}`,
      value: componentName,
    };
  });

  const { selectedComponent } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedComponent",
      message: "Select a component to remove:",
      choices,
    },
  ]);

  // Find the key for this component name
  const matchedKey = Object.entries(AVAILABLE_COMPONENTS).find(
    ([_, info]) => info.name === selectedComponent
  );

  if (matchedKey) {
    return removeCommand(matchedKey[0]);
  } else {
    // Handle custom components not in the standard list
    const pascalCaseName = selectedComponent;
    const yurekaDir = path.join(process.cwd(), "components", "yureka-ui");
    const componentDir = path.join(yurekaDir, pascalCaseName);

    // Ask for confirmation before removal
    const { confirmRemove } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmRemove",
        message: `Are you sure you want to remove the custom ${pascalCaseName} component?`,
        default: false,
      },
    ]);

    if (!confirmRemove) {
      console.log(chalk.yellow("Removal cancelled."));
      return;
    }

    const spinner = ora(`Removing ${pascalCaseName} component...`).start();

    try {
      // Remove the component directory
      await fs.remove(componentDir);

      // Update the index file
      const indexExtension = await detectIndexFileExtension();
      const indexPath = path.join(yurekaDir, `index${indexExtension}`);

      if (await fs.pathExists(indexPath)) {
        let indexContent = await fs.readFile(indexPath, "utf8");
        // Remove the export line for this component
        const exportPattern = new RegExp(
          `export\\s*{\\s*default\\s+as\\s+${pascalCaseName}\\s*}.*?;.*?\\n`,
          "g"
        );
        indexContent = indexContent.replace(exportPattern, "");
        await fs.writeFile(indexPath, indexContent);
      }

      spinner.succeed(`${pascalCaseName} component removed successfully`);
      console.log(
        chalk.green(
          `\n✅ Custom ${pascalCaseName} component has been removed from your project!`
        )
      );
    } catch (error) {
      spinner.fail(`Failed to remove ${pascalCaseName} component`);
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  }
}

/**
 * Validate that Yureka UI is properly initialized in this project
 */
async function validateProjectEnvironment() {
  if (!fs.existsSync("package.json")) {
    console.error(
      chalk.red(
        "Error: No package.json found. Please run this command in your Next.js project root."
      )
    );
    process.exit(1);
    return false;
  }

  const yurekaDir = path.join(process.cwd(), "components", "yureka-ui");
  if (!fs.existsSync(yurekaDir)) {
    console.error(
      chalk.red(
        'Error: Yureka UI is not initialized in this project. Please run "npx yureka@latest init" first.'
      )
    );
    process.exit(1);
    return false;
  }

  return true;
}

module.exports = removeCommand;
