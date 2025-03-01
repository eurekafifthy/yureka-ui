#!/usr/bin/env node

const { program } = require("commander");
const initCommand = require("../src/cli/init");
const addCommand = require("../src/cli/add");
const removeCommand = require("../src/cli/remove");
const packageJson = require("../package.json");

program
  .name("yureka")
  .description("A modular UI component library for Next.js")
  .version(packageJson.version);

program
  .command("init")
  .description("Initialize Yureka UI in your Next.js project")
  .action(initCommand);

program
  .command("add <component>")
  .description("Add a component to your project")
  .action(addCommand);

program
  .command("remove <component>")
  .description("Remove a component from your project")
  .action(removeCommand);

program.parse(process.argv);
