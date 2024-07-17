import path from 'path';
import * as fs from 'fs';
import jscodeshift from 'jscodeshift';
class ReactFile{
    constructor(name, components){
        this.name = name;
        this.components = components;
    }
}


function loadReactFiles(files){
    let reactFiles = [];
    const j = jscodeshift;
    files.forEach(file => {
        const filePath = path.join("../code/vite-project/src/", file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const ast = j(fileContent);
        let components = [];
    
        ast.find(j.FunctionDeclaration).forEach(path => {
        components.push(path.node.id.name);
      });
    reactFiles.push(new ReactFile(file, components));
  });
  return reactFiles;
}
export {ReactFile,loadReactFiles};