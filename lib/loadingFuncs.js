import jscodeshift from 'jscodeshift';
import { ReactComponent } from './ReactComponent.js';
import { returnsJSX,resolveImportPath,resolveJscodeshiftParser } from './util.js';
import { fileType } from '../index.js';
function loadReactComponents(reactFiles) {
    let components = [];
    const j = resolveJscodeshiftParser(fileType);
    const componentIsExported = (reactFile, componentName) => reactFile.exports.exportList.includes(componentName);

    reactFiles.forEach(file =>{
      file.ast.find(j.FunctionDeclaration).forEach(path => {
        const componentName = path.node.id.name
        const {isUsedInHtml,isUsedInRootFile} = checkComponentAcrossFiles(reactFiles,componentName);
        if (returnsJSX(path, j) && componentName[0]===componentName[0].toUpperCase()
            && (isUsedInHtml || componentIsExported(file,componentName))) {
          let props = [];
          
          path.node.params.forEach(param => {
            if (param.type === 'ObjectPattern') {
              props = extractPropsFromObjectPattern(param);
            } else if(param.type === 'Identifier' && param.name==='props'){
                const propsUsages = extractPropsFromDeclaredWithIdentifierUsage(path.node.body, 'props');
                props.push(...propsUsages);
            }
          });
  
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
        const {isUsedInHtml,isUsedInRootFile} = checkComponentAcrossFiles(reactFiles,componentName);
        let extendsComponent = false;
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
            ((method.type === 'MethodDefinition') || (method.type === 'ClassMethod')) &&
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
        if(extendsComponent && componentName[0]===componentName[0].toUpperCase() && (isUsedInHtml || componentIsExported(file,componentName))){
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
            const {isUsedInHtml,isUsedInRootFile} = checkComponentAcrossFiles(reactFiles,componentName);
            if(declaration.init && declaration.init.type === 'ArrowFunctionExpression'
                 && returnsJSX(declaration.init, j) && componentName[0]===componentName[0].toUpperCase()
                 && componentName
                    && (isUsedInHtml || componentIsExported(file,componentName))) {
                let props = [];
                declaration.init.params.forEach(param => {
                    if(param.type === 'ObjectPattern'){
                        props = extractPropsFromObjectPattern(param);
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
        })
       })
     });
  
    return components;
}  

function extractPropsForClassComponents(j, renderMethod, classNode, ast){
    let props = [];
    // Handle Destructured Props
    j(renderMethod)
        .find(j.VariableDeclarator)
        .forEach(path => {
            if (
                path.node.init &&
                path.node.init.type === 'MemberExpression' &&
                path.node.init.object.type === 'ThisExpression' &&
                path.node.init.property.name === 'props' &&
                path.node.id.type === 'ObjectPattern'
            ) {
                path.node.id.properties.forEach(property => {
                    if (property.type === 'Property' && property.key.type === 'Identifier') {
                        props.push(property.key.name+'='+property.key.name);
                    }
                });
            }
        });
     // Handle Direct `this.props` References
    j(renderMethod)
        .find(j.MemberExpression, {
            object: { type: 'ThisExpression' },
            property: { name: 'props' }
        })
        .forEach(path => {
            if (path.parent.node.type === 'MemberExpression' &&
                path.parent.node.property.type === 'Identifier') {
                const propName = path.parent.node.property.name;
                if (!props.includes(propName)) {
                    props.push(propName+'='+propName);
                }
            }
        });
    // Handle TypeScript Constructor Parameter Properties
    j(classNode)
        .closest(j.ClassDeclaration)
        .find(j.ClassMethod, { key: { name: 'constructor' } })
        .forEach(constructorPath => {
            constructorPath.node.params.forEach(param => {
                if (
                    param.type === 'TSParameterProperty' &&
                    param.parameter.type === 'Identifier'
                ) {
                    props.push(`${param.parameter.name}=${param.parameter.name}`);
                }
            });
        });
    // Handle TypeScript Class Property Declarations
    j(classNode)
        .closest(j.ClassDeclaration)
        .find(j.ClassProperty, { key: { name: 'props' } })
        .forEach(propPath => {
            if (propPath.node.typeAnnotation) {
                const typeAnnotation = propPath.node.typeAnnotation.typeAnnotation;
                if (typeAnnotation.type === 'TSTypeLiteral') {
                    typeAnnotation.members.forEach(member => {
                        if (member.key && member.key.type === 'Identifier') {
                            props.push(`${member.key.name}=${member.key.name}`);
                        }
                    });
                }
            }
        });
    // Track Props from TypeScript Interface in Class Definition
    if (
        classNode.superTypeParameters &&
        classNode.superTypeParameters.params &&
        classNode.superTypeParameters.params.length > 0
      ) {
        const propsType = classNode.superTypeParameters.params[0];
        if (
          propsType.type === 'TSTypeReference' &&
          propsType.typeName &&
          propsType.typeName.type === 'Identifier'
        ) {
          const interfaceName = propsType.typeName.name;
          ast.find(j.TSInterfaceDeclaration, { id: { name: interfaceName } })
            .forEach(interfacePath => {
              interfacePath.node.body.body.forEach(member => {
                if (member.key && member.key.type === 'Identifier') {
                  props.push(`${member.key.name}=${member.key.name}`);
                }
              });
            });
        }
      }
    return props;
}

function extractPropsFromObjectPattern(objectPatternNode) {
    let props = [];
    objectPatternNode.properties.forEach(property => {
        if (property.type === 'Property') {
            const propName = property.key.name;
            const propValue = jscodeshift(property.value).toSource();
            props.push(`${propName}=${propValue}`);
        } else if (property.type === 'ObjectPattern') {
            const nestedProps = extractPropsFromObjectPattern(property);
            props.push(...nestedProps);
        } else if (property.type === 'ObjectProperty' && property.key && property.key.type === 'Identifier' &&
            property.value && property.value.name 
        ){
            const propName = property.key.name;
            const propValue = property.value.name;
            props.push(`${propName}=${propValue}`)
        }
    });

    return props;
}

function extractPropsFromDeclaredWithIdentifierUsage(ast, propsIdentifierName) {
    let propsUsages = [];
    jscodeshift(ast).find(jscodeshift.MemberExpression).forEach(path => {
            if (
                path.node.object.type === 'Identifier' &&
                path.node.object.name === propsIdentifierName && path.node.property.type === 'Identifier'
            ) {
               
                propsUsages.push(path.node.property.name+"="+path.node.property.name);
                
            }
        });
    return propsUsages;
}

function extractReturnElements(classOrFunctionNode) {
    let returnedElements = [];
  
    // Handle function components
    if (
      classOrFunctionNode.type === 'FunctionDeclaration' ||
      classOrFunctionNode.type === 'ArrowFunctionExpression'
    ) {
      if (classOrFunctionNode.body.type === 'BlockStatement') {
        classOrFunctionNode.body.body.forEach(node => {
          if (node.type === 'ReturnStatement' && node.argument) {
            returnedElements = returnedElements.concat(extractElementNames(node.argument));
          }
        });
      } else {
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
          member.key &&
          member.key.name === 'render'
        ) {
          // In most cases, member.value is the function (its body is a BlockStatement)
          const methodBody = member.value && member.value.body
            ? member.value.body
            : member.body; // fallback if member.value is not present
          if (methodBody && methodBody.type === 'BlockStatement') {
            methodBody.body.forEach(node => {
              if (node.type === 'ReturnStatement' && node.argument) {
                returnedElements = returnedElements.concat(extractElementNames(node.argument));
              }
              // Handle if-statements inside render
              if (node.type === 'IfStatement' && node.consequent && node.consequent.body) {
                node.consequent.body.forEach(p => {
                  if (p.type === 'ReturnStatement' && p.argument) {
                    returnedElements = returnedElements.concat(extractElementNames(p.argument));
                  }
                });
              }
              // Handle switch statements inside render
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
        // Additionally, for cases where the component uses a class property to store a render-like method
        else if (member.type === 'ClassProperty' && member.key.name === 'renderContent') {
          // For example, if renderContent is an arrow function defined as a class property
          if (member.value && member.value.body && member.value.body.type === 'BlockStatement') {
            member.value.body.body.forEach(node => {
              if (node.type === 'ReturnStatement' && node.argument) {
                returnedElements = returnedElements.concat(extractElementNames(node.argument));
              }
              if (node.type === 'IfStatement' && node.consequent && node.consequent.body) {
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
            elementNames.push(openingElement.name.property.name);
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

function checkComponentAcrossFiles(reactFiles, componentName) {
    for (const file of reactFiles) {
        const {isUsedInHtml,isUsedInRootFile} = file.checkComponentUsageInHtml(componentName);
        
        if (isUsedInHtml) {
            return {isUsedInHtml,isUsedInRootFile};
        }
    }
    const isUsedInHtml = false;
    const isUsedInRootFile = false; 
    return { isUsedInHtml, isUsedInRootFile};
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
    const countsOfReactComponentsWithGivenName = reactComponents.filter(comp => comp.name === componentName);
    if(countsOfReactComponentsWithGivenName.length === 1){
        //For Components with unique name
        return countsOfReactComponentsWithGivenName[0].reactFile.filePath+":"+componentName;
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