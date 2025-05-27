import { ReactComponent } from './ReactComponent.js';
import { returnsJSX,resolveImportPath,resolveJscodeshiftParser } from './util.js';
import { fileType } from '../index.js';
import { extractPropsFromObjectPattern,extractPropsFromDeclaredWithIdentifierUsage,extractPropsForClassComponents,extractPropsFromInnerDestructuring } from './Property.js';
function loadReactComponents(reactFiles, jsxElements) {
    let components = [];
    const j = resolveJscodeshiftParser(fileType);
    const componentIsExported = (reactFile, componentName) => reactFile.exports.exportList.includes(componentName);

    reactFiles.filter(rf => !rf.filePath.endsWith(".ts")).forEach(file =>{
      file.ast.find(j.FunctionDeclaration).forEach(path => {
        let componentName;
        if(path.node.id !== null){
          componentName = path.node.id.name;
        } else {
          const fileParts = file.filePath.split("\\");
          componentName = fileParts.pop().split(".")[0];
        }
        
      
        const {isUsedInHtml,isUsedInRootFile} = checkComponentAcrossFiles(jsxElements,componentName);
        if (returnsJSX(path, j) && componentName[0]===componentName[0].toUpperCase()
            && (isUsedInHtml || componentIsExported(file,componentName))) {
          let props = [];
          
          path.node.params.forEach(param => {
            if (param.type === 'ObjectPattern') {
                let propTypeNode = path.node.params.length > 0 && path.node.params[0].typeAnnotation
                ? path.node.params[0].typeAnnotation
                : undefined;
              props = extractPropsFromObjectPattern(param, file.ast, j, propTypeNode);
            } else if(param.type === 'Identifier' && param.name==='props'){
                const propsUsages = extractPropsFromDeclaredWithIdentifierUsage(path.node.body, 'props');
                props.push(...propsUsages);
            }
          });
          props.push(...extractPropsFromInnerDestructuring(j,file.ast));
  
          let returnedElements = extractReturnElements(path.node);
          for(let i=0;i<returnedElements.length;i++){
            if(returnedElements[i] === componentName){
                returnedElements = [];
                break;
            }
        }
          console.log(componentName + " is in " + file.filePath);
          components.push(
            new ReactComponent(
              componentName,
              props,
              returnedElements,
              [],
              'Function',
              file,
              isUsedInRootFile
            )
          );
        }
      });
  
      file.ast.find(j.ClassDeclaration).forEach(path => {
        const componentName = path.node.id.name
        const {isUsedInRootFile} = checkComponentAcrossFiles(jsxElements, componentName);
        let extendsComponent = false;
        //TODO Refactor this duplication here
        if(path.node.superClass && path.node.superClass.type==='Identifier'){
            const superClassName = path.node.superClass.name;
            if(superClassName==='Component' || superClassName==='PureComponent'){
                extendsComponent=true;
            }
        }
        if(path.node.superClass && path.node.superClass.type==='MemberExpression'){
            const superClassName = path.node.superClass.property.name;
            if(superClassName==='Component' || superClassName==='PureComponent'){
                extendsComponent=true;
            }
        }

        const renderMethod = path.node.body.body.find(method =>
            ((method.type === 'MethodDefinition') || (method.type === 'ClassMethod') || (method.type === 'ClassProperty')) &&
            method.key.name === 'render'
        );
        if(!extendsComponent) return;
        let props = extractPropsForClassComponents(j, renderMethod, path.node, file.ast);
        let returnedElements = extractReturnElements(path.node);
        for(let i=0;i<returnedElements.length;i++){
            if(returnedElements[i] === componentName){
                returnedElements = [];
                break;
            }
        }
        if(extendsComponent && componentName[0]===componentName[0].toUpperCase()){
            console.log(componentName + " is in " + file.filePath);
            components.push(
                new ReactComponent(
                    componentName,
                    props,
                    returnedElements,
                    [],
                    'Class',
                    file,
                    isUsedInRootFile
                )
                );
        }
       });

       file.ast.find(j.VariableDeclaration).forEach(path => {
        path.node.declarations.forEach(declaration => {
            const componentName = declaration.id.name;
            const {isUsedInHtml,isUsedInRootFile} = checkComponentAcrossFiles(jsxElements,componentName);
            if(declaration.init && declaration.init.type === 'ArrowFunctionExpression'
                 && returnsJSX(declaration.init, j) && componentName[0]===componentName[0].toUpperCase()
                 && componentName
                    && (isUsedInHtml || componentIsExported(file,componentName))) {
                let props = [];
                declaration.init.params.forEach(param => {
                    if(param.type === 'ObjectPattern'){
                        let propTypeNode = (declaration.id.typeAnnotation) ? declaration.id.typeAnnotation : undefined;
                        props = extractPropsFromObjectPattern(param,file.ast,j,propTypeNode);
                    } else if(param.type === 'Identifier' && param.name==='props'){
                        const propsUsages = extractPropsFromDeclaredWithIdentifierUsage(declaration.init.body, 'props');
                        props.push(...propsUsages);
                    }
                });

                let returnedElements = extractReturnElements(declaration.init);

                for(let i=0;i<returnedElements.length;i++){
                    if(returnedElements[i] === componentName){
                        returnedElements = [];
                        break;
                    }
                }
                console.log(componentName + " is in " + file.filePath);
                components.push(
                    new ReactComponent(
                        componentName,
                        props,
                        returnedElements,
                        [],
                        'ArrowFunction',
                        file,
                        isUsedInRootFile
                    )
                );
            }
            if(declaration.init?.type === "CallExpression" 
              && declaration?.init?.callee?.object?.name === "React"
               && declaration?.init?.callee?.property?.name === 'createClass'){
                let componentName = declaration.id.name;
                const { isUsedInRootFile } = checkComponentAcrossFiles(jsxElements, componentName);
    
                // Extract props and returned elements from the created class component
                let renderMethod;
                const classArgs = declaration?.init?.arguments;
                classArgs.forEach(cl => {
                  renderMethod = cl?.properties.filter(method => method?.key?.name === 'render');
                })
                
                let props = (renderMethod) ? extractPropsForClassComponents(j, renderMethod, declaration.init, file.ast) : [];
                let returnedElements = extractReturnElements(declaration.init);

                for (let i = 0; i < returnedElements.length; i++) {
                    if (returnedElements[i] === componentName) {
                        returnedElements = [];
                        break;
                    }
                }

                console.log(componentName + " is in " + file.filePath);
                components.push(
                    new ReactComponent(
                        componentName,
                        props,
                        returnedElements,
                        [],
                        'Class',
                        file,
                        isUsedInRootFile
                    )
                );
               }
            
        })
       })
     });
  
    return components;
}

