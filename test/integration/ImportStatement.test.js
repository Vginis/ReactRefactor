import { extractImportDeclarations } from '../../lib/ImportStatement.js';
import { getFileManager} from '../utils/test-utils.js'

describe("ImportStatement module", () => {

    test("should identify static imports", () => {

        const fileManager = getFileManager('test//resources//social-net//src', "test//resources//social-net//src//App.jsx")

        let reactFile = fileManager.getReactFile("Feed.jsx")

        expect(reactFile.relativePath).toBe("Feed.jsx")

        expect(reactFile.importDeclarations.length).toBe(3)
        expect(reactFile.importDeclarations[0].importSpecifiers.length).toBe(1)
        expect(reactFile.importDeclarations[1].importSpecifiers.length).toBe(1)
        expect(reactFile.importDeclarations[2].importSpecifiers.length).toBe(3)

        let defaultSpecifier = reactFile.importDeclarations[0].importSpecifiers[0]
        // should resolve to the exported component name
        expect(defaultSpecifier.original).toBe("default")
    });

    test("should resolve imported inner module paths", () => {
        
        const fileManager = getFileManager("test//resources//e-library//src", 
                                    "test//resources//e-library//src//app//layout.jsx")

        
        let reactFile = fileManager.getReactFile("components\\cart\\CartModal.tsx")
        
        expect(reactFile.relativePath).toBe("components\\cart\\CartModal.tsx")

        expect(reactFile.importDeclarations.length).toBe(10)
        let importInOuterFolder = reactFile.importDeclarations[1]
        expect(importInOuterFolder.relativeModulePath).toBe("components\\books\\BooksTable")

        let importInCurrentFolder = reactFile.importDeclarations[4]
        expect(importInCurrentFolder.relativeModulePath).toBe("components\\cart\\CartBookModal")


    });

    test("should resolve imported external module paths", () => {
        
        const fileManager = getFileManager("test//resources//e-library//src", 
                                    "test//resources//e-library//src//app//layout.jsx")

        
        let reactFile = fileManager.getReactFile("components\\cart\\CartModal.tsx")

        expect(reactFile.relativePath).toBe("components\\cart\\CartModal.tsx")

        extractImportDeclarations([reactFile]);

        expect(reactFile.importDeclarations.length).toBe(10)
        
        let externalModuleImport = reactFile.importDeclarations[3]
        expect(externalModuleImport.relativeModulePath).toBe("react-toastify")
        expect(externalModuleImport.isExternalModule).toBeTruthy()

        let prefixedModuleImport = reactFile.importDeclarations[2]
        expect(prefixedModuleImport.relativeModulePath).toBe("@/services/cartService")
        expect(prefixedModuleImport.isExternalModule).toBeTruthy()

    });

});





