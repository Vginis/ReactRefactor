import jscodeshift from 'jscodeshift';
import { resolveJscodeshiftParser } from './util.js';
import { fileType } from '../index.js';

class Export{
    constructor(exportList, isDefault=false){
        this.exportList = exportList;
        this.isDefault = isDefault;
    }
}

function extractExports(reactFile) {
    const j = resolveJscodeshiftParser(fileType);
    let exportList = [];
    let isDefault = false;

    reactFile.ast.find(j.ExportNamedDeclaration).forEach(path => {
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
   
    reactFile.ast.find(j.ExportDefaultDeclaration).forEach(path => {
        if (path.node.declaration) {
            if (path.node.declaration.name) {
                exportList.push(path.node.declaration.name);
                isDefault = true;
            } else if(path.node.declaration.type==='FunctionDeclaration' && path.node.declaration.id !== null){
              exportList.push(path.node.declaration.id.name);
              isDefault = true;
            } else if(path.node.declaration.type==='FunctionDeclaration' && path.node.declaration.id === null){
                const fileParts = reactFile.filePath.split("\\");
                const fileName = fileParts.pop().split(".")[0]
                exportList.push(fileName);
                isDefault = true;
            } else if (path.node.declaration.type === 'CallExpression') {
              const callee = path.node.declaration.callee;
                if (callee.type === 'Identifier' && path.node.declaration.arguments.length > 0) {
                    const component = path.node.declaration.arguments[0];
                    
                    if (component.type === 'Identifier') {
                        exportList.push(component.name);
                        isDefault = true;
                    }
                } else if(callee.type === 'CallExpression' && path.node.declaration.arguments.length > 0){
                    path.node.declaration.arguments.forEach(arg => {
                        if(arg.type==='Identifier' && arg.name){
                            exportList.push(arg.name);
                            isDefault = true;
                        }
                    })
                }}
              else {
              exportList.push('default');
              isDefault = false;
            }
        }
    });
    reactFile.exports = new Export(exportList,isDefault);
    
    return exportList;
}

export {extractExports}