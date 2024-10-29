import React from 'react';
import {connect} from 'react-redux';

import PropTypes from 'prop-types';

import MapUtils from '../utils/MapUtils';

class OL3D extends React.Component {
    
    static propTypes = {
        /** Whether OL3D is active */
        active: PropTypes.bool
    }

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        console.log("OL3D mount");
    }

    componentDidUpdate(prevProps, prevState) {
        console.log("OL3D update", prevProps, this.props, prevState, this.state);

        const ol3d = MapUtils.getHook(MapUtils.GET_OL3D);
        ol3d.setEnabled(!!this.props.active);
    }

    render() {
        console.log("OL3D render");
        return null;
    }
}

export default connect((state) => ({
    active: state.task.id === "OL3D",
}), {
})(OL3D);
