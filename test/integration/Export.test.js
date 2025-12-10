import { loadReactComponents } from '../../lib/loadingFuncs.js';
import { getFileManager } from '../utils/test-utils.js';


describe("Reexporting", () => {

    function getReexportDeclarations(reactFile) {
        return reactFile.reexportStatements.flatMap(reexport => reexport.exportedDeclarations)
    }

    function expectReexportDeclaration(exportedDeclaration, exportedName, componentName, isComponentResolved = true) {
        expect(exportedDeclaration.alias).toBe(exportedName)
        if (isComponentResolved) {
            expect(exportedDeclaration.component).toBeTruthy()
            expect(exportedDeclaration.component.name).toBe(componentName)
        } else {
            expect(exportedDeclaration.component).toBeFalsy()
        }
    }

    test("should resolve reexports from central barrel file", () => {
        const { fileManager, filteredJsxElements } = getFileManager(
            "test//resources//ecommerce-react//src",
            "test//resources//ecommerce-react//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        expect(reactComponents.length).toBe(81)

        let reactFile = fileManager.getReactFile("components\\common")
        expect(reactFile).toBeTruthy()
        expect(reactFile.fileName).toBe("index.js")

        expect(reactFile.reexportStatements.length).toBe(17)
        const reexportDeclarations = getReexportDeclarations(reactFile)
        expect(reexportDeclarations.length).toBe(17)

        expectReexportDeclaration(reexportDeclarations[14], "PriceRange", "PriceRange", true)
    })

    test("should resolve reexports from index file", () => {

        const { fileManager, filteredJsxElements } = getFileManager(
            "test//resources//ecommerce-react//src",
            "test//resources//ecommerce-react//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        expect(reactComponents.length).toBe(81)

        let reactFile = fileManager.getReactFile("components\\basket")
        expect(reactFile).toBeTruthy()
        expect(reactFile.fileName).toBe("index.js")

        expect(reactFile.reexportStatements.length).toBe(4)
        const reexportDeclarations = getReexportDeclarations(reactFile)
        expect(reexportDeclarations.length).toBe(4)

        expectReexportDeclaration(reexportDeclarations[0], "Basket", "Basket", true)
        expectReexportDeclaration(reexportDeclarations[1], "BasketItem", "BasketItem", true)
        expectReexportDeclaration(reexportDeclarations[2], "BasketItemControl", "BasketItemControl", true)
        // BasketToggle is cannot be identified as component
        expectReexportDeclaration(reexportDeclarations[3], "BasketToggle", undefined, false)



        // reactFile = fileManager.getReactFile("components\\common\\PriceRange")
        // expect(reactFile).toBeTruthy()
        // expect(reactFile.fileName).toBe("index.jsx")

        // reactFile = fileManager.getReactFile("views\\auth\\forgot_password")
        // expect(reactFile).toBeTruthy()
        // expect(reactFile.fileName).toBe("index.jsx")
    })


    test("should resolve reexports to actual components", () => {
        const { fileManager, filteredJsxElements } = getFileManager(
            "test//resources//social-net-alias//src",
            "test//resources//social-net-alias//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        expect(reactComponents.length).toBe(6)

        const componentsFile = fileManager.getReactFile("components.jsx")
        expect(componentsFile).toBeTruthy()

        expect(componentsFile.reexportStatements.length).toBe(2)
        const reexportDeclarations = getReexportDeclarations(componentsFile)
        expect(reexportDeclarations.length).toBe(3)

        // export {default as Avatar, AvatarEx} from "./Avatar.jsx"
        // export {WrappedComment} from "./Comment.jsx"
        expectReexportDeclaration(reexportDeclarations[0], "Avatar", "Avatar", true)
        expectReexportDeclaration(reexportDeclarations[1], "AvatarEx", "AvatarEx", true)
        expectReexportDeclaration(reexportDeclarations[2], "WrappedComment", "Comment", true)

    })

})

describe("Export module", () => {


    test("should identify named exports", () => {

        const { fileManager, filteredJsxElements } = getFileManager(
            "test//resources//social-net//src",
            "test//resources//social-net//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        expect(reactComponents.length).toBe(9)

        const componentsFile = fileManager.getReactFile("components.jsx")
        expect(componentsFile).toBeTruthy()

        const exportedDeclarations = componentsFile.exports.exportedDeclarations
        expect(exportedDeclarations.length).toBe(5)

        expectExportDeclaration(exportedDeclarations, "Comment", "PostComment", false, "ArrowFunctionExpression")
        expectExportDeclaration(exportedDeclarations, "Icon", "Icon", false, "ArrowFunctionExpression")
        expectExportDeclaration(exportedDeclarations, "Avatar", "Avatar", false, "ClassDeclaration")
        expectExportDeclaration(exportedDeclarations, "AvatarClass", "AvatarClass", false, "ClassDeclaration")
        // component not resolved
        expectExportDeclaration(exportedDeclarations, "AvatarEx", "AvatarEx", false, "ClassExpression", false)

    });

    test("should identify wrapped exports", () => {
        const { fileManager, filteredJsxElements } = getFileManager(
            "test//resources//social-net-alias//src",
            "test//resources//social-net-alias//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        expect(reactComponents.length).toBe(6)

        const feedFile = fileManager.getReactFile("Feed.jsx")
        expect(feedFile).toBeTruthy()

        let exportedDeclarations = feedFile.exports.exportedDeclarations
        expectExportDeclaration(exportedDeclarations, "Feed", "Feed", true, "ArrowFunctionExpression", true)

        // default export wrapped by wrapper component e.g. Wrapper(Post)
        const postFile = fileManager.getReactFile("Post.jsx")
        expect(postFile).toBeTruthy()
        exportedDeclarations = postFile.exports.exportedDeclarations

        // named export, wrapped component in variable declaration
        expectExportDeclaration(exportedDeclarations, "WrappedPost", "WrappedPost", false, "ArrowFunctionExpression", true)
        expectExportDeclaration(exportedDeclarations, "Post", "Post", true, "ArrowFunctionExpression", true)

        const commentFile = fileManager.getReactFile("Comment.jsx")
        expect(commentFile).toBeTruthy()
        exportedDeclarations = commentFile.exports.exportedDeclarations

        // named export, wrapped component in variable declaration
        expectExportDeclaration(exportedDeclarations, "WrappedComment", "WrappedComment", false, "ArrowFunctionExpression", true)

    })

    test("should identify default identifier exports", () => {

        const { fileManager, filteredJsxElements } = getFileManager(
            "test//resources//social-net//src",
            "test//resources//social-net//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        expect(reactComponents.length).toBe(9)

        const postFile = fileManager.getReactFile("Post.jsx")
        expect(postFile).toBeTruthy()

        const exportedDeclarations = postFile.exports.exportedDeclarations
        expect(exportedDeclarations.length).toBe(2)

        expectExportDeclaration(exportedDeclarations, "Post", "Post", true, "ArrowFunctionExpression")

    });

    test("should identify default anonymous function exports", () => {

        const { fileManager, filteredJsxElements } = getFileManager(
            "test//resources//social-net//src",
            "test//resources//social-net//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        expect(reactComponents.length).toBe(9)

        const feedFile = fileManager.getReactFile("Feed.jsx")
        expect(feedFile).toBeTruthy()

        const exportedDeclarations = feedFile.exports.exportedDeclarations
        expect(exportedDeclarations.length).toBe(1)

        expectExportDeclaration(exportedDeclarations, "Feed", "Feed", true, "FunctionDeclaration")

    });

    function expectExportDeclaration(exportedDeclarations, localName, alias, isDefault, astNodeType, isComponentResolved = true) {
        const exportedDeclaration = exportedDeclarations.filter(exp => exp.name === localName)[0]
        expect(exportedDeclaration.alias).toBe(alias)
        expect(exportedDeclaration.isDefault).toBe(isDefault)
        expect(exportedDeclaration.astNode.type).toBe(astNodeType)
        if (isComponentResolved) {
            expect(exportedDeclaration.component).toBeTruthy()
        } else {
            expect(exportedDeclaration.component).toBe(null)
        }
    }

});

