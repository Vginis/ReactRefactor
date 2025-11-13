//import { extractGlobalCliVariables } from './cli.js';
//import { resolveJscodeshiftParser } from './util.js';

//const { fileType } = extractGlobalCliVariables();
//import j from './Parser.js'

class Export {
    constructor(exportList, isDefault = false) {
        this.exportList = exportList;
        this.isDefault = isDefault;
    }
}

function extractExports(reactFile) {
    //const j = resolveJscodeshiftParser(fileType);
    let exportList = [];
    let isDefault = false;
    const j = reactFile.j;
    reactFile.ast.find(j.ExportNamedDeclaration).forEach(path => {
        const declaration = path.node.declaration;
        if (declaration) {
            if (declaration.id) {
                exportList.push(declaration.id.name);
            }
            else if (declaration.declarations) {
                declaration.declarations.forEach(declaration => {
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
        const declaration = path.node.declaration;
        if (declaration) {
            if (declaration.name) {
                exportList.push(declaration.name);
                isDefault = true;
            } else if ((declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') && declaration.id !== null) {
                exportList.push(declaration.id.name);
                isDefault = true;
            } else if ((declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') && declaration.id === null) {
                const fileParts = reactFile.filePath.split("\\");
                const fileName = fileParts.pop().split(".")[0]
                exportList.push(fileName);
                isDefault = true;
            } else if (declaration.type === 'CallExpression') {
                const callee = declaration.callee;
                if (callee.type === 'Identifier' && declaration.arguments.length > 0) {
                    const component = declaration.arguments[0];

                    if (component.type === 'Identifier') {
                        exportList.push(component.name);
                        isDefault = true;
                    }
                } else if (callee.type === 'CallExpression' && declaration.arguments.length > 0) {
                    declaration.arguments.forEach(arg => {
                        if (arg.type === 'Identifier' && arg.name) {
                            exportList.push(arg.name);
                            isDefault = true;
                        }
                    })
                }
            }
            else {
                exportList.push('default');
                isDefault = false;
            }
        }
    });
    reactFile.exports = new Export(exportList, isDefault);

    return exportList;
}

export { extractExports }