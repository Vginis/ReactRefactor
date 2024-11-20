import jscodeshift from 'jscodeshift';
import { ReactComponent } from './ReactComponent.js';
import { returnsJSX } from './util.js';
function loadReactComponents(reactFiles) {
    let components = [];
    const j = jscodeshift;
    const componentIsExported = (reactFile, componentName) => reactFile.exports.exportList.includes(componentName);

    reactFiles.forEach(file =>{
      file.ast.find(j.FunctionDeclaration).forEach(path => {
        const {isUsedInHtml,isUsedInRootFile} = checkComponentAcrossFiles(reactFiles,path.node.id.name);
        if (returnsJSX(path, j) && path.node.id.name[0]===path.node.id.name[0].toUpperCase()
            && (isUsedInHtml || componentIsExported(file,path.node.id.name))) {
          let props = [];
          
          path.node.params.forEach(param => {
            if (param.type === 'ObjectPattern') {
              props = extractPropsFromObjectPattern(param);
            }
          });
  
          let returnedElements = extractReturnElements(path.node);
          for(let i=0;i<returnedElements.length;i++){
            if(returnedElements[i] === path.node.id.name){
                returnedElements = [];
                break;
            }
        }
          console.log(path.node.id.name + " is in " + file.filePath);
          components.push(
            new ReactComponent(
              path.node.id.name,
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
        let props = [];
        let returnedElements = [];
        const {isUsedInHtml,isUsedInRootFile} = checkComponentAcrossFiles(reactFiles,path.node.id.name);
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
            method.type === 'MethodDefinition' &&
            method.key.name === 'render'
        );
        if(!extendsComponent) return;
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
        returnedElements = extractReturnElements(path.node);
        for(let i=0;i<returnedElements.length;i++){
            if(returnedElements[i] === path.node.id.name){
                returnedElements = [];
                break;
            }
        }
        if(extendsComponent && path.node.id.name[0]===path.node.id.name[0].toUpperCase() && (isUsedInHtml || componentIsExported(file,path.node.id.name))){
            console.log(path.node.id.name + " is in " + file.filePath);
            components.push(
                new ReactComponent(
                    path.node.id.name,
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
            const {isUsedInHtml,isUsedInRootFile} = checkComponentAcrossFiles(reactFiles,declaration.id.name);
            if(declaration.init && declaration.init.type === 'ArrowFunctionExpression'
                 && returnsJSX(declaration.init, j) && declaration.id.name[0]===declaration.id.name[0].toUpperCase()
                 && declaration.id.name
                    && (isUsedInHtml || componentIsExported(file,declaration.id.name))) {
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
                    if(returnedElements[i] === declaration.id.name){
                        returnedElements = [];
                        break;
                    }
                }
                console.log(declaration.id.name + " is in " + file.filePath);
                components.push(
                    new ReactComponent(
                        declaration.id.name,
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
    if (classOrFunctionNode.type === 'FunctionDeclaration' || classOrFunctionNode.type === 'ArrowFunctionExpression') {
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
            if (member.type === 'MethodDefinition' && member.key.name === 'render') {
                const renderBody = member.value.body.body;
                renderBody.forEach(node => {
                    if (node.type === 'ReturnStatement' && node.argument) {
                        returnedElements = returnedElements.concat(extractElementNames(node.argument));
                    }
                    if (node.type === 'IfStatement' && node.consequent.body) {
                        node.consequent.body.forEach(p => {
                            if (p.type === 'ReturnStatement' && p.argument) {
                                returnedElements = returnedElements.concat(extractElementNames(p.argument));
                            }
                        });
                    }
                });
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
    } 
    else if (node.type === 'MemberExpression') {
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

export {loadReactComponents,addParents,extractReturnElements,checkComponentAcrossFiles};