import * as fs from 'fs';
import jscodeshift from 'jscodeshift';
import path from 'path';
import {ReactFile,loadReactFiles} from './Objects/ReactFile.js';
import {ReactComponent, loadReactComponents,addParents} from './Objects/ReactComponent.js';
let files = fs.readdirSync('../code/vite-project/src/');
const j = jscodeshift;

files = files.filter(file => file.endsWith(".jsx"));

const reactFiles = loadReactFiles(files);
const reactComponents = loadReactComponents(files);


addParents(reactComponents);


console.log(reactComponents);