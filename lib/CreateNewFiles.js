import * as fs from 'fs';
import path from 'path';
function createNewContextFile(prop){
    const content = `import React, { createContext } from 'react';

    export const ${prop}Context = createContext();
    
    export const ${prop}Provider = ({ ${prop}, children }) => {
        return (
            <${prop}Context.Provider ${prop}={${prop}}>
                {children}
            </${prop}Context.Provider>
        );
    };
    `
    const filePath = path.join('../code/vite-project/src/', `${prop}Context.js`);

    fs.writeFile(filePath, content, (err) => {
        if (err) throw err;
        console.log(`${prop}Context.js has been created!`);
    })
}

export {createNewContextFile}