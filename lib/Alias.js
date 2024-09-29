import path from 'path';
class Alias{
    constructor(original, aliases=[],filepaths = []){
        this.original = original;
        this.aliases = aliases;
        this.filepaths = filepaths;
    }
}

function loadAliases(reactFiles,reactComponents){
        reactComponents.forEach(component => {
        const file = reactFiles.find(fil => fil.filePath === component.filepath);
        if (!file || !file.exports.isDefault) return;
        const originalName = file.exports.exportList[0] || component.name;
        const aliases = [];
        const filepaths = [];

        reactFiles.forEach(reactFile => {
            if(reactFile===file) return;
            
            reactFile.importDeclarations.forEach(imp => {
                const normalizedImpSource = path.normalize(imp.source);
                const normalizedFileName = path.normalize(file.name);
                if(normalizedFileName.includes(normalizedImpSource) && imp.specifiers.length === 1 && imp.specifiers[0]!==originalName){
                    aliases.push(imp.specifiers[0]);
                    filepaths.push(reactFile.filePath);
                }
            });
        });
        if(aliases.length>0) component.aliases = new Alias(originalName, aliases,filepaths);
    });
}

export {loadAliases}