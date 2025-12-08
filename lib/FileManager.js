
import assert from "assert"
import { PATH_SEPARATOR } from "./ReactFile.js"

export default class FileManager {

    constructor(reactFiles) {
        this.reactFiles = reactFiles
        this.filePathToReactFileMap = new Map()
        this.directoryToReactFileContents = new Map()

        for (let reactFile of this.reactFiles) {
            this.filePathToReactFileMap.set(reactFile.relativePath, reactFile)
            let dirContent = this.directoryToReactFileContents.get(reactFile.relativeParentDirectoryPath)
            if (dirContent !== undefined) {
                dirContent.push(reactFile)
            } else {
                dirContent = [reactFile]
                this.directoryToReactFileContents.set(reactFile.relativeParentDirectoryPath, dirContent)
            }
        }
    }

    /**
     * Returns list of ReactFile objects that are contained in the given directory
     * @param {string} relativePath directory with path segments separated by PATH_SEPARATOR
     */
    getDirectoryContent(relativePath) {

    }

    /**
     * Returns ReactFile object corresponding to the given path
     * @param {string} relativePath directory with path segments separated by PATH_SEPARATOR
     * The path includes the part after the projectPath
     */
    getReactFile(relativePath) {
        let reactFile = this.filePathToReactFileMap.get(relativePath)
        // normal case
        if (reactFile) return reactFile;

        let pathSegments = relativePath.split(PATH_SEPARATOR)
        if (pathSegments.length === 0) {
            // not a valid relativePath should have at least one element
            return null
        }

        // check if relativePath corresponds to a directory
        const dirContents = this.directoryToReactFileContents.get(relativePath)
        if (dirContents && dirContents.length > 0) {
            let reactFile = this.getReactFileInDirectory(relativePath, "index")
            if (reactFile) return reactFile;

            // try with the last segment
            reactFile = this.getReactFileInDirectory(relativePath, pathSegments[pathSegments.length - 1])
            if (reactFile) return reactFile;
        }

        let fileName = pathSegments.pop()
        let parentDirectory = pathSegments.join(PATH_SEPARATOR)
        reactFile = this.getReactFileInDirectory(parentDirectory, fileName)
        return reactFile;
    }

/**
 * @param {string} directoryPath A relative directory path w.r.t. project path
 * Path segments are separated with PATH_SEPARATOR
 * @param {string} fileName A plain file name without path segments.
 * The fileName may not have an extension.
 * @returns A react file that matches the file name 
 */
getReactFileInDirectory(directoryPath, fileName) {

    const fileWithExtension = hasFileExtension(fileName)
    const dirContents = this.directoryToReactFileContents.get(directoryPath)

    if (!dirContents || dirContents.length === 0) {
        return null;
    }

    const foundFiles = dirContents.filter(reactFile => {
        return (fileWithExtension && reactFile.fileName === fileName) ||
            (!fileWithExtension && reactFile.fileNameNoExtension === fileName)
    })

    assert(foundFiles.length <= 1)

    if (foundFiles.length === 1) return foundFiles[0]

    return null;

}

/**
 * 
 * @param {string} source the source part of an import/reexport statement
 * @param {ReactFile} reactFile the declaring reactFile
 * @returns A relative path to the project using \\ as path segment separator
 */
getRelativeModulePath(source, reactFile) {
    let sourcePathSegments = source.split(/[\\\/]/)
    if (![".", ".."].includes(sourcePathSegments[0])) {
        return null
    }

    // path segments of react file without the file name
    let reactFilePathSegments = [...reactFile.relativePathSegments]
    reactFilePathSegments.pop()

    let relativeModulePathSegments = [...reactFilePathSegments]
    for (let segment of sourcePathSegments) {
        if (segment === ".") continue;
        else if (segment === "..") {
            relativeModulePathSegments.pop();
        } else {
            relativeModulePathSegments.push(segment)
        }
    }
    return relativeModulePathSegments.join("\\")
}

}

function hasFileExtension(filePath) {
    const fileParts = filePath.split(".")
    return fileParts.length > 1
}
