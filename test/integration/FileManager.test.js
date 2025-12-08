import { getFileManager } from '../utils/test-utils.js';

describe("FileManager relative module path resolution", () => {

    test("should handle relative specifiers", () => {

        const {fileManager} = getFileManager(
            "test//resources//e-library//src", 
            "test//resources//e-library//src//app//layout.tsx");

        let reactFile = fileManager.getReactFile("components\\books\\BooksTable.tsx")
        expect(reactFile).toBeTruthy()

        expectSpecifierToPathResolution("./BookCartModal.tsx", reactFile, "components\\books\\BookCartModal.tsx")
        expectSpecifierToPathResolution("./BookCartModal", reactFile, "components\\books\\BookCartModal")

        expectSpecifierToPathResolution("../common/LoadingSpinner.tsx", reactFile, "components\\common\\LoadingSpinner.tsx")
        expectSpecifierToPathResolution("../common/LoadingSpinner", reactFile, "components\\common\\LoadingSpinner")
    })



    function expectSpecifierToPathResolution(specifier, reactFile, expectedModulePath){
        let modulePath = globalThis.fileManager.getRelativeModulePath(specifier, reactFile)
        expect(modulePath).toBe(expectedModulePath)
        expect(globalThis.fileManager.getReactFile(modulePath)).toBeTruthy()
    }

})

describe("FileManager", () => {

    test("should resolve directory path to index file", () => {

        const {fileManager} = getFileManager(
            "test//resources//ecommerce-react//src", 
            "test//resources//ecommerce-react//src//App.jsx");

        let reactFile = fileManager.getReactFile("components\\basket")
        expect(reactFile).toBeTruthy()
        expect(reactFile.fileName).toBe("index.js")

        reactFile = fileManager.getReactFile("components\\common\\PriceRange")
        expect(reactFile).toBeTruthy()
        expect(reactFile.fileName).toBe("index.jsx")

        reactFile = fileManager.getReactFile("views\\auth\\forgot_password")
        expect(reactFile).toBeTruthy()
        expect(reactFile.fileName).toBe("index.jsx")
    })

    test("should resolve directory path to file with same name", () => {

    })

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



