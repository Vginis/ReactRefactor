import path from 'path';
import * as fs from 'fs';
import parserFor from './Parser.js'
import { extractExports, extractReexports } from './Export.js';
import { extractImportStatements } from './ImportStatement.js';
import { extractGlobalCliVariables } from './cli.js';
import FileManager from './FileManager.js';
import { astLocationMatches } from './ast-utils.js';

const { projectPath, PATH_SEPARATOR } = extractGlobalCliVariables();

class ReactFile {
  constructor(ast, j, filePath, isRootFile = false, importStmts = []) {
    this.ast = ast;
    this.j = j;
    this.filePath = filePath;
    this.isRootFile = isRootFile;
    // list of ImportStatement objects, populated after exports resolution
    this.importStatements = importStmts;
    this.reactComponents = []
    // reference to an Export object, will be intialized after creation
    this.exports = null;
    this.reexportStatements = null;
    // associates local names within the file to components imported from other files
    this.localNameToImportedComponent = new Map()
    // associates names of exported components with the actual component objects
    // it also includes names and component mappings for reexported components
    this.exportedNameToComponent = new Map()
    // associates local names within the file to components declared in the file
    this.localNamesToComponents = new Map()
    // maps local identifiers to functional units within the file
    this.identifierToAstMap = this.identifierToFunctionalDeclarationMap()
    // maps reexported names to the actual components

    //this.reexportedNameToComponent = new Map()
    // declares whether the file reexports one or more declarations
    //this.hasReexports = false;
  }

  identifierToFunctionalDeclarationMap() {

    let identifierToAstMap = new Map()
    const j = this.j;

    if (!this.ast) return identifierToAstMap;

    this.ast.find(j.FunctionDeclaration).forEach(path => {
      let functionDeclaration = path.node
      let name = functionDeclaration.id ? functionDeclaration.id.name : this.fileNameNoExtension
      identifierToAstMap.set(name, functionDeclaration)
    })

    this.ast.find(j.ClassDeclaration).forEach(path => {
      let classDeclaration = path.node
      let name = classDeclaration.id ? classDeclaration.id.name : this.fileNameNoExtension
      identifierToAstMap.set(name, classDeclaration)
    })


    this.ast.find(j.VariableDeclarator).forEach(path => {
      let name = path.node.id.name
      let init = path.node.init
      if (!init) return
      if (init.type === "FunctionExpression"
        || init.type === "ArrowFunctionExpression"
        || init.type === "ClassExpression") {
        identifierToAstMap.set(name, init)
      }
    })

    // also detect call expressions that receive as argument names already
    // identified as part of previous searches
    this.ast.find(j.VariableDeclarator).forEach(path => {
      let name = path.node.id.name
      let init = path.node.init
      if (!init) return
      if (init.type === "CallExpression") {
        if (init.callee.type === "Identifier" ||
          init.callee.type === "CallExpression") {
          registerFunctionAliasesInCallArguments(init.arguments,
            name, identifierToAstMap)
        }
      }
    })

    function registerFunctionAliasesInCallArguments(args, alias, identifierToAstMap) {
      for (let argNode of args) {
        if (argNode.type !== "Identifier") continue;
        let argName = argNode.name
        let astNode = identifierToAstMap.get(argName)
        if (astNode) {
          identifierToAstMap.set(alias, astNode)
        }
      }
    }

    return identifierToAstMap
  }

  resolveAliases() {
    // resolve local aliases
    this.localNamesToComponents.forEach((component, localName) => {
      if (component.name !== localName) {
        component.addAlias(localName, this)
      }
    })
    // resolve imported name aliases
    this.localNameToImportedComponent.forEach((component, localName) => {
      if (component.name !== localName) {
        component.addAlias(localName, this)
      }
    })
  }

  /**
   * Should be invoked after resolution of exported components (resolveExportedComponents)
   */
  resolveReexportedComponents() {

    if (!this.reexportStatements) {
      throw new Error("Should be invoked after extractReexports()")
    }

    for (let reexportStatement of this.reexportStatements) {

      let sourceFile = reexportStatement.importedReactFile
      if (!sourceFile) return;

      for (let declaration of reexportStatement.exportedDeclarations) {

        if (declaration.name === "*") {
          // TBD
        } else { // named export
          // local name here matches the exported name in the source file
          const component = sourceFile.getExportedComponentDeclaration(declaration.name)
          declaration.component = component
          if (component) {
            this.exportedNameToComponent.set(declaration.alias, component)
          }
        }
      }
    }
  }

