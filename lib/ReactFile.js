import path from 'path';
import * as fs from 'fs';
import jscodeshift from 'jscodeshift';
import { returnsJSX } from './util.js';
import { projectPath } from '../index.js';
class ReactFile{
    constructor(name, components, ast,filePath){
        this.name = name;
        this.components = components;
        this.ast = ast;
        this.filePath = filePath
    }
}


function loadReactFiles(files) {
  let reactFiles = [];
  const j = jscodeshift;

  files.forEach(file => {
    const filePath = path.join(projectPath, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const ast = j(fileContent);
    let components = [];

    ast.find(j.FunctionDeclaration).forEach(path => {
      if (returnsJSX(path, j)) {
        components.push(path.node.id.name);
      }          
    });

    ast.find(j.ClassDeclaration).forEach(path => {
      components.push(path.node.id.name);  
    });

    ast.find(j.VariableDeclaration)
      .filter(path => {
        return path.node.declarations.some(declaration => 
          declaration.init && declaration.init.type === 'ArrowFunctionExpression'/* && returnsJSX(declaration.init, j) extend this function for arrow and class Components*/
        );
      })
      .forEach(path => {
        path.node.declarations.forEach(declaration => {
          if (declaration.init.type === 'ArrowFunctionExpression' && declaration.id) {
            components.push(declaration.id.name);
          }
        });
      });
    if (components.length) {
      reactFiles.push(new ReactFile(file, components, ast, filePath));
    } 
  });

  return reactFiles;
}

export {ReactFile,loadReactFiles};