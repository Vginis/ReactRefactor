import { getFileManager } from '../utils/test-utils.js';
import { loadReactComponents } from "../../lib/loadingFuncs.js"

describe("loadReactComponents", () => {

    test("should load all components in path", () => {

        const { fileManager, filteredJsxElements } = getFileManager("test//resources//social-net//src", "test//resources//social-net//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)

        // BUG: should be 8 components, currently class expressions are not supported
        expect(reactComponents.length).toBe(8)

        expectContainedComponents("components.jsx", 4, fileManager)
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

    test("should associate all imported declarations to components", () => {
        const { fileManager, filteredJsxElements } = getFileManager(
            "test//resources//social-net//src", 
            "test//resources//social-net//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)

        const feedFile = fileManager.getReactFile("Feed.jsx")
        // import MyPost, {Logo} from "./Post.jsx";
        const postComponent = feedFile.getImportedComponentDeclaration("MyPost")
        expect(postComponent).toBeTruthy()
        expect(feedFile.getImportedComponentDeclaration("Logo")).toBeTruthy()

        // import * as name from "./components"
        const avatarComponent = feedFile.getImportedComponentDeclaration("components.Avatar")
        expect(avatarComponent).toBeTruthy()

        // import {default as Feed} from "./Feed.jsx"
        const appFile = fileManager.getReactFile("App.jsx")
        const feedComponent = appFile.getImportedComponentDeclaration("Feed")
        expect(feedComponent).toBeTruthy()
    })

    test("should associate wrapped components to their implementation", () => {
        const { fileManager, filteredJsxElements } = getFileManager(
            "test//resources//social-net-alias//src", 
            "test//resources//social-net-alias//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)

        const commentFile = fileManager.getReactFile("Comment.jsx")
        const WrappedComment = commentFile.getLocalComponent("WrappedComment")
        expect(WrappedComment).toBeTruthy()
        expect(commentFile.getExportedComponentDeclaration("WrappedComment")).toBe(WrappedComment)
        expect(commentFile.getLocalComponent("Comment")).toBe(WrappedComment)

        const postFile = fileManager.getReactFile("Post.jsx")
        const Post = postFile.getLocalComponent("Post")
        expect(Post).toBeTruthy()
        const WrappedPost = postFile.getLocalComponent("WrappedPost")
        expect(WrappedPost).toBeTruthy()
        expect(postFile.getExportedComponentDeclaration("default")).toBe(Post)
        expect(postFile.getLocalComponent("ConnectedPost")).toBe(Post)
        expect(postFile.getLocalComponent("LocalWrappedPost")).toBe(Post)

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