  /**
   * Called after react component loading,
   * to associate ExportedDeclaration objects (members of this.exports)
   * with the actual exported component.
   * 
   * Populates the exportedNameToComponent map
   */
  resolveExportedComponents() {
    if (!this.exports || !this.exports.exportedDeclarations) {
      throw new Error("Should be invoked after loading exported declarations.")
    }

    this.exports.exportedDeclarations.forEach(declaration => {
      for (let component of this.reactComponents) {
        if (astLocationMatches(component.astNode, declaration.astNode)) {
          declaration.component = component
          if (declaration.isDefault) {
            this.exportedNameToComponent.set("default", component)
          } else {
            this.exportedNameToComponent.set(declaration.alias, component)
          }
        }
      }
    })
  }

  /**
   * Populates the localNamesToComponents map that associates local names 
   * in the react file to react components declared within the file
   * 
   * Should be invoked after imported components' resolution
   */
  resolveLocalComponents() {

    this.reactComponents.forEach(component => {
      this.localNamesToComponents.set(component.name, component)

      // add also aliases related to wrapper functions
      this.identifierToAstMap.forEach((astNode, identifier) => {
        if (astLocationMatches(astNode, component.astNode)) {
          if (identifier !== component.name) { // alias
            this.localNamesToComponents.set(identifier, component)
          }
        }
      })
    });
  }

  getLocalComponent(localName) {
    return this.localNamesToComponents.get(localName)
  }
  /**
   * Populates the localNamesToImportedComponents map.
   * Should be invoked after resolveExportedComponents during
   * component loading
   */
  resolveImportedComponents() {

    if (!this.importStatements) return;

    for (let importStatements of this.importStatements) {

      let importedReactFile = importStatements.importedReactFile
      if (!importedReactFile) continue;

      importStatements.importSpecifiers.forEach(specifier => {

        // namespace import
        if (specifier.original === "*") {
          resolveNamespaceImport(specifier.local, importedReactFile,
            this.localNameToImportedComponent)
          return;
        }

        // other types of imports
        let exportedName = specifier.original
        let localName = specifier.local
        let importedComponent = null

        if (specifier.isDefault) {
          importedComponent = importedReactFile.getExportedComponentDeclaration("default")
        } else {
          importedComponent = importedReactFile.getExportedComponentDeclaration(exportedName)
        }
        if (importedComponent) {
          this.localNameToImportedComponent.set(localName, importedComponent)
        }
      })
    }

    function resolveNamespaceImport(namespace, importedReactFile, localNameToComponentMap) {
      if (!importedReactFile.exports) return;
      for (let exportedDeclaration of importedReactFile.exports.exportedDeclarations) {
        if (exportedDeclaration.component) {
          let localName = namespace + "." + exportedDeclaration.alias
          localNameToComponentMap.set(localName, exportedDeclaration.component)
        }
      }
    }
  }

  getImportedComponentDeclaration(localName) {
    return this.localNameToImportedComponent.get(localName)
  }

  /**
   * Returns a component declaration corresponding to the given
   * exported name of the file
   * @param {string} exportedName Provide keyword default for default export
   * @returns ReactComponent
   */
  getExportedComponentDeclaration(exportedName) {
    return this.exportedNameToComponent.get(exportedName)
  }

  getExportedNameForComponent(component) {

    if (!this.exports || !this.exports.exportedDeclarations) {
      return null;
    }

    for (let declaration of this.exports.exportedDeclarations) {
      if (declaration.name === component.name) {
        return declaration.alias
      }
    }
    return null;
  }

  addReactComponents(componentList) {
    this.reactComponents.push(...componentList)
  }

  loadFileAndAst() {
    //const j = resolveJscodeshiftParser(fileType);
    const filePath = this.filePath;
    const ast = this.ast;
    const j = this.j
    return { j, filePath, ast };
  }

  /**
   * The relative path of the file
   */
  get relativePath() {
    if (!this._relativePath) {
      this._relativePath = this.relativePathSegments.join(PATH_SEPARATOR)
    }
    return this._relativePath
  }

  get relativePathSegments() {
    if (!this._relativePathSegments) {
      let filePathSegments = this.filePath.split(/[\\\/]/)
      let projectPathSegments = globalThis.projectPath.split(/[\\\/]/).filter(s => s.trim() !== '')
      this._relativePathSegments = filePathSegments.slice(projectPathSegments.length)
    }
    return this._relativePathSegments
  }

  get relativeParentDirectoryPath() {
    if (!this._relativeParentDirectoryPath) {
      let filePathSegments = [...this.relativePathSegments]
      // remove file name
      filePathSegments.pop()
      this._relativeParentDirectoryPath = filePathSegments.join(PATH_SEPARATOR)
    }
    return this._relativeParentDirectoryPath
  }

  /**
   * The name of the file without extension and any path segments
   */
  get fileNameNoExtension() {
    if (!this._fileNameNoExtension) {
      const fileParts = this.filePath.split(PATH_SEPARATOR);
      // get file name, split by . 
      const fileNameParts = fileParts.pop().split('.')
      // drop last extension
      fileNameParts.pop()
      this._fileNameNoExtension = fileNameParts.join(".")
    }
    return this._fileNameNoExtension
  }

