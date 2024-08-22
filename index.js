import * as fs from 'fs';
import jscodeshift from 'jscodeshift';
import {ReactFile,loadReactFiles} from './lib/ReactFile.js';
import {ReactComponent} from './lib/ReactComponent.js';
import { loadReactComponents,addParents, extractImportDeclarations } from './lib/loadingFuncs.js';
import {UseStateDeclaration, loadUseStateVariables} from './lib/UseStateDeclaration.js';
import {findCommonAncestor,getValueFromGivenState,findCommonUseStates,findRepeatedCode} from './lib/util.js';
import { PropDrilling } from './lib/PropDrilling.js';
import {StateLifter} from './lib/StateLifter.js';
import {loadHierarchy,extractAllPaths,extractPropDrillingObjects} from './lib/hierarchy.js';
import { createNewContextFile } from './lib/CreateNewFiles.js';

export const projectPath = '../code2/my-app/src';

let files = fs.readdirSync(`${projectPath}`);

files = files.filter(file => file.endsWith(".js"));
const reactFiles = loadReactFiles(files);
const reactComponents = loadReactComponents(reactFiles);
const useStateVariableDeclarations = loadUseStateVariables(reactFiles);//this doesn't work for arrow functions

addParents(reactComponents);
useStateVariableDeclarations.forEach(variable => {
    reactComponents.forEach(comp => {
        if(comp.name === variable.reactComponent){
            comp.useStateDeclarations.push(variable);
        }
    })
});
const root = reactComponents.find(comp => !comp.parent);
const hierarchyTree = loadHierarchy(root,reactComponents);
const paths = extractAllPaths(hierarchyTree);
const propDrillingObjs = extractPropDrillingObjects(paths,reactComponents);
console.log(propDrillingObjs);
//USE CASES(TESTING PURPOSES)
//propDrillingObjs[0].addComponentComposition(reactComponents);
//console.log(JSON.stringify(hierarchyTree, null, 2));
//const liftStater = new StateLifter([reactComponents[0],reactComponents[3]],'age')
// const variable = 'number';
// reactComponents[0].addNewUseStateDeclaration({
//     variableName: variable,
//     setVariableMethod: `set${variable.charAt(0).toUpperCase() + variable.slice(1)}`,
//     initialValue: 90,
//     filePath: reactComponents[0].filepath,
//     reactComponent: reactComponents[0].name
// });
//reactComponents[0].addNewProperty('id')
//reactComponents[0].removeProperty('id')
//reactComponents[0].removeUseStateDeclaration('number');
//console.log(findCommonAncestor(reactComponents[2],reactComponents[1],root));
//reactComponents[0].addNewPropToReturnElement('age','Example');
//reactComponents[0].removePropFromReturnElement('age','Example');
//console.log(getValueFromGivenState('age',reactComponents[0]));
// liftStater.liftStateUpFromTwoComponents(root);
//const counts = findCommonUseStates(useStateVariableDeclarations);
//console.log(reactComponents[1].getChildProps());
//const propDrilling = locatePropDrillingPath(root,reactComponents);
// propDrilling.removeAllProps(reactComponents);
//console.log(locatePropDrillingPath(root,reactComponents));
propDrillingObjs[0].addUseContext(reactComponents);
//createNewContextFile('age')
reactComponents.forEach(comp => {
    comp.writeChanges();
});