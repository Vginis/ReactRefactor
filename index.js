import * as fs from 'fs';
import jscodeshift from 'jscodeshift';
import {ReactFile,loadReactFiles} from './lib/ReactFile.js';
import {ReactComponent} from './lib/ReactComponent.js';
import { loadReactComponents,addParents } from './lib/loadingFuncs.js';
import {UseStateDeclaration, loadUseStateVariables} from './lib/UseStateDeclaration.js';
import {findCommonAncestor,getValueFromGivenState,findCommonUseStates,findRepeatedCode,locatePropDrilling} from './lib/util.js';
import {StateLifter} from './lib/StateLifter.js';
let files = fs.readdirSync('../code/vite-project/src/');

files = files.filter(file => file.endsWith(".jsx"));

const reactFiles = loadReactFiles(files);
const reactComponents = loadReactComponents(reactFiles);
//todo change this ola fortonontai apo ta files. Na ta fortono mia fora 
const useStateVariableDeclarations = loadUseStateVariables(reactFiles);

addParents(reactComponents);

useStateVariableDeclarations.forEach(variable => {
    reactComponents.forEach(comp => {
        if(comp.name === variable.reactComponent){
            comp.useStateDeclarations.push(variable);
        }
    })
})
const root = reactComponents[0];
console.log(useStateVariableDeclarations);
//const liftStater = new StateLifter([reactComponents[0],reactComponents[3]],'age');
//locatePropDrilling(reactComponents);
//USE CASES(TESTING PURPOSES)
// const variable = 'number';
// reactComponents[3].addNewUseStateDeclaration({
//     variableName: variable,
//     setVariableMethod: `set${variable.charAt(0).toUpperCase() + variable.slice(1)}`,
//     initialValue: 90,
//     filePath: reactComponents[3].filepath,
//     reactComponent: reactComponents[3].name
// });
//reactComponents[2].addNewProperty('age')
//reactComponents[1].removeProperty('age')
//reactComponents[3].removeUseStateDeclaration('number');
//console.log(findCommonAncestor(reactComponents[2],reactComponents[1],root));
reactComponents[0].addNewPropToReturnElement('age','Example');
//reactComponents[1].removePropFromReturnElement('num','Example2');
// console.log(getValueFromGivenState('age',reactComponents[3]));
// liftStater.liftStateUpFromTwoComponents(root);
//const counts = findCommonUseStates(useStateVariableDeclarations);


//todo add component hierarchy object