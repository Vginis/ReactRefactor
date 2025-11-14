const { execSync } = require("child_process"); // Works in Jest



describe("Automation tests for RefactoringReact's Prop Drilling and component detection", () => {
    const testProjects = [
        {
            path: "..\\testing-projects\\react-redux-realworld-example-app-master\\react-redux-realworld-example-app-master\\src",
            mainFile:"..\\testing-projects\\react-redux-realworld-example-app-master\\react-redux-realworld-example-app-master\\src\\index.js",
            expectedComponents: 32,
            expectedPropDrillings: 13,
            rootComponent: ""
        },
        {
            path: "..\\testing-projects\\react-proto-master_v2\\react-proto-master_v2\\src",
            mainFile:"..\\testing-projects\\react-proto-master_v2\\react-proto-master_v2\\src\\index.js",
            expectedComponents: 20,
            expectedPropDrillings: 5,
            rootComponent: ""
        },
        {
            path: "..\\testing-projects\\project_fitness_app-main\\project_fitness_app-main\\src",
            mainFile:"..\\testing-projects\\project_fitness_app-main\\project_fitness_app-main\\src\\index.js",
            expectedComponents: 17,
            expectedPropDrillings: 4,
            rootComponent: ""
        },
        {
            path: "..\\testing-projects\\Full-Stack-React-Projects-master\\Full-Stack-React-Projects-master\\Chapter05\\mern-social\\client",
            mainFile:"..\\testing-projects\\Full-Stack-React-Projects-master\\Full-Stack-React-Projects-master\\Chapter05\\mern-social\\client\\main.js",
            expectedComponents: 20,
            expectedPropDrillings: 2,
            rootComponent: ""
        },
        {
            path: "..\\testing-projects\\Whisper-main2\\Whisper-main\\client\\src",
            mainFile:"..\\testing-projects\\Whisper-main2\\Whisper-main\\client\\src\\index.jsx",
            expectedComponents: 33,
            expectedPropDrillings: 10,
            rootComponent: ""
        }
        ,
        {
            path: "..\\testing-projects\\ecommerce-react-master\\ecommerce-react-master\\src",
            mainFile:"..\\testing-projects\\ecommerce-react-master\\ecommerce-react-master\\src\\index.jsx",
            expectedComponents: 81,
            expectedPropDrillings: 2,
            rootComponent: 'App'
        },
        {
            path: "..\\testing-projects\\carbon-main\\carbon-main",
            mainFile:"..\\testing-projects\\carbon-main\\carbon-main\\pages\\index.js",
            expectedComponents: 100,
            expectedPropDrillings: 54,
            rootComponent: ""
        },
        {
            path: "..\\testing-projects\\prometheus-release-2.21\\prometheus-release-2.21\\web\\ui\\react-app\\src",
            mainFile:"..\\testing-projects\\prometheus-release-2.21\\prometheus-release-2.21\\web\\ui\\react-app\\src\\App.tsx",
            expectedComponents: 42,
            expectedPropDrillings: 8,
            rootComponent: "App"
        },
        {
            path: "..\\testing-projects\\tidb-release-6.5\\tidb-release-6.5\\br\\web\\src\\",
            mainFile:"..\\testing-projects\\tidb-release-6.5\\tidb-release-6.5\\br\\web\\src\\index.tsx",
            expectedComponents: 17,
            expectedPropDrillings: 6,
            rootComponent: "App"
        },
        {
            path: "..\\testing-projects\\mitmproxy-7.0.x\\mitmproxy-7.0.x\\web\\src\\js\\",
            mainFile:"..\\testing-projects\\mitmproxy-7.0.x\\mitmproxy-7.0.x\\web\\src\\js\\app.jsx",
            expectedComponents: 79,
            expectedPropDrillings: 15,
            rootComponent: "Response,Request"
        },
        {
            path: "..\\testing-projects\\conky-1.22.1\\conky-1.22.1\\web\\",
            mainFile:"..\\testing-projects\\conky-1.22.1\\conky-1.22.1\\web\\index.tsx",
            expectedComponents: 21,
            expectedPropDrillings: 1,
            rootComponent: ""
        },
        {
            path: "..\\testing-projects\\joplin-release-1.0\\joplin-release-1.0\\ElectronClient\\gui\\",
            mainFile:"..\\testing-projects\\joplin-release-1.0\\joplin-release-1.0\\ElectronClient\\gui\\Root.jsx",
            expectedComponents: 48,
            expectedPropDrillings: 5,
            rootComponent: "MainScreenComponent,ConfigScreenComponent tsx"
        },
        {
            path: "..\\testing-projects\\vitess-22.0.0-rc3\\vitess-22.0.0-rc3\\web\\vtadmin\\src\\",
            mainFile:"..\\testing-projects\\vitess-22.0.0-rc3\\vitess-22.0.0-rc3\\web\\vtadmin\\src\\index.tsx",
            expectedComponents: 112,
            expectedPropDrillings: 61,
            rootComponent: "App"
        },
        {
            path: "..\\testing-projects\\lossless-cut-master\\lossless-cut-master\\src\\renderer\\src\\",
            mainFile:"..\\testing-projects\\lossless-cut-master\\lossless-cut-master\\src\\renderer\\src\\index.tsx",
            expectedComponents: 65,
            expectedPropDrillings: 28,
            rootComponent: "App"
        },
        {
            path: "..\\testing-projects\\superset-2021.41.0\\superset-2021.41.0\\superset-frontend\\src\\",
            mainFile:"..\\testing-projects\\superset-2021.41.0\\superset-2021.41.0\\superset-frontend\\src\\views\\App.tsx",
            expectedComponents: 378,
            expectedPropDrillings: 75,
            rootComponent: "App"
        },
        {
            path: "..\\testing-projects\\lighthouse-main\\lighthouse-main\\flow-report\\src\\",
            mainFile:"..\\testing-projects\\lighthouse-main\\lighthouse-main\\flow-report\\src\\app.tsx",
            expectedComponents: 46,
            expectedPropDrillings: 14,
            rootComponent: "App"
        }
    ];

    testProjects.forEach(({ path, mainFile, expectedComponents, expectedPropDrillings, rootComponent }) => {
        test(`Checking project: ${path}`, () => {
                const input = `node index.js ${path} ${mainFile} ${rootComponent}`;
                const output = execSync(input).toString();
                expect(output).toContain(`Number of found Components: ${expectedComponents}`);
                expect(output).toContain(`Found: ${expectedPropDrillings} Prop Drilling Occurences`);
        });
    })
})