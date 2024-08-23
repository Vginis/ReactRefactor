import * as fs from 'fs';
import path from 'path';
import { projectPath } from '../index.js';
function createNewContextFile(prop){
    const prop1 = prop.charAt(0).toUpperCase() + prop.slice(1);
    const content = `import React, { createContext } from 'react';

    export const ${prop1}Context = createContext();
    
    export const ${prop1}Provider = ({ ${prop}, children }) => {
        return (
            <${prop1}Context.Provider value={${prop}}>
                {children}
            </${prop1}Context.Provider>
        );
    };
    `
    const filePath = path.join(projectPath, `${prop1}Context.js`);

    fs.writeFile(filePath, content, (err) => {
        if (err) throw err;
        console.log(`${prop1}Context.js has been created!`);
    })
}

export {createNewContextFile}