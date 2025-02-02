import { ImportStatement } from "./ImportStatement.js";
class ImportManager {
    constructor(j, reactFile) {
        this.j = j;
        this.reactFile = reactFile;
        this.isChanged = false;
    }

    addImport(source, importSpecifiers, filePath, importAsDefault) {
        let found = false;
    
        const localImportNames = [];
        this.reactFile.importDeclarations.forEach(imp => {
            imp.importSpecifiers.forEach(impSpec => {
                localImportNames.push(impSpec.local);
            });
        });
    
        importSpecifiers.forEach(impSpec => {
            if (localImportNames.includes(impSpec.local)) found = true;
        });
    
        this.reactFile.ast.find(this.j.ImportDeclaration).forEach(path => {
            if (path.node.source.value === source) {
                importSpecifiers.forEach(importSpecifier => {
                    const hasSpecifier = path.node.specifiers.some(specifier => {
                        return (
                            specifier.imported &&
                            specifier.imported.name === importSpecifier.original
                        );
                    });
                    if (!hasSpecifier) {
                        path.node.specifiers.push(
                            importAsDefault
                                ? this.j.importDefaultSpecifier(
                                    this.j.identifier(importSpecifier.local)
                                  )
                                : this.j.importSpecifier(
                                    this.j.identifier(importSpecifier.original),
                                    this.j.identifier(importSpecifier.local)
                                  )
                        );
                        this.isChanged = true;
                    }
                });
                found = true;
            }
        });

        if (!found) {
            const newImport = new ImportStatement(source, importSpecifiers, filePath);
            this.reactFile.ast.find(this.j.Program).get('body').value.unshift(
                this.j.importDeclaration(
                    importAsDefault
                        ? [this.j.importDefaultSpecifier(this.j.identifier(importSpecifiers[0].local))]
                        : newImport.importSpecifiers.map(spec =>
                            this.j.importSpecifier(
                                this.j.identifier(spec.original),
                                this.j.identifier(spec.local)
                            )
                        ),
                    this.j.literal(newImport.source)
                )
            );
            this.isChanged = true;
        }
    }
}

export { ImportManager };