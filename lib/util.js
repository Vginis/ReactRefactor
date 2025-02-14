import { PropDrilling } from './PropDrilling.js';
import * as path from 'path';
import {getDefaultExportsFromDirectory} from './Alias.js';
import jscodeshift from 'jscodeshift';

function removeDuplicateObjects(arr) {
  return arr.filter((obj, index, self) =>
    index === self.findIndex((t) => JSON.stringify(t) === JSON.stringify(obj))
  );
}

function removeDuplicatePropPassings(arr) {
  return arr.filter((obj, index, self) =>
    index === self.findIndex((t) =>
      t.sourceComponent.name === obj.sourceComponent.name &&
      t.destComponent.name === obj.destComponent.name &&
      JSON.stringify(t.props) === JSON.stringify(obj.props)
    )
  );
}

//Filter Prop Drillings that their path is subset to another's path and they also have the same props 
function filterLongestPropDrillings(propDrillingInstances) {
  propDrillingInstances.sort((a, b) => b.path.length - a.path.length);

  const filteredInstances = [];

  let propMap;
  for (const currentInstance of propDrillingInstances) {
      const currentProps = Object.keys(currentInstance.properties[0])[0];
      const isSubset = filteredInstances.some(instance => {
          const instanceProps = Object.keys(instance.properties[0])[0];
          if(propMap && propMap[instanceProps] && propMap[currentProps]){
            const filteredInstanceProps = removeDuplicateObjects(propMap[instanceProps]);
            const filteredCurrentProps = removeDuplicateObjects(propMap[currentProps]);
            if(JSON.stringify(filteredCurrentProps) !== JSON.stringify(filteredInstanceProps)){
              return false;
            }  
          }
          return isPathSubset(currentInstance.path, instance.path);
      });
      if (!isSubset) {
          propMap = currentInstance.generatePropMapping();
          filteredInstances.push(currentInstance);
      }
  }   
  return filteredInstances;
}

function isPathSubset(path1, path2) {
  if (path1.length > path2.length) return false;

  const path1Components = path1.map(passing => passing.sourceComponent.name);
  path1Components.push(path1[path1.length-1].destComponent.name);
  const path2Components = path2.map(passing => passing.sourceComponent.name);
  path2Components.push(path2[path2.length-1].destComponent.name);

  let j = 0;
  for (let i = 0; i < path2Components.length; i++) {
      if (path1Components[j] === path2Components[i]) {
          j++;
      }
      if (j === path1Components.length) {
          return true;
      }
  }
  return false;
}

//Helper method that decides if an ast node includes returned jsx
function returnsJSX(path, j) {
  let returnedJSX = false;

  const containsJSX = (node) => {
    if (!node) return false;

    if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
      return true;
    }

    if (
      node.type === 'CallExpression' &&
      node.callee.object &&
      node.callee.object.name === 'React' &&
      node.callee.property.name === 'createElement'
    ) {
      return true;
    }

    if (node.type === 'ConditionalExpression') {
      return containsJSX(node.consequent) || containsJSX(node.alternate);
    }

    if (node.type === 'LogicalExpression') {
      return containsJSX(node.left) || containsJSX(node.right);
    }

    if (node.type === 'Identifier' && node.name === 'children') {
      return true;
    }

    return false;
  };

  j(path).find(j.ReturnStatement).forEach((returnPath) => {
    const argument = returnPath.node.argument;
    if (containsJSX(argument)) {
      returnedJSX = true;
    }
  });

  if (!returnedJSX && path.type === 'ArrowFunctionExpression') {
    const body = path.body;

    if (containsJSX(body)) {
      returnedJSX = true;
    }
  }

  return returnedJSX;
}

function groupPropDrillingsByPath(propDrillings) {
  const grouped = {};

  propDrillings.forEach((propDrilling) => {
    const pathArray = propDrilling.path.map(propPassing => propPassing.sourceComponent.name);
    pathArray.push(propDrilling.dest.name);
    const pathKey = pathArray.join('->');
    if (!grouped[pathKey]) {
      grouped[pathKey] = new PropDrilling([],propDrilling.path,propDrilling.source,propDrilling.dest);
    }
    grouped[pathKey].properties = grouped[pathKey].properties.concat(propDrilling.properties);
  });

  return Object.values(grouped);
}


