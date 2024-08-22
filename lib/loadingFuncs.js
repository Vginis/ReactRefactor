import path from 'path';
import * as fs from 'fs';
import jscodeshift from 'jscodeshift';
import { ReactComponent } from './ReactComponent.js';
import { returnsJSX } from './util.js';
function loadReactComponents(reactFiles) {
    let components = [];
    const j = jscodeshift;
  
    reactFiles.forEach(file => {
      file.ast.find(j.FunctionDeclaration).forEach(path => {
        if (returnsJSX(path, j)) {
          let props = [];
          
          path.node.params.forEach(param => {
            if (param.type === 'ObjectPattern') {
              props = extractPropsFromObjectPattern(param);
            }
          });
  
          const returnedElements = extractReturnElements(path.node);
          components.push(
            new ReactComponent(
              path.node.id.name,
              props,
              returnedElements,
              [],
              file.filePath,
              file.ast,
              'Function'
            )
          );
  
          extractImportDeclarations(components);
        }
      });
  
      file.ast.find(j.ClassDeclaration).forEach(path => {
        const className = path.node.id.name;
        let props = [];
        let returnedElements = [];
  
        const renderMethod = path.node.body.body.find(method =>
            method.type === 'MethodDefinition' &&
            method.key.name === 'render'
        );
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

        components.push(
        new ReactComponent(
            path.node.id.name,
            props,
            returnedElements,
            [],
            file.filePath,
            file.ast,
            'Class'
        )
        );
  
        extractImportDeclarations(components);
       });

       file.ast.find(j.VariableDeclaration).forEach(path => {
        path.node.declarations.forEach(declaration => {
            if(declaration.init && declaration.init.type === 'ArrowFunctionExpression' && returnsJSX(declaration.init, j)){
                let props = [];
                declaration.init.params.forEach(param => {
                    if(param.type === 'ObjectPattern'){
                        props = extractPropsFromObjectPattern(param);
                    }
                });
                const returnedElements = extractReturnElements(declaration.init);

                components.push(
                    new ReactComponent(
                        declaration.id.name,
                        props,
                        returnedElements,
                        [],
                        file.filePath,
                        file.ast,
                        'ArrowFunction'
                    )
                );

                extractImportDeclarations(components);
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

function extractReturnElements(classOrFunctionNode) {
    let returnedElements = [];

    // Handle function components
    if (classOrFunctionNode.type === 'FunctionDeclaration' || classOrFunctionNode.type === 'ArrowFunctionExpression') {
        // Handle arrow function bodies that are wrapped in curly braces
        if (classOrFunctionNode.body.type === 'BlockStatement') {
            classOrFunctionNode.body.body.forEach(node => {
                if (node.type === 'ReturnStatement') {
                    if (node.argument && (node.argument.type === 'JSXElement' || node.argument.type === 'JSXFragment')) {
                        returnedElements = returnedElements.concat(extractElementNames(node.argument));
                    }
                }
            });
        } 
        // Handle arrow function bodies that implicitly return JSX without curly braces
        else if (classOrFunctionNode.body.type === 'JSXElement' || classOrFunctionNode.body.type === 'JSXFragment') {
            returnedElements = returnedElements.concat(extractElementNames(classOrFunctionNode.body));
        }
    } 
    
    // Handle class components
    else if (classOrFunctionNode.type === 'ClassDeclaration') {
        classOrFunctionNode.body.body.forEach(member => {
            if (member.type === 'MethodDefinition' && member.key.name === 'render') {
                member.value.body.body.forEach(node => {
                    if (node.type === 'ReturnStatement') {
                        if (node.argument && (node.argument.type === 'JSXElement' || node.argument.type === 'JSXFragment')) {
                            returnedElements = returnedElements.concat(extractElementNames(node.argument));
                        }
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
        if (openingElement.name.type === 'JSXIdentifier') {
            elementNames.push(openingElement.name.name);
        } else if (openingElement.name.type === 'JSXMemberExpression') {
            elementNames.push(openingElement.name.property.name);
        }

        openingElement.attributes.forEach(attr => {
            if (attr.type === 'JSXAttribute' && attr.value) {
                if (attr.value.type === 'JSXElement') {
                    elementNames = elementNames.concat(extractElementNames(attr.value));
                } else if (attr.value.type === 'JSXExpressionContainer') {
                    elementNames = elementNames.concat(extractElementNames(attr.value.expression));
                }
            }
        });

        node.children.forEach(child => {
            if (child.type === 'JSXElement' || child.type === 'JSXFragment' || child.type === 'JSXExpressionContainer') {
                elementNames = elementNames.concat(extractElementNames(child));
            }
        });
    } 
    else if (node.type === 'JSXFragment') {
        node.children.forEach(child => {
            if (child.type === 'JSXElement' || child.type === 'JSXFragment' || child.type === 'JSXExpressionContainer') {
                elementNames = elementNames.concat(extractElementNames(child));
            }
        });
    } 
    else if (node.type === 'JSXExpressionContainer') {
        if (node.expression.type === 'JSXElement' || node.expression.type === 'JSXFragment' || node.expression.type === 'CallExpression' || node.expression.type === 'ConditionalExpression' || node.expression.type === 'LogicalExpression') {
            elementNames = elementNames.concat(extractElementNames(node.expression));
        }
    } 
    else if (node.type === 'ConditionalExpression') {
        if (node.consequent.type === 'JSXElement' || node.consequent.type === 'JSXFragment') {
            elementNames = elementNames.concat(extractElementNames(node.consequent));
        }
        if (node.alternate.type === 'JSXElement' || node.alternate.type === 'JSXFragment') {
            elementNames = elementNames.concat(extractElementNames(node.alternate));
        }
    } 
    else if (node.type === 'LogicalExpression') {
        if (node.left.type === 'JSXElement' || node.left.type === 'JSXFragment') {
            elementNames = elementNames.concat(extractElementNames(node.left));
        }
        if (node.right.type === 'JSXElement' || node.right.type === 'JSXFragment') {
            elementNames = elementNames.concat(extractElementNames(node.right));
        }
    } 
    else if (node.type === 'CallExpression' && node.callee.property) {
        node.arguments.forEach(arg => {
            if (arg.body && (arg.body.type === 'JSXElement' || arg.body.type === 'JSXFragment' || arg.body.type === 'JSXExpressionContainer')) {
                elementNames = elementNames.concat(extractElementNames(arg.body));
            } else if (arg.type === 'JSXElement' || arg.type === 'JSXFragment') {
                elementNames = elementNames.concat(extractElementNames(arg));
            }
        });
    } 

    return elementNames;
}

function addParents(reactComponents){
    reactComponents.forEach(comp => {
        const otherComponents = reactComponents.filter(component => component.name !== comp.name);
        let parents = [];
        otherComponents.forEach(comp2 => {
            if(comp2.returnedElements.includes(comp.name)){
                parents.push(comp2);
            }
        });
        comp.parentElements = parents;
    });
}

function extractImportDeclarations(reactComponents){
        reactComponents.forEach(reactComponent => {
            const { j, ast } = reactComponent.loadFileAndAst();

            const imports = [];
    
            ast.find(j.ImportDeclaration).forEach(path => {
                const source = path.node.source.value;
                const specifiers = path.node.specifiers.map(specifier => {
                    if (specifier.type === 'ImportSpecifier') {
                        return specifier.imported.name;
                    } else if (specifier.type === 'ImportDefaultSpecifier') {
                        return specifier.local.name;
                    } else if (specifier.type === 'ImportNamespaceSpecifier') {
                        return '*';
                    }
                });
    
                imports.push({ [source]: specifiers });
            });
            reactComponent.importDeclarations = imports;
        })
        
}

export {loadReactComponents,addParents,extractReturnElements,extractImportDeclarations};