const { execSync } = require("child_process"); // Works in Jest



describe("Automation tests for RefactoringReact's Prop Drilling and component detection", () => {
    const testProjects = [
        {
            path: "..\\testing-projects\\react-redux-realworld-example-app-master\\react-redux-realworld-example-app-master\\src",
            mainFile:"..\\testing-projects\\react-redux-realworld-example-app-master\\react-redux-realworld-example-app-master\\src\\index.js",
            expectedComponents: 31,
            expectedPropDrillings: 9
        },
        {
            path: "..\\testing-projects\\react-proto-master_v2\\react-proto-master_v2\\src",
            mainFile:"..\\testing-projects\\react-proto-master_v2\\react-proto-master_v2\\src\\index.js",
            expectedComponents: 19,
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
            path: "..\\testing-projects\\Whisper-main\\Whisper-main\\client\\src",
            mainFile:"..\\testing-projects\\Whisper-main\\Whisper-main\\client\\src\\index.jsx",
            expectedComponents: 31,
            expectedPropDrillings: 1,
            rootComponent: ""
        }
        ,
        {
            path: "..\\testing-projects\\ecommerce-react-master\\ecommerce-react-master\\src",
            mainFile:"..\\testing-projects\\ecommerce-react-master\\ecommerce-react-master\\src\\index.jsx",
            expectedComponents: 82,
            expectedPropDrillings: 2,
            rootComponent: 'App'
        },
        {
            path: "..\\testing-projects\\carbon-main\\carbon-main",
            mainFile:"..\\testing-projects\\carbon-main\\carbon-main\\pages\\index.js",
            expectedComponents: 100,
            expectedPropDrillings: 48,
            rootComponent: ""
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