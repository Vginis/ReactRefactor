class ImportSpecifier {
    constructor(original, local) {
        this.original = original;
        this.local = local;
    }
}

class ImportStatement {

    /**
     * 
     * @param {String} source The module part of the import
     * @param {List} importSpecifiers List of import specifiers (pairs of name and alias)
     * @param {String} filePath The actual path of the referenced module (relative path?)
     */
    constructor(source, importSpecifiers, filePath) {
        this.source = source;
        this.importSpecifiers = importSpecifiers;
        this.filePath = filePath;
        // should be initialized to a ReactFile object
        this.importedReactFile = null
    }
}

function extractImportDeclarations(reactFiles) {
    reactFiles.forEach(reactFile => {
        const { j, ast, filePath } = reactFile.loadFileAndAst();

        reactFile.importDeclarations = [
            ...parseStaticImports(j, ast, filePath),
            ...parseNextDynamicImports(j, ast, filePath)
        ];
        // resolve filePaths and imported react files
        // as a result each import statement would refer to a ReactFile
    });
}

// Parses normal `import ... from ...`
function parseStaticImports(j, ast, filePath) {
    const imports = [];
    ast.find(j.ImportDeclaration).forEach(path => {
        const source = path.node.source.value;
        const importSpecifiers = path.node.specifiers.map(specifier => parseImportSpecifier(specifier));

        const importStatement = new ImportStatement(source, importSpecifiers, filePath);
        imports.push(importStatement);
    });

    return imports;
}

// Parses Next.js `dynamic(() => import('module'))`
function parseNextDynamicImports(j, ast, filePath) {
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
                const importStatement = new ImportStatement(source, [importSpecifiers], filePath);
                imports.push(importStatement);
            }
        });

    return imports;
}

function parseImportSpecifier(specifier) {
    if (specifier.type === 'ImportSpecifier') {
        return new ImportSpecifier(specifier.imported.name, specifier.local.name);
    } else if (specifier.type === 'ImportDefaultSpecifier') {
        return new ImportSpecifier(specifier.local.name, specifier.local.name);
    } else if (specifier.type === 'ImportNamespaceSpecifier') {
        //Cases like import * as React from "react"
        const localName = (specifier?.local?.name) ? specifier.local.name : "*";
        return new ImportSpecifier('*', localName);
    }
    return null;
}

export { ImportStatement, extractImportDeclarations, ImportSpecifier }