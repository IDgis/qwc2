/**
 * Copyright 2016, Sourcepole AG.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PropTypes = require('prop-types');
const {connect} = require('react-redux');
const isEmpty = require('lodash.isempty');
const Message = require('../components/I18N/Message');
const CoordinatesUtils = require('../utils/CoordinatesUtils');
const {LayerRole} = require('../actions/layers');
const {setCurrentTask} = require('../actions/task');
const {TaskBar} = require('../components/TaskBar');
const PrintFrame = require('../components/PrintFrame');
require('./style/DxfExport.css');

class DxfExport extends React.Component {
    static propTypes = {
        layers: PropTypes.array,
        map: PropTypes.object,
        setCurrentTask: PropTypes.func,
        theme: PropTypes.object
    }
    renderBody = () => {
        const themeLayers = this.props.layers.filter(layer => layer.role === LayerRole.THEME);
        if (!this.props.theme || isEmpty(themeLayers)) {
            return null;
        }
        const themeSubLayers = themeLayers.map(layer => layer.params.LAYERS).reverse().join(",");
        const filename = this.props.theme.name + ".dxf";
        const action = this.props.theme.url;
        return (
            <span>
                <form action={action} method="POST" ref={form => { this.form = form; }} target="_blank">
                    <div className="help-text"><Message msgId="dxfexport.selectinfo" /></div>
                    <div className="export-settings">
                        <Message msgId="dxfexport.symbologyscale" />
                        <span className="input-frame"><span>1&nbsp;:&nbsp;</span><input defaultValue="500" name="SCALE" type="number" /></span>
                    </div>
                    <input name="SERVICE" readOnly type="hidden" value="WMS" />
                    <input name="VERSION" readOnly type="hidden" value={themeLayers[0].version || "1.3.0"} />
                    <input name="REQUEST" readOnly type="hidden" value="GetMap" />
                    <input name="FORMAT" readOnly type="hidden" value="application/dxf" />
                    <input name="LAYERS" readOnly type="hidden" value={themeSubLayers} />
                    <input name="CRS" readOnly type="hidden" value={this.props.map.projection} />
                    <input name="FILE_NAME" readOnly type="hidden" value={this.props.theme.name + ".dxf"} />
                    <input name="BBOX" readOnly ref={input => { this.extentInput = input; }} type="hidden" value="" />
                </form>
            </span>
        );
    }
    render() {
        return (
            <TaskBar task="DxfExport">
                {() => ({
                    body: this.renderBody(),
                    extra: (<PrintFrame bboxSelected={this.bboxSelected} map={this.props.map} />)
                })}
            </TaskBar>
        );
    }
    bboxSelected = (bbox, crs) => {
        const version = this.props.theme.version || "1.3.0";
        const extent = (CoordinatesUtils.getAxisOrder(crs).substr(0, 2) === 'ne' && version === '1.3.0') ?
            bbox[1] + "," + bbox[0] + "," + bbox[3] + "," + bbox[2] :
            bbox.join(',');
        this.extentInput.value = extent;
        this.form.submit();
        this.props.setCurrentTask(null);
    }
}

const selector = (state) => ({
    theme: state.theme ? state.theme.current : null,
    map: state.map ? state.map : null,
    layers: state.layers ? state.layers.flat : []
});

module.exports = {
    DxfExportPlugin: connect(selector, {
        setCurrentTask: setCurrentTask
    })(DxfExport),
    reducers: {
        task: require('../reducers/task')
    }
};
