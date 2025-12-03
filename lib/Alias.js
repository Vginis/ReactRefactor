import pathLib from 'node:path';
import { extractGlobalCliVariables } from './cli.js';

const { rootFile, fileType } = extractGlobalCliVariables();

class Alias {
    constructor(original, aliases = [], filepaths = []) {
        this.original = original;
        this.aliases = aliases;
        this.filepaths = filepaths;
    }
}

function loadAliasFromDefaultExports(reactFile, aliases, filepaths, file, componentName, reactComponents) {
    if (!file || !file.exports.isDefault) return;
    const originalName = file.exports.exportList[0] || componentName;

    const isPrometheus = file.filePath.includes("prometheus");
    reactFile.importDeclarations.forEach(imp => {

        const normalizedImpSource = pathLib.normalize(imp.source);
        const normalizedFilePath = pathLib.normalize(file.filePath);

        const fileBaseName = pathLib.basename(normalizedFilePath);
        const impBaseName = pathLib.basename(normalizedImpSource);
        if (isPrometheus) {
            if ((impBaseName === fileBaseName || impBaseName + "." + fileType === fileBaseName)
                && imp.importSpecifiers.length === 1 && imp.importSpecifiers[0].local !== originalName
                && !otherComponentWithAliasedNameExistsOnSameFile(reactComponents, imp.importSpecifiers[0].local, file.filePath)
            ) {
                aliases.push(imp.importSpecifiers[0]);
                filepaths.push(reactFile.filePath);
            }
        } else {
            if ((impBaseName === fileBaseName || impBaseName + "." + fileType === fileBaseName)
                && imp.importSpecifiers.length === 1 && imp.importSpecifiers[0].local !== originalName
            ) {
                aliases.push(imp.importSpecifiers[0]);
                filepaths.push(reactFile.filePath);
            }
        }
    });

}

//Assure that no other component with the aliased name exists on the same file(Prometheus case for PanelListContent)
function otherComponentWithAliasedNameExistsOnSameFile(reactComponents, aliasName, filePath) {
    return reactComponents.some(c => c.name === aliasName && c.reactFile.filePath === filePath);
}

function loadAliasAsStatement(reactFile, aliases, filepaths, component, file) {
    // FIXME: when component is exported with static export and renamed,
    // e.g. { Comment as PostComment} component name is Comment and 
    // its original name cannot be resolved since exportList contains PostComment
    // thus PostComment is not an alias of Comment and hierarchy is broken
    const originalName = file.exports.exportList.find(exp => exp === component.name);
    //const originalName = file.getExportedNameForComponent(component)
    reactFile.importDeclarations.forEach(imp => {
        imp.importSpecifiers.forEach(specifier => {
            const componentPath = pathLib.normalize(component.reactFile.filePath);
            const componentPathArray = componentPath.split("\\");
            const impSourcePath = pathLib.normalize(imp.source);

            if (originalName === specifier.original && specifier.local !== specifier.original
                && componentPathArray.includes(impSourcePath)) {
                aliases.push(specifier.local);
                filepaths.push(reactFile.filePath);
            }
        });
    });
}

function loadAliasesFromAggregateExports(reactFile, reactFiles, aliases, filepaths, j, component) {
    //Find aliases from exports like export { default as Button } from './Button';
    reactFile.ast.find(j.ExportNamedDeclaration).forEach(path => {
        const node = path.value;
        if (node.source && node.specifiers && node.specifiers.length > 0) {
            node.specifiers.forEach(specifier => {
                if (
                    specifier?.local?.name === 'default' &&
                    specifier?.exported?.name
                ) {
                    const aliasName = specifier.exported.name;
                    const normalizedExpSource = pathLib.normalize(node.source.value);
                    const normalizedFilePath = pathLib.normalize(component.reactFile.filePath);
                    const dirExport = getDefaultExportsFromDirectory(normalizedExpSource, reactFiles);
                    if ((normalizedFilePath.endsWith(normalizedExpSource) || (dirExport && dirExport[0] === component.name)) && aliasName !== component.name) {
                        aliases.push(aliasName);
                        filepaths.push(reactFile.filePath);
                    }
                }
            });
        }
    });
}

