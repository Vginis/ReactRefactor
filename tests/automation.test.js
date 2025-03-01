const { execSync } = require("child_process"); // ✅ Works in Jest



describe("Automation tests for RefactoringReact's Prop Drilling and component detection", () => {
    const testProjects = [
        {
            path: "..\\code2\\my-app\\src",
            mainFile:"..\\code2\\my-app\\src\\index.js",
            expectedComponents: 9,
            expectedPropDrillings: 2
        },
        {
            path: "..\\react-redux-realworld-example-app-master\\react-redux-realworld-example-app-master\\src",
            mainFile:"..\\react-redux-realworld-example-app-master\\react-redux-realworld-example-app-master\\src\\index.js",
            expectedComponents: 31,
            expectedPropDrillings: 9
        },
        {
            path: "..\\react-proto-master_v2\\react-proto-master_v2\\src",
            mainFile:"..\\react-proto-master_v2\\react-proto-master_v2\\src\\index.js",
            expectedComponents: 19,
            expectedPropDrillings: 5
        },
        {
            path: "..\\project_fitness_app-main\\project_fitness_app-main\\src",
            mainFile:"..\\project_fitness_app-main\\project_fitness_app-main\\src\\index.js",
            expectedComponents: 17,
            expectedPropDrillings: 4
        },
        {
            path: "..\\Full-Stack-React-Projects-master\\Full-Stack-React-Projects-master\\Chapter05\\mern-social\\client",
            mainFile:"..\\Full-Stack-React-Projects-master\\Full-Stack-React-Projects-master\\Chapter05\\mern-social\\client\\main.js",
            expectedComponents: 20,
            expectedPropDrillings: 2
        },
        {
            path: "..\\Whisper-main\\Whisper-main\\client\\src",
            mainFile:"..\\Whisper-main\\Whisper-main\\client\\src\\index.jsx",
            expectedComponents: 31,
            expectedPropDrillings: 1
        }
        //,
        // {
        //     path: "..\\ecommerce-react-master\\ecommerce-react-master\\src",
        //     mainFile:"..\\ecommerce-react-master\\ecommerce-react-master\\src\\index.jsx",
        //     expectedComponents: 80,
        //     expectedPropDrillings: 2
        // },
        // {
        //     path: "..\\carbon-main\\carbon-main",
        //     mainFile:"..\\carbon-main\\carbon-main\\pages\\index.js",
        //     expectedComponents: 99,
        //     expectedPropDrillings: 41
        // }
    ];

    testProjects.forEach(({ path, mainFile, expectedComponents, expectedPropDrillings }) => {
        test(`Checking project: ${path}`, () => {
                const input = `node index.js ${path} ${mainFile}`;
                const output = execSync(input).toString();
                expect(output).toContain(`Number of found Components: ${expectedComponents}`);
                expect(output).toContain(`Found: ${expectedPropDrillings} Prop Drilling Occurences`);
        });
    })
})