function extractReturnElements(classOrFunctionNode) {
    let returnedElements = [];
    // Handle function components
    if (
      classOrFunctionNode.type === 'FunctionDeclaration' ||
      classOrFunctionNode.type === 'ArrowFunctionExpression' ||
      (classOrFunctionNode.type === 'CallExpression' && classOrFunctionNode?.callee?.object?.name==='React'
       && classOrFunctionNode?.callee?.property?.name === 'createClass')
    ) {
      if (classOrFunctionNode?.body?.type === 'BlockStatement') {
        returnedElements = extractElementsFromClassOrFunctionNodeBody(classOrFunctionNode)
      } else if(classOrFunctionNode.type === 'CallExpression') {
        classOrFunctionNode?.arguments.forEach(arg => arg?.properties.forEach(property => 
          returnedElements = returnedElements.concat(extractElementsFromClassOrFunctionNodeBody(property))))
      }
      else {
        returnedElements = returnedElements.concat(extractElementNames(classOrFunctionNode.body));
      }
    } 
    // Handle class components
    else if (classOrFunctionNode.type === 'ClassDeclaration') {
      classOrFunctionNode.body.body.forEach(member => {
        // Check for render method. In TS the method might be MethodDefinition, ClassMethod, or TSDeclareMethod.
        if (
          (member.type === 'MethodDefinition' ||
           member.type === 'ClassMethod' ||
           member.type === 'TSDeclareMethod') &&
          member.key
        ) {
          // In most cases, member.value is the function (its body is a BlockStatement)
          const methodBody = member?.value?.body
            ? member.value.body
            : member.body; // fallback if member.value is not present
          if (methodBody && methodBody.type === 'BlockStatement') {
            methodBody.body.forEach(node => {
              if (node.type === 'ReturnStatement' && node.argument) {
                returnedElements = returnedElements.concat(extractElementNames(node.argument));
              }
              // Handle if-statements inside render
              if (node.type === 'IfStatement' && node?.consequent?.body) {
                node.consequent.body.forEach(p => {
                  if (p.type === 'ReturnStatement' && p.argument) {
                    returnedElements = returnedElements.concat(extractElementNames(p.argument));
                  }
                  if(p.type ==='ExpressionStatement' && p.expression?.right?.type === "JSXElement" && p.expression?.right?.openingElement?.name?.name){
                    returnedElements.push(p.expression.right.openingElement.name.name);
                  }
                });
                node?.alternate?.body?.forEach(p => {
                  if (p.type === 'ReturnStatement' && p.argument) {
                    returnedElements = returnedElements.concat(extractElementNames(p.argument));
                  }
                  if(p.type ==='ExpressionStatement' && p.expression?.right?.type === "JSXElement" && p.expression?.right?.openingElement?.name?.name){
                    returnedElements.push(p.expression.right.openingElement.name.name);
                  }
                  if(p.type ==='ExpressionStatement' && p.expression?.right?.type === "JSXFragment" && p.expression?.right?.children){
                    p.expression.right.children.filter(c => c.type === "JSXElement").forEach(c => {
                      returnedElements.push(c?.openingElement?.name?.name);
                    })
                  }
                });
              }
              // Handle switch statements inside render
              if (node.type === 'SwitchStatement' && node.cases && node.cases.length > 0) {
                node.cases.forEach(nodeCase => {
                  if (
                    nodeCase.type === 'SwitchCase' &&
                    nodeCase?.consequent[0]?.type === 'ReturnStatement' &&
                    nodeCase.consequent[0].argument
                  ) {
                    const firstConsequent = nodeCase.consequent[0];
                    returnedElements = returnedElements.concat(extractElementNames(firstConsequent.argument));
                  }
                });
              }
            //Track elements hidden in variables
          if (node.type === 'VariableDeclaration') {
            node.declarations.forEach(decl => {
                if (decl.init && (decl.init.type === 'JSXElement' || decl.init.type === 'CallExpression') && decl.init?.openingElement?.name?.name) {
                    returnedElements.push(decl.init.openingElement.name.name);
                }

                if (
                  decl.init?.callee?.type === 'MemberExpression' &&
                  decl.init.arguments?.length
                ) {
                  decl.init.arguments.forEach(arg => {
                    if (
                      arg.type === 'ArrowFunctionExpression' ||
                      arg.type === 'FunctionExpression'
                    ) {
                      const body = arg.body;
                      if (body.type === 'JSXElement' || body.type === 'JSXFragment') {
                        returnedElements.push(...extractElementNames(body));
                      }
                      if (body.type === 'BlockStatement') {
                        body.body.forEach(statement => {
                          if (statement.type === 'ReturnStatement' && statement.argument) {
                            returnedElements.push(...extractElementNames(statement.argument));
                          }
                        });
                      }
                    }
                  });
                }

            });
            }
            });
          }
        }
        // Additionally, for cases where the component uses a class property to store a render-like method
        else if (member.type === 'ClassProperty' && member.key.name === 'renderContent') {
          // For example, if renderContent is an arrow function defined as a class property
          if (member?.value?.body && member.value.body.type === 'BlockStatement') {
            member.value.body.body.forEach(node => {
              if (node.type === 'ReturnStatement' && node.argument) {
                returnedElements = returnedElements.concat(extractElementNames(node.argument));
              }
              if (node.type === 'IfStatement' && node?.consequent?.body) {
                node.consequent.body.forEach(p => {
                  if (p.type === 'ReturnStatement' && p.argument) {
                    returnedElements = returnedElements.concat(extractElementNames(p.argument));
                  }
                });
              }
              if (node.type === 'SwitchStatement' && node.cases && node.cases.length > 0) {
                node.cases.forEach(nodeCase => {
                  if (
                    nodeCase.type === 'SwitchCase' &&
                    nodeCase.consequent &&
                    nodeCase.consequent[0] &&
                    nodeCase.consequent[0].type === 'ReturnStatement' &&
                    nodeCase.consequent[0].argument
                  ) {
                    const firstConsequent = nodeCase.consequent[0];
                    returnedElements = returnedElements.concat(extractElementNames(firstConsequent.argument));
                  }
                });
              }
            });
          }
        }
      });
    }
    const filteredReturnedElements = returnedElements.filter(el => el !== undefined)
    return filteredReturnedElements;
  }

