import path from 'path';
import * as fs from 'fs';
import jscodeshift from 'jscodeshift';
import { returnsJSX,resolveJscodeshiftParser } from './util.js';
import { extractExports } from './Export.js';
import { projectPath, fileType } from '../index.js';
import { extractImportDeclarations } from './ImportStatement.js';
class ReactFile{
    constructor(components, ast,filePath,isRootFile=false,importDeclarations=[]){
        this.components = components;
        this.ast = ast;
        this.filePath = filePath;
        this.isRootFile = isRootFile;
        this.importDeclarations = importDeclarations
    }

    loadFileAndAst(){
      const j = resolveJscodeshiftParser(fileType);
      const filePath = this.filePath;
      const ast = this.ast;
      return {j,filePath,ast};
    } 

    checkComponentUsageInHtml(componentName) {
      const j = resolveJscodeshiftParser(fileType);
      let isUsedInHtml = false;
      let isUsedInRootFile = this.isRootFile || false;
      let componentFound = false;
      const roots = new Set();
    
      const isJSXIdentifierMatch = (element, name) =>
        element && element.type === 'JSXIdentifier' && element.name === name;
     
      const checkJSXElement = (node) => {
        let componentFoundLocally = false;
      
        if (node.type === 'JSXElement') {
          const { openingElement, children } = node;
          
          if (isJSXIdentifierMatch(openingElement.name, componentName)) {
            componentFound = true;
            componentFoundLocally = true;
            isUsedInHtml = true;
          }
      
          children?.forEach(child => {
            if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
              componentFoundLocally = checkJSXElement(child) || componentFoundLocally;
            }
          });
      
          openingElement?.attributes?.forEach(attr => {
            if (attr.type === 'JSXAttribute') {
              if (attr.value?.type === 'JSXExpressionContainer' && attr.value.expression.type === 'Identifier') {
                if (attr.value.expression.name === componentName) {
                  componentFound = true;
                  componentFoundLocally = true;
                  isUsedInHtml = true;
                }
              } else if (attr.value?.type === 'JSXElement' || attr.value?.type === 'JSXFragment') {
                componentFoundLocally = checkJSXElement(attr.value) || componentFoundLocally;
              }
            }
          });
      
        } else if (node.type === 'JSXFragment') {
          node.children?.forEach(child => {
            componentFoundLocally = checkJSXElement(child) || componentFoundLocally;
          });
      
        } else if (node.type === 'ConditionalExpression') {
          componentFoundLocally = checkJSXElement(node.consequent) || componentFoundLocally;
          componentFoundLocally = checkJSXElement(node.alternate) || componentFoundLocally;
      
        } else if (node.type === 'LogicalExpression') {
          componentFoundLocally = checkJSXElement(node.left) || componentFoundLocally;
          componentFoundLocally = checkJSXElement(node.right) || componentFoundLocally;
      
        } else if (node.type === 'CallExpression') {
          node.arguments.forEach(arg => {
            if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
              componentFoundLocally = checkJSXElement(arg.body) || componentFoundLocally;
            } else if (arg.type === 'JSXElement' || arg.type === 'JSXFragment') {
              componentFoundLocally = checkJSXElement(arg) || componentFoundLocally;
            }
          });
      
        } else if (node.type === 'JSXExpressionContainer') {
          componentFoundLocally = checkJSXElement(node.expression) || componentFoundLocally;
        }
      
        return componentFoundLocally;
      };
      this.ast.find(j.JSXElement).forEach((path) => {
        const elementFound = checkJSXElement(path.node);
        if (elementFound) {
          componentFound = true;
        }
      });
    
      // ReactDOM.createRoot and render usage checks
      const checkRenderCalls = (path,componentFound) => {
        if(!componentFound) return;
        const { callee } = path.node;
        
        // Utility to check if a method is being called on ReactDOM
        const isReactRenderCall = (obj, method) =>
          callee.type === 'MemberExpression' && callee.object.name === obj && callee.property.name === method;
    
        if (isReactRenderCall('ReactDOM', 'createRoot') && path.parent.node.type === 'VariableDeclarator') {
          roots.add(path.parent.node.id.name);
        }
    
        if (isReactRenderCall('ReactDOM', 'render')) {
          isUsedInHtml = true;
        }
    
        if (callee.type === 'MemberExpression' && roots.has(callee.object.name) && callee.property.name === 'render') {
          isUsedInHtml = true;
        }
    
        if (isReactRenderCall('ReactDOM', 'createRoot') && callee.object.type === 'CallExpression' && callee.property.name === 'render') {
          isUsedInHtml = true;
        }
      };
    
      // Find and check all CallExpression nodes for ReactDOM usage
      this.ast.find(j.CallExpression).forEach((path) => checkRenderCalls(path,componentFound));
      return { isUsedInHtml, isUsedInRootFile };
    }

    findMostNestedComponent(components) {
      let mostNestedComponent = null;
      let maxDepth = -1;
      const j = resolveJscodeshiftParser(fileType);
      
      this.ast.find(j.JSXElement).forEach(path => {
          const openingElement = path.node.openingElement;
          const tagName = openingElement.name?.name;
    
         if (components.includes(tagName)) {
              const depth = this.calculateJSXDepth(path);
              if (depth > maxDepth) {
                  maxDepth = depth;
                  mostNestedComponent = tagName;
              }
          }
    
          openingElement.attributes?.forEach(attr => {
              if (attr.type === 'JSXAttribute' && attr.value?.type === 'JSXExpressionContainer') {
                  const expression = attr.value.expression;
                  if (expression.type === 'Identifier' && components.includes(expression.name)) {
                      const depth = this.calculateJSXDepth(path);
                      if (depth > maxDepth) {
                          maxDepth = depth;
                          mostNestedComponent = expression.name;
                      }
                  }
              }
          });
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
    let j = resolveJscodeshiftParser(fileType);

    files.forEach(file => {
      let filePath = null;
      if(file.includes(".test.")){
        return;
      }
      if((file.endsWith(".js") || file.endsWith(".jsx") || file.endsWith(".tsx"))){
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

      ast.find(j.VariableDeclaration).filter(path => {
          return path.node.declarations.some(declaration => 
              declaration.init && declaration.init.type === 'ArrowFunctionExpression' 
              && returnsJSX(declaration.init, j));
          }).forEach(path => {
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
      const reactFile = new ReactFile(components, ast, filePath,isRootFile);
      extractExports(reactFile);
      reactFiles.push(reactFile);
      });
      
      extractImportDeclarations(reactFiles);
    return reactFiles;
}

export {ReactFile,loadReactFiles};