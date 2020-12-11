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
const Message = require('../components/I18N/Message');
const MapUtils = require('../utils/MapUtils');
const {setActiveLayerInfo} = require('../actions/layerinfo');
const ResizeableWindow = require("../components/ResizeableWindow");
const LayerUtils = require('../utils/LayerUtils');
const MiscUtils = require('../utils/MiscUtils');
require('./style/LayerInfoWindow.css');

class LayerInfoWindow extends React.Component {
    static propTypes = {
        bboxDependentLegend: PropTypes.bool,
        layer: PropTypes.object,
        map: PropTypes.object,
        setActiveLayerInfo: PropTypes.func,
        sublayer: PropTypes.object,
        windowSize: PropTypes.object
    }
    renderLink(text, url) {
        if (url) {
            return (<a href={url} rel="noreferrer" target="_blank">{text}</a>);
        } else if (text) {
            return text;
        }
        return null;
    }
    renderRow = (title, content, html = false) => {
        if (content) {
            return (
                <tr>
                    <td><Message msgId={title} />:</td>
                    {html ? (
                        <td dangerouslySetInnerHTML={{__html: MiscUtils.addLinkAnchors(content)}} />
                    ) : (<td>{content}</td>)}
                </tr>
            );
        }
        return null;
    }
    render() {
        if (!this.props.layer || !this.props.sublayer) {
            return null;
        }
        let legend = null;
        if (this.props.layer.legendUrl) {
            const scale = MapUtils.computeForZoom(this.props.map.scales, this.props.map.zoom);
            const request = LayerUtils.getLegendUrl(this.props.layer, this.props.sublayer, scale, this.props.map.projection, this.props.bboxDependentLegend ? this.props.map : null);
            legend = (<img className="layer-info-window-legend" src={request} />);
        } else if (this.props.layer.color) {
            legend = (<span className="layer-info-window-coloricon" style={{backgroundColor: this.props.layer.color}} />);
        }
        return (
            <ResizeableWindow icon="info-sign" initialHeight={this.props.windowSize.height} initialWidth={this.props.windowSize.width} onClose={this.onClose}
                title="layerinfo.title" zIndex={9}>
                <div className="layer-info-window-body" role="body">
                    <h4 className="layer-info-window-title">{this.props.sublayer.title}</h4>
                    <div className="layer-info-window-frame">
                        <table className="layer-info-window-table">
                            <tbody>
                                {this.renderRow("layerinfo.abstract", this.props.sublayer.abstract, true)}
                                {this.props.sublayer.attribution ? this.renderRow("layerinfo.attribution", this.renderLink(this.props.sublayer.attribution.Title, this.props.sublayer.attribution.OnlineResource)) : null}
                                {this.renderRow("layerinfo.keywords", this.props.sublayer.keywords)}
                                {this.renderRow("layerinfo.dataUrl", this.renderLink(this.props.sublayer.dataUrl, this.props.sublayer.dataUrl))}
                                {this.renderRow("layerinfo.metadataUrl", this.renderLink(this.props.sublayer.metadataUrl, this.props.sublayer.metadataUrl))}
                                {this.props.sublayer.minScale !== undefined ? this.renderRow("layerinfo.maxscale", this.renderScale(this.props.sublayer.minScale)) : null}
                                {this.props.sublayer.maxScale !== undefined ? this.renderRow("layerinfo.minscale", this.renderScale(this.props.sublayer.maxScale)) : null}
                                {this.renderRow("layerinfo.legend", legend)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </ResizeableWindow>
        );
    }
    renderScale = (scale) => {
        if (scale === 0) {
            return "0";
        } else if (scale >= 1) {
            return "1:" + Math.round(scale);
        } else {
            return Math.round(1 / scale) + ":1";
        }
    }
    onClose = () => {
        this.props.setActiveLayerInfo(null, null);
    }
}

const selector = state => ({
    map: state.map,
    layer: state.layerinfo.layer || null,
    sublayer: state.layerinfo.sublayer || null
});

module.exports = connect(selector, {
    setActiveLayerInfo: setActiveLayerInfo
})(LayerInfoWindow);