function extractElementsFromClassOrFunctionNodeBody(classOrFunctionNode){
  const classOrFunctionNodeBody = (classOrFunctionNode.body) ? classOrFunctionNode : classOrFunctionNode.value;
  let returnedElements = [];
  classOrFunctionNodeBody?.body?.body?.forEach(node => {
    if (node.type === 'ReturnStatement' && node.argument) {
      returnedElements = returnedElements.concat(extractElementNames(node.argument));
    } else if(node.type === 'IfStatement'){
        let nestedConsequentJSxElement = node.consequent?.body?.[0]?.argument ?? node.consequent?.body?.[0]?.expression?.right ?? undefined;
        let nestedAlternateJSxElement = node.alternate?.body?.[0]?.argument ?? node.alternate?.body?.[0]?.expression?.right ?? undefined;
        
        if(nestedConsequentJSxElement){
          returnedElements = returnedElements.concat(extractElementNames(nestedConsequentJSxElement));
        }
        if(nestedAlternateJSxElement){
          returnedElements = returnedElements.concat(extractElementNames(nestedAlternateJSxElement));
        }
    }

    //Track elements hidden in variables
    returnedElements.push(...collectElementsInsideBody(node));
  });
  return returnedElements;
}

function collectElementsInsideBody(node){
  let returnedElements = [];
  if (node.type === 'VariableDeclaration') {
    node.declarations.forEach(decl => {
        if (decl.init && (decl.init.type === 'JSXElement')) {
            const elementName = decl.init?.openingElement?.name?.name;
            if(elementName){
              returnedElements.push(elementName)
            }
        }
    });
  } else if(node.type === 'ExpressionStatement' && node.expression && node.expression.type === 'CallExpression' && node.expression.arguments){
    node.expression.arguments.forEach(arg => returnedElements.push(arg?.openingElement?.name?.name))  
  } else if(node.type === 'ForOfStatement' && node?.body?.body){
    node.body.body.forEach(nod => {
      returnedElements.push(...collectElementsInsideBody(nod));
    })
  }
  return returnedElements;
}

