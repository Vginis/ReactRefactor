class ImportStatement {
    constructor(source, specifiers, filePath) {
        this.source = source;
        this.specifiers = specifiers;
        this.filePath = filePath;
    }
}

function extractImportDeclarations(reactComponents) {
    reactComponents.forEach(reactComponent => {
        const { j, ast, filePath } = reactComponent.loadFileAndAst();

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

        reactComponent.importDeclarations = imports;
    });
}

export {ImportStatement,extractImportDeclarations}