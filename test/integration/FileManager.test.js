import FileManager from '../../lib/FileManager.js'
import {
    getAllFiles,
    resolveIfProjectHasMultiplePages,
} from '../../lib/util.js';
import { loadReactFiles } from '../../lib/ReactFile.js';
import { getAbsolutePath, setProjectPath, setRootFile } from '../utils/test-utils.js';

describe("File manager", () => {

    test("should resolve file paths with extension", () => {

        const fileManager = loadFileManager("test//resources//e-library//src", "test//resources//e-library//src//app//layout.tsx");

        let reactFile = fileManager.getReactFile("components\\books\\BooksTable.tsx")
        expect(reactFile).toBeTruthy()

    });

    test("should resolve file paths without extension", () => {

        const fileManager = loadFileManager("test//resources//e-library//src", "test//resources//e-library//src//app//layout.tsx");

        let reactFile = fileManager.getReactFile("components\\books\\BooksTable")
        expect(reactFile).toBeTruthy()

    });

    test("should resolve file paths without extension in root dir", () => {

        const fileManager = loadFileManager("test//resources//atm-banking//src",
            "test//resources//atm-banking//src//main.tsx");

        let reactFile = fileManager.getReactFile("main")
        expect(reactFile).toBeTruthy()

        reactFile = fileManager.getReactFile("App")
        expect(reactFile).toBeTruthy()

    });



});

function loadFileManager(testProjectPath, rootFilePath) {
    setProjectPath(testProjectPath)
    setRootFile(rootFilePath)

    const allFiles = getAllFiles(globalThis.projectPath);
    const hasMultiplePages = resolveIfProjectHasMultiplePages(globalThis.projectPath);
    const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles, globalThis.rootFile);

    const fileManager = new FileManager(reactFiles)

    expect(fileManager.filePathToReactFileMap.size).toBe(reactFiles.length);

    return fileManager
}


