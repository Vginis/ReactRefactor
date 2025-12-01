import { getFileManager } from '../utils/test-utils.js';
import {loadReactComponents} from "../../lib/loadingFuncs.js"

describe("loadReactComponents", () => {

    test("should load all components in path", () => {

        const {fileManager, filteredJsxElements} = getFileManager("test//resources//social-net//src", "test//resources//social-net//src//App.jsx");        

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)

        // BUG: should be 8 components, currently class expressions are not supported
        expect(reactComponents.length).toBe(7)

    });


});



