class ImportSpecifier {
    constructor(original, local) {
        this.original = original;
        this.local = local; 
    }
}

class ImportStatement {
    constructor(source,importSpecifiers, filePath) {
        this.source = source;
        this.importSpecifiers = importSpecifiers;
        this.filePath = filePath;
    }
}

function extractImportDeclarations(reactFiles) {
    reactFiles.forEach(reactFile => {
        const { j, ast, filePath } = reactFile.loadFileAndAst();

        const imports = [];

        ast.find(j.ImportDeclaration).forEach(path => {
            const source = path.node.source.value;
            const importSpecifiers = path.node.specifiers.map(specifier => {
                if (specifier.type === 'ImportSpecifier') {
                    return new ImportSpecifier(specifier.imported.name, specifier.local.name);
                } else if (specifier.type === 'ImportDefaultSpecifier') {
                    return new ImportSpecifier(specifier.local.name, specifier.local.name); // Default imports
                } else if (specifier.type === 'ImportNamespaceSpecifier') {
                    return new ImportSpecifier('*', '*'); // Namespace imports
                }
            });
            const importStatement = new ImportStatement(source, importSpecifiers, filePath);
            imports.push(importStatement);
        });

        reactFile.importDeclarations = imports;
    });
}


export {ImportStatement,extractImportDeclarations,ImportSpecifier}