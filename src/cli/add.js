const path = require("path");
const fs = require("fs-extra");
const ora = require("ora");
const chalk = require("chalk");
const inquirer = require("inquirer");
const detectTailwind = require("../utils/detect-tailwind");
const detectTypeScript = require("../utils/detect-typescript");

// List of available components - easy to extend with new components
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
 * Detect file extension based on project setup
 */
async function detectFileExtension() {
  const isTypeScript = await detectTypeScript();
  const componentsDir = path.join(process.cwd(), "components");

  try {
    if (await fs.pathExists(componentsDir)) {
      const files = await fs.readdir(componentsDir, { withFileTypes: true });

      if (
        isTypeScript &&
        files.some((file) => file.isFile() && file.name.endsWith(".tsx"))
      ) {
        return ".tsx";
      }

      if (
        isTypeScript &&
        files.some((file) => file.isFile() && file.name.endsWith(".ts"))
      ) {
        return ".ts";
      }

      if (files.some((file) => file.isFile() && file.name.endsWith(".jsx"))) {
        return ".jsx";
      }
    }

    return isTypeScript ? ".tsx" : ".js";
  } catch (error) {
    return isTypeScript ? ".tsx" : ".js";
  }
}

/**
 * Main function to add a component to the project
 */
async function addCommand(componentName) {
  if (!componentName) {
    return await interactiveComponentSelection();
  }

  const normalizedName = componentName.toLowerCase();

  // Check if component exists
  if (!AVAILABLE_COMPONENTS[normalizedName]) {
    console.error(
      chalk.red(
        `Error: Component "${componentName}" is not available in Yureka UI.`
      )
    );

    return await interactiveComponentSelection();
  }

  const componentInfo = AVAILABLE_COMPONENTS[normalizedName];
  const pascalCaseName = componentInfo.name;

  console.log(
    chalk.blue(`🧩 Adding ${pascalCaseName} component to your project...`)
  );

  // Validate project environment
  if (!(await validateProjectEnvironment())) {
    return;
  }

  // Setup environment variables
  const hasTailwind = await detectTailwind();
  const fileExtension = await detectFileExtension();
  const isTypeScript = fileExtension === ".ts" || fileExtension === ".tsx";
  const indexExtension = fileExtension.includes("x") ? fileExtension : ".js";

  const yurekaDir = path.join(process.cwd(), "components", "yureka-ui");
  const componentDir = path.join(yurekaDir, pascalCaseName);

  const spinner = ora(`Creating ${pascalCaseName} component...`).start();

  try {
    await fs.ensureDir(componentDir);

    // Get appropriate template
    const templateFiles = await getComponentTemplateFiles(
      pascalCaseName,
      hasTailwind,
      isTypeScript,
      fileExtension
    );

    // Write component files
    for (const [filePath, content] of Object.entries(templateFiles)) {
      await fs.writeFile(path.join(componentDir, filePath), content);
    }

    // Create index file for easy import
    await fs.writeFile(
      path.join(componentDir, `index${indexExtension}`),
      `export { default } from './${pascalCaseName}';\n`
    );

    // Update main index file
    await updateMainIndex(yurekaDir, pascalCaseName, indexExtension);

    spinner.succeed(`${pascalCaseName} component created successfully`);

    // Show success message with import examples
    displaySuccessMessage(pascalCaseName);
  } catch (error) {
    spinner.fail(`Failed to add ${pascalCaseName} component`);
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Interactive component selection when no argument is provided or invalid component is requested
 */
async function interactiveComponentSelection() {
  console.log(chalk.blue("Available Yureka UI components:"));

  const choices = Object.entries(AVAILABLE_COMPONENTS).map(
    ([key, component]) => ({
      name: `${component.name} - ${component.description}`,
      value: key,
    })
  );

  const { selectedComponent } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedComponent",
      message: "Select a component to add:",
      choices,
    },
  ]);

  return addCommand(selectedComponent);
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

/**
 * Get component template files based on project configuration
 */