  get fileName() {
    if (!this._fileName) {
      const fileParts = this.filePath.split(PATH_SEPARATOR);
      this._fileName = fileParts.pop()
    }
    return this._fileName
  }

  get fileType() {
    return ReactFile.getFileExtension(this.filePath)
  }

  checkComponentUsageInHtml(componentName) {
    //const j = resolveJscodeshiftParser(fileType);
    let isUsedInHtml = false;
    let isUsedInRootFile = this.isRootFile || false;
    let componentFound = false;
    const roots = new Set();

    const isJSXIdentifierMatch = (element, name) =>
      element && element.type === 'JSXIdentifier' && element.name === name;

    const checkJSXElement = (node) => {
      let componentFoundLocally = false;

      if (node.type === 'JSXElement') {
        const { openingElement, children } = node;

        if (isJSXIdentifierMatch(openingElement.name, componentName)) {
          componentFound = true;
          componentFoundLocally = true;
          isUsedInHtml = true;
        }

        children?.forEach(child => {
          if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
            componentFoundLocally = checkJSXElement(child) || componentFoundLocally;
          }
        });

        openingElement?.attributes?.forEach(attr => {
          if (attr.type === 'JSXAttribute') {
            if (attr.value?.type === 'JSXExpressionContainer' && attr.value.expression.type === 'Identifier') {
              if (attr.value.expression.name === componentName) {
                componentFound = true;
                componentFoundLocally = true;
                isUsedInHtml = true;
              }
            } else if (attr.value?.type === 'JSXElement' || attr.value?.type === 'JSXFragment') {
              componentFoundLocally = checkJSXElement(attr.value) || componentFoundLocally;
            }
          }
        });

      } else if (node.type === 'JSXFragment') {
        node.children?.forEach(child => {
          componentFoundLocally = checkJSXElement(child) || componentFoundLocally;
        });

      } else if (node.type === 'ConditionalExpression') {
        componentFoundLocally = checkJSXElement(node.consequent) || componentFoundLocally;
        componentFoundLocally = checkJSXElement(node.alternate) || componentFoundLocally;

      } else if (node.type === 'LogicalExpression') {
        componentFoundLocally = checkJSXElement(node.left) || componentFoundLocally;
        componentFoundLocally = checkJSXElement(node.right) || componentFoundLocally;

      } else if (node.type === 'CallExpression') {
        node.arguments.forEach(arg => {
          if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
            componentFoundLocally = checkJSXElement(arg.body) || componentFoundLocally;
          } else if (arg.type === 'JSXElement' || arg.type === 'JSXFragment') {
            componentFoundLocally = checkJSXElement(arg) || componentFoundLocally;
          }
        });

      } else if (node.type === 'JSXExpressionContainer') {
        componentFoundLocally = checkJSXElement(node.expression) || componentFoundLocally;
      }

      return componentFoundLocally;
    };
    this.ast.find(j.JSXElement).forEach((path) => {
      const elementFound = checkJSXElement(path.node);
      if (elementFound) {
        componentFound = true;
      }
    });

    // ReactDOM.createRoot and render usage checks
    const checkRenderCalls = (path, componentFound) => {
      if (!componentFound) return;
      const { callee } = path.node;

      // Utility to check if a method is being called on ReactDOM
      const isReactRenderCall = (obj, method) =>
        callee.type === 'MemberExpression' && callee.object.name === obj && callee.property.name === method;

      if (isReactRenderCall('ReactDOM', 'createRoot') && path.parent.node.type === 'VariableDeclarator') {
        roots.add(path.parent.node.id.name);
      }

      if (isReactRenderCall('ReactDOM', 'render')) {
        isUsedInHtml = true;
      }

      if (callee.type === 'MemberExpression' && roots.has(callee.object.name) && callee.property.name === 'render') {
        isUsedInHtml = true;
      }

      if (isReactRenderCall('ReactDOM', 'createRoot') && callee.object.type === 'CallExpression' && callee.property.name === 'render') {
        isUsedInHtml = true;
      }
    };

    // Find and check all CallExpression nodes for ReactDOM usage
    this.ast.find(j.CallExpression).forEach((path) => checkRenderCalls(path, componentFound));
    return { isUsedInHtml, isUsedInRootFile };
  }

  findMostNestedComponent(components) {
    let mostNestedComponent = null;
    let maxDepth = -1;
    //const j = resolveJscodeshiftParser(fileType);

    this.ast.find(this.j.JSXElement).forEach(path => {
      const openingElement = path.node.openingElement;
      const tagName = openingElement.name?.name;

      if (components.includes(tagName)) {
        const depth = this.calculateJSXDepth(path);
        if (depth > maxDepth) {
          maxDepth = depth;
          mostNestedComponent = tagName;
        }
      }

      openingElement.attributes?.forEach(attr => {
        if (attr.type === 'JSXAttribute' && attr.value?.type === 'JSXExpressionContainer') {
          const expression = attr.value.expression;
          if (expression.type === 'Identifier' && components.includes(expression.name)) {
            const depth = this.calculateJSXDepth(path);
            if (depth > maxDepth) {
              maxDepth = depth;
              mostNestedComponent = expression.name;
            }
          }
        }
      });
    });

    return mostNestedComponent;
  }


  calculateJSXDepth(path) {
    let depth = 0;
    let currentPath = path;

    while (currentPath.parentPath) {
      if (currentPath.parentPath.value.type === 'JSXElement') {
        depth++;
      }
      currentPath = currentPath.parentPath;
    }

    return depth;
  }

  removePropFromPropType(reactComponentName, prop) {
    const { j } = this.loadFileAndAst();
    this.ast.find(j.ExpressionStatement)
      .filter(path => {
        // Check if the expression is an assignment to propTypes
        const { left, right } = path.value.expression || {};
        return (
          left?.object?.name === reactComponentName &&
          left?.property?.name === 'propTypes' &&
          right?.properties
        );
      })
      .forEach(path => {
        const newProperties = path.value.expression.right.properties.filter(
          property => property.key.name !== prop
        );

        path.value.expression.right.properties = newProperties;
      });
  }
}