function extractElementNames(node) {
    let elementNames = [];

    if (node.type === 'JSXElement') {
        const openingElement = node.openingElement;

        // Extract component name
        if (openingElement.name.type === 'JSXIdentifier') {
            elementNames.push(openingElement.name.name);
        } else if (openingElement.name.type === 'JSXMemberExpression') {
            // Extract only if the object isn't a known namespace like "Icons"
            const objectName = openingElement.name.object.name;
            const propertyName = openingElement.name.property.name;

            const ignoredNamespaces = ['Icons', 'Icon', 'SvgIcons']; // add more as needed. Todo: figure out a better solution rather than hardcoding invalid values. This is done for the superset project that has a false positive Icons.ListView 

            if (!ignoredNamespaces.includes(objectName)) {
                elementNames.push(propertyName);
            }
        }

        // Process attributes for the `component` prop
        openingElement.attributes.forEach(attr => {
            if (attr.type === 'JSXAttribute' && attr.name.name === 'component') {
                if (attr.value && attr.value.type === 'JSXExpressionContainer') {
                    const expression = attr.value.expression;
                    if (expression.type === 'Identifier') {
                        elementNames.push(expression.name); // Extract the component name
                    } else if (expression.type === 'MemberExpression') {
                        elementNames.push(extractMemberExpressionName(expression));
                    } else if(expression.type === 'ConditionalExpression'){
                       elementNames = elementNames.concat(extractConditionalExpressionFromIdentifier(expression,elementNames));
                    }
                }
            } else if (attr.type === 'JSXAttribute' && attr.value) {
                if (attr.value.type === 'JSXElement') {
                    elementNames = elementNames.concat(extractElementNames(attr.value));
                } else if (attr.value.type === 'JSXExpressionContainer' && attr.value.expression) {
                    const expression = attr.value.expression;
                    elementNames = elementNames.concat(extractElementNames(expression));
                }
            }
        });

        // Recursively process children
        node.children.forEach(child => {
            elementNames = elementNames.concat(extractElementNames(child));
            elementNames = elementNames.concat(extractElementsFromFunctionAsChild(child));
        });
    } 
    else if (node.type === 'JSXFragment') {
        node.children.forEach(child => {
            elementNames = elementNames.concat(extractElementNames(child));
        });
    } 
    else if (node.type === 'JSXExpressionContainer') {
        if (node.expression) {
            elementNames = elementNames.concat(extractElementNames(node.expression));
        }
    } 
    else if (node.type === 'ConditionalExpression') {
        elementNames = elementNames.concat(extractElementNames(node.consequent));
        elementNames = elementNames.concat(extractElementNames(node.alternate));
    } 
    else if (node.type === 'LogicalExpression') {
        elementNames = elementNames.concat(extractElementNames(node.left));
        elementNames = elementNames.concat(extractElementNames(node.right));
    } 
    else if (node.type === 'CallExpression') {
        node.arguments.forEach(arg => {
            if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
                elementNames = elementNames.concat(extractElementNames(arg.body));
            } else if (arg.type === 'JSXElement' || arg.type === 'JSXFragment') {
                elementNames = elementNames.concat(extractElementNames(arg));
            }
        });
    } else if (node.type === 'ChainExpression') {
        elementNames = elementNames.concat(extractElementNames(node.expression));
    } else if (node.type === 'MemberExpression') {
        elementNames.push(extractMemberExpressionName(node));
    }

    function extractMemberExpressionName(memberExpr) {
        if (memberExpr.type === 'JSXMemberExpression' || memberExpr.type === 'MemberExpression') {
            const objectName = memberExpr.object.name || extractMemberExpressionName(memberExpr.object);
            const propertyName = memberExpr.property.name;
            return propertyName;
        }
        return memberExpr.name || '';
    }
    return elementNames;
}

