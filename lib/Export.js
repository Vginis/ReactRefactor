//import { extractGlobalCliVariables } from './cli.js';
//import { resolveJscodeshiftParser } from './util.js';

//const { fileType } = extractGlobalCliVariables();
//import j from './Parser.js'

// wrapper around an import statement
class ReexportStatement {

    constructor(source, filePath, reactFile) {
        this.source = source;
        this.exportSpecifiers = [];
        this.filePath = filePath;
        // the relative path w.r.t. project path of the imported module
        // in case of external modules it is just the module name
        this._relativeModulePath = null
        // the imported file that includes the imported declarations
        this.importedReactFile = null
        // the file containing the ImportStatement
        this.reactFile = reactFile
        this.isExternalModule = false
        // list of ExportedDeclaration objects corresponding to the export part of the statement
        this.exportedDeclarations = []
        this.resolveReferencedModules()
    }

    addExportedDeclaration(exportedName, localName, isDefault) {
        if (isDefault) this.isDefault = true;
        let astNode = this.importedReactFile.identifierToAstMap.get(localName);
        this.exportedDeclarations.push(new ExportedDeclaration(localName, exportedName, astNode, isDefault))
//        this.exportSpecifiers.push(new ExportSpecifier(exportedName, localName, isDefault))
    }

    // from constructor
    resolveReferencedModules() {
        const reactFile = globalThis.fileManager.getReactFile(this.relativeModulePath)
        this.importedReactFile = reactFile
    }

    /**
     * Converts a module path found in import statements of the form './module/path.js'
     * to the relative path of the file in the project.
     * It takes into account the relative path of the current file
    */
    get relativeModulePath() {
        if (!this._relativeModulePath) {
            let relativeModulePath = globalThis.fileManager.getRelativeModulePath(this.source, this.reactFile)
            if (!relativeModulePath) {
                this.isExternalModule = true;
                return this.source
            }
            this._relativeModulePath = relativeModulePath
        }
        return this._relativeModulePath
    }
}

// class ExportSpecifier {
//     constructor(exported, local, isDefault = false) {
//         this.exported = exported;
//         this.local = local;
//         this.isDefault = isDefault
//     }
// }

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

class Export {
    constructor(reactFile) {
        // could be a list of ExportedDeclation objects
        this.exportList = [];
        // each ExportedDeclaration should have its own isDefault flag
        this.isDefault = false;
        this.exportedDeclarations = [];
        // list of ImportStatement objects that represent reexport statements
        this.reexportStatements = [];
        this.reactFile = reactFile;
    }

    addExportedEntry(localName, exportedName, isDefault) {
        this.exportList.push(exportedName);
        if (isDefault) this.isDefault = true;
        let astNode = this.reactFile.identifierToAstMap.get(localName)
        this.exportedDeclarations.push(new ExportedDeclaration(localName, exportedName, astNode, isDefault))
    }

    /**
     * FIXME: Do we need this? 
     */
    addDefaultEntry() {
        this.exportList.push("default")
        this.isDefault = false;
        console.log(`Add default entry: ${this.reactFile.filePath}}`)
    }

}

function parseExportAllDeclaration(path, reactFile) {

}


function extractReexports(reactFiles) {
    reactFiles.forEach(reactFile => {
        reactFile.reexportDeclarations = parseReexportNamedDeclarations(reactFile)
    });
}

function parseReexportNamedDeclarations(reactFile) {

    const reexportDeclarations = []
    const { j, ast, filePath } = reactFile.loadFileAndAst();

    ast.find(j.ExportNamedDeclaration).forEach(path => {

        if (!path.node.source) { // ordinary named export
            return;
        }
        
        const reexport = new ReexportStatement(path.node.source.value, filePath, reactFile)
        path.node.specifiers.forEach(specifier => {
            if (specifier.type === 'ExportSpecifier') {
                const isDefault = specifier.local.name === "default"
                reexport.addExportedDeclaration(specifier.exported.name, specifier.local.name, isDefault)
            } else if (specifier.type === 'ExportNamespaceSpecifier') {
                reexport.addExportedDeclaration(specifier.exported.name, '*', false);
            }
        });
        reexportDeclarations.push(reexport)
    });

    return reexportDeclarations;
}


function extractExports(reactFile) {
    const j = reactFile.j;

    reactFile.exports = new Export(reactFile);

    reactFile.ast.find(j.ExportNamedDeclaration).forEach(path => {
        const declaration = path.node.declaration;
        // export declaration
        if (declaration) {
            // function or class declaration
            if (declaration.id) {
                let localName = declaration.id.name
                reactFile.exports.addExportedEntry(localName, localName, false)
            }
            else if (declaration.declarations) {
                declaration.declarations.forEach(declaration => {
                    let localName = declaration.id.name
                    reactFile.exports.addExportedEntry(localName, localName, false)
                });
            }
        }
        // plain named export
        else if (path.node.specifiers && !path.node.source) {
            path.node.specifiers.forEach(specifier => {
                let localName = specifier.local.name;
                let exportedName = specifier.exported.name;
                reactFile.exports.addExportedEntry(localName, exportedName, false)
            });
        }
    });

    reactFile.ast.find(j.ExportDefaultDeclaration).forEach(path => {
        const declaration = path.node.declaration;
        if (declaration) {
            if (declaration.name) {
                let localName = declaration.name;
                reactFile.exports.addExportedEntry(localName, localName, true)
            } else if ((declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') && declaration.id !== null) {
                let localName = declaration.id.name;
                reactFile.exports.addExportedEntry(localName, localName, true)
            } else if ((declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') && declaration.id === null) {
                let fileName = reactFile.fileNameNoExtension
                reactFile.exports.addExportedEntry(fileName, fileName, true)
            } else if (declaration.type === 'CallExpression') {
                const callee = declaration.callee;
                if (callee.type === 'Identifier' && declaration.arguments.length > 0) {
                    const component = declaration.arguments[0];

                    if (component.type === 'Identifier') {
                        reactFile.exports.addExportedEntry(component.name, component.name, true)
                    }
                } else if (callee.type === 'CallExpression' && declaration.arguments.length > 0) {
                    declaration.arguments.forEach(arg => {
                        if (arg.type === 'Identifier' && arg.name) {
                            reactFile.exports.addExportedEntry(arg.name, arg.name, true)
                        }
                    })
                }
            }
            else {
                // interface, object expression
                reactFile.exports.addDefaultEntry()
            }
        }
    });
}

export { extractExports, extractReexports }