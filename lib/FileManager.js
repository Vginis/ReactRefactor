
import assert from "assert"
import { PATH_SEPARATOR } from "./ReactFile.js"
import { extractGlobalCliVariables } from "./cli.js"

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

        const { projectPath } = extractGlobalCliVariables()
        this.projectPath = projectPath
        this.projectPathSegments = projectPath.split(/[\\\/]/)
        const lastSegment = this.projectPathSegments[this.projectPathSegments.length - 1].trim()
        if (lastSegment === "") {
            this.projectPathSegments.pop()
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

        // if (sourcePathSegments[0].startsWith("@")){
        //     console.log("Aliased source:", source)
        // }

        if (sourcePathSegments.length == 1) {
            return null;
        }

        if (sourcePathSegments[0].startsWith("@")) {
            return getModulePathFromDirectoryAlias(sourcePathSegments, null)
        }

        if ([".", ".."].includes(sourcePathSegments[0])) {
            return getModulePathRelativeToCurrentFile(
                sourcePathSegments,
                reactFile.relativePathSegments)
        }

        return getModulePathRelativeToProjectRoot(sourcePathSegments, this.projectPathSegments);
    }

}

function getModulePathRelativeToProjectRoot(sourcePathSegments, projectPathSegments) {

    let alignmentPosition = projectPathSegments.indexOf(sourcePathSegments[0])
    let alignedSegments = -1

    while (alignmentPosition < projectPathSegments.length && alignmentPosition != -1) {
        alignedSegments = getAlignedSegments(alignmentPosition, projectPathSegments, sourcePathSegments);
        alignmentPosition = projectPathSegments.indexOf(sourcePathSegments[0], alignmentPosition + 1)
    }

    if (alignedSegments !== -1) {
        sourcePathSegments.splice(0, alignedSegments)
    }

    return sourcePathSegments.join(PATH_SEPARATOR)

    function getAlignedSegments(startPosition, projectPathSegments, sourcePathSegments) {

        let currentPosition = startPosition
        let i = 0
        while (currentPosition < projectPathSegments.length) {
            if (projectPathSegments[currentPosition] === sourcePathSegments[i]) {
                currentPosition++;
                i++;
            } else {
                break;
            }
        }

        if (currentPosition == projectPathSegments.length) { // aligned to the end of projectPath
            // equal to aligned segments
            return i;
        }

        return -1;
    }
}



function getModulePathFromDirectoryAlias(sourcePathSegments, directoryAliasesMap) {
    // TBD
    return null;
}

function getModulePathRelativeToCurrentFile(sourcePathSegments, currentFilePathSegments) {
    let reactFilePathSegments = [...currentFilePathSegments]
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

function hasFileExtension(filePath) {
    const fileParts = filePath.split(".")
    return fileParts.length > 1
}

export { getModulePathRelativeToProjectRoot }