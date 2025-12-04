//import { extractGlobalCliVariables } from './cli.js';
//import { resolveJscodeshiftParser } from './util.js';

//const { fileType } = extractGlobalCliVariables();
//import j from './Parser.js'

class Export {
    constructor(exportList, exportedDeclarations, isDefault = false) {
        // could be a list of ExportedDeclation objects
        this.exportList = exportList;
        // each ExportedDeclaration should have its own isDefault flag
        this.isDefault = isDefault;
        this.exportedDeclarations = exportedDeclarations
    }
}

class ExportedDeclaration {
    constructor(name, exportedName, astNode, isDefault = false) {
        // the name of the declaration (function or class or sth else)
        this.name = name;
        // the exported name of the declaration, equals name if statement is not "export as"
        this.alias = exportedName;
        // the ast node (function, class or sth else) of the exported declaration
        this.astNode = astNode;
        // FIXME: as part of loadReactComponents, for each identified component, search
        // exported declarations of the file to match the statement that exports it
        // matching could be performed by comparing NodePath.value.start and NodePath.value.end of the ast fragments
        this.component = null;
        // marks whether the specific declaration is the default for the given file
        this.isDefault = isDefault;
    }
}

function extractExports(reactFile) {
    //const j = resolveJscodeshiftParser(fileType);
    let exportList = [];
    let exportedDeclarations = []
    let isDefault = false;
    const j = reactFile.j;


    function addExportedEntry(localName, exportedName, isDefault, identifierToAstMap) {
        exportList.push(exportedName);
        let astNode = reactFile.identifierToAstMap.get(localName)
        exportedDeclarations.push(new ExportedDeclaration(localName, exportedName, astNode, isDefault))
    }

    // TODO: resolve also ast nodes that are top level and correspond to the following types:
    // function declaration, class declaration or
    // variable/constant assignment whose right part is a call expression or function declaration/class declaration
    // associate each identified ast node to the relevant export (do not add exports correspondig to other types)

    reactFile.ast.find(j.ExportNamedDeclaration).forEach(path => {
        const declaration = path.node.declaration;
        if (declaration) {
            // function or class declaration
            if (declaration.id) {
                let localName = declaration.id.name
                addExportedEntry(localName, localName, false)
            }
            else if (declaration.declarations) {
                declaration.declarations.forEach(declaration => {
                    let localName = declaration.id.name
                    addExportedEntry(localName, localName, false)
                });
            }
        }
        else if (path.node.specifiers) {
            path.node.specifiers.forEach(specifier => {
                let localName = specifier.local.name;
                let exportedName = specifier.exported.name;
                addExportedEntry(localName, exportedName, false)
            });
        }
    });

    reactFile.ast.find(j.ExportDefaultDeclaration).forEach(path => {
        const declaration = path.node.declaration;
        if (declaration) {
            if (declaration.name) {
                let localName = declaration.name;
                addExportedEntry(localName, localName, true)
                isDefault = true;
            } else if ((declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') && declaration.id !== null) {
                let localName = declaration.id.name;
                addExportedEntry(localName, localName, true)
                isDefault = true;
            } else if ((declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') && declaration.id === null) {
                let fileName = reactFile.fileNameNoExtension
                addExportedEntry(fileName, fileName, true)
                isDefault = true;
            } else if (declaration.type === 'CallExpression') {
                const callee = declaration.callee;
                if (callee.type === 'Identifier' && declaration.arguments.length > 0) {
                    const component = declaration.arguments[0];

                    if (component.type === 'Identifier') {
                        addExportedEntry(component.name, component.name, true)
                        isDefault = true;
                    }
                } else if (callee.type === 'CallExpression' && declaration.arguments.length > 0) {
                    declaration.arguments.forEach(arg => {
                        if (arg.type === 'Identifier' && arg.name) {
                            addExportedEntry(arg.name, arg.name, true)
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
    reactFile.exports = new Export(exportList, exportedDeclarations, isDefault);

    return exportList;
}

export { extractExports }