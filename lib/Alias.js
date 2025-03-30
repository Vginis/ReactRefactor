import path1 from 'path';
import { rootFile,fileType } from '../index.js';
import jscodeshift from 'jscodeshift';
import { resolveJscodeshiftParser } from './util.js';
class Alias{
    constructor(original, aliases=[],filepaths = []){
        this.original = original;
        this.aliases = aliases;
        this.filepaths = filepaths;
    }
}

function loadAliasFromDefaultExports(reactFile,aliases,filepaths,file,componentName){
    if (!file || !file.exports.isDefault) return;
    const originalName = file.exports.exportList[0] || componentName;

    reactFile.importDeclarations.forEach(imp => {
        const normalizedImpSource = path1.normalize(imp.source);
        const normalizedFilePath = path1.normalize(file.filePath);

        const fileBaseName = path1.basename(normalizedFilePath);
        const impBaseName = path1.basename(normalizedImpSource);
        
        if((impBaseName === fileBaseName || impBaseName+"."+fileType === fileBaseName) 
            && imp.importSpecifiers.length === 1 && imp.importSpecifiers[0].local!==originalName){
            aliases.push(imp.importSpecifiers[0]);
            filepaths.push(reactFile.filePath);
        }
    });
            
}

function loadAliasAsStatement(reactFile,aliases,filepaths, componentName, file){
    const originalName = file.exports.exportList.find(exp => exp === componentName);
    reactFile.importDeclarations.forEach(imp => {
            imp.importSpecifiers.forEach(specifier => {
                if (originalName===specifier.original && specifier.local!==specifier.original) {
                    aliases.push(specifier.local);
                    filepaths.push(reactFile.filePath);
                }
        });
    });
}

function loadAliasesFromAggregateExports(reactFile,reactFiles,aliases,filepaths,j,component) {
    reactFile.ast.find(j.ExportNamedDeclaration).forEach(path => {
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
                    if ((normalizedFilePath.endsWith(normalizedExpSource) || (dirExport && dirExport[0]===component.name)) && aliasName !== component.name) {
                        aliases.push(aliasName);
                        filepaths.push(reactFile.filePath);
                    }
                }
            });
        }
    });
}

function getDefaultExportsFromDirectory(dirPath, reactFiles) {
    const matchedFiles = reactFiles.filter(f => 
        f.filePath.includes(dirPath) && 
        (f.filePath.endsWith("index.js") || f.filePath.endsWith("index.jsx") || f.filePath.endsWith("index.tsx"))
    );

    return matchedFiles.length > 0 ? matchedFiles[0].exports.exportList : undefined;
}

function loadAliasesFromFunctionCalls(reactFile,aliases,filepaths,j, componentName) {
    reactFile.ast.find(j.VariableDeclarator).forEach(path => {
        const node = path.value;
        
        if (node.init && node.init.type === "CallExpression" && node.init.arguments.length) {
            const firstArg = node.init.arguments[0];
            
            if (firstArg.type === "Identifier" && firstArg.name === componentName) {
                aliases.push(node.id.name);
                filepaths.push(reactFile.filePath);
            }
        }
    });
}

function loadAliases(reactFiles,reactComponents){
    const j = resolveJscodeshiftParser(jscodeshift);
    reactComponents.forEach(component => {
        const file = component.reactFile;
        if (!file) return;
        
        const aliases = [];
        const filepaths = [];
        reactFiles.forEach(reactFile => {
            if (reactFile === file) return;

            if (file && file.exports.isDefault){
                loadAliasFromDefaultExports(reactFile,aliases,filepaths,file,component.name);
            }
            loadAliasAsStatement(reactFile,aliases,filepaths, component.name, file);
            loadAliasesFromAggregateExports(reactFile,reactFiles,aliases,filepaths,j,component)
            loadAliasesFromFunctionCalls(reactFile,aliases,filepaths,j, component.name);
        });

        if (aliases.length > 0) {
            if (filepaths.includes(rootFile)) component.isInRootFile = true;
            component.aliases = new Alias(component.compositeKeyName, aliases, filepaths);
        }
    });
}
export {loadAliases, getDefaultExportsFromDirectory}