import { getFileManager } from '../utils/test-utils.js';

describe("File manager", () => {

    test("should resolve file paths with extension", () => {

        const {fileManager} = getFileManager("test//resources//e-library//src", "test//resources//e-library//src//app//layout.tsx");

        let reactFile = fileManager.getReactFile("components\\books\\BooksTable.tsx")
        expect(reactFile).toBeTruthy()

    });

    test("should resolve file paths without extension", () => {

        const {fileManager} = getFileManager("test//resources//e-library//src", "test//resources//e-library//src//app//layout.tsx");

        let reactFile = fileManager.getReactFile("components\\books\\BooksTable")
        expect(reactFile).toBeTruthy()

    });

    test("should resolve file paths without extension in root dir", () => {

        const {fileManager} = getFileManager("test//resources//atm-banking//src",
            "test//resources//atm-banking//src//main.tsx");

        let reactFile = fileManager.getReactFile("main")
        expect(reactFile).toBeTruthy()

        reactFile = fileManager.getReactFile("App")
        expect(reactFile).toBeTruthy()

    });



});



