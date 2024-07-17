import * as fs from 'fs';
import jscodeshift from 'jscodeshift';
import path from 'path';
import {ReactFile,loadReactFiles} from './Objects/ReactFile.js';
import {ReactComponent, loadReactComponents,addParents,addNewPropToComponent,removeExistingPropFromComponent} from './Objects/ReactComponent.js';
import {UseStateDeclaration, loadUseStateVariables} from './Objects/UseStateDeclaration.js';
let files = fs.readdirSync('../code/vite-project/src/');
const j = jscodeshift;

files = files.filter(file => file.endsWith(".jsx"));

const reactFiles = loadReactFiles(files);
const reactComponents = loadReactComponents(files);

const useStateVariableDeclarations = loadUseStateVariables(files);
console.log(useStateVariableDeclarations);
addParents(reactComponents);

//addNewPropToComponent(reactComponents[1],'count=count');
//removeExistingPropFromComponent(reactComponents[1],'age');