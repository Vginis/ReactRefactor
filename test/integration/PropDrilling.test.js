import { loadAliases } from "../../lib/Alias.js";
import { detectPropDrilling } from "../../lib/Hierarchy.js";
import { addCompositeKeyReturnedElements, addParents, loadReactComponents } from "../../lib/loadingFuncs.js";
import { loadReactFiles } from "../../lib/ReactFile.js";
import { getAllFiles } from "../../lib/util.js";
import * as cliModule from '../../lib/cli.js';

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

        const allFiles = getAllFiles(testProjectPath);
        const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles,rootFileName);
        const reactComponents = loadReactComponents(reactFiles, filteredJsxElements);

        loadAliases(reactFiles,reactComponents);
        addParents(reactComponents);
        addCompositeKeyReturnedElements(reactComponents,reactFiles);

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
        const propDrillings = detectPropDrilling(paths,reactComponents);
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

        const allFiles = getAllFiles(testProjectPath);
        const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles,rootFileName);
        const reactComponents = loadReactComponents(reactFiles, filteredJsxElements);

        loadAliases(reactFiles,reactComponents);
        addParents(reactComponents);
        addCompositeKeyReturnedElements(reactComponents,reactFiles);

        const paths = [
            [
                String.raw`test\resources\atm-banking\src\App.jsx:App`,
                String.raw`test\resources\atm-banking\src\Components\Deposit.jsx:Deposit`,
                String.raw`test\resources\atm-banking\src\Components\Deposit.jsx:Example`,
            ]
        ];
        const groupedProps = [ { num: 'num' } ];

        const propDrillings = detectPropDrilling(paths,reactComponents);
        expect(propDrillings.length).toBe(1);
        expect(propDrillings[0].checkForOtherIntermediatePropsInPath(reactComponents, groupedProps))
            .toBe(false);
    });
})

describe("Context refactoring pre-condition check.", () => {
    test("should allow Context refactoring", () => {
        const testProjectPath = './test/resources/atm-banking/src';
        const rootFileName = String.raw`test\resources\atm-banking\src\main.jsx`;

        jest.spyOn(cliModule, 'extractGlobalCliVariables').mockReturnValue({
            projectPath: testProjectPath,
            rootFile: ".//test//resources//atm-banking//src//main.jsx",
            rootComponent: "App",
            fileType: "jsx"
        });

        const allFiles = getAllFiles(testProjectPath);
        const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles,rootFileName);
        const reactComponents = loadReactComponents(reactFiles, filteredJsxElements);

        loadAliases(reactFiles,reactComponents);
        addParents(reactComponents);
        addCompositeKeyReturnedElements(reactComponents,reactFiles);

        const paths = [
            [
                String.raw`test\resources\atm-banking\src\App.jsx:App`,
                String.raw`test\resources\atm-banking\src\Components\Deposit.jsx:Deposit`,
                String.raw`test\resources\atm-banking\src\Components\Deposit.jsx:Example`,
            ]
        ];

        const propDrillings = detectPropDrilling(paths,reactComponents);
        expect(propDrillings.length).toBe(1);
        expect(propDrillings[0].checkIfDestComponentHasOtherParentComponents(propDrillings))
            .toBe(false);
    });

    test("should not allow Context refactoring", () => {
        const testProjectPath = './test/resources/social-netx';
        const rootFileName = String.raw`test\resources\social-netx\App.jsx`;

        jest.spyOn(cliModule, 'extractGlobalCliVariables').mockReturnValue({
            projectPath: testProjectPath,
            rootFile: ".//test//resources//social-netx//src//App.jsx",
            rootComponent: "App",
            fileType: "jsx"
        });

        const allFiles = getAllFiles(testProjectPath);
        const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles,rootFileName);
        const reactComponents = loadReactComponents(reactFiles, filteredJsxElements);

        loadAliases(reactFiles,reactComponents);
        addParents(reactComponents);
        addCompositeKeyReturnedElements(reactComponents,reactFiles);

        const paths = [
            [
                String.raw`test\resources\social-netx\src\App.jsx:App`,
                String.raw`test\resources\social-netx\src\Feed.jsx:Feed`,
                String.raw`test\resources\social-netx\src\Avatar.jsx:Avatar`
            ]
        ];

        const propDrillings = detectPropDrilling(paths,reactComponents);
        expect(propDrillings.length).toBe(1);
        expect(propDrillings[0].checkIfDestComponentHasOtherParentComponents(propDrillings))
            .toBe(true);
    });
})