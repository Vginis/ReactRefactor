#!/usr/bin/env node
console.time("Execution time");
import * as fs from 'fs';
import * as path from 'path';
import {loadReactFiles} from './lib/ReactFile.js';
import { loadReactComponents,addParents,checkComponentAcrossFiles } from './lib/loadingFuncs.js';
import {loadHierarchy,extractAllPaths,detectPropDrilling} from './lib/Hierarchy.js';
import readline from 'readline';
import { loadAliases } from './lib/Alias.js';
import { displayMenu,displayPropDrilling } from './lib/cli.js';
const args = process.argv.slice(2);

export const projectPath = args[0];
export const rootFile = args[1];
export const rootComponent = args[2];

if(!projectPath && !rootFile){
    console.error("Error: Please provide project path and root file.");
    process.exit(1);
}

function getAllFiles(dirPath) {
    const stack = [dirPath];
    const allFiles = [];

    while (stack.length > 0) {
        const currentDir = stack.pop();
        const files = fs.readdirSync(currentDir);

        files.forEach(file => {
            const fullPath = path.join(currentDir, file);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                stack.push(fullPath);
            } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
                allFiles.push(fullPath);
            }
        });
    }
    return allFiles;
}
const files = getAllFiles(projectPath);
const reactFiles = loadReactFiles(files,rootFile);
const reactComponents = loadReactComponents(reactFiles);
console.log(reactComponents.length);

loadAliases(reactFiles,reactComponents);
addParents(reactComponents);
const roots = reactComponents.filter(comp => comp.isInRootFile).map(comp => comp.name);
const reactRootFile = reactFiles.find(reactF => reactF.filePath===rootFile);
const root = reactComponents.find(comp => comp.name === reactRootFile.findMostNestedComponent(roots)) || reactComponents.find(comp => comp.name === rootComponent);
const hierarchyTree = loadHierarchy(root,reactComponents);
const paths = extractAllPaths(hierarchyTree);

console.log(JSON.stringify(hierarchyTree, null, 2));
const propDrillings = detectPropDrilling(paths,reactComponents);
console.log("Found: " + propDrillings.length + " Prop Drilling Occurences");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let currentIndex = 0;
let inMenu = false;
let currentMenuIndex = 0;
const menuOptions = ["Refactor Prop Drilling with Context","Refactor Prop Drilling with Component Composition",
     "View Detailed Path"];

function handleUserInput(key){
    if(inMenu){
        handleMenuInput(key,propDrillings,reactComponents,currentIndex,currentMenuIndex,menuOptions);
        return;
    }
    if(key === '\u0003' || key.toLowerCase()==='q'){ // Ctrl+C or 'Q'
        rl.close();
        process.exit();
    } else if(key === '\u001b[A'){ //UP arrow
        if(currentIndex > 0){
            currentIndex -= 1;
            displayPropDrilling(currentIndex,propDrillings);
        }
    } else if(key === '\u001b[B'){ //DOWN arrow
        if(currentIndex <propDrillings.length-1){
            currentIndex += 1;
            displayPropDrilling(currentIndex,propDrillings);
        }
    } else if(key === '\r'){//Enter
        inMenu = true;
        currentMenuIndex = 0;
        displayMenu(currentIndex,currentMenuIndex,menuOptions);
    }
}
function handleMenuInput(key){
     if (key === '\u0003' || key.toLowerCase() === 'q') { // Ctrl+C or 'Q'
         inMenu = false;
         displayPropDrilling(currentIndex,propDrillings);
     } else if (key === '\u001b[A') { // UP arrow
         if (currentMenuIndex > 0) {
             currentMenuIndex -= 1;
             displayMenu(currentIndex,currentMenuIndex,menuOptions);
         }
     } else if (key === '\u001b[B') { // DOWN arrow
         if (currentMenuIndex < menuOptions.length - 1) {
             currentMenuIndex += 1;
             displayMenu(currentIndex,currentMenuIndex,menuOptions);
         }
     } else if (key === '\r') { // Enter
         const selectedOption = menuOptions[currentMenuIndex];
         inMenu = false;
         console.clear();
         console.log(`You selected: ${selectedOption}`);
         // Placeholder actions for menu options
         if (selectedOption === "Refactor Prop Drilling with Context") {
             console.log("Initiating context refactoring for prop drilling...");
             propDrillings[currentIndex].addUseContext(reactComponents,propDrillings);
         } else if(selectedOption === "Refactor Prop Drilling with Component Composition"){
             console.log("Initiating component composition for prop drilling...")
             propDrillings[currentIndex].addComponentComposition(reactComponents,propDrillings);
         } else if (selectedOption === "View Detailed Path") {
             console.log("Displaying detailed path...");           
             console.log(propDrillings[currentIndex].giveDetailedPropDrillingPath());
         }
         reactComponents.forEach(comp => {
             comp.writeChanges();
         });
         console.log("\nPress any key to go back.");
         process.stdin.once("keypress", () => {
             displayPropDrilling(currentIndex,propDrillings);
         });
     }
 }

if(propDrillings.length > 0){
    console.clear();
    displayPropDrilling(currentIndex,propDrillings);
    const propDrillingInformation = {
        propDrillings,reactComponents,rl,currentIndex
    };
    process.stdin.on('keypress', (chunk,key) => handleUserInput(key.sequence,propDrillingInformation));
} else {
    console.log("No Prop Drilling occurences found.");
    process.exit();
}

rl.on('SIGINT', () => {
    rl.close();
    process.exit();
});
propDrillings.forEach(propDrilling => console.log(propDrilling.giveDetailedPropDrillingPath()))

//USE CASES(TESTING PURPOSES)
//propDrillings[0].addComponentComposition(reactComponents,propDrillings);
//propDrillings[0].addUseContext(reactComponents,propDrillings);

//console.log(propDrillings[0].generatePropMapping());
reactComponents.forEach(comp => {
    comp.writeChanges();
});

console.timeEnd("Execution time");