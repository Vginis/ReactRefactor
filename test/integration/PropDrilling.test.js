import { loadAliases } from "../../lib/Alias.js";
import { detectPropDrilling } from "../../lib/Hierarchy.js";
import { addCompositeKeyReturnedElements, addParents, loadReactComponents } from "../../lib/loadingFuncs.js";
import { loadReactFiles } from "../../lib/ReactFile.js";
import { getAllFiles } from "../../lib/util.js";
import * as cliModule from '../../lib/cli.js';

import { analyzeComponentHierarchy } from '../utils/test-utils.js';

describe("Component composition refactoring pre-condition check.", () => {
    test("should not allow Component composition refactoring", () => {
        
        const testProjectPath = './test/resources/e-library/src';
        const rootFileName = String.raw`test\resources\e-library\src\app\layout.tsx`;

        jest.spyOn(cliModule, 'extractGlobalCliVariables').mockReturnValue({
            projectPath: testProjectPath,
            rootFile: ".//test//resources//e-library//src//app//layout.tsx",
            rootComponent: "OrdersTable,CartModal",
            fileType: "tsx"
        });

        globalThis.projectPath = testProjectPath
        const allFiles = getAllFiles(testProjectPath);
        const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles,rootFileName);
        const reactComponents = loadReactComponents(reactFiles, filteredJsxElements);

        loadAliases(reactFiles);
        addParents();
        addCompositeKeyReturnedElements(reactFiles);

        const paths = [
            [
                String.raw`test\resources\e-library\src\components\orders\OrdersTable.tsx:OrdersTable`, 
                String.raw`test\resources\e-library\src\components\orders\OrderActionsDropdown.tsx:OrderActionsDropdown`, 
                String.raw`test\resources\e-library\src\components\orders\OrderCartDetailsModal.tsx:OrderCartDetailsModal`
            ],
            [
                String.raw`test\resources\e-library\src\components\cart\CartModal.tsx:CartModal`, 
                String.raw`test\resources\e-library\src\components\cart\CartPaymentModal.tsx:CartPaymentModal`, 
                String.raw`test\resources\e-library\src\components\cart\CartPaymentVisaModal.tsx:CartPaymentVisaModal`
            ],
            [
                String.raw`test\resources\e-library\src\components\cart\CartModal.tsx:CartModal`,
                String.raw`test\resources\e-library\src\components\cart\CartPaymentModal.tsx:CartPaymentModal`, 
                String.raw`test\resources\e-library\src\components\cart\CartPaymentCashModal.tsx:CartPaymentCashModal`
            ]
        ];

        const groupedProps = [ {order: 'order'} ];
        const propDrillings = detectPropDrilling(paths);
        expect(propDrillings.length).toBe(3);
        expect(propDrillings[0].checkForOtherIntermediatePropsInPath(reactComponents, groupedProps))
            .toBe(true);
    });

    test("should allow Component composition refactoring", () => {
        const testProjectPath = './test/resources/atm-banking/src';
        const rootFileName = String.raw`test\resources\atm-banking\src\main.jsx`;

        jest.spyOn(cliModule, 'extractGlobalCliVariables').mockReturnValue({
            projectPath: testProjectPath,
            rootFile: ".//test//resources//atm-banking//src//main.jsx",
            rootComponent: "App",
            fileType: "jsx"
        });

        globalThis.projectPath = testProjectPath
        const allFiles = getAllFiles(testProjectPath);
        const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles,rootFileName);
        const reactComponents = loadReactComponents(reactFiles, filteredJsxElements);

        loadAliases(reactFiles);
        addParents();
        addCompositeKeyReturnedElements(reactFiles);

        const paths = [
            [
                String.raw`test\resources\atm-banking\src\App.jsx:App`,
                String.raw`test\resources\atm-banking\src\Components\Deposit.jsx:Deposit`,
                String.raw`test\resources\atm-banking\src\Components\Deposit.jsx:Example`,
            ]
        ];
        const groupedProps = [ { num: 'num' } ];

        const propDrillings = detectPropDrilling(paths);
        expect(propDrillings.length).toBe(1);
        expect(propDrillings[0].checkForOtherIntermediatePropsInPath(reactComponents, groupedProps))
            .toBe(false);
    });
})

describe("Context refactoring pre-condition check.", () => {
    test("should allow Context refactoring", () => {

        const { hierarchyTrees, paths } = analyzeComponentHierarchy(
            "test//resources//atm-banking//src",
            "test//resources//atm-banking//src//main.jsx", "App", 13, 17)

    
        const propDrillings = detectPropDrilling(paths);
        expect(propDrillings.length).toBe(1);
        expect(propDrillings[0].checkIfDestComponentHasOtherParentComponents(propDrillings))
            .toBe(false);
    });

    test("should not allow Context refactoring", () => {

        const { hierarchyTrees, paths } = analyzeComponentHierarchy(
            "test//resources//social-netx//src",
            "test//resources//social-netx//src//App.jsx", "App", 13, 17)

        const propDrillings = detectPropDrilling(paths);
        expect(propDrillings.length).toBe(1);
        expect(propDrillings[0].checkIfDestComponentHasOtherParentComponents(propDrillings))
            .toBe(true);
    });
})