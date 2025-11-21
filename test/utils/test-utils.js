import path from 'path';

/**
 * Sets the globalThis.projectPath variable on the basis of a path with // 
 * path segment separator
 * @param {string} relativePath 
 */
function setProjectPath(relativePath) {
    let pathSegments = relativePath.split("//").filter(s => s.trim() !== '')
    globalThis.projectPath = path.resolve(process.cwd(), ...pathSegments)
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
export { setProjectPath, getAbsolutePath }