import * as fs from 'fs';
import path from 'path';

function createNewContextFile(propsArray,dirPath) {
    const propsFormatted = propsArray.map(
        prop => `${prop}: ${prop}`
    ).join(', ');

    const capitalizedProps = propsArray.map(
        prop => prop.charAt(0).toUpperCase() + prop.slice(1)
    ).join('');

    const content = `
        import React, { createContext } from 'react';

        export const ${capitalizedProps}Context = createContext();

        export const ${capitalizedProps}Provider = ({ ${propsArray.join(', ')}, children }) => {
            return (
                <${capitalizedProps}Context.Provider value={{ ${propsFormatted} }}>
                    {children}
                </${capitalizedProps}Context.Provider>
            );
        };
        `;

    const filePath = path.join(path.dirname(dirPath), `${capitalizedProps}Context.js`);

    fs.writeFile(filePath, content, (err) => {
        if (err) throw err;
        console.log(`${capitalizedProps}Context.js has been created!`);
    });
}

export { createNewContextFile };
