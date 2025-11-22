
import { PATH_SEPARATOR } from "./ReactFile"

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
        // check if relativePath has no file extension
        if (!reactFile) {
            let pathSegments = relativePath.split(PATH_SEPARATOR)
            if (pathSegments.length === 0) {
                // not a valid relativePath should have at least one element
                return null
            }
            let fileName = pathSegments.pop()
            let parentDirectory = pathSegments.join(PATH_SEPARATOR)
            reactFile = this.getReactFileInDirectory(parentDirectory, fileName)
        }
        return reactFile
    }

    getReactFileInDirectory(directoryPath, fileName) {
        let fileNameParts = fileName.split(".")
        // the file path has extension and not react file is found
        if (fileNameParts.length > 1) {
            return null
        }
        let fileNameNoExtension = fileNameParts[0]
        

    }

}
