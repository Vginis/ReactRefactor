#!/usr/bin/env node
console.time("Execution time");
import { getAllFiles,extractPathsAndHierarchies } from './lib/util.js';
import { loadReactFiles } from './lib/ReactFile.js';
import { loadReactComponents,addParents,addCompositeKeyReturnedElements } from './lib/loadingFuncs.js';
import { detectPropDrilling } from './lib/Hierarchy.js';
import readline from 'readline';
import { loadAliases } from './lib/Alias.js';
import { displayMenu,displayPropDrilling } from './lib/cli.js';
const args = process.argv.slice(2);

export const projectPath = args[0];
export const rootFile = args[1];
export const rootComponent = args[2];
export const fileType = rootFile.split(".").pop();

if(!projectPath && !rootFile){
    console.error("Error: Please provide project path and root file.");
    process.exit(1);
}

const {allFiles, isNextJsProject} = getAllFiles(projectPath);
const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles,rootFile);
const reactComponents = loadReactComponents(reactFiles, filteredJsxElements);
console.log(`Number of found Components: ${reactComponents.length}`);

loadAliases(reactFiles,reactComponents);
addParents(reactComponents);
addCompositeKeyReturnedElements(reactComponents,reactFiles);
const {hierarchyTrees, paths} = extractPathsAndHierarchies(reactFiles,reactComponents,isNextJsProject);

// Print all hierarchy trees
console.log(JSON.stringify(hierarchyTrees, null, 2));
const propDrillings = detectPropDrilling(paths,reactComponents);
console.log("Found: " + propDrillings.length + " Prop Drilling Occurences");

// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });

// let currentIndex = 0;
// let inMenu = false;
// let currentMenuIndex = 0;
// const menuOptions = ["Refactor Prop Drilling with Context","Refactor Prop Drilling with Component Composition",
//      "View Detailed Path"];

// function handleUserInput(key){
//     if(inMenu){
//         handleMenuInput(key,propDrillings,reactComponents,currentIndex,currentMenuIndex,menuOptions);
//         return;
//     }
//     if(key === '\u0003' || key.toLowerCase()==='q'){ // Ctrl+C or 'Q'
//         rl.close();
//         process.exit();
//     } else if(key === '\u001b[A'){ //UP arrow
//         if(currentIndex > 0){
//             currentIndex -= 1;
//             displayPropDrilling(currentIndex,propDrillings);
//         }
//     } else if(key === '\u001b[B'){ //DOWN arrow
//         if(currentIndex <propDrillings.length-1){
//             currentIndex += 1;
//             displayPropDrilling(currentIndex,propDrillings);
//         }
//     } else if(key === '\r'){//Enter
//         inMenu = true;
//         currentMenuIndex = 0;
//         displayMenu(currentIndex,currentMenuIndex,menuOptions);
//     }
// }
// function handleMenuInput(key){
//      if (key === '\u0003' || key.toLowerCase() === 'q') { // Ctrl+C or 'Q'
//          inMenu = false;
//          displayPropDrilling(currentIndex,propDrillings);
//      } else if (key === '\u001b[A') { // UP arrow
//          if (currentMenuIndex > 0) {
//              currentMenuIndex -= 1;
//              displayMenu(currentIndex,currentMenuIndex,menuOptions);
//          }
//      } else if (key === '\u001b[B') { // DOWN arrow
//          if (currentMenuIndex < menuOptions.length - 1) {
//              currentMenuIndex += 1;
//              displayMenu(currentIndex,currentMenuIndex,menuOptions);
//          }
//      } else if (key === '\r') { // Enter
//          const selectedOption = menuOptions[currentMenuIndex];
//          inMenu = false;
//          console.clear();
//          console.log(`You selected: ${selectedOption}`);
//          // Placeholder actions for menu options
//          if (selectedOption === "Refactor Prop Drilling with Context") {
//              console.log("Initiating context refactoring for prop drilling...");
//              propDrillings[currentIndex].addUseContext(reactComponents,propDrillings);
//          } else if(selectedOption === "Refactor Prop Drilling with Component Composition"){
//              console.log("Initiating component composition for prop drilling...")
//              propDrillings[currentIndex].addComponentComposition(reactComponents,propDrillings);
//          } else if (selectedOption === "View Detailed Path") {
//              console.log("Displaying detailed path...");           
//              console.log(propDrillings[currentIndex].giveDetailedPropDrillingPath());
//          }
//          reactComponents.forEach(comp => {
//              comp.writeChanges();
//          });
//          console.log("\nPress any key to go back.");
//          process.stdin.once("keypress", () => {
//              displayPropDrilling(currentIndex,propDrillings);
//          });
//      }
//  }

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
//propDrillings[0].addUseContext(reactComponents,propDrillings);

reactComponents.forEach(comp => {
    comp.writeChanges();
});

console.timeEnd("Execution time");