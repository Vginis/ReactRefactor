import { getFileManager } from '../utils/test-utils.js';
import { loadAliases, loadAliases2 } from '../../lib/Alias.js';
import {
    resolveIfProjectHasMultiplePages,
    extractPathsAndHierarchies
} from '../../lib/util.js';

import {
    loadReactComponents,
    addParents,
    addCompositeKeyReturnedElements
} from '../../lib/loadingFuncs.js';

describe("Component hierarchy", () => {


   
    test("should load hierarchy without circles", () => {

        const { hierarchyTrees, paths } = analyzeComponentHierarchy(
            "test//resources//social-net//src",
            "test//resources//social-net//src//App.jsx", "App", 9, 8)

        expect(paths.length).toBe(2);
        expect(paths[0].length).toBe(3)
        expect(paths[1].length).toBe(4)

    });

    test("should load hierarchy containing circles", () => {

        const { hierarchyTrees, paths } = analyzeComponentHierarchy(
            "test//resources//social-netx//src",
            "test//resources//social-netx//src//App.jsx", "App", 5, 6)

        expect(paths.length).toBe(4);
        expect(paths[0].length).toBe(3)
        expect(paths[1].length).toBe(4)
        expect(paths[2].length).toBe(5)
        expect(paths[2].length).toBe(5)

    });


    test("should load hierarchy containing aliases", () => {

        const { hierarchyTrees, paths } = analyzeComponentHierarchy(
            "test//resources//social-net-alias//src",
            "test//resources//social-net-alias//src//App.jsx", "App", 6, 6)

        // 5 jsx elements, Feed is not used anywhere

        expect(paths.length).toBe(4);
        expect(paths[0].length).toBe(3)
        expect(paths[1].length).toBe(4)
        expect(paths[2].length).toBe(4)

    });
});

function analyzeComponentHierarchy(testProjectPath, rootFileName, rootComponent, expectedReactComponents, expectedJsxElements) {

    const { fileManager, filteredJsxElements } = getFileManager(testProjectPath, rootFileName, rootComponent);
    const reactFiles = fileManager.reactFiles;

    const reactComponents = loadReactComponents(reactFiles, filteredJsxElements)

    const hasMultiplePages = resolveIfProjectHasMultiplePages(testProjectPath);

    expect(filteredJsxElements.size).toBe(expectedJsxElements);
    expect(reactComponents.length).toBe(expectedReactComponents);

    loadAliases(reactFiles, reactComponents);
    addParents(reactComponents);
    addCompositeKeyReturnedElements(reactComponents, reactFiles);
    const { hierarchyTrees, paths } = extractPathsAndHierarchies(
        reactFiles, rootFileName, reactComponents, hasMultiplePages);

    return { hierarchyTrees, paths }
}