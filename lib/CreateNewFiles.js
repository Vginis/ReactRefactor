import * as fs from 'node:fs';
import path from 'node:path';
import { extractGlobalCliVariables } from './cli.js';

const { projectPath, fileType } = extractGlobalCliVariables();

function createNewContextFileJS(propsArray) {
    const {propsFormatted, props, capitalizedProps, contextName} = getPropsFormatting(propsArray);

    
    const content = `
        import React, { createContext } from 'react';

        export const ${contextName} = createContext();

        export const ${capitalizedProps}Provider = ({ ${props}, children }) => {
            return (
                <${contextName}.Provider value={{ ${propsFormatted} }}>
                    {children}
                </${contextName}.Provider>
            );
        };
        `;

    const filePath = path.join(projectPath, `${contextName}.${fileType}`);

    fs.writeFile(filePath, content, (err) => {
        if (err) throw err;
        console.log(`${contextName}.${fileType} has been created!`);
    });
    return capitalizedProps;
}

function createNewContextFileTS(propsArray, propTypeMapping){
    const {props, capitalizedProps,contextName} = getPropsFormatting(propsArray);
    const contextInterfaceName = capitalizedProps+"ContextInterface";
    const providerInterfacePropsName = capitalizedProps+"ProviderProps";

    const content = `
        import React, { createContext } from 'react';
        ${createInterface(contextInterfaceName,propTypeMapping,false)}

        ${createInterface(providerInterfacePropsName,propTypeMapping,true)}

        export const ${contextName} = createContext<${contextInterfaceName} | null>(null);

        export const ${capitalizedProps}Provider: React.FC<${providerInterfacePropsName}> = ({ ${props},children }) => {
            return (
                <${contextName}.Provider value={{ ${props} }}>
                {children}
                </${contextName}.Provider>
            );
        }
        `;

    
    const filePath = path.join(projectPath, `${contextName}.${fileType}`);

    fs.writeFile(filePath, content, (err) => {
        if (err) throw err;
        console.log(`${contextName}.${fileType} has been created!`);
    });
    return capitalizedProps;
}

function createInterface(interfaceName, propTypeMapping,addChildren){
    return `interface ${interfaceName}{
        ${putPropsInInterface(propTypeMapping,addChildren)}
        }`
}

function putPropsInInterface(propTypeMapping,addChildren){
    let propString = ``;
    for (const [key, value] of propTypeMapping) {
        propString += `${key}: ${value},`;
    }
    if(addChildren){
        propString += 'children: React.ReactNode';
    }
    return propString;
}

function getPropsFormatting(propsArray){
    const propsFormatted = propsArray.map(
        prop => `${Object.keys(prop)[0]}: ${Object.keys(prop)[0]}`
    ).join(', ');

    const props = propsArray.map(
        prop => `${Object.keys(prop)[0]}`
    ).join(', ');

    const capitalizedProps = propsArray.map(
        prop => Object.keys(prop)[0].charAt(0).toUpperCase() + Object.keys(prop)[0].slice(1)
    ).join('');

    const contextName = capitalizedProps+"Context"; 
    return {propsFormatted, props, capitalizedProps,contextName};
}

export { createNewContextFileJS, createNewContextFileTS };
