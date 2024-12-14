#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import {loadReactFiles} from './lib/ReactFile.js';
import { loadReactComponents,addParents,checkComponentAcrossFiles } from './lib/loadingFuncs.js';
import {loadHierarchy,extractAllPaths,detectPropDrilling} from './lib/Hierarchy.js';
import readline from 'readline';
import { loadAliases } from './lib/Alias.js';
import { displayPropDrilling, handleUserInput } from './lib/cli.js';
const args = process.argv.slice(2);

export const projectPath = args[0];
export const rootFile = args[1];
if(!projectPath){
    console.error("Error: Please provide project path");
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
const reactFile = reactFiles.find(reactF => reactF.filePath===rootFile);
const root = reactComponents.find(comp => comp.name === reactFile.findMostNestedComponent(roots));
const hierarchyTree = loadHierarchy(root,reactComponents);
const paths = extractAllPaths(hierarchyTree);

console.log(JSON.stringify(hierarchyTree, null, 2));
const propDrillings = detectPropDrilling(paths,reactComponents);
console.log("Found: " + propDrillings.length + " Prop Drilling Occurences");

// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });

// let currentIndex = 0;

// if(propDrillings.length > 0){
//     console.clear();
//     displayPropDrilling(currentIndex,propDrillings);
//     const propDrillingInformation = {
//         propDrillings,reactComponents,rl,currentIndex
//     };
//     process.stdin.on('keypress', (chunk,key) => handleUserInput(key.sequence,propDrillingInformation));
// } else {
//     console.log("No Prop Drilling occurences found.");
//     process.exit();
// }

// rl.on('SIGINT', () => {
//     rl.close();
//     process.exit();
// });
propDrillings.forEach(propDrilling => console.log(propDrilling.giveDetailedPropDrillingPath()))

//USE CASES(TESTING PURPOSES)
//propDrillings[0].addComponentComposition(reactComponents,propDrillings);
propDrillings[5].addUseContext(reactComponents,propDrillings);

reactComponents.forEach(comp => {
    comp.writeChanges();
});