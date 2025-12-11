import exp from 'constants';
import { extractImportStatements } from '../../lib/ImportStatement.js';
import { getFileManager} from '../utils/test-utils.js'

describe("ImportStatement module", () => {

    test("should resolve import sources relative to project directory", () => {
        
        const {fileManager} = getFileManager("test//resources//e-library//src", 
                                    "test//resources//e-library//src//app//layout.jsx")

        
        let reactFile = fileManager.getReactFile("components\\books\\BookCartModal.tsx")
        
        expect(reactFile.relativePath).toBe("components\\books\\BookCartModal.tsx")

        expect(reactFile.importStatements.length).toBe(7)

        let projRelativeImport = reactFile.importStatements[5]
        expect(projRelativeImport.relativeModulePath).toBe("components\\common\\LoadingSpinner")
        expect(projRelativeImport.importedReactFile).toBeTruthy()
        expect(projRelativeImport.importedReactFile.fileName).toBe("LoadingSpinner.tsx")

    });

    test("should identify static imports", () => {

        const {fileManager} = getFileManager('test//resources//social-net//src', 
                                "test//resources//social-net//src//App.jsx")

        let reactFile = fileManager.getReactFile("Feed.jsx")

        expect(reactFile.relativePath).toBe("Feed.jsx")

        expect(reactFile.importStatements.length).toBe(2)

        const importFromPost = reactFile.importStatements[0];
        expect(importFromPost.importSpecifiers.length).toBe(2)
        expect(importFromPost.importedReactFile).toBeTruthy()
        expect(importFromPost.importedReactFile.fileName).toBe("Post.jsx")

        // expect(reactFile.importStatements[1].importSpecifiers.length).toBe(1)
        // expect(reactFile.importStatements[1].importedReactFile).toBe(importFromPost.importedReactFile)

        const importFromComponents = reactFile.importStatements[1]
        expect(importFromComponents.importSpecifiers.length).toBe(1)
        expect(importFromComponents.importedReactFile).toBeTruthy()
        expect(importFromComponents.importedReactFile.fileName).toBe("components.jsx")

        let defaultSpecifier = importFromPost.importSpecifiers[0]
        // should resolve to the exported component name
        expect(defaultSpecifier.original).toBe("MyPost")
        expect(defaultSpecifier.isDefault).toBe(true)
    });

    test("should resolve import sources relative to current module", () => {
        
        const {fileManager} = getFileManager("test//resources//e-library//src", 
                                    "test//resources//e-library//src//app//layout.jsx")

        
        let reactFile = fileManager.getReactFile("components\\cart\\CartModal.tsx")
        
        expect(reactFile.relativePath).toBe("components\\cart\\CartModal.tsx")

        expect(reactFile.importStatements.length).toBe(10)

        let importInOuterFolder = reactFile.importStatements[1]
        expect(importInOuterFolder.relativeModulePath).toBe("components\\books\\BooksTable")
        expect(importInOuterFolder.importedReactFile.fileName).toBe("BooksTable.tsx")

        let importInCurrentFolder = reactFile.importStatements[4]
        expect(importInCurrentFolder.relativeModulePath).toBe("components\\cart\\CartBookModal")
        expect(importInCurrentFolder.importedReactFile).toBeTruthy()
        expect(importInCurrentFolder.importedReactFile.fileName).toBe("CartBookModal.tsx")


    });

    test("should resolve imported external module paths", () => {
        
        const {fileManager} = getFileManager("test//resources//e-library//src", 
                                    "test//resources//e-library//src//app//layout.jsx")

        
        let reactFile = fileManager.getReactFile("components\\cart\\CartModal.tsx")

        expect(reactFile.relativePath).toBe("components\\cart\\CartModal.tsx")

        extractImportStatements([reactFile]);

        expect(reactFile.importStatements.length).toBe(10)
        
        let externalModuleImport = reactFile.importStatements[3]
        expect(externalModuleImport.relativeModulePath).toBe("react-toastify")
        expect(externalModuleImport.isExternalModule).toBeTruthy()
        expect(externalModuleImport.importedReactFile).toBeFalsy()

        let prefixedModuleImport = reactFile.importStatements[2]
        expect(prefixedModuleImport.relativeModulePath).toBe("@/services/cartService")
        expect(prefixedModuleImport.isExternalModule).toBeTruthy()

    });

});





