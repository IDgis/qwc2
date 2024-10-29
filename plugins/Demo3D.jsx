import React from 'react';

import './style/Demo3D.css';

class Demo3D extends React.Component {

    state = {
        active: false
    };

    constructor(props) {
        super(props);

        this.targetRef = React.createRef();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.active) {
            if (!prevState.active) {
                this.attach();
            }
        } else {
            if (prevState.active) {
                this.dispose();
            }
        }
    }

    attach() {
        console.log("attach", this.targetRef.current);
    }

    dispose() {
        console.log("dispose");
    }

    render() {
        const label = `Switch to ${this.state.active ? "2D" : "3D"}`;

        return (
            <div id="demo3d">
                <button onClick={() => this.setState({...this.state, active: !this.state.active})}>{label}</button>
                <div className="target" ref={this.targetRef}/>
            </div>
        );
    }
}

export default Demo3D;
