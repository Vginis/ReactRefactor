import path1 from 'path';
import { rootFile } from '../index.js';
import jscodeshift from 'jscodeshift';
class Alias{
    constructor(original, aliases=[],filepaths = []){
        this.original = original;
        this.aliases = aliases;
        this.filepaths = filepaths;
    }
}

function loadAliasesFromDefaultExports(reactFiles,reactComponents){
        reactComponents.forEach(component => {
        const file = component.reactFile;
        if (!file || !file.exports.isDefault) return;
        const originalName = file.exports.exportList[0] || component.name;
        const aliases = [];
        const filepaths = [];
        reactFiles.forEach(reactFile => {
            if(reactFile===file) return;
            
            reactFile.importDeclarations.forEach(imp => {
                const normalizedImpSource = path1.normalize(imp.source);
                const normalizedFilePath = path1.normalize(file.filePath);

                const fileBaseName = path1.basename(normalizedFilePath);
                const impBaseName = path1.basename(normalizedImpSource);
                //todo this checks here only for the first element of the array importSpecifiers.Check it.
                if(impBaseName === fileBaseName && imp.importSpecifiers.length === 1 && imp.importSpecifiers[0].local!==originalName){
                    aliases.push(imp.specifiers[0]);
                    filepaths.push(reactFile.filePath);
                }
            });
        });
        if(aliases.length>0 && originalName===component.name) {
            if(filepaths.includes(rootFile)) component.isInRootFile=true;
            component.aliases = new Alias(originalName, aliases,filepaths)};
    });
}

function loadAliasesAsStatement(reactFiles,reactComponents){
    reactComponents.forEach(component => {
        const file = component.reactFile;
        if (!file) return;
        const originalName = file.exports.exportList.find(exp => exp === component.name);
        const aliases = [];
        const filepaths = [];
        reactFiles.forEach(reactFile => {
            if(reactFile===file) return;
            reactFile.importDeclarations.forEach(imp => {
                imp.importSpecifiers.forEach(specifier => {
                    if (originalName===specifier.original && specifier.local!==specifier.original) {
                        aliases.push(specifier.local);
                        filepaths.push(reactFile.filePath);
                    }
            });
        });
    });
    if(aliases.length>0 && originalName===component.name){
        if(filepaths.includes(rootFile)) component.isInRootFile=true; 
        component.aliases = new Alias(originalName, aliases,filepaths);
    }
    })
}

function loadAliasesFromAggregateExports(reactFiles, reactComponents) {
    reactComponents.forEach(component => {
        if (!component.reactFile) return;
        const aliases = [];
        const filepaths = [];
        reactFiles.forEach(reactFile => {
            if (reactFile === component.reactFile) return;
            reactFile.ast.find(jscodeshift.ExportNamedDeclaration).forEach(path => {
                const node = path.value;
                if (node.source && node.specifiers && node.specifiers.length > 0) {
                    node.specifiers.forEach(specifier => {
                        if (
                            specifier.local &&
                            specifier.local.name === 'default' &&
                            specifier.exported &&
                            specifier.exported.name
                        ) {
                            const aliasName = specifier.exported.name;
                            const normalizedExpSource = path1.normalize(node.source.value);
                            const normalizedFilePath = path1.normalize(component.reactFile.filePath);
                            const dirExport = getDefaultExportsFromDirectory(normalizedExpSource,reactFiles);
                            if (normalizedFilePath.endsWith(normalizedExpSource) && aliasName !== component.name) {
                                aliases.push(aliasName);
                                filepaths.push(reactFile.filePath);
                            } else if (dirExport && dirExport[0]===component.name && aliasName !== component.name){
                                aliases.push(aliasName);
                                filepaths.push(reactFile.filePath);
                            }
                        }
                    });
                }
            });
        });
        if (aliases.length > 0) {
            if (filepaths.includes(rootFile)) component.isInRootFile = true;
            component.aliases = new Alias(component.name, aliases, filepaths);
        }
    });
}

function getDefaultExportsFromDirectory(dirPath, reactFiles) {
    const matchedFiles = reactFiles.filter(f => 
        f.filePath.includes(dirPath) && 
        (f.filePath.endsWith("index.js") || f.filePath.endsWith("index.jsx"))
    );

    return matchedFiles.length > 0 ? matchedFiles[0].exports.exportList : undefined;
}
function loadAliases(reactFiles,reactComponents){
    loadAliasesAsStatement(reactFiles,reactComponents);
    loadAliasesFromDefaultExports(reactFiles,reactComponents);
    loadAliasesFromAggregateExports(reactFiles,reactComponents);
}
export {loadAliases}