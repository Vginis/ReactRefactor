import path from 'path';
import { loadReactFiles } from '../../lib/ReactFile.js';
import {
    getAllFiles,
    extractPathsAndHierarchies2,
    resolveIfProjectHasMultiplePages,
} from '../../lib/util.js';

import { loadAliases2 } from '../../lib/Alias.js';

import {
    loadReactComponents,
    addParents
} from '../../lib/loadingFuncs.js';

/**
 * Sets the globalThis.projectPath variable on the basis of a path with // 
 * path segment separator
 * @param {string} relativePath 
 */
function setProjectPath(relativePath) {
    let pathSegments = relativePath.split("//").filter(s => s.trim() !== '')
    globalThis.projectPath = path.resolve(process.cwd(), ...pathSegments)
}

function setRootFile(relativePath) {
    let pathSegments = relativePath.split("//").filter(s => s.trim() !== '')
    globalThis.rootFile = path.resolve(process.cwd(), ...pathSegments)
}

/**
 * Returns an absolute path on the basis of a path with // as
 * path segment separator
 * @param {string} relativePath 
 */
function getAbsolutePath(relativePath) {
    let pathSegments = relativePath.split("//").filter(s => s.trim() !== '')
    return path.resolve(process.cwd(), ...pathSegments)
}

function getFileManager(testProjectPath, rootFilePath, rootComponent) {
    setProjectPath(testProjectPath)
    setRootFile(rootFilePath)
    globalThis.rootComponent = rootComponent

    const allFiles = getAllFiles(globalThis.projectPath);
    const hasMultiplePages = resolveIfProjectHasMultiplePages(globalThis.projectPath);
    const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles, globalThis.rootFile);

    const fileManager = globalThis.fileManager

    expect(fileManager.filePathToReactFileMap.size).toBe(reactFiles.length);

    return {fileManager, filteredJsxElements}
}

function analyzeComponentHierarchy(testProjectPath, rootFileName, rootComponent, expectedReactComponents, expectedJsxElements) {

    const { fileManager, filteredJsxElements } = getFileManager(testProjectPath, rootFileName, rootComponent);
    const reactFiles = fileManager.reactFiles;

    const reactComponents = loadReactComponents(reactFiles, filteredJsxElements)

    const hasMultiplePages = resolveIfProjectHasMultiplePages(testProjectPath);

    expect(filteredJsxElements.size).toBe(expectedJsxElements);
    expect(reactComponents.length).toBe(expectedReactComponents);

    loadAliases2(reactFiles);
    addParents();
    
    const { hierarchyTrees, paths } = extractPathsAndHierarchies2();

    return { hierarchyTrees, paths }
}

export { setProjectPath, setRootFile, getAbsolutePath, getFileManager, analyzeComponentHierarchy }