class PropPassing {
    constructor(sourceComponent, destComponent, props, passedProps) {
        this.sourceComponent = sourceComponent;
        this.destComponent = destComponent;
        this.props = props;
        this.passedProps = passedProps;
        this.next = null;
    }
}


export {PropPassing}