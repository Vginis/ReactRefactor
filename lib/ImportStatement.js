class ImportSpecifier {
    constructor(original, local) {
        this.original = original;
        this.local = local; 
    }
}

class ImportStatement {
    constructor(source, specifiers, filePath) {
        this.source = source;
        this.specifiers = specifiers; 
        this.importSpecifiers = []; //todo refactoring: Remoeve the specifiers field and keep only the importSpecifiers 
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

            path.node.specifiers.forEach(specifier => {
                if (specifier.type === 'ImportSpecifier') {
                    importStatement.importSpecifiers.push(new ImportSpecifier(specifier.imported.name, specifier.local.name));
                } else if (specifier.type === 'ImportDefaultSpecifier') {
                    importStatement.importSpecifiers.push(new ImportSpecifier(specifier.local.name, specifier.local.name)); // Default imports
                }
            });

            imports.push(importStatement);
        });

        reactFile.importDeclarations = imports;
    });
}


export {ImportStatement,extractImportDeclarations}