export default class ReactComponentManager {

    constructor(reactComponents) {
        this.reactComponents = reactComponents;
        this.compositeKeyToReactComponentMap = new Map();
        this.nameToReactComponentMap = new Map();

        for (const reactComponent of reactComponents) {
            this.compositeKeyToReactComponentMap.set(reactComponent.compositeKeyName, reactComponent);

            if (this.nameToReactComponentMap.has(reactComponent.name)) {
                const componentsArray = this.nameToReactComponentMap.get(reactComponent.name);
                componentsArray.push(reactComponent);
                this.nameToReactComponentMap.set(reactComponent.name, componentsArray);
            } else {
                this.nameToReactComponentMap.set(reactComponent.name, [reactComponent]);
            }
        }
    }

    getAllReactComponents() {
        return this.reactComponents;
    }

    getReactComponentByKey(compositeKeyName) {
        return this.compositeKeyToReactComponentMap.get(compositeKeyName);
    }

    get rootComponents() {
        if (!this._rootComponents) {
            this._rootComponents = []
            this.resolveRootComponents()
        }
        return this._rootComponents
    }

    resolveRootComponents() {
        this.reactComponents.forEach(component => {
            if (component.parentComponents.size === 0
                && component.childComponents.size > 0) {
                this._rootComponents.push(component)
            }
        });
    }
}