import path from 'path';
import { parseReactFile, ReactFile } from '../../lib/ReactFile.js';
import { extractExports } from '../../lib/Export.js'
import { loadReactComponents } from '../../lib/loadingFuncs.js';
import { getFileManager } from '../utils/test-utils.js';
import exp from 'constants';


describe("Export module", () => {

    test("should identify named exports", () => {

        let reactFile = loadReactFile("test//resources//social-net//src//components.jsx")
        let exportList = extractExports(reactFile)

        expect(exportList.length).toBeTruthy();
        expect.arrayContaining["PostComment", "Avatar", "AvatarEx", "AvatarClass"]
        let exportedDeclarations = reactFile.exports.exportedDeclarations

        let commentExport = exportedDeclarations.filter(exp => exp.name === "Comment")[0]
        expect(commentExport.astNode.type).toBe("ArrowFunctionExpression")

    });

    test("should identify wrapped exports", () => {
        const { fileManager, filteredJsxElements } = getFileManager(
                "test//resources//social-net-alias//src",
                 "test//resources//social-net//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        expect(reactComponents.length).toBe(6)

        const feedFile = fileManager.getReactFile("Feed.jsx")
        expect(feedFile).toBeTruthy()

        // default export wrapped by function call like connect
        const feedComponent = feedFile.getExportedComponentDeclaration("default")
        expect(feedComponent).toBeTruthy()
        expect(feedComponent.name).toBe("Feed")

        // default export wrapped by wrapper component e.g. Wrapper(Post)
        const postFile = fileManager.getReactFile("Post.jsx")
        expect(postFile).toBeTruthy()
        // named export, wrapped component in variable declaration
        const postComponent = postFile.getExportedComponentDeclaration("default")
        expect(postComponent).toBeTruthy()
        expect(postComponent.name).toBe("Post")
        const wrappedPostComponent = postFile.getExportedComponentDeclaration("WrappedPost")
        expect(wrappedPostComponent).toBeTruthy()
        expect(wrappedPostComponent.name).toBe("Post")

        const commentFile = fileManager.getReactFile("Comment.jsx")
        expect(commentFile).toBeTruthy()
        // named export, wrapped component in variable declaration
        const commentComponent = commentFile.getExportedComponentDeclaration("WrappedComment")
        expect(commentComponent).toBeTruthy()
        expect(commentComponent.name).toBe("Comment")

    })

    test("should identify default identifier exports", () => {

        let reactFile = loadReactFile("test//resources//social-net//src//Post.jsx")
        let exportList = extractExports(reactFile)

        expect(exportList.length).toBeTruthy();
        expect.arrayContaining["Logo", "Post"]

        let exportedDeclarations = reactFile.exports.exportedDeclarations
        let postExport = exportedDeclarations.filter(exp => exp.name === "Post")[0]
        expect(postExport.astNode.type).toBe("ArrowFunctionExpression")

    });

    test("should identify default function exports", () => {

        let reactFile = loadReactFile("test//resources//social-net//src//Feed.jsx")
        let exportList = extractExports(reactFile)
        let exportedDeclarations = reactFile.exports.exportedDeclarations
        expect(exportList.length).toBeTruthy();
        expect(exportedDeclarations.length).toBe(1)
        let feedExport = exportedDeclarations[0]
        expect(feedExport.astNode.type).toBe("FunctionDeclaration")
        // anonymous function default export
        expect(feedExport.name).toBe("Feed")
        expect(feedExport.alias).toBe("Feed")
        expect(feedExport.isDefault).toBe(true)

    });

});

function loadReactFile(relativePath) {
    let segments = relativePath.split("//")
    const absoluteFilePath = path.resolve(process.cwd(), ...segments);
    let result = parseReactFile(absoluteFilePath)
    expect(result).toBeTruthy();
    let { ast, j, filePath } = result;
    return new ReactFile(ast, j, filePath, false)
}