ReactFile.getFileExtension = function (path) {
  let filePathSegments = path.split(/[\\\/]/)
  let fileName = filePathSegments[filePathSegments.length - 1]
  return fileName.split(/\./)[1]
}


function parseReactFile(file) {
  let filePath = null;
  if (file.includes(".test.") || file.endsWith(".d.ts") || file.includes(".spec.") || file.includes(".styled.")) {
    return;
  }
  if ((file.endsWith(".js") || file.endsWith(".jsx") || file.endsWith(".tsx") || file.endsWith(".ts"))) {
    filePath = file;
  } else {
    // FIXME: Do we need this statement?
    filePath = path.join(projectPath, file);
  }
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const j = parserFor(filePath)
  let ast = null;

  try {
    ast = j(fileContent);
  } catch {
    //console.log('Skipping file > ', filePath)
    return null;
  }
  return { ast, j, filePath }
}

function loadReactFiles(files, rootFileName) {
  let reactFiles = [];
  let jsxElements = new Set();

  files.forEach(file => {

    let result = parseReactFile(file)

    if (!result) return;

    let { ast, j, filePath } = result;

    let isRootFile = false;
    if (rootFileName === file) {
      isRootFile = true;
    }
    const addedJsxElemnts = extractJSXElements(ast, j, isRootFile);
    addedJsxElemnts.forEach(el => jsxElements.add(el));
    const reactFile = new ReactFile(ast, j, filePath, isRootFile, jsxElements);
    extractExports(reactFile);
    reactFiles.push(reactFile);
  });

  globalThis.fileManager = new FileManager(reactFiles)

  //Extract jsx names in a Set to reduce complexity.
  extractImportStatements(reactFiles);
  extractReexports(reactFiles)

  const filteredJsxElements = filterJsxElements(jsxElements);

  return { reactFiles, filteredJsxElements };
}

function extractJSXElements(ast, j, isRootFile) {
  let jsxElements = new Set();
  //const j = resolveJscodeshiftParser(jscodeshift)
  ast.find(j.JSXElement).forEach(el => {
    const elementName = el?.value?.openingElement?.name?.name;
    if (elementName && elementName[0] === elementName[0].toUpperCase())
      //e.g. <ScrollMenu />
      jsxElements.add({ [elementName]: isRootFile });
    const attributes = el?.value?.openingElement?.attributes;
    if (attributes) {
      attributes.forEach(attr => {
        //e.g. <ScrollMenu LeftArrow={LeftArrow}/>
        const attributeName = attr.value?.expression?.name;
        if (attr.type === 'JSXAttribute' && attributeName && attributeName[0] === attributeName[0].toUpperCase()) {
          jsxElements.add({ [attributeName]: isRootFile });
        }
      })
    }
  });

  return jsxElements;
}

function filterJsxElements(jsxElements) {
  const uniqueElements = new Map();

  for (const item of jsxElements) {
    const [key, value] = Object.entries(item)[0];
    // Update the map only if it's true or the key is not already in the map
    if (value || !uniqueElements.has(key)) {
      uniqueElements.set(key, value);
    }
  }

  const filteredElements = new Set(
    Array.from(uniqueElements).map(([key, value]) => ({ [key]: value }))
  );
  return filteredElements;
}

export { ReactFile, loadReactFiles, parseReactFile, PATH_SEPARATOR };