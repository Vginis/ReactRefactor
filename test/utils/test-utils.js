import path from 'path';
import { loadReactFiles } from '../../lib/ReactFile.js';
import {
    getAllFiles,
    resolveIfProjectHasMultiplePages,
} from '../../lib/util.js';

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

export { setProjectPath, setRootFile, getAbsolutePath, getFileManager }