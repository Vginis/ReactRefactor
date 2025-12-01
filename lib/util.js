import { PropDrilling } from './PropDrilling.js';
import * as path from 'node:path';
import * as fs from 'node:fs';
import jscodeshift from 'jscodeshift';
import { loadHierarchy, extractAllPaths } from './Hierarchy.js';
import { extractGlobalCliVariables } from './cli.js';

const { rootComponent } = extractGlobalCliVariables(); 

function getAllFiles(dirPath) {
    const stack = [dirPath];
    const allFiles = [];
    while (stack.length > 0) {
        const currentDir = stack.pop();
        const files = fs.readdirSync(currentDir);

        files.forEach(file => {
            const fullPath = path.join(currentDir, file);
            if(fullPath.includes("node_modules") || fullPath.includes(".next")){
              return;
            }
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                stack.push(fullPath);
            } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
                allFiles.push(fullPath);
            }
        });
    }
    return allFiles;
}

function resolveIfProjectHasMultiplePages(dirPath) {
  const rootFile = globalThis.rootFile
  const rootFiles = fs.readdirSync(dirPath);
  const pagesDir = rootFiles.find(rf => rf === "pages") || rootFiles.find(rf => rf === "views");

  return (pagesDir && !isLastDirectorySrc(rootFile));
}

function isLastDirectorySrc(path) {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 2] === "src";
}

function extractPathsAndHierarchies(reactFiles, fileRoot, reactComponents,isNextJsProject,isFirstIteration=true){
  let hierarchyTrees = [];
  let paths = [];
  const allRootComponents = reactComponents.filter(c => c.name === rootComponent)
  if(rootComponent && allRootComponents.length>1 && isFirstIteration){
     for (const rtComp of allRootComponents){
      const dirPath = path.dirname(rtComp.reactFile.filePath);
     
      const pagesDir = dirPath.includes("pages") || dirPath.includes("views");
      const {
        hierarchyTrees: childTrees,
        paths: childPaths
      } = extractPathsAndHierarchies(reactFiles, rtComp.reactFile.filePath,reactComponents,pagesDir && !isLastDirectorySrc(fileRoot),false);
       hierarchyTrees.push(...childTrees);
       paths.push(...childPaths);
     }
  } else if (isNextJsProject) {
      // Identify entry points (all files inside "pages/" or "app/")
      const nextJsEntryFiles = reactFiles.filter(file => {
          const normalizedPath = path.normalize(file.filePath);
          return normalizedPath.includes(path.normalize("pages/")) || 
                normalizedPath.includes(path.normalize("views/")) || 
                normalizedPath.includes(path.normalize("app/"));
      });

      console.log(`Detected ${nextJsEntryFiles.length} Next.js entry points.`);

      for (const entryFile of nextJsEntryFiles) {
          const roots = reactComponents
              .filter(comp => comp.reactFile.filePath === entryFile.filePath)
              .map(comp => comp.name);

          const root = reactComponents.find(comp => comp.name === roots[0])
            || reactComponents.find(comp => comp.name === entryFile.findMostNestedComponent(roots));

          if (root) {
              const hierarchyTree = loadHierarchy(root, reactComponents);
              hierarchyTrees.push(hierarchyTree);
              paths.push(...extractAllPaths(hierarchyTree));
          }
      }
  } else {
    // Standard React project (Single root file logic)
    let root;
    let roots;
    if(rootComponent?.includes(",")){
      roots = rootComponent.split(",");
      for(const r of roots){
        const rootComp = reactComponents.find(c =>c.name === r);
        const hierarchyTree = loadHierarchy(rootComp, reactComponents);
        hierarchyTrees.push(hierarchyTree);
        paths.push(...extractAllPaths(hierarchyTree));
      }
    } else if(rootComponent){
      root = reactComponents.find(c =>c.name === rootComponent);
    } else {
      const reactRootFile = reactFiles.find(reactF => reactF.filePath === fileRoot);
      const roots = reactComponents.filter(comp => comp.isInRootFile).map(comp => comp.name);
      root = reactComponents.find(comp => comp.name === reactRootFile.findMostNestedComponent(roots));
    }

    if(root){
      const hierarchyTree = loadHierarchy(root, reactComponents);
      hierarchyTrees.push(hierarchyTree);
      paths.push(...extractAllPaths(hierarchyTree));
    } else if(!roots) {
      throw new Error("Could not locate root component");
    }
     
  }

  return {hierarchyTrees, paths};
}

function getRootComponents(rootComponent){
  if(rootComponent?.includes(",")){
    return rootComponent.split(",");  
  }
  return [rootComponent];
}

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
          propMap = currentInstance.generatePropMapping();
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

  return (distinctArray.length === 0) ? distinctArray : filterLongestPropDrillings(distinctArray);
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
        (f.filePath.endsWith("index.js") || f.filePath.endsWith("index.jsx") || f.filePath.endsWith("index.tsx"))
    )||
    reactFiles.find(f => f.filePath.includes(normedPath) && 
        (f.filePath.endsWith("\\" + normedPath + ".js") || f.filePath.endsWith("\\" + normedPath + ".jsx") || f.filePath.endsWith("\\" + normedPath + ".tsx"))
    ) ||
    reactFiles.find(f => f.filePath.includes(normedPath) && 
        (f.filePath.endsWith("\\" + normedPath + "\\" + componentNameLocal.toLowerCase() + "\\" + componentNameLocal+ ".js") 
        || (f.filePath.endsWith("\\" + normedPath + "\\" + componentNameLocal.toLowerCase() + "\\" + componentNameLocal+ ".jsx")
        || (f.filePath.endsWith("\\" + normedPath + "\\" + componentNameLocal.toLowerCase() + "\\" + componentNameLocal+ ".tsx"))))
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

/**
 * Deprecated, do not use it.
 * import j from './Parser.js' instead
 */
function resolveJscodeshiftParser(fileType){
  if(fileType === "tsx"){
    return jscodeshift.withParser("tsx");
  }
  return jscodeshift;
}

function mapTSTypesWithTypes(){
  let typeMap = new Map();
  typeMap.set("TSStringKeyword","string");
  typeMap.set("Number","Number");
  return typeMap;
}

function findCommonEnding(paths) {
  if (paths.length === 0) return [];

  let commonSuffix = paths[0];
  for (let i = 1; i < paths.length; i++) {
      let currentPath = paths[i];
      let minLength = Math.min(commonSuffix.length, currentPath.length);
      let j = 1;

      while (j <= minLength && commonSuffix[commonSuffix.length - j] === currentPath[currentPath.length - j]) {
          j++;
      }

      commonSuffix = commonSuffix.slice(-j + 1);
  }

  return commonSuffix;
}

function cleanUnneccessaryParenthesis(j, node){
  const rawSource = j(node).toSource().trim();

  // Strip wrapping parentheses
  const cleanedSource = rawSource.startsWith('(') && rawSource.endsWith(')')
    ? rawSource.slice(1, -1).trim()
    : rawSource;
  
  // Parse back to AST
  return j(cleanedSource).nodes()[0];
}

export { getAllFiles,
          resolveIfProjectHasMultiplePages,
          extractPathsAndHierarchies,
          returnsJSX,
          filterLongestPropDrillings,
          removeDuplicateObjects,
          removeDuplicatePropPassings,
          groupPropDrillingsByPath,
          getDistinctPropDrillings,
          resolveImportPath,
          resolveJscodeshiftParser,
          mapTSTypesWithTypes,
          findCommonEnding,
          cleanUnneccessaryParenthesis };