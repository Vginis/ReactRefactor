import path from 'path';
import { getAllFiles } from "../../lib/util";
import * as cliModule from '../../lib/cli.js';

describe("Component hierarchy", () => {
    afterAll(() => {
        jest.restoreAllMocks();
    });

    test("should load hierarchy without circles", () => {

        const testProjectPath = path.resolve(process.cwd(),"test", "resources", "social-net");
        const allFiles = getAllFiles(testProjectPath);
        const rootFileName = path.resolve(process.cwd(),"test", "resources", "social-net", "App.jsx");

        jest.spyOn(cliModule, 'extractGlobalCliVariables').mockReturnValue({
            projectPath: testProjectPath,
            rootFile: ".//test//resources//social-net//App.jsx",
            rootComponent: "App",
            fileType: "jsx"
        });

        const loadReactFiles = require('../../lib/ReactFile.js').loadReactFiles;
        const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles, rootFileName);

        expect(reactFiles.length).toBe(4);
        expect(filteredJsxElements.size).toBe(4);
        expect([...filteredJsxElements].some(e => e.App)).toBe(true);
        // expect([...filteredJsxElements].some(e => e.TransactionHistory)).toBe(false);
        // expect(reactFiles.some(f => f.isRootFile)).toBe(true);
    });

   
});