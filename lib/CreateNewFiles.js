import * as fs from 'fs';
import path from 'path';
import { projectPath } from '../index.js';
function createNewContextFile(propsArray) {
    const propsFormatted = propsArray.map(
        prop => `${Object.keys(prop)[0]}: ${Object.keys(prop)[0]}`
    ).join(', ');

    const props = propsArray.map(
        prop => `${Object.keys(prop)[0]}`
    ).join(', ');

    const capitalizedProps = propsArray.map(
        prop => Object.keys(prop)[0].charAt(0).toUpperCase() + Object.keys(prop)[0].slice(1)
    ).join('');

    const content = `
        import React, { createContext } from 'react';

        export const ${capitalizedProps}Context = createContext();

        export const ${capitalizedProps}Provider = ({ ${props}, children }) => {
            return (
                <${capitalizedProps}Context.Provider value={{ ${propsFormatted} }}>
                    {children}
                </${capitalizedProps}Context.Provider>
            );
        };
        `;

    const filePath = path.join(projectPath, `${capitalizedProps}Context.js`);

    fs.writeFile(filePath, content, (err) => {
        if (err) throw err;
        console.log(`${capitalizedProps}Context.js has been created!`);
    });
}

export { createNewContextFile };
