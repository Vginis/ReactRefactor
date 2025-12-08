import path from 'node:path';
import { getAllFiles } from "../../lib/util";
import * as exportsModule from '../../lib/Export.js';
import * as importsModule from '../../lib/ImportStatement.js';
import * as cliModule from '../../lib/cli.js';
import { ReactFile } from '../../lib/ReactFile.js';
import { getFileManager } from '../utils/test-utils.js';
import { loadReactComponents } from '../../lib/loadingFuncs.js';

describe("React file properties", ()=>{

    test("should include file type", ()=>{
        let reactFile = new ReactFile(null, null, "\\path\\to\\file\\FileName.jsx")
        expect(reactFile.fileType).toBe("jsx")

        reactFile = new ReactFile(null, null, "\\path\\to\\file\\FileName.tsx")
        expect(reactFile.fileType).toBe("tsx")
    })

        test("should return filenames without extensions", ()=>{
        let reactFile = new ReactFile(null, null, "\\path\\to\\file\\FileName.other.jsx")
        expect(reactFile.fileNameNoExtension).toBe("FileName.other")

        reactFile = new ReactFile(null, null, "\\path\\to\\file\\FileName.tsx")
        expect(reactFile.fileNameNoExtension).toBe("FileName")
    })


});

function expectExportedComponent(reactFile, exportedName, componentName){
    const component = reactFile.getExportedComponentDeclaration(exportedName)
    expect(component).toBeTruthy()
    expect(component.name).toBe(componentName)
}

describe("ReactFile component resolution", ()=>{

    test("should identify components exported by name", () =>{
        const { fileManager, filteredJsxElements } = getFileManager(
            "test//resources//social-net//src",
            "test//resources//social-net//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        expect(reactComponents.length).toBe(8)

        const componentsFile = fileManager.getReactFile("components.jsx")
        expect(componentsFile).toBeTruthy()

        expectExportedComponent(componentsFile, "Icon", "Icon")
        expectExportedComponent(componentsFile, "PostComment", "Comment")
        expectExportedComponent(componentsFile, "Avatar", "Avatar")
        expectExportedComponent(componentsFile, "AvatarClass", "AvatarClass")

    })

    test("should identify wrapped exported components", () => {
        const { fileManager, filteredJsxElements } = getFileManager(
            "test//resources//social-net-alias//src",
            "test//resources//social-net-alias//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        expect(reactComponents.length).toBe(6)

        const feedFile = fileManager.getReactFile("Feed.jsx")
        expect(feedFile).toBeTruthy()

        expectExportedComponent(feedFile, "default", "Feed")
        
        // default export wrapped by wrapper component e.g. Wrapper(Post)
        const postFile = fileManager.getReactFile("Post.jsx")
        expect(postFile).toBeTruthy()
        expectExportedComponent(postFile, "default", "Post")
        expectExportedComponent(postFile, "WrappedPost", "Post")

        const commentFile = fileManager.getReactFile("Comment.jsx")
        expect(commentFile).toBeTruthy()

        expectExportedComponent(commentFile, "WrappedComment", "Comment")

    });

})

describe("Extract all React File objects from a list of files", () => {
    afterAll(() => {
        jest.restoreAllMocks();
    });

    test("scan all files and extract the respective React file objects for single page app", () => {
        const testProjectPath = path.resolve(process.cwd(),"test", "resources", "atm-banking", "src");
        const allFiles = getAllFiles(testProjectPath);
        const rootFileName = path.resolve(process.cwd(),"test", "resources", "atm-banking", "src", "main.jsx");

        jest.spyOn(exportsModule, 'extractExports').mockImplementation(() => {});
        jest.spyOn(importsModule, 'extractImportDeclarations').mockImplementation(() => {});
        jest.spyOn(cliModule, 'extractGlobalCliVariables').mockReturnValue({
            projectPath: testProjectPath,
            rootFile: ".//test//resources//atm-banking//src//main.jsx",
            rootComponent: "App",
            fileType: "jsx"
        });

        globalThis.projectPath = testProjectPath;
        const loadReactFiles = require('../../lib/ReactFile.js').loadReactFiles;
        const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles, rootFileName);

        expect(reactFiles.length).toBe(15);
        expect(filteredJsxElements.size).toBe(17);
        expect([...filteredJsxElements].some(e => e.App)).toBe(true);
        expect([...filteredJsxElements].some(e => e.TransactionHistory)).toBe(false);
        expect(reactFiles.some(f => f.isRootFile)).toBe(true);
    });

    test("scan all files and extract the respective React file objects for multiple page app", () => {
        
        const testProjectPath = path.resolve(process.cwd(),"test", "resources", "e-library", "src");
        const allFiles = getAllFiles(testProjectPath);
        const rootFileName = path.resolve(process.cwd(),"test", "resources", "e-library", "src", "pages", "home.tsx");
        
        jest.spyOn(exportsModule, 'extractExports').mockImplementation(() => {});
        jest.spyOn(cliModule, 'extractGlobalCliVariables').mockReturnValue({
            projectPath: testProjectPath,
            rootFile: ".//test//resources//e-library//src//pages//home.tsx",
            rootComponent: "HomePage",
            fileType: "tsx"
        });
        jest.spyOn(importsModule, 'extractImportDeclarations').mockImplementation(() => {});

        globalThis.projectPath = testProjectPath;
        const loadReactFiles = require('../../lib/ReactFile.js').loadReactFiles;
        const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles, rootFileName);

        expect(reactFiles.length).toBe(43);
        expect(filteredJsxElements.size).toBe(65);
        expect(reactFiles.some(f => f.isRootFile)).toBe(true);
    });
});