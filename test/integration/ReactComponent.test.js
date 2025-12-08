import { getFileManager } from '../utils/test-utils.js';
import { loadReactComponents } from "../../lib/loadingFuncs.js"
import { loadAliases } from '../../lib/Alias.js';

describe("ReactComponent", () => {

    test("should resolve child components in functional declarations", () => {

        const { fileManager, filteredJsxElements } = getFileManager("test//resources//social-net//src", "test//resources//social-net//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        
        loadAliases(fileManager.reactFiles, reactComponents)

        // BUG: should be 8 components, currently class expressions are not supported
        expect(reactComponents.length).toBe(8)

        expectContainedComponents("components.jsx", 4, fileManager)
        // 1 component not exported
        expectContainedComponents("Post.jsx", 2, fileManager)

    });

    
    function expectContainedComponents(relativeFileName, componentCount, fileManager) {
        const reactFile = fileManager.getReactFile(relativeFileName)
        expect(reactFile).toBeTruthy()
        // 1 component not exported
        expect(reactFile.reactComponents.length).toBe(componentCount)
    }

});



