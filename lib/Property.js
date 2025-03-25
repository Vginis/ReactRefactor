import {mapTSTypesWithTypes,resolveJscodeshiftParser} from './util.js';
import { fileType } from '../index.js';
class Property{
    constructor(propName, propType=undefined){
        this.propName = propName;
        this.propType = propType;
    }
}

function extractPropsFromObjectPattern(objectPatternNode, ast, j, propTypeNode=undefined) {
    let props = [];
    const typesMap = mapTSTypesWithTypes();
    objectPatternNode.properties.forEach(property => {
        if (property.type === 'Property') {
            const propName = property.key.name;
            let propType = undefined;
            if (property.value.typeAnnotation && property.value.typeAnnotation.typeAnnotation) {
                propType = j(property.value.typeAnnotation.typeAnnotation).toSource();
            }

            props.push(new Property(propName, propType));
        } else if (property.type === 'ObjectPattern') {
            const nestedProps = extractPropsFromObjectPattern(property);
            props.push(...nestedProps);
        } else if (property.type === 'ObjectProperty' && property.key && property.key.type === 'Identifier' &&
            property.value && property.value.name 
        ){
            const propName = property.key.name;
            let propType = undefined;
            if (property.value.typeAnnotation && property.value.typeAnnotation.typeAnnotation) {
                propType = j(property.value.typeAnnotation.typeAnnotation).toSource();
            }

            props.push(new Property(propName, propType));
        }
    });

    if(propTypeNode!==undefined && propTypeNode.typeAnnotation){
        if(propTypeNode.typeAnnotation.typeParameters && propTypeNode.typeAnnotation.typeParameters.params){
            //For Variable Declaration Components
            const propParameters = propTypeNode.typeAnnotation.typeParameters.params;
            const typeReference = propParameters[0];
            propParameters.forEach(propParam => {
                if(propParam.members){
                    propParam.members.forEach(propParamMember => {
                        const property = props.find(p => p.propName===propParamMember.key.name);
                        if(property){
                            property.propType = typesMap.get(propParamMember.typeAnnotation.typeAnnotation.type) ?? "string";
                        }
                    });
                }
            });

            if(typeReference.type==="TSTypeReference" && typeReference.typeName){
                const referencedTypeName = typeReference.typeName.name;
                searchPropsInTypeOrInterface(referencedTypeName, j, ast, props, typesMap)
            }
        } else if(propTypeNode.typeAnnotation.members){
            propTypeNode.typeAnnotation.members.forEach(member => {
                if(member.typeAnnotation && member.typeAnnotation.typeAnnotation){
                    const property = props.find(p => p.propName===member.key.name);
                    const propType = typesMap.get(member.typeAnnotation.typeAnnotation.name) || j(member.typeAnnotation?.typeAnnotation).toSource();
                    if(property){
                        property.propType = propType
                    }
                }
            })
        } else if(propTypeNode.typeAnnotation && propTypeNode.typeAnnotation.typeName 
            && propTypeNode.typeAnnotation.typeName.name){
                searchPropsInTypeOrInterface(propTypeNode.typeAnnotation.typeName.name, j, ast, props, typesMap)
            }
    }
        
    return props;
}

function searchPropsInTypeOrInterface(referencedTypeName, j, ast, props, typesMap){
    ast.find(j.TSInterfaceDeclaration, { id: { name: referencedTypeName } }).forEach(interfacePath => {
        interfacePath.node.body.body.forEach(member => {
            if (member.key && member.key.type === 'Identifier') {
                const property = props.find(p => p.propName===member.key.name);
                const propType = typesMap.get(member.typeAnnotation?.typeAnnotation?.type) || j(member.typeAnnotation?.typeAnnotation).toSource();
                if(property){
                    property.propType = propType
                } else {
                    props.push(new Property(member.key.name, propType));
                }
            }
        });
    });

    ast.find(j.TSTypeAliasDeclaration, { id: { name: referencedTypeName } }).forEach(typeAliasPath => {
        if (typeAliasPath.node.typeAnnotation.type === 'TSTypeLiteral') {
            typeAliasPath.node.typeAnnotation.members.forEach(member => {
                if (member.key && member.key.type === 'Identifier') {
                    const property = props.find(p => p.propName===member.key.name);
                    const propType = typesMap.get(member.typeAnnotation?.typeAnnotation?.type) || j(member.typeAnnotation?.typeAnnotation).toSource();
                    if(property){
                        property.propType = propType
                    } else {
                        props.push(new Property(member.key.name, propType));
                    }
                }
            });
        }
    });
}

function extractPropsFromDeclaredWithIdentifierUsage(ast, propsIdentifierName) {
    const j = resolveJscodeshiftParser(fileType);
    let propsUsages = [];
    j(ast).find(j.MemberExpression).forEach(path => {
            if (
                path.node.object.type === 'Identifier' &&
                path.node.object.name === propsIdentifierName && path.node.property.type === 'Identifier'
            ) {
                const propName = path.node.property.name;
                let propType = undefined;
    
                let parentNode = path.parent.node;
                if (parentNode.type === 'VariableDeclarator' && parentNode.id.typeAnnotation) {
                    propType = j(parentNode.id.typeAnnotation.typeAnnotation).toSource();
                }
    
                propsUsages.push(new Property(propName, propType));
            }
        });
    return propsUsages;
}

function extractPropsForClassComponents(j, renderMethod, classNode, ast){
    let props = [];
    const typesMap = mapTSTypesWithTypes();
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
                        props.push(new Property(property.key.name));
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
                    props.push(new Property(propName));
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
                    props.push(new Property(param.parameter.name));
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
                            props.push(new Property(member.key.name));
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
        extractPropsFromTSTypeReference(propsType, props, typesMap,ast,j)
        if(propsType.type === 'TSIntersectionType' && propsType.types){
            propsType.types.forEach(pr => extractPropsFromTSTypeReference(pr, props, typesMap,ast,j));
        }
        if (propsType.type === 'TSTypeLiteral') {
            propsType.members.forEach(member => {
                if (member.key && member.key.type === 'Identifier') {
                    const propType = typesMap.get(member.typeAnnotation.typeAnnotation.typeName.name) ?? "string";
                    const prop = props.find(p => p.propName === member.key.name);
                    if(prop===undefined){
                        props.push(new Property(member.key.name,member.typeAnnotation.typeAnnotation.typeName.name));
                    } else {
                        prop.propType = propType;
                    }
                   
                }
            });
          }
      }
    return props;
}

function extractPropsFromTSTypeReference(propsType,props,typesMap,ast,j) {
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
                const propType = typesMap.get(member.typeAnnotation.typeAnnotation.type) ?? "string";
                const prop = props.find(p => p.propName === member.key.name);
                if(prop===undefined){
                  props.push(new Property(member.key.name,propType));
                } else {
                  prop.propType = propType;
                }
              }
            });
          });
      }
}
export {Property, extractPropsFromObjectPattern, extractPropsFromDeclaredWithIdentifierUsage, extractPropsForClassComponents};