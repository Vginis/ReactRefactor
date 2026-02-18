// import { getFileManager } from '../utils/test-utils.js';
// import { loadAliases2 } from '../../lib/Alias.js';
// import {
//     resolveIfProjectHasMultiplePages,
//     extractPathsAndHierarchies2
// } from '../../lib/util.js';

// import {
//     loadReactComponents,
//     addParents
// } from '../../lib/loadingFuncs.js';

import { analyzeComponentHierarchy } from '../utils/test-utils.js';

describe("Component hierarchy", () => {
   
    test("should load hierarchy without circles", () => {

        const { hierarchyTrees, paths } = analyzeComponentHierarchy(
            "test//resources//social-net//src",
            "test//resources//social-net//src//App.jsx", "App", 9, 8)

        expect(paths.length).toBe(3);
        expect(paths[0].length).toBe(4);
        expect(paths[1].length).toBe(6);
        expect(paths[2].length).toBe(7);
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

        // App -- Feed -- Avatar (3 uses)
        //           | -- Post  -- Avatar
        //                    | -- Comment -- Avatar
        //                               | -- Post

        const { hierarchyTrees, paths } = analyzeComponentHierarchy(
            "test//resources//social-net-alias//src",
            "test//resources//social-net-alias//src//App.jsx", "App", 6, 6)

        // 5 jsx elements, Feed is not used anywhere

        expect(paths.length).toBe(4);
        expectPath(paths[0], 'App', 'Avatar', 3)
        expectPath(paths[1], 'App', 'Avatar', 4)
        expectPath(paths[2],'App', 'Avatar', 5)
        expectPath(paths[3],'App', 'Post', 5)
        
    });
});

function expectPath(path, source, dest, length){
    expect(path.length).toBe(length)
    let sourceName = path[0].split(':').pop()
    let destName = path[length - 1].split(':').pop()
    expect(sourceName).toBe(source)
    expect(destName).toBe(dest)
}

