import { getFileManager } from '../utils/test-utils.js';
import { loadReactComponents } from "../../lib/loadingFuncs.js"

describe("loadReactComponents", () => {

    test("should load all components in path", () => {

        const { fileManager, filteredJsxElements } = getFileManager("test//resources//social-net//src", "test//resources//social-net//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)

        // BUG: should be 8 components, currently class expressions are not supported
        expect(reactComponents.length).toBe(7)

        expectContainedComponents("components.jsx", 3, fileManager)
        // 1 component not exported
        expectContainedComponents("Post.jsx", 2, fileManager)

        expectAllExportedComponentsResolved(fileManager, ["AvatarEx"])
    });

    test("should associate all exported declarations with components", () => {
        const { fileManager, filteredJsxElements } = 
            getFileManager("test//resources//atm-banking//src", "test//resources//atm-banking//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)

        expectAllExportedComponentsResolved(fileManager, ["Endpoints", "getBalance", "makeADeposit",
            "makeAWithdrawal"
        ])
    })

    test("should resolve aliases/exported names to exported components", () => {
        const { fileManager, filteredJsxElements } = getFileManager("test//resources//social-net//src", "test//resources//social-net//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)

        const feedFile = fileManager.getReactFile("Feed.jsx")
        const feedComponent = feedFile.getExportedComponentDeclaration("default")
        expect(feedComponent).toBeTruthy()
        // filename without suffix
        expect(feedComponent.name).toBe("Feed")

        const postFile = fileManager.getReactFile("Post.jsx")
        const postComponent = postFile.getExportedComponentDeclaration("default")
        expect(postComponent).toBeTruthy()
        expect(postComponent.name).toBe("Post")

        const componentsFile = fileManager.getReactFile("components.jsx")
        expect(componentsFile.getExportedComponentDeclaration("PostComment")).toBeTruthy()
        expect(componentsFile.getExportedComponentDeclaration("Avatar")).toBeTruthy()
        // FIXME: currently class expressions are not supported
        expect(componentsFile.getExportedComponentDeclaration("AvatarEx")).toBeFalsy()
        expect(componentsFile.getExportedComponentDeclaration("AvatarClass")).toBeTruthy()
    
    })

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



