import path from 'path';
import * as fs from 'fs';
import jscodeshift from 'jscodeshift';
import { returnsJSX } from './util.js';
import { projectPath } from '../index.js';
class ReactFile{
    constructor(name, components, ast,filePath,isRootFile=false){
        this.name = name;
        this.components = components;
        this.ast = ast;
        this.filePath = filePath;
        this.isRootFile = isRootFile;
    }

    checkComponentUsageInHtml(componentName) {
        const j = jscodeshift;
        let isUsedInHtml = false;
        let isUsedInRootFile = false;
        let componentFound = false;
        this.ast.find(j.JSXElement).forEach(path => {
          const openingElement = path.node.openingElement;
          if (!(openingElement.name.type === 'JSXIdentifier' && openingElement.name.name === componentName)) {
            return;
          }
          componentFound = true;
          let parent = path.parent.node;
          while (parent) {
            if (parent.type === 'JSXElement' && parent.openingElement.name.type === 'JSXIdentifier') {
              const parentTag = parent.openingElement.name.name;
              if (/^[a-zA-Z]/.test(parentTag)) {
                isUsedInHtml = true;
                break;  
              }
            }
            parent = parent.parent ? parent.parent.node : null;
          }
        });
      
        if (!componentFound) {
          return { isUsedInHtml, isUsedInRootFile };
        }
      
        this.ast.find(j.CallExpression).forEach(path => {
          const callee = path.node.callee;
      
          // Check for ReactDOM.render
          if (callee.type === 'MemberExpression' && callee.object.name === 'ReactDOM' && callee.property.name === 'render') {
            isUsedInHtml = true;
            return; 
          }
          // Check for ReactDOM.createRoot(...).render
          if (
            callee.type === 'MemberExpression' &&
            callee.object.type === 'CallExpression' &&
            callee.object.callee.type === 'MemberExpression' &&
            callee.object.callee.property.name === 'createRoot' &&
            callee.property.name === 'render'
          ) {
            isUsedInHtml = true;
            return;
          }

          if (path.node.callee && path.node.callee.type === 'Identifier' && path.node.callee.name === 'createRoot') {
            isUsedInHtml = true;
          } 
        });
        if(this.isRootFile){
            isUsedInRootFile = true;
        }
        return { isUsedInHtml, isUsedInRootFile };
      }
  extractExports() {
    const j = jscodeshift;
    let exportList = [];

    this.ast.find(j.ExportNamedDeclaration).forEach(path => {
        if (path.node.declaration) {
            if (path.node.declaration.id) {
                exportList.push(path.node.declaration.id.name);
            }
            else if (path.node.declaration.declarations) {
                path.node.declaration.declarations.forEach(declaration => {
                    exportList.push(declaration.id.name);
                });
            }
        }
        else if (path.node.specifiers) {
            path.node.specifiers.forEach(specifier => {
                exportList.push(specifier.exported.name);
            });
        }
    });

    this.ast.find(j.ExportDefaultDeclaration).forEach(path => {
        if (path.node.declaration) {
            if (path.node.declaration.name) {
                exportList.push('default (' + path.node.declaration.name + ')');
            } else {
                exportList.push('default');
            }
        }
    });

    this.exports = exportList;  // Store the exports list in the class
    return exportList;
    } 

    findMostNestedComponent(components) {
        let mostNestedComponent = null;
        let maxDepth = -1;
        const j = jscodeshift;
        this.ast.find(j.JSXElement).forEach(path => {
            const openingElement = path.node.openingElement;
            const tagName = openingElement.name.name;
            if (components.includes(tagName)) {
                const depth = this.calculateJSXDepth(path);
                if (depth > maxDepth) {
                    maxDepth = depth;
                    mostNestedComponent = tagName;
                }
          }
        });
    
        return mostNestedComponent;
      }
    
    calculateJSXDepth(path) {
        let depth = 0;
        let currentPath = path;
    
        while (currentPath.parentPath) {
          if (currentPath.parentPath.value.type === 'JSXElement') {
            depth++;
          }
          currentPath = currentPath.parentPath;
        }
    
        return depth;
      }
}


function loadReactFiles(files,rootFileName) {
    let reactFiles = [];
    const j = jscodeshift;

    files.forEach(file => {
    let filePath = null;
    if(file.endsWith(".js") || file.endsWith(".jsx")){
        filePath = file;
    } else {
        filePath = path.join(projectPath, file);
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const ast = j(fileContent);

    let components = [];
    ast.find(j.FunctionDeclaration).forEach(path => {
        if (returnsJSX(path, j)) {
        components.push(path.node.id.name);
        }          
    });

    ast.find(j.ClassDeclaration).forEach(path => {
        if(returnsJSX(path,j))
        components.push(path.node.id.name);  
    });

    ast.find(j.VariableDeclaration)
        .filter(path => {
        return path.node.declarations.some(declaration => 
            declaration.init && declaration.init.type === 'ArrowFunctionExpression' 
            && returnsJSX(declaration.init, j));
        })
        .forEach(path => {
        path.node.declarations.forEach(declaration => {
            if (declaration.init.type === 'ArrowFunctionExpression' && declaration.id) {
            components.push(declaration.id.name);
            }
        });
        });
        let isRootFile = false;
        if(rootFileName === file){
        isRootFile = true;
        }
        const reactFile = new ReactFile(file, components, ast, filePath,isRootFile);
        reactFile.extractExports();
        reactFiles.push(reactFile);
    });
    return reactFiles;
    }

export {ReactFile,loadReactFiles};