function serializePropDrilling(propDrilling) {
  return JSON.stringify({
      properties: propDrilling.properties,
      path: propDrilling.path.map(p => ({
          source: p.sourceComponent.name,
          dest: p.destComponent.name,
          props: p.props
      })),
      source: propDrilling.source.name,
      dest: propDrilling.dest.name
  });
}
function getDistinctPropDrillings(propDrillings) {
  const uniqueSet = new Set();
  let distinctArray = [];

  for (const drilling of propDrillings) {
      const serialized = serializePropDrilling(drilling);
      if (!uniqueSet.has(serialized)) {
          uniqueSet.add(serialized);
          distinctArray.push(drilling);
      }
  }
  distinctArray = filterLongestPropDrillings(distinctArray);
  return distinctArray;
}

function resolveImportPath(reactFiles, importPath, currentPath,componentNameLocal) {
  const filePaths = reactFiles.map(f => f.filePath);
  importPath = importPath.replace(/\\/g,"/");
  let resolvedImportPath = null;
  // Handle relative imports (./ or ../)
  if (importPath.startsWith(".")) {
    let absoluteImportPath = path.resolve(path.dirname(currentPath), importPath);
    if (!absoluteImportPath.endsWith(".js") && currentPath.endsWith(".js")) {
        absoluteImportPath += ".js";
    } else if (!absoluteImportPath.endsWith(".jsx") && currentPath.endsWith(".jsx")) {
        absoluteImportPath += ".jsx";
    } else if (!absoluteImportPath.endsWith(".tsx") && currentPath.endsWith(".tsx")) {
      absoluteImportPath += ".tsx";
    } 
    absoluteImportPath = path.normalize(absoluteImportPath);
    
    resolvedImportPath = filePaths.find(f => {
      const pathName = f.split("..")[1];
      if(absoluteImportPath.includes(pathName)){
        return f;
      }
    }) || null;
  }

  if(resolvedImportPath !== null){
    return resolvedImportPath;
  }
  
  //Handle cases of default exports from directory
  const extractPath = (input) => {
    const match = input.match(/[a-zA-Z].*/);
    return match ? match[0] : '';
  };
  let normedPath = extractPath(importPath);
  normedPath = path.normalize(normedPath);
  const matchedFile = 
    reactFiles.find(f => f.filePath.includes(normedPath) && 
        (f.filePath.endsWith(normedPath + "\\" + componentNameLocal + ".js") || f.filePath.endsWith(normedPath + "\\" + componentNameLocal + ".jsx")
        || f.filePath.endsWith(normedPath + "\\" + componentNameLocal + ".tsx"))
    ) ||
    reactFiles.find(f => f.filePath.includes(normedPath) && 
        (f.filePath.endsWith("\\" + normedPath + ".js") || f.filePath.endsWith("\\" + normedPath + ".jsx") || f.filePath.endsWith("\\" + normedPath + ".jsx"))
    ) ||
    reactFiles.find(f => f.filePath.includes(normedPath) && 
        (f.filePath.endsWith("index.js") || f.filePath.endsWith("index.jsx") || f.filePath.endsWith("index.tsx"))
    );


  if(matchedFile){
    return matchedFile.filePath;
  }
  
  // Handle absolute imports (e.g., "src/components/Example3.js")
  for (const filePath of filePaths) {
    const normalizedFilePath = path.normalize(filePath).replace(/\\/g, "/");
    if (normalizedFilePath.includes(importPath)) {
        return filePath;
    }
  }

  return null; // If no match is found
}

function resolveJscodeshiftParser(fileType){
  if(fileType === "tsx"){
    return jscodeshift.withParser("tsx");
  }
  return jscodeshift;
}

export {returnsJSX,
        filterLongestPropDrillings,
        removeDuplicateObjects,
        removeDuplicatePropPassings,
        groupPropDrillingsByPath,
        getDistinctPropDrillings,
        resolveImportPath,
        resolveJscodeshiftParser};