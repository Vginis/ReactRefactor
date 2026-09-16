#!/usr/bin/env node
console.time("Execution time");
import * as fs from 'fs';
import {
    getAllFiles,
    resolveIfProjectHasMultiplePages,
    extractPathsAndHierarchies2
} from './lib/util.js';
import { loadReactFiles } from './lib/ReactFile.js';
import { loadReactComponents, addParents } from './lib/loadingFuncs.js';
import { detectPropDrilling } from './lib/Hierarchy.js';
import readline from 'readline';
import { loadAliases2 } from './lib/Alias.js';
import { displayMenu, displayPropDrilling } from './lib/cli.js';
import { printPropDrillingsWithDetails } from './lib/PropDrilling.js';

import { Command } from 'commander';
const program = new Command();

program
    .requiredOption('-p, --project <string>', 'Relative path of the project under analysis (root directory of React app)')
    .requiredOption('--root <string>', 'Relative path of a source file declaring a root component')
    .option('-i, --interactive', 'Runs the tool in interactive mode', false)
    .option('-m, --prefix-mappings <string>', 'Mappings of module prefixes to paths relative to project root, e.g. "@//=core @//plane-web=ce" (single space separated)')

program.parse()

const options = program.opts()

console.log('Options:', program.opts())

const args = process.argv.slice(2);
const projectPath = options.project;
const rootFile = options.root;
const rootComponent = undefined;

const fileType = undefined

// Change this to apply refactorings interactive
const interactive = options.interactive;

globalThis.projectPath = projectPath
globalThis.rootFile = rootFile
globalThis.rootComponent = rootComponent
globalThis.fileType = fileType
globalThis.prefixMappings = options.prefixMappings ? options.prefixMappings.split(" ") : undefined


if (!projectPath && !rootFile) {
    console.error("Error: Please provide project path and root file.");
    process.exit(1);
}

const allFiles = getAllFiles(projectPath);
const hasMultiplePages = resolveIfProjectHasMultiplePages(projectPath);

console.time("React file loading")
const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles, rootFile);
console.timeEnd("React file loading")

console.time("Component identification")
const reactComponents = loadReactComponents(reactFiles, filteredJsxElements);
console.timeEnd("Component identification")

console.log(`Number of analyzed files: ${reactFiles.length}`)
console.log(`Number of found Components: ${reactComponents.length}`);

console.time("Alias resolution")
loadAliases2(reactFiles);
console.timeEnd("Alias resolution")

addParents();

console.time("Hierarchy resolution")
const { hierarchyTrees, paths } = extractPathsAndHierarchies2();
console.timeEnd("Hierarchy resolution")

// Print all hierarchy trees
fs.writeFileSync('./stats/tmp/a.json', JSON.stringify(hierarchyTrees, null, 2), 'utf-8');

savePaths(paths);

//console.log(JSON.stringify(hierarchyTrees, null, 2));

console.time("PD detection")
const propDrillings = detectPropDrilling(paths);
console.timeEnd("PD detection")

console.log("Found: " + propDrillings.length + " Prop Drilling Occurences");

let currentIndex = 0;
let inMenu = false;
let currentMenuIndex = 0;
const menuOptions = ["Refactor Prop Drilling with Context", "Refactor Prop Drilling with Component Composition",
    "View Detailed Path"];

function savePaths(paths, debug = true) {
    if (!debug) return;

    let projSegmentCount = projectPath.split("\\").length;

    let csvLines = [];
    for (let path of paths) {
        csvLines.push(path.map(item => {
            let segments = item.split("\\");
            let componentPathSegments = segments.slice(projSegmentCount, segments.length)
            return componentPathSegments.join(":")
        }).join(","));
    }
    fs.writeFileSync('./stats/tmp/paths.csv', csvLines.join("\n"), 'utf-8');
}

function handleUserInput(rl, key) {
    const reactComponents = globalThis.reactComponentManager.getAllReactComponents();
    if (inMenu) {
        handleMenuInput(key, propDrillings, currentIndex, currentMenuIndex, menuOptions);
        return;
    }
    if (key === '\u0003' || key.toLowerCase() === 'q') { // Ctrl+C or 'Q'
        rl.close();
        process.exit();
    } else if (key === '\u001b[A') { //UP arrow
        if (currentIndex > 0) {
            currentIndex -= 1;
            displayPropDrilling(currentIndex, propDrillings);
        }
    } else if (key === '\u001b[B') { //DOWN arrow
        if (currentIndex < propDrillings.length - 1) {
            currentIndex += 1;
            displayPropDrilling(currentIndex, propDrillings);
        }
    } else if (key === '\r') {//Enter
        inMenu = true;
        currentMenuIndex = 0;
        displayMenu(currentIndex, currentMenuIndex, menuOptions);
    }
}
function handleMenuInput(key) {
    const reactComponents = globalThis.reactComponentManager.getAllReactComponents();
    if (key === '\u0003' || key.toLowerCase() === 'q') { // Ctrl+C or 'Q'
        inMenu = false;
        displayPropDrilling(currentIndex, propDrillings);
    } else if (key === '\u001b[A') { // UP arrow
        if (currentMenuIndex > 0) {
            currentMenuIndex -= 1;
            displayMenu(currentIndex, currentMenuIndex, menuOptions);
        }
    } else if (key === '\u001b[B') { // DOWN arrow
        if (currentMenuIndex < menuOptions.length - 1) {
            currentMenuIndex += 1;
            displayMenu(currentIndex, currentMenuIndex, menuOptions);
        }
    } else if (key === '\r') { // Enter
        const selectedOption = menuOptions[currentMenuIndex];
        inMenu = false;
        console.clear();
        console.log(`You selected: ${selectedOption}`);
        // Placeholder actions for menu options
        if (selectedOption === "Refactor Prop Drilling with Context") {
            console.log("Initiating context refactoring for prop drilling...");
            propDrillings[currentIndex].addUseContext(propDrillings);
        } else if (selectedOption === "Refactor Prop Drilling with Component Composition") {
            console.log("Initiating component composition for prop drilling...")
            propDrillings[currentIndex].addComponentComposition(propDrillings);
        } else if (selectedOption === "View Detailed Path") {
            console.log("Displaying detailed path...");
            console.log(propDrillings[currentIndex].giveDetailedPropDrillingPath(propDrillings, propDrillings[currentIndex].getGroupedProps(propDrillings)));
        }
        reactComponents.forEach(comp => {
            comp.writeChanges();
        });
        console.log("\nPress any key to go back.");
        process.stdin.once("keypress", () => {
            displayPropDrilling(currentIndex, propDrillings);
        });
    }
}

if (propDrillings.length > 0) {
    if (interactive) {
        console.clear();
        displayPropDrilling(currentIndex, propDrillings);
        const propDrillingInformation = {
            propDrillings, reactComponents, currentIndex
        };
        startInteractiveConsole(propDrillingInformation)
    }
} else {
    console.log("No Prop Drilling occurences found.");
    process.exit();
}

function startInteractiveConsole(propDrillingInformation) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    process.stdin.on('keypress', (chunk, key) => handleUserInput(rl, key.sequence, propDrillingInformation));

    rl.on('SIGINT', () => {
        rl.close();
        process.exit();
    });
}

const { possibleRefactorings, allPropDrillings } = printPropDrillingsWithDetails(propDrillings, reactComponents);

fs.writeFileSync(`./stats/tmp/candidates.json`, JSON.stringify(allPropDrillings, null, 2), 'utf-8');

reactComponents.forEach(comp => {
    comp.writeChanges();
});

console.timeEnd("Execution time");