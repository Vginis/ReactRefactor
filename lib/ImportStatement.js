class ImportStatement {
    constructor(source, specifiers, filePath) {
        this.source = source;
        this.specifiers = specifiers;
        this.filePath = filePath;
    }
}

function extractImportDeclarations(reactFiles) {
    reactFiles.forEach(reactFile => {
        const { j, ast, filePath } = reactFile.loadFileAndAst();

        const imports = [];

        ast.find(j.ImportDeclaration).forEach(path => {
            const source = path.node.source.value;
            const specifiers = path.node.specifiers.map(specifier => {
                if (specifier.type === 'ImportSpecifier') {
                    return specifier.imported.name;
                } else if (specifier.type === 'ImportDefaultSpecifier') {
                    return specifier.local.name;
                } else if (specifier.type === 'ImportNamespaceSpecifier') {
                    return '*';
                }
            });

            const importStatement = new ImportStatement(source, specifiers, filePath);

            imports.push(importStatement);
        });

        reactFile.importDeclarations = imports;
    });
}

export {ImportStatement,extractImportDeclarations}