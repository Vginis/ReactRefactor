import path from 'node:path';
import { getAllFiles } from "../../lib/util";
import * as exportsModule from '../../lib/Export.js';
import * as importsModule from '../../lib/ImportStatement.js';
import * as cliModule from '../../lib/cli.js';
import { ReactFile } from '../../lib/ReactFile.js';

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