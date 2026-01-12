#!/usr/bin/env node
console.time("Execution time");
import * as fs from 'fs';
import { getAllFiles, resolveIfProjectHasMultiplePages, extractPathsAndHierarchies,
    extractPathsAndHierarchies2
 } from './lib/util.js';
import { loadReactFiles } from './lib/ReactFile.js';
import { loadReactComponents, addParents, addCompositeKeyReturnedElements } from './lib/loadingFuncs.js';
import { detectPropDrilling } from './lib/Hierarchy.js';
import readline from 'readline';
import { loadAliases, loadAliases2 } from './lib/Alias.js';
import { displayMenu, displayPropDrilling} from './lib/cli.js';
import { countDistinctComponents, calculatePropDrillingDepths, countCompoundPropDrillings, countPathOccurrences, countPropDrillingFamilies, countPropDrillingRefactoringStats, countPropDrillingsWithDifferentStartCommonEnding } from './lib/statsCalculation.js';
import { printPropDrillingsWithDetails } from './lib/PropDrilling.js';

const args = process.argv.slice(2);
const projectPath = args[0];
const rootFile = args[1];
const rootComponent = args[2];
const fileType = args[3] || rootFile?.split(".").pop();

globalThis.projectPath = projectPath
globalThis.rootFile = rootFile
globalThis.rootComponent = rootComponent
globalThis.fileType = fileType


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

// console.time("Add parents")
addParents();
// console.timeEnd("Add parents")

//addCompositeKeyReturnedElements(reactFiles);

console.time("Hierarchy resolution")
//const { hierarchyTrees, paths } = extractPathsAndHierarchies(reactFiles, rootFile, hasMultiplePages);
const { hierarchyTrees, paths } = extractPathsAndHierarchies2();
console.timeEnd("Hierarchy resolution")

// Print all hierarchy trees
fs.writeFileSync('./stats/a.json', JSON.stringify(hierarchyTrees, null, 2), 'utf-8');

savePaths(paths);

//console.log(JSON.stringify(hierarchyTrees, null, 2));

console.time("PD detection")
const propDrillings = detectPropDrilling(paths);
console.timeEnd("PD detection")

console.log("Found: " + propDrillings.length + " Prop Drilling Occurences");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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
    fs.writeFileSync('./stats/paths.csv', csvLines.join("\n"), 'utf-8');
}

function handleUserInput(key) {
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
    console.clear();
    displayPropDrilling(currentIndex, propDrillings);
    const propDrillingInformation = {
        propDrillings, reactComponents, rl, currentIndex
    };
    process.stdin.on('keypress', (chunk, key) => handleUserInput(key.sequence, propDrillingInformation));
} else {
    console.log("No Prop Drilling occurences found.");
    process.exit();
}

rl.on('SIGINT', () => {
    rl.close();
    process.exit();
});
const { possibleRefactorings, allPropDrillings } = printPropDrillingsWithDetails(propDrillings, reactComponents);

fs.writeFileSync(`./stats/candidates.json`, JSON.stringify(allPropDrillings, null, 2), 'utf-8');

//USE CASES(TESTING PURPOSES)
//propDrillings[0].addComponentComposition(reactComponents,propDrillings);
//propDrillings[0].addUseContext(reactComponents,propDrillings);

//StatsModule
// console.log(`Components participating in Prop Drillings: ${(countDistinctComponents(propDrillings))}`)
// console.log(`Components participation percentage in Prop Drillings: ${(countDistinctComponents(propDrillings)/reactComponents.length).toFixed(2)}`)
// console.log(`Possible Refactorings with Context or Composition: ${possibleRefactorings}`);
// const depthsMap = calculatePropDrillingDepths(propDrillings);
// for(let i=3; i<=5; i++){
//     const familyDepth = (depthsMap.get(i)) ? depthsMap.get(i) : 0; 
//     console.log(`Number of Prop Drillings with depth ${i}: ${familyDepth}`);
// }

// const { compoundPropDrillingsCount, totalCompoundPropDrillings } = countCompoundPropDrillings(propDrillings);
// console.log(`Total Number of Compound Prop Drillings: ${totalCompoundPropDrillings}`);
// const pathOccurencesMap = countPathOccurrences(propDrillings);
// console.log(pathOccurencesMap);
// console.log("Path Occurences Array: " + [...pathOccurencesMap.values()]);
// const compoundPropDrillingFamilies = countPropDrillingFamilies(propDrillings);

// console.log(`Compound Prop Drilling Families with 2 properties: ${compoundPropDrillingFamilies["twos"]}`);
// console.log(`Compound Prop Drilling Families with 3 properties: ${compoundPropDrillingFamilies["threes"]}`);
// console.log(`Compound Prop Drilling Families with more than 4 properties: ${compoundPropDrillingFamilies["multiples"]}`);
// console.log(`Number of compound Prop Drillings: ${compoundPropDrillingsCount}`);

// const { componentCompositionCount, contextCount, refactorableCompoundPropDrillingsCount } = countPropDrillingRefactoringStats(propDrillings);
// console.log(`Allowed Refactorings with Component Composition: ${componentCompositionCount}`);
// console.log(`Allowed Refactorings with Context: ${contextCount}`);
// console.log(`Number of refactorable Compound Prop Drillings: ${refactorableCompoundPropDrillingsCount}`);

// const { propDrillingsWithCommonEnding, propDrilllingsWithCommonStart } = countPropDrillingsWithDifferentStartCommonEnding(propDrillings);
// console.log(`Prop Drillings with common ending: ${propDrillingsWithCommonEnding}`);
// console.log(`Prop Drillings with common start: ${propDrilllingsWithCommonStart}`);

reactComponents.forEach(comp => {
    comp.writeChanges();
});

console.timeEnd("Execution time");