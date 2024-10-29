import React from 'react';
import {connect} from 'react-redux';

import PropTypes from 'prop-types';

import './style/Demo3D.css';

class Demo3D extends React.Component {
    
    static propTypes = {
        /** Whether Demo3D is active */
        active: PropTypes.bool
    }

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        console.log("Demo3D mount");
    }

    componentDidUpdate(prevProps, prevState) {
        console.log("Demo3D update", prevProps, this.props, prevState, this.state);
    }

    render() {
        console.log("Demo3D render");

        if (this.props.active) {
            return (
                <div id="demo3d">

                </div>
            )
        }

        return null;
    }
}

export default connect((state) => ({
    active: state.task.id === "Demo3D",
}), {
})(Demo3D);
