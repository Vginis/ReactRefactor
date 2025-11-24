import path from 'path';
import { getAllFiles, resolveIfProjectHasMultiplePages } from '../../lib/util';
import * as cliModule from '../../lib/cli.js';
import {getAbsolutePath, setProjectPath, setRootFile} from "../utils/test-utils.js";

describe("getAllFiles integration test", () => {
    const testProjectPath = path.resolve(process.cwd(),"test", "resources", "e-library", "src");

    test('scans testing project and returns all JS/TS/TSX files', () => {
        const allFiles = getAllFiles(testProjectPath);
        expect(Array.isArray(allFiles)).toBe(true);
        expect(allFiles.every(f => f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.tsx')))
        .toBe(true);
        expect(allFiles.length).toBe(43);
    })
});

describe("resolve if project has multiple pages integration test", () => {

    afterAll(() => {
        jest.restoreAllMocks();
    });
    
    test('check that test project has multiple pages', () => {
        const testProjectPath = path.resolve(process.cwd(),"test", "resources", "e-library", "src");
        jest.spyOn(cliModule, 'extractGlobalCliVariables').mockReturnValue({
            projectPath: testProjectPath,
            rootFile: ".//test//resources//e-library//src//pages//home.tsx",
            rootComponent: "HomePage"
        });
        setProjectPath("test//resources//e-library//src")
        setRootFile("test//resources//e-library//src//pages//home.tsx")
        const hasMultiplePages = resolveIfProjectHasMultiplePages(testProjectPath);
        expect(hasMultiplePages).toBe(true);
    })

    test.skip('check that test project is a single page application', () => {
        const testProjectPath = path.resolve(process.cwd(),"test", "resources", "atm-banking", "src");
        jest.spyOn(cliModule, 'extractGlobalCliVariables').mockReturnValue({
            projectPath: testProjectPath,
            rootFile: ".//test//resources//atm-banking//src//main.jsx",
            rootComponent: "App"
        });

        setProjectPath("test//resources//atm-banking//src")
        setRootFile("test//resources//atm-banking//src//main.jsx")
        const hasMultiplePages = resolveIfProjectHasMultiplePages(testProjectPath);
        expect(hasMultiplePages).toBe(false);
    })
});