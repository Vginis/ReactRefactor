#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import jscodeshift from 'jscodeshift';
import {ReactFile,loadReactFiles} from './lib/ReactFile.js';
import {ReactComponent} from './lib/ReactComponent.js';
import { loadReactComponents,addParents,checkComponentAcrossFiles } from './lib/loadingFuncs.js';
import { PropDrilling } from './lib/PropDrilling.js';
import {loadHierarchy,extractAllPaths,detectPropDrilling} from './lib/Hierarchy.js';
import { createNewContextFile } from './lib/CreateNewFiles.js';
import { loadAliases } from './lib/Alias.js';
import { ImportSpecifier } from './lib/ImportStatement.js';
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
addParents(reactComponents);
loadAliases(reactFiles,reactComponents);
const roots = reactComponents.filter(comp => comp.isInRootFile).map(comp => comp.name);
const reactFile = reactFiles.find(reactF => reactF.filePath===rootFile);
const root = reactComponents.find(comp => comp.name === reactFile.findMostNestedComponent(roots));
const hierarchyTree = loadHierarchy(root,reactComponents);
const paths = extractAllPaths(hierarchyTree);


console.log(JSON.stringify(hierarchyTree, null, 2));
const propDrillings = detectPropDrilling(paths,reactComponents);

console.log("Found: " + propDrillings.length + " Prop Drilling Occurences");
console.log(propDrillings);
propDrillings.forEach(propDrilling => console.log(propDrilling.giveDetailedPropDrillingPath()))
//USE CASES(TESTING PURPOSES)
//propDrillings[0].addComponentComposition(reactComponents,propDrillings);// here relation i -- i+1
// const sourceComponent = reactComponents.find(comp => comp.name === propDrillingObjs[0].source);
//const liftStater = new StateLifter([reactComponents[0],reactComponents[3]],'age')
// const variable = 'age';
// reactComponents[0].addNewUseStateDeclaration({
//     variableName: variable,
//     setVariableMethod: `set${variable.charAt(0).toUpperCase() + variable.slice(1)}`,
//     initialValue: 90,
//     reactComponent: reactComponents[0].name
// });
//reactComponents[0].addNewProperty('id')
//reactComponents[0].removeProperty('id')
//reactComponents[0].removeUseStateDeclaration('number');
//console.log(findCommonAncestor(reactComponents[2],reactComponents[1],root));
//reactComponents[0].addNewPropToReturnElement('age','Example');
//reactComponents[0].removePropFromReturnElement('age','Deposit');
//console.log(getValueFromGivenState('age',reactComponents[0]));
// liftStater.liftStateUpFromTwoComponents(root);
//const counts = findCommonUseStates(useStateVariableDeclarations);
//console.log(reactComponents[1].getChildProps());
//const propDrilling = locatePropDrillingPath(root,reactComponents);
// propDrilling.removeAllProps(reactComponents);
//console.log(locatePropDrillingPath(root,reactComponents));
propDrillings[0].addUseContext(reactComponents,propDrillings);
//createNewContextFile('age')
reactComponents.forEach(comp => {
    comp.writeChanges();
});

//todo: fix ecommmerce, carbon
//todo: remove unneccesary methods
//todo: Implement logic for Context usage for variable name change