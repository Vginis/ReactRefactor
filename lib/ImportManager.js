import { ImportStatement } from "./ImportStatement.js";
class ImportManager {
    constructor(j, ast) {
        this.j = j;
        this.ast = ast;
        this.isChanged = false;
    }

    addImport(source, imported, filepath) {
        let found = false;

        this.ast.find(this.j.ImportDeclaration).forEach(path => {
            if (path.node.source.value === source) {
                const hasSpecifier = path.node.specifiers.some(specifier => specifier.imported.name === imported);

                if (!hasSpecifier) {
                    path.node.specifiers.push(this.j.importSpecifier(this.j.identifier(imported)));
                    this.isChanged = true;
                }

                found = true;
            }
        });

        if (!found) {
            const newImport = new ImportStatement(source, [imported],filepath);
            this.ast.find(this.j.Program).get('body').value.unshift(
                this.j.importDeclaration(
                    newImport.specifiers.map(spec => this.j.importSpecifier(this.j.identifier(spec))),
                    this.j.literal(newImport.source)
                )
            );
            this.isChanged = true;
        }
    }
}

export {ImportManager}