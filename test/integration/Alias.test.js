import { getFileManager } from '../utils/test-utils.js';
import { loadReactComponents } from "../../lib/loadingFuncs.js"
import { loadAliases } from '../../lib/Alias.js';

describe("Alias", () => {

    test("should resolve default export aliases", () => {

        const { fileManager, filteredJsxElements } = getFileManager("test//resources//social-net//src", "test//resources//social-net//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        
        loadAliases(fileManager.reactFiles, reactComponents)

        // BUG: should be 8 components, currently class expressions are not supported
        expect(reactComponents.length).toBe(7)

        expectContainedComponents("components.jsx", 3, fileManager)
        // 1 component not exported
        expectContainedComponents("Post.jsx", 2, fileManager)

        expectAllExportedComponentsResolved(fileManager, ["AvatarEx"])
    });

    
    function expectAllExportedComponentsResolved(fileManager, exceptions) {
        fileManager.reactFiles.forEach(reactFile => {
            reactFile.exports.exportedDeclarations.forEach(declaration => {
                if (exceptions.includes(declaration.name)) {
                    expect(declaration.component).toBeFalsy()
                } else {
                    expect(declaration.component).toBeTruthy()
                }
            })
        })
    }

    function expectContainedComponents(relativeFileName, componentCount, fileManager) {
        const reactFile = fileManager.getReactFile(relativeFileName)
        expect(reactFile).toBeTruthy()
        // 1 component not exported
        expect(reactFile.reactComponents.length).toBe(componentCount)
    }

});