// Handle function-as-child like: {confirmDelete => (...) }
function extractElementsFromFunctionAsChild(child){
  let elementNames = [];
  if (
      child.type === 'JSXExpressionContainer' &&
      (child.expression?.type === 'ArrowFunctionExpression' ||
       child.expression?.type === 'FunctionExpression')
    ) {
      const fnBody = child.expression.body;
      if (fnBody.type === 'JSXElement' || fnBody.type === 'JSXFragment') {
        elementNames = elementNames.concat(extractElementNames(fnBody));
      } else if (fnBody.type === 'BlockStatement') {
        fnBody.body.forEach(statement => {
          if (statement.type === 'ReturnStatement' && statement.argument) {
            elementNames = elementNames.concat(extractElementNames(statement.argument));
          }
        });
      }
    }

    return elementNames;
} 

function extractConditionalExpressionFromIdentifier(expression, elementNames) {
    let conditionalExpressionNamesList = [];
    if (
        expression.alternate &&
        expression.alternate.type === 'ConditionalExpression' &&
        expression.consequent &&
        expression.consequent.type === 'ConditionalExpression'
    ) {
        conditionalExpressionNamesList = conditionalExpressionNamesList.concat(
            extractConditionalExpressionFromIdentifier(expression.alternate, elementNames)
        );
        conditionalExpressionNamesList = conditionalExpressionNamesList.concat(
            extractConditionalExpressionFromIdentifier(expression.consequent, elementNames)
        );
    } else {
        if (expression.consequent && expression.consequent.name) {
            conditionalExpressionNamesList.push(expression.consequent.name);
        }
        if (expression.alternate && expression.alternate.name) {
            conditionalExpressionNamesList.push(expression.alternate.name);
        }
    }

    return conditionalExpressionNamesList;
}

