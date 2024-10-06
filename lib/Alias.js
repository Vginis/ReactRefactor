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
        const file = reactFiles.find(fil => fil.filePath === component.filePath);
        if (!file || !file.exports.isDefault) return;
        const originalName = file.exports.exportList[0] || component.name;
        const aliases = [];
        const filepaths = [];

        reactFiles.forEach(reactFile => {
            if(reactFile===file) return;
            
            reactFile.importDeclarations.forEach(imp => {
                
                const normalizedImpSource = path.normalize(imp.source);
                const normalizedFilePath = path.normalize(file.filePath);

                const fileBaseName = path.basename(normalizedFilePath);
                const impBaseName = path.basename(normalizedImpSource);
                if(impBaseName === fileBaseName && imp.specifiers.length === 1 && imp.specifiers[0]!==originalName){
                    aliases.push(imp.specifiers[0]);
                    filepaths.push(reactFile.filePath);
                }
            });
        });
        if(aliases.length>0 && originalName===component.name) component.aliases = new Alias(originalName, aliases,filepaths);
    });
}

export {loadAliases}