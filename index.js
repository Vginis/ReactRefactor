import * as fs from 'fs';
import jscodeshift from 'jscodeshift';
import {ReactFile,loadReactFiles} from './lib/ReactFile.js';
import {ReactComponent} from './lib/ReactComponent.js';
import { loadReactComponents,addParents } from './lib/loadingFuncs.js';
import {UseStateDeclaration, loadUseStateVariables} from './lib/UseStateDeclaration.js';
import {findCommonAncestor,getValueFromGivenState,findCommonUseStates,findRepeatedCode} from './lib/util.js';
import { PropDrilling } from './lib/PropDrilling.js';
import {StateLifter} from './lib/StateLifter.js';
import {loadHierarchy,extractAllPaths,extractPropDrillingObjects} from './lib/hierarchy.js';
import { createNewContextFile } from './lib/CreateNewFiles.js';
let files = fs.readdirSync('../code/vite-project/src/');

files = files.filter(file => file.endsWith(".jsx"));

const reactFiles = loadReactFiles(files);
const reactComponents = loadReactComponents(reactFiles);
const useStateVariableDeclarations = loadUseStateVariables(reactFiles);

addParents(reactComponents);

useStateVariableDeclarations.forEach(variable => {
    reactComponents.forEach(comp => {
        if(comp.name === variable.reactComponent){
            comp.useStateDeclarations.push(variable);
        }
    })
})
const root = reactComponents.find(comp => !comp.parent);
const hierarchyTree = loadHierarchy(root,reactComponents);
const paths = extractAllPaths(hierarchyTree);
console.log(extractPropDrillingObjects(paths,reactComponents));
//console.log(JSON.stringify(hierarchyTree, null, 2));
///const liftStater = new StateLifter([reactComponents[0],reactComponents[3]],'age');
//USE CASES(TESTING PURPOSES)
// const variable = 'number';
// reactComponents[0].addNewUseStateDeclaration({
//     variableName: variable,
//     setVariableMethod: `set${variable.charAt(0).toUpperCase() + variable.slice(1)}`,
//     initialValue: 90,
//     filePath: reactComponents[3].filepath,
//     reactComponent: reactComponents[3].name
// });
//reactComponents[1].addNewProperty('age')
//reactComponents[0].removeProperty('age')
//reactComponents[0].removeUseStateDeclaration('number');
//console.log(findCommonAncestor(reactComponents[2],reactComponents[1],root));
//reactComponents[0].addNewPropToReturnElement('age','Example');
//reactComponents[0].removePropFromReturnElement('age','Example');
// console.log(getValueFromGivenState('age',reactComponents[3]));
// liftStater.liftStateUpFromTwoComponents(root);
//const counts = findCommonUseStates(useStateVariableDeclarations);
//console.log(reactComponents[1].getChildProps());
//const propDrilling = locatePropDrillingPath(root,reactComponents);
// propDrilling.removeAllProps(reactComponents);
//console.log(locatePropDrillingPath(root,reactComponents));
// propDrilinOb[0].addUseContext(reactComponents);
//createNewContextFile('age')
//propDrilling.addUseContext(reactComponents);

reactComponents.forEach(comp => {
    comp.writeChanges();
})
//todo add component hierarchy object