function addParents(reactComponents){
    reactComponents.forEach(comp => {
        const otherComponents = reactComponents.filter(component => component.name !== comp.name);
        let parents = [];
        otherComponents.forEach(comp2 => {
            if(comp2.returnedElements.includes(comp.name) || (comp.aliases && comp2.returnedElements.some(element => comp.aliases.aliases.includes(element)))){
                parents.push(comp2);
            } 
        });
        comp.parentElements = parents;
    });
}

function checkComponentAcrossFiles(jsxElements, componentName) {

    const isUsedInHtml = hasComponent(jsxElements, componentName);

    let isUsedInRootFile = false;
    if(isUsedInHtml){
      const component = Array.from(jsxElements).find(item => Object.keys(item)[0] === componentName);
      isUsedInRootFile = component ? Object.values(component)[0] : false;
    } 
    return { isUsedInHtml, isUsedInRootFile};
}

function hasComponent(jsxElements, componentName) {
  return Array.from(jsxElements).some(item => Object.keys(item)[0] === componentName);
}

function addCompositeKeyReturnedElements(reactComponents,reactFiles){
    reactComponents.forEach(component => {
        let updatedReturnedElements = component.returnedElements.map(componentName => constructCompositeKeys(componentName,component.reactFile.importDeclarations,reactFiles,reactComponents));
        updatedReturnedElements = updatedReturnedElements.filter(el => el !== null);
        component.returnedElementsByKey = updatedReturnedElements;
    })
}

function constructCompositeKeys(componentName, importDeclarations, reactFiles, reactComponents){
    let componentPath;
    let currenPath;
    const countsOfReactComponentsWithGivenName = reactComponents.filter(comp => comp.name === componentName 
      || (comp.aliases && comp.aliases.aliases.map(al => al.local).includes(componentName)));
    if(countsOfReactComponentsWithGivenName.length === 1){
        //For Components with unique name
        return countsOfReactComponentsWithGivenName[0].reactFile.filePath+":"+countsOfReactComponentsWithGivenName[0].name;
    }

    //For Components with not unique names
    importDeclarations.forEach(importDeclaration => {
        currenPath = importDeclaration.filePath;
        const importSpecifier = importDeclaration.importSpecifiers.filter(importSpecifier => importSpecifier.local === componentName);
        if(importSpecifier.length > 0){
            componentPath = resolveImportPath(reactFiles,importDeclaration.source,importDeclaration.filePath,componentName); 
        }
    })
    
    if (componentPath){
        return componentPath+":"+componentName;
    } else if(componentName && componentName[0]===componentName[0].toUpperCase()){
        return currenPath +":"+componentName;
    }
    return null;
}

export {loadReactComponents,addParents,extractReturnElements,checkComponentAcrossFiles,addCompositeKeyReturnedElements};