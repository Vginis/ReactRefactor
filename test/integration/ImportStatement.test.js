import exp from 'constants';
import { extractImportDeclarations } from '../../lib/ImportStatement.js';
import { getFileManager} from '../utils/test-utils.js'

describe("ImportStatement module", () => {

    test("should identify static imports", () => {

        const {fileManager} = getFileManager('test//resources//social-net//src', "test//resources//social-net//src//App.jsx")

        let reactFile = fileManager.getReactFile("Feed.jsx")

        expect(reactFile.relativePath).toBe("Feed.jsx")

        expect(reactFile.importDeclarations.length).toBe(3)

        const importFromPost = reactFile.importDeclarations[0];
        expect(importFromPost.importSpecifiers.length).toBe(1)
        expect(importFromPost.importedReactFile).toBeTruthy()
        expect(importFromPost.importedReactFile.fileName).toBe("Post.jsx")

        expect(reactFile.importDeclarations[1].importSpecifiers.length).toBe(1)
        expect(reactFile.importDeclarations[1].importedReactFile).toBe(importFromPost.importedReactFile)

        const importFromComponents = reactFile.importDeclarations[2]
        expect(importFromComponents.importSpecifiers.length).toBe(3)
        expect(importFromComponents.importedReactFile).toBeTruthy()
        expect(importFromComponents.importedReactFile.fileName).toBe("components.jsx")

        let defaultSpecifier = importFromPost.importSpecifiers[0]
        // should resolve to the exported component name
        expect(defaultSpecifier.original).toBe("default")
    });

    test("should resolve imported inner module paths", () => {
        
        const {fileManager} = getFileManager("test//resources//e-library//src", 
                                    "test//resources//e-library//src//app//layout.jsx")

        
        let reactFile = fileManager.getReactFile("components\\cart\\CartModal.tsx")
        
        expect(reactFile.relativePath).toBe("components\\cart\\CartModal.tsx")

        expect(reactFile.importDeclarations.length).toBe(10)

        let importInOuterFolder = reactFile.importDeclarations[1]
        expect(importInOuterFolder.relativeModulePath).toBe("components\\books\\BooksTable")
        expect(importInOuterFolder.importedReactFile.fileName).toBe("BooksTable.tsx")

        let importInCurrentFolder = reactFile.importDeclarations[4]
        expect(importInCurrentFolder.relativeModulePath).toBe("components\\cart\\CartBookModal")
        expect(importInCurrentFolder.importedReactFile).toBeTruthy()
        expect(importInCurrentFolder.importedReactFile.fileName).toBe("CartBookModal.tsx")


    });

    test("should resolve imported external module paths", () => {
        
        const {fileManager} = getFileManager("test//resources//e-library//src", 
                                    "test//resources//e-library//src//app//layout.jsx")

        
        let reactFile = fileManager.getReactFile("components\\cart\\CartModal.tsx")

        expect(reactFile.relativePath).toBe("components\\cart\\CartModal.tsx")

        extractImportDeclarations([reactFile]);

        expect(reactFile.importDeclarations.length).toBe(10)
        
        let externalModuleImport = reactFile.importDeclarations[3]
        expect(externalModuleImport.relativeModulePath).toBe("react-toastify")
        expect(externalModuleImport.isExternalModule).toBeTruthy()
        expect(externalModuleImport.importedReactFile).toBeFalsy()

        let prefixedModuleImport = reactFile.importDeclarations[2]
        expect(prefixedModuleImport.relativeModulePath).toBe("@/services/cartService")
        expect(prefixedModuleImport.isExternalModule).toBeTruthy()

    });

});





