class ImportSpecifier {
    constructor(original, local, isDefault = false) {
        this.original = original;
        this.local = local;
        this.isDefault = isDefault
    }
}

class ImportStatement {

    /**
     * 
     * @param {String} source The module part of the import
     * @param {List} importSpecifiers List of import specifiers (pairs of name and alias)
     * @param {String} filePath ?unused
     */
    constructor(source, importSpecifiers, filePath, reactFile) {
        this.source = source;
        this.importSpecifiers = importSpecifiers;
        this.filePath = filePath;
        // the relative path w.r.t. project path of the imported module
        // in case of external modules it is just the module name
        this._relativeModulePath = null
        // the imported file that includes the imported declarations
        this.importedReactFile = null
        // the file containing the ImportStatement
        this.reactFile = reactFile
        this.isExternalModule = false
    }

    resolveReferencedModules(){
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
            let sourcePathSegments = this.source.split(/[\\\/]/)
            if (![".", ".."].includes(sourcePathSegments[0])){
                this.isExternalModule = true;
                return this.source;
            }

            // path segments of react file without the file name
            let reactFilePathSegments = [...this.reactFile.relativePathSegments]
            reactFilePathSegments.pop()

            let relativeModulePathSegments = [...reactFilePathSegments]
            for (let segment of sourcePathSegments) {
                if (segment === ".") continue;
                else if (segment === "..") {
                    relativeModulePathSegments.pop();
                } else {
                    relativeModulePathSegments.push(segment)
                }
            }
            this._relativeModulePath = relativeModulePathSegments.join("\\")
        }
        return this._relativeModulePath
    }
}

function extractImportDeclarations(reactFiles) {
    reactFiles.forEach(reactFile => {
        const { j, ast, filePath } = reactFile.loadFileAndAst();

        reactFile.importDeclarations = [
            ...parseStaticImports(j, ast, filePath, reactFile),
            ...parseNextDynamicImports(j, ast, filePath, reactFile)
        ];

        reactFile.importDeclarations.forEach(importStatement => {
            importStatement.resolveReferencedModules()
        })
        // resolve filePaths and imported react files
        // as a result each import statement would refer to a ReactFile
    });
}

// Parses normal `import ... from ...`
function parseStaticImports(j, ast, filePath, reactFile) {
    const imports = [];
    ast.find(j.ImportDeclaration).forEach(path => {
        const source = path.node.source.value;
        const importSpecifiers = path.node.specifiers.map(specifier => parseImportSpecifier(specifier));

        const importStatement = new ImportStatement(source, importSpecifiers, filePath, reactFile);
        imports.push(importStatement);
    });

    return imports;
}

// Parses Next.js `dynamic(() => import('module'))`
function parseNextDynamicImports(j, ast, filePath, reactFile) {
    const imports = [];

    ast.find(j.VariableDeclarator)
        .filter(path =>
            path.node.id.type === 'Identifier' &&
            path.node.init &&
            path.node.init.type === 'CallExpression' &&
            path.node.init.callee.type === 'Identifier' &&
            path.node.init.callee.name === 'dynamic' &&
            path.node.init.arguments.length > 0
        )
        .forEach(path => {
            const firstArg = path.node.init.arguments[0];

            // Check if the first argument is an ArrowFunctionExpression or FunctionExpression
            if (
                (firstArg.type === 'ArrowFunctionExpression' || firstArg.type === 'FunctionExpression') &&
                firstArg.body.type === 'ImportExpression'
            ) {
                const source = firstArg.body.source.value; // Extract module path
                const importSpecifiers = new ImportSpecifier(path.node.id.name, path.node.id.name);
                const importStatement = new ImportStatement(source, [importSpecifiers], filePath, reactFile);
                imports.push(importStatement);
            }
        });

    return imports;
}

function parseImportSpecifier(specifier) {
    if (specifier.type === 'ImportSpecifier') {
        return new ImportSpecifier(specifier.imported.name, specifier.local.name);
    } else if (specifier.type === 'ImportDefaultSpecifier') {
        return new ImportSpecifier(specifier.local.name, specifier.local.name, true);
    } else if (specifier.type === 'ImportNamespaceSpecifier') {
        //Cases like import * as React from "react"
        const localName = (specifier?.local?.name) ? specifier.local.name : "*";
        return new ImportSpecifier('*', localName);
    }
    return null;
}

export { ImportStatement, extractImportDeclarations, parseImportSpecifier, ImportSpecifier }