async function getComponentTemplateFiles(
  componentName,
  hasTailwind,
  isTypeScript,
  fileExtension
) {
  const result = {};
  const srcExtension = isTypeScript ? fileExtension : ".js";

  // Determine template directories to try
  const templateDirs = [];
  if (isTypeScript && hasTailwind) {
    templateDirs.push("tailwind-ts");
  } else if (isTypeScript && !hasTailwind) {
    templateDirs.push("non-tailwind-ts");
  } else if (!isTypeScript && hasTailwind) {
    templateDirs.push("tailwind");
  } else {
    templateDirs.push("non-tailwind");
  }

  // Add fallback directories
  if (isTypeScript) templateDirs.push("tailwind-ts", "non-tailwind-ts");
  templateDirs.push("tailwind", "non-tailwind");

  // Try to find component file in template directories
  let templateContent = null;
  let templateDir = null;

  for (const dir of templateDirs) {
    const possibleExtensions = isTypeScript ? [".tsx", ".ts", ".js"] : [".js"];

    for (const ext of possibleExtensions) {
      const templatePath = path.join(
        __dirname,
        "..",
        "templates",
        dir,
        `${componentName}${ext}`
      );

      if (await fs.pathExists(templatePath)) {
        templateContent = await fs.readFile(templatePath, "utf8");
        templateDir = dir;
        break;
      }
    }

    if (templateContent) break;
  }

  // If no template found, create a minimal template
  if (!templateContent) {
    templateContent = createDefaultTemplate(
      componentName,
      hasTailwind,
      isTypeScript
    );
  }

  // Add the main component file
  result[`${componentName}${srcExtension}`] = templateContent;

  // Add CSS module if not using Tailwind
  if (!hasTailwind) {
    const cssTemplatePath = path.join(
      __dirname,
      "..",
      "templates",
      templateDir || "non-tailwind",
      `${componentName}.module.css`
    );

    let cssContent;

    if (templateDir && (await fs.pathExists(cssTemplatePath))) {
      cssContent = await fs.readFile(cssTemplatePath, "utf8");
    } else {
      cssContent = `/* ${componentName} component styles */\n\n.${componentName.toLowerCase()} {\n  /* Add your styles here */\n}\n`;
    }

    result[`${componentName}.module.css`] = cssContent;

    // Add TypeScript declaration for CSS module
    if (isTypeScript) {
      const cssClassNames = cssContent.match(/\.(\w+)\s*{/g) || [];
      const classNames = cssClassNames.map((className) =>
        className.replace(/^\./, "").replace(/\s*{/, "")
      );

      const typeDefinition = `declare const styles: {\n${classNames
        .map((className) => `  readonly ${className}: string;`)
        .join("\n")}\n};\nexport default styles;\n`;

      result[`${componentName}.module.css.d.ts`] = typeDefinition;
    }
  }

  return result;
}

/**
 * Create a default component template if none exists
 */
function createDefaultTemplate(componentName, hasTailwind, isTypeScript) {
  if (isTypeScript) {
    if (hasTailwind) {
      return `import React, { ReactNode, ButtonHTMLAttributes } from 'react';

interface ${componentName}Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const ${componentName} = ({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  ...props
}: ${componentName}Props) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  };
  
  const sizeClasses = {
    small: 'py-1 px-3 text-sm rounded',
    medium: 'py-2 px-4 text-base rounded-md',
    large: 'py-3 px-6 text-lg rounded-lg',
  };
  
  const loadingClass = loading ? 'opacity-70 cursor-not-allowed' : '';
  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    loadingClass,
    widthClass,
    className,
  ].join(' ');
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </button>
  );
};

export default ${componentName};
`;
    } else {
      return `import React, { ReactNode, ButtonHTMLAttributes } from 'react';
import styles from './${componentName}.module.css';

interface ${componentName}Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const ${componentName} = ({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  ...props
}: ${componentName}Props) => {
  const classes = [
    styles.${componentName.toLowerCase()},
    styles[\`variant\${variant.charAt(0).toUpperCase() + variant.slice(1)}\`],
    styles[\`size\${size.charAt(0).toUpperCase() + size.slice(1)}\`],
    loading ? styles.loading : '',
    fullWidth ? styles.fullWidth : '',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className={styles.loadingIndicator}>
          Loading...
        </span>
      )}
      {icon && iconPosition === 'left' && <span className={styles.iconLeft}>{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className={styles.iconRight}>{icon}</span>}
    </button>
  );
};

export default ${componentName};
`;
    }
  } else {
    if (hasTailwind) {
      return `import React from 'react';

const ${componentName} = ({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  };
  
  const sizeClasses = {
    small: 'py-1 px-3 text-sm rounded',
    medium: 'py-2 px-4 text-base rounded-md',
    large: 'py-3 px-6 text-lg rounded-lg',
  };
  
  const loadingClass = loading ? 'opacity-70 cursor-not-allowed' : '';
  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    loadingClass,
    widthClass,
    className,
  ].join(' ');
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </button>
  );
};

export default ${componentName};
`;
    } else {
      return `import React from 'react';
import styles from './${componentName}.module.css';

const ${componentName} = ({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  ...props
}) => {
  const classes = [
    styles.${componentName.toLowerCase()},
    styles[\`variant\${variant.charAt(0).toUpperCase() + variant.slice(1)}\`],
    styles[\`size\${size.charAt(0).toUpperCase() + size.slice(1)}\`],
    loading ? styles.loading : '',
    fullWidth ? styles.fullWidth : '',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className={styles.loadingIndicator}>
          Loading...
        </span>
      )}
      {icon && iconPosition === 'left' && <span className={styles.iconLeft}>{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className={styles.iconRight}>{icon}</span>}
    </button>
  );
};

export default ${componentName};
`;
    }
  }
}

/**
 * Update the main index file with the new component
 */
async function updateMainIndex(yurekaDir, componentName, indexExtension) {
  const indexPath = path.join(yurekaDir, `index${indexExtension}`);
  let currentIndex = "";

  try {
    currentIndex = await fs.readFile(indexPath, "utf8");
  } catch (error) {
    // Index file not found, create a new one
    currentIndex = `// Yureka UI Components\n// This file is automatically generated for all UI components\n`;
  }

  // Check if component already exists in index
  if (!currentIndex.includes(`export { default as ${componentName} }`)) {
    const updatedIndex =
      currentIndex +
      `export { default as ${componentName} } from './${componentName}';\n`;

    await fs.writeFile(indexPath, updatedIndex);
  }
}

/**
 * Display success message with usage examples
 */
function displaySuccessMessage(componentName) {
  console.log(
    chalk.green(
      `\n✅ ${componentName} component has been added to your project!`
    )
  );
  console.log(chalk.blue("\nYou can import it with:"));
  console.log(
    chalk.white(`  import { ${componentName} } from '@/components/yureka-ui';`)
  );
  console.log(chalk.blue("\nOr directly:"));
  console.log(
    chalk.white(
      `  import ${componentName} from '@/components/yureka-ui/${componentName}';`
    )
  );
  console.log(chalk.blue("\nExample usage:"));
  console.log(chalk.white(`  <${componentName}>Click me</${componentName}>`));
}

module.exports = addCommand;
