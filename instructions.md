# Reproducing results from RefactoringReact
This markdown document provides detailed instructions for reproducing the results extracted using my RefactoringReact tool.

## Step 1: Build project
Run the following command to install dependencies and build the project:

```bash
npm install
```

## Step 2: Run RefactoringReact for every project of the dataset

1. Project Fitness
```bash
node index.js ..testing-projects\project_fitness_app-main\project_fitness_app-main\src ..\testing-projects\project_fitness_app-main\project_fitness_app-main\src\index.js 
```
2. Carbon
```bash
node index.js ..\testing-projects\carbon-main\carbon-main ..\testing-projects\carbon-main\carbon-main\pages\index.js
```

3. React-Redux Realworld Example
```bash
node index.js ..\testing-projects\react-redux-realworld-example-app-master\react-redux-realworld-example-app-master\src ..\testing-projects\react-redux-realworld-example-app-master\react-redux-realworld-example-app-master\src\index.js
```

4. React Proto
```bash
node index.js ..\testing-projects\react-proto-master_v2\react-proto-master_v2\src ..\testing-projects\react-proto-master_v2\react-proto-master_v2\src\index.js
````

5. Ecommerce React
```bash
node index.js ..\testing-projects\ecommerce-react-master\ecommerce-react-master\src ..\testing-projects\ecommerce-react-master\ecommerce-react-master\src\index.jsx App
```

6. Whisper
```bash
node index.js ..\testing-projects\Whisper-main\Whisper-main\client\src ..\testing-projects\Whisper-main2\Whisper-main\client\src\index.jsx
```

7. Prometheus
```bash
node index.js ..\testing-projects\prometheus-release-2.21\prometheus-release-2.21\web\ui\react-app\src\ ..\testing-projects\prometheus-release-2.21\prometheus-release-2.21\web\ui\react-app\src\App.tsx App
```
8. TiDB
```bash
node index.js ..\testing-projects\tidb-release-6.5\tidb-release-6.5\br\web\src\ ..\testing-projects\tidb-release-6.5\tidb-release-6.5\br\web\src\index.tsx App
```

9. MiTM Proxy
```bash
node index.js ..\testing-projects\mitmproxy-7.0.x\mitmproxy-7.0.x\web\src\js\ ..\testing-projects\mitmproxy-7.0.x\mitmproxy-7.0.x\web\src\js\app.jsx Response,Request
```

10. Joplin
```bash
node index.js ..\testing-projects\joplin-release-1.0\joplin-release-1.0\ElectronClient\gui\ ..\testing-projects\joplin-release-1.0\joplin-release-1.0\ElectronClient\gui\Root.jsx MainScreenComponent,ConfigScreenComponent tsx
```

11. Conky
```bash
node index.js ..\testing-projects\conky-1.22.1\conky-1.22.1\web\ ..\testing-projects\conky-1.22.1\conky-1.22.1\web\index.tsx
```

12. Vitess
```bash
node index.js ..\\testing-projects\\vitess-22.0.0-rc3\\vitess-22.0.0-rc3\\web\\vtadmin\\src\\ ..\\testing-projects\\vitess-22.0.0-rc3\\vitess-22.0.0-rc3\\web\\vtadmin\\src\\index.tsx App
```

13. Lossless Cut
```bash
node index.js ..\\testing-projects\\lossless-cut-master\\lossless-cut-master\\src\\renderer\\src\\ ..\\testing-projects\\lossless-cut-master\\lossless-cut-master\\src\\renderer\\src\\index.tsx App
```

14. Apache Superset
```bash
node index.js ..\\testing-projects\\superset-2021.41.0\\superset-2021.41.0\\superset-frontend\\src\\ ..\\testing-projects\\superset-2021.41.0\\superset-2021.41.0\\superset-frontend\\src\\profile\\index.tsx App
```

15. Lighthouse
```bash
node index.js ..\\testing-projects\\lighthouse-main\\lighthouse-main\\flow-report\\src\\ ..\\testing-projects\\lighthouse-main\\lighthouse-main\\flow-report\\src\\app.tsx App
```