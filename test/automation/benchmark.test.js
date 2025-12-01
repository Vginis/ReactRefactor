const { execSync } = require("child_process"); // Works in Jest



describe("Benchmark tests for RefactoringReact's Prop Drilling and component detection", () => {
    const testProjects = [
        {
            name: "redux-app",
            path: "..\\benchmark\\redux-app\\src",
            mainFile: "..\\benchmark\\redux-app\\src\\index.js",
            expectedComponents: 31,
            expectedPropDrillings: 14,
            rootComponent: ""
        },
        {
            name: "react-proto",
            path: "..\\benchmark\\react-proto\\src",
            mainFile: "..\\benchmark\\react-proto\\src\\index.js",
            expectedComponents: 19,
            expectedPropDrillings: 5,
            rootComponent: ""
        },
        {
            name: "fitness-app",
            path: "..\\benchmark\\project_fitness_app\\src",
            mainFile: "..\\benchmark\\project_fitness_app\\src\\index.js",
            expectedComponents: 17,
            expectedPropDrillings: 4,
            rootComponent: ""
        },
        {
            name: "whisper",
            path: "..\\benchmark\\Whisper\\client\\src",
            mainFile: "..\\benchmark\\Whisper\\client\\src\\index.jsx",
            expectedComponents: 33,
            expectedPropDrillings: 10,
            rootComponent: ""
        }
        ,
        {
            name: "ecommerce",
            path: "..\\benchmark\\ecommerce-react\\src",
            mainFile: "..\\benchmark\\ecommerce-react\\src\\index.jsx",
            expectedComponents: 81,
            expectedPropDrillings: 2,
            rootComponent: 'App'
        },
        {
            name: "carbon",
            path: "..\\benchmark\\carbon",
            mainFile: "..\\benchmark\\carbon\\pages\\index.js",
            expectedComponents: 102,
            expectedPropDrillings: 56,
            rootComponent: ""
        },
        {
            name: "prometheus",
            path: "..\\benchmark\\prometheus\\web\\ui\\react-app\\src",
            mainFile: "..\\benchmark\\prometheus\\web\\ui\\react-app\\src\\App.tsx",
            expectedComponents: 43,
            expectedPropDrillings: 10,
            rootComponent: "App"
        },
        {
            name: "tidb",
            path: "..\\benchmark\\tidb\\br\\web\\src\\",
            mainFile: "..\\benchmark\\tidb\\br\\web\\src\\index.tsx",
            expectedComponents: 17,
            expectedPropDrillings: 6,
            rootComponent: "App"
        },
        {
            name: "mitmproxy",
            path: "..\\benchmark\\mitmproxy\\web\\src\\js\\",
            mainFile: "..\\benchmark\\mitmproxy\\web\\src\\js\\app.jsx",
            expectedComponents: 83,
            expectedPropDrillings: 15,
            rootComponent: "Response,Request"
        },
        {
            name: "conky",
            path: "..\\benchmark\\conky\\web\\",
            mainFile: "..\\benchmark\\conky\\web\\index.tsx",
            expectedComponents: 21,
            expectedPropDrillings: 1,
            rootComponent: ""
        },
        {
            name: "joplin",
            path: "..\\benchmark\\joplin\\ElectronClient\\gui\\",
            mainFile: "..\\benchmark\\joplin\\ElectronClient\\gui\\Root.jsx",
            expectedComponents: 48,
            expectedPropDrillings: 5,
            rootComponent: "MainScreenComponent,ConfigScreenComponent tsx"
        },
        {
            name: "vitess",
            path: "..\\benchmark\\vitess\\web\\vtadmin\\src\\",
            mainFile: "..\\benchmark\\vitess\\web\\vtadmin\\src\\index.tsx",
            expectedComponents: 112,
            expectedPropDrillings: 61,
            rootComponent: "App"
        },
        {
            name: "lossless-cut",
            path: "..\\benchmark\\lossless-cut\\src\\renderer\\src\\",
            mainFile: "..\\benchmark\\lossless-cut\\src\\renderer\\src\\index.tsx",
            expectedComponents: 65,
            expectedPropDrillings: 29,
            rootComponent: "App"
        },
        {
            name: "superset",
            path: "..\\benchmark\\superset\\superset-frontend\\src\\",
            mainFile: "..\\benchmark\\superset\\superset-frontend\\src\\profile\\index.tsx",
            expectedComponents: 395,
            expectedPropDrillings: 75,
            rootComponent: "App"
        },
        {
            name: "lighthouse",
            path: "..\\benchmark\\lighthouse\\flow-report\\src\\",
            mainFile: "..\\benchmark\\lighthouse\\flow-report\\src\\app.tsx",
            expectedComponents: 46,
            expectedPropDrillings: 14,
            rootComponent: "App"
        }
    ];

    testProjects.forEach(({ name, path, mainFile, expectedComponents, expectedPropDrillings, rootComponent }) => {
        test(`Checking project: ${name}`, () => {
            const input = `node index.js ${path} ${mainFile} ${rootComponent}`;
            const output = execSync(input).toString();
            const outputLines = output.split("\n");
            const actualComponentsLog = outputLines.find(l => l.includes("Number of found"))
            const actualPropDrillingsLog = outputLines.find(l => l.includes("Prop Drilling Occurences"))
            expect(actualComponentsLog).toContain(`Number of found Components: ${expectedComponents}`);
            expect(actualPropDrillingsLog).toContain(`Found: ${expectedPropDrillings} Prop Drilling Occurences`);
        });
    })
})