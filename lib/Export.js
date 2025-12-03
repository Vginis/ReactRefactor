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
        this.identifierToAstMap = null
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

function identifierToFunctionalDeclarationMap(reactFile) {
    let identifierToAstMap = new Map()
    const j = reactFile.j;

    reactFile.ast.find(j.FunctionDeclaration).forEach(path => {
        let functionDeclaration = path.node
        let name = functionDeclaration.id ? functionDeclaration.id.name : reactFile.fileNameNoExtension
        identifierToAstMap.set(name, functionDeclaration)
    })

    reactFile.ast.find(j.ClassDeclaration).forEach(path => {
        let classDeclaration = path.node
        let name = classDeclaration.id ? classDeclaration.id.name : reactFile.fileNameNoExtension
        identifierToAstMap.set(name, classDeclaration)
    })


    reactFile.ast.find(j.VariableDeclarator).forEach(path => {
        let name = path.node.id.name
        let init = path.node.init
        if (!init) return
        if (init.type === "FunctionExpression"
            || init.type === "ArrowFunctionExpression"
            || init.type === "ClassExpression") {
            identifierToAstMap.set(name, init)
        }
    })

    // also detect call expressions that receive as argument names already
    // identified as part of previous searches
    reactFile.ast.find(j.VariableDeclarator).forEach(path => {
        let name = path.node.id.name
        let init = path.node.init
        if (!init) return
        if (init.type === "CallExpression") {
            if (init.callee.type === "Identifier" ||
                init.callee.type === "CallExpression") {
                registerFunctionAliasesInCallArguments(init.arguments,
                    name, identifierToAstMap)
            }
        }
    })

    function registerFunctionAliasesInCallArguments(args, alias, identifierToAstMap) {
        for (let argNode of args) {
            if (argNode.type !== "Identifier") continue;
            let argName = argNode.name
            let astNode = identifierToAstMap.get(argName)
            if (astNode) {
                identifierToAstMap.set(alias, astNode)
            }
        }
    }

    return identifierToAstMap
}


function extractExports(reactFile) {
    //const j = resolveJscodeshiftParser(fileType);
    let exportList = [];
    let exportedDeclarations = []
    let isDefault = false;
    const j = reactFile.j;

    // map of local identifiers to ast nodes
    const identifierToAstMap = identifierToFunctionalDeclarationMap(reactFile)

    function addExportedEntry(localName, exportedName, isDefault) {
        exportList.push(exportedName);
        let astNode = identifierToAstMap.get(localName)
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
    reactFile.exports.identifierToAstMap = identifierToAstMap

    return exportList;
}

export { extractExports }