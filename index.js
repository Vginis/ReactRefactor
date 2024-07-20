import * as fs from 'fs';
import jscodeshift from 'jscodeshift';
import path from 'path';
import {ReactFile,loadReactFiles} from './Objects/ReactFile.js';
import {ReactComponent, loadReactComponents,addParents} from './Objects/ReactComponent.js';
import {UseStateDeclaration, loadUseStateVariables} from './Objects/UseStateDeclaration.js';
let files = fs.readdirSync('../code/vite-project/src/');
const j = jscodeshift;

files = files.filter(file => file.endsWith(".jsx"));

const reactFiles = loadReactFiles(files);
const reactComponents = loadReactComponents(files);

const useStateVariableDeclarations = loadUseStateVariables(files);

addParents(reactComponents);

useStateVariableDeclarations.forEach(variable => {
    reactComponents.forEach(comp => {
        if(comp.name === variable.reactComponent){
            comp.useStateDeclarations.push(variable);
        }
    })
})



// const variable = 'number';
// reactComponents[3].addNewUseStateDeclaration({
//     variableName: variable,
//     setVariableMethod: `set${variable.charAt(0).toUpperCase() + variable.slice(1)}`,
//     initialValue: 90,
//     filePath: reactComponents[3].filepath,
//     reactComponent: reactComponents[3].name
// });
reactComponents[1].addNewProperty('age')
//reactComponents[1].removeProperty('age')
//reactComponents[3].removeUseStateDeclaration('number');