function getDefaultExportsFromDirectory(dirPath, reactFiles) {
    const matchedFiles = reactFiles.filter(f => {
        const splitedFilePathArray = f.filePath.split("\\");
        const splitedDirPathArray = dirPath.split("\\");
        return isSubsetArray(splitedDirPathArray, splitedFilePathArray) &&
            (f.filePath.endsWith("index.js") || f.filePath.endsWith("index.jsx") || f.filePath.endsWith("index.tsx"));
    }
    );

    return matchedFiles.length > 0 ? matchedFiles[0].exports.exportList : undefined;
}

function isSubsetArray(sub, full) {
    return sub.every(el => full.includes(el));
}

function loadAliasesFromFunctionCalls(reactFile, aliases, filepaths, j, componentName, reactFiles) {
    reactFile.ast.find(j.VariableDeclarator).forEach(path => {
        const node = path.value;

        if (node?.init?.type === "CallExpression" && node.init.arguments.length) {
            // Case 1: direct call like connect(Component)
            const firstArg = node.init.arguments[0];

            if (firstArg.type === "Identifier" && firstArg.name === componentName) {
                aliases.push(node.id.name);
                filepaths.push(reactFile.filePath);
            }

            // Case 2: nested call like connect(...)(Component)
            if (node.init.callee?.type === "CallExpression") {
                const innerArgs = node.init.arguments;

                if (
                    innerArgs.length &&
                    innerArgs[0].type === "Identifier" &&
                    innerArgs[0].name === componentName
                ) {
                    aliases.push(node.id.name);
                    filepaths.push(reactFile.filePath);
                }
            }
        }
    });

    // Handle `export default connect(...)(Component)` case
    reactFile.ast.find(j.ExportDefaultDeclaration).forEach(path => {
        const exportNode = path.value;
        if (
            exportNode.declaration?.type === "CallExpression" &&
            exportNode.declaration.callee?.type === "CallExpression"
        ) {
            const finalArg = exportNode.declaration.arguments[0];

            if (finalArg?.type === "Identifier" && finalArg.name === componentName) {
                // Check other parsed files to find who imports this one
                reactFiles.forEach(rf => {
                    rf.importDeclarations.forEach(imp => {
                        const matchesSource = (() => {
                            if (!imp.source) return false;

                            const importPath = imp.source;
                            const importerFileDir = pathLib.dirname(rf.filePath);
                            const resolvedImportPath = pathLib.resolve(importerFileDir, importPath);
                            const normalizedResolvedImport = removeExtension(pathLib.normalize(resolvedImportPath));
                            const normalizedReactFile = removeExtension(pathLib.normalize(pathLib.resolve(reactFile.filePath)));
                            return normalizedResolvedImport === normalizedReactFile;
                        })();
                        if (matchesSource && imp.importSpecifiers.length === 1) {
                            const alias = imp.importSpecifiers[0].local;
                            if (alias) {
                                aliases.push(alias);
                                filepaths.push(rf.filePath);
                            }
                        }
                    });
                });
            }
        }
    });
}

function removeExtension(path) {
    return path.replace(/\.(js|ts|jsx|tsx)$/, '');
}

function loadAliases(reactFiles, reactComponents) {
    //const j = resolveJscodeshiftParser(jscodeshift);
    reactComponents.forEach(component => {
        const file = component.reactFile;
        if (!file) return;

        const aliases = [];
        const filepaths = [];
        reactFiles.forEach(reactFile => {
            if (reactFile === file) return;

            if (file?.exports?.isDefault) {
                loadAliasFromDefaultExports(reactFile, aliases, filepaths, file, component.name, reactComponents);
            }

            loadAliasAsStatement(reactFile, aliases, filepaths, component, file);
            loadAliasesFromAggregateExports(reactFile, reactFiles, aliases, filepaths, reactFile.j, component)
            loadAliasesFromFunctionCalls(reactFile, aliases, filepaths, reactFile.j, component.name, reactFiles);
        });

        if (aliases.length > 0) {
            if (filepaths.includes(rootFile)) component.isInRootFile = true;
            component.aliases = new Alias(component.compositeKeyName, aliases, filepaths);
        }
    });
}
export { loadAliases, getDefaultExportsFromDirectory }