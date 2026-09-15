import { getFileManager } from '../utils/test-utils.js';
import { getModulePathRelativeToProjectRoot } from '../../lib/FileManager.js';

function expectSpecifierToPathResolution(specifier, reactFile, expectedModulePath) {
    let modulePath = globalThis.fileManager.getRelativeModulePath(specifier, reactFile)
    expect(modulePath).toBe(expectedModulePath)
    expect(globalThis.fileManager.getReactFile(modulePath)).toBeTruthy()
}

describe("Module path with wildcard characters", () => {

    test("should resolve @ as first path segment", () => {
        const { fileManager } = getFileManager(
            "test//resources//ecommerce-react//src",
            "test//resources//ecommerce-react//src//App.jsx");

        let reactFile = fileManager.getReactFile("components\\product\\ProductItem.jsx")
        expect(reactFile).toBeTruthy()

        expectSpecifierToPathResolution("@/components/common", reactFile, "components\\common")
        
    })

})

describe("Module path alignment to project root", () => {

    test("should handle specifiers starting from project root", () => {

        const sourcePathSegments = "src/components/common/LoadingSpinner".split(/[\\\/]/)
        const projectPathSegments = "e-library/src".split(/[\\\/]/)

        const relativeModulePath = getModulePathRelativeToProjectRoot(sourcePathSegments, projectPathSegments)
        expect(relativeModulePath).toBe('components\\common\\LoadingSpinner')

    })

    test("should handle specifiers starting before project root", () => {

        const sourcePathSegments = "src/pages/common/LoadingSpinner".split(/[\\\/]/)
        const projectPathSegments = "e-library/src/pages".split(/[\\\/]/)

        const relativeModulePath = getModulePathRelativeToProjectRoot(sourcePathSegments, projectPathSegments)
        expect(relativeModulePath).toBe('common\\LoadingSpinner')

    })

    test("should handle specifiers with segments repeating in project root", () => {

        const sourcePathSegments = "src/pages/common/LoadingSpinner".split(/[\\\/]/)
        const projectPathSegments = "e-library/src/react/app/src/pages".split(/[\\\/]/)

        const relativeModulePath = getModulePathRelativeToProjectRoot(sourcePathSegments, projectPathSegments)
        expect(relativeModulePath).toBe('common\\LoadingSpinner')

    })


})

describe("FileManager relative module path resolution", () => {

    test("should handle relative specifiers to current file", () => {

        const { fileManager } = getFileManager(
            "test//resources//e-library//src",
            "test//resources//e-library//src//app//layout.tsx");

        let reactFile = fileManager.getReactFile("components\\books\\BooksTable.tsx")
        expect(reactFile).toBeTruthy()

        expectSpecifierToPathResolution("./BookCartModal.tsx", reactFile, "components\\books\\BookCartModal.tsx")
        expectSpecifierToPathResolution("./BookCartModal", reactFile, "components\\books\\BookCartModal")

        expectSpecifierToPathResolution("../common/LoadingSpinner.tsx", reactFile, "components\\common\\LoadingSpinner.tsx")
        expectSpecifierToPathResolution("../common/LoadingSpinner", reactFile, "components\\common\\LoadingSpinner")
    })

    test("should handle relative specifiers to project directory", () => {
        const { fileManager } = getFileManager(
            "test//resources//e-library//src/",
            "test//resources//e-library//src//app//layout.tsx");

        let reactFile = fileManager.getReactFile("components\\books\\BookCartModal.tsx")
        expect(reactFile).toBeTruthy()

        expectSpecifierToPathResolution("src/components/common/LoadingSpinner", reactFile, "components\\common\\LoadingSpinner")

    })



})

describe("FileManager", () => {

    test("should resolve directory path to index file", () => {

        const { fileManager } = getFileManager(
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

        const { fileManager } = getFileManager("test//resources//e-library//src", "test//resources//e-library//src//app//layout.tsx");

        let reactFile = fileManager.getReactFile("components\\books\\BooksTable.tsx")
        expect(reactFile).toBeTruthy()

    });

    test("should resolve file paths without extension", () => {

        const { fileManager } = getFileManager("test//resources//e-library//src", "test//resources//e-library//src//app//layout.tsx");

        let reactFile = fileManager.getReactFile("components\\books\\BooksTable")
        expect(reactFile).toBeTruthy()

    });

    test("should resolve file paths without extension in root dir", () => {

        const { fileManager } = getFileManager("test//resources//atm-banking//src",
            "test//resources//atm-banking//src//main.tsx");

        let reactFile = fileManager.getReactFile("main")
        expect(reactFile).toBeTruthy()

        reactFile = fileManager.getReactFile("App")
        expect(reactFile).toBeTruthy()

    });




});



