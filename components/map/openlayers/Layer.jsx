/**
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');
const PropTypes = require('prop-types');
const assign = require('object-assign');
const isEqual = require('lodash.isequal');
const omit = require('lodash.omit');
const ol = require('openlayers');
const CoordinatesUtils = require('../../../utils/CoordinatesUtils');
const LayerRegistry = require('./plugins/index');

class OpenlayersLayer extends React.Component {
    static propTypes = {
        children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
        map: PropTypes.object,
        mapId: PropTypes.string,
        options: PropTypes.object,
        setLayerLoading: PropTypes.func,
        srs: PropTypes.string,
        swipe: PropTypes.number,
        type: PropTypes.string,
        zIndex: PropTypes.number
    }
    static defaultProps = {
        swipe: null
    }
    state = {
        layer: null
    }
    componentDidMount() {
        this.valid = true;
        this.tilestoload = 0;
        this.createLayer(this.props.type, this.props.options, this.props.zIndex);
    }
    componentDidUpdate(prevProps, prevState) {
        if (prevProps.options) {
            this.updateLayer(this.props, prevProps);
        }
        if (!this.state.layer) {
            return;
        }
        const newVisibility = this.props.options && this.props.options.visibility !== false;
        const oldVisibility = prevProps.options && prevProps.options.visibility !== false;
        if (newVisibility !== oldVisibility && this.state.layer && this.isValid(this.state.layer)) {
            this.state.layer.setVisible(newVisibility);
        }

        const newOpacity = (this.props.options && this.props.options.opacity !== undefined) ? this.props.options.opacity : 255.0;
        this.state.layer.setOpacity(newOpacity / 255.0);

        if (this.props.zIndex !== prevProps.zIndex && this.state.layer.setZIndex) {
            this.state.layer.setZIndex(this.props.zIndex);
        }
        if (this.props.swipe !== prevProps.swipe) {
            this.props.map.render();
        }
    }
    componentWillUnmount() {
        if (this.state.layer && this.props.map) {
            if (this.state.layer.detached) {
                this.state.layer.remove();
            } else {
                this.props.map.removeLayer(this.state.layer);
            }
        }
    }
    render() {
        if (this.props.children) {
            const layer = this.state.layer;
            if (!layer) {
                return null;
            }
            return (
                <noscript>
                    {React.Children.map(this.props.children, child => {
                        return child ? React.cloneElement(child, {container: layer}) : null;
                    })}
                </noscript>
            );
        }

        const layerCreator = LayerRegistry[this.props.type];
        if (layerCreator && layerCreator.render) {
            return layerCreator.render(this.props.options, this.props.map, this.props.mapId, this.state.layer);
        }
        return null;
    }
    generateOpts = (options, zIndex, srs) => {
        return assign({}, options, {zIndex: zIndex, srs});
    }
    createLayer = (type, options, zIndex) => {
        let layer = null;
        if (type === 'group') {
            layer = new ol.layer.Group({zIndex});
            layer.setLayers(new ol.Collection(options.items.map(item => {
                const layerCreator = LayerRegistry[item.type];
                if (layerCreator) {
                    const layerOptions = this.generateOpts(item, zIndex, CoordinatesUtils.normalizeSRS(this.props.srs));
                    const sublayer = layerCreator.create(layerOptions, this.props.map, this.props.mapId);
                    layer.set('id', options.id + "#" + layerOptions.name);
                    return sublayer;
                } else {
                    return null;
                }
            }).filter(x => x)));
        } else {
            const layerCreator = LayerRegistry[type];
            if (layerCreator) {
                const layerOptions = this.generateOpts(options, zIndex, CoordinatesUtils.normalizeSRS(this.props.srs));
                layer = layerCreator.create(layerOptions, this.props.map, this.props.mapId);
            }
        }
        if (layer) {
            layer.set('id', options.id);
            layer.setVisible(options.visibility);
            if (!layer.detached) {
                this.addLayer(layer, options);
            }
            this.setState({layer: layer});
        }
    }
    updateLayer = (newProps, oldProps) => {
        // optimization to avoid to update the layer if not necessary
        if (newProps.zIndex === oldProps.zIndex && newProps.srs === oldProps.srs) {
            // check if options are the same, except loading
            if (newProps.options === oldProps.options) return;
            if (isEqual(omit(newProps.options, ["loading"]), omit(oldProps.options, ["loading"]) ) ) {
                return;
            }
        }
        const layerCreator = LayerRegistry[this.props.type];
        if (layerCreator && layerCreator.update && this.state.layer) {
            layerCreator.update(
                this.state.layer,
                this.generateOpts(newProps.options, newProps.zIndex, CoordinatesUtils.normalizeSRS(newProps.srs)),
                this.generateOpts(oldProps.options, oldProps.zIndex, CoordinatesUtils.normalizeSRS(oldProps.srs)),
                this.props.map,
                this.props.mapId
            );
        }
    }
    addLayer = (layer, options) => {
        if (this.isValid(layer)) {
            this.props.map.addLayer(layer);
            layer.on('precompose', (event) => {
                const ctx = event.context;
                ctx.save();
                ctx.beginPath();
                if (this.props.swipe) {
                    const width = ctx.canvas.width * (this.props.swipe / 100);
                    ctx.rect(0, 0, width, ctx.canvas.height);
                    ctx.clip();
                }
            });

            layer.on('postcompose', (event) => {
                event.context.restore();
            });

            if (options.zoomToExtent && layer.getSource()) {
                const map = this.props.map;
                const source = layer.getSource();
                source.once('change', () => {
                    if (source.getState() === 'ready') {
                        if (source.getFeatures().length > 0) {
                            map.getView().fit(source.getExtent(), map.getSize());
                        }
                    }
                });
            }
            const sublayers = {};
            if (layer instanceof ol.layer.Group) {
                layer.getLayers().forEach(sublayer => {
                    sublayers[options.id + "#" + sublayer.get('id')] = sublayer;
                });
            } else {
                sublayers[options.id] = layer;
            }
            Object.entries(sublayers).map(([id, sublayer]) => {
                if (!sublayer.getTileLoadFunction) {
                    sublayer.getSource().on('imageloadstart', () => {
                        this.props.setLayerLoading(id, true);
                    });
                    sublayer.getSource().on('imageloadend', () => {
                        this.props.setLayerLoading(id, false);
                    });
                    sublayer.getSource().on('imageloaderror', () => {
                        this.props.setLayerLoading(id, false);
                    });
                } else {
                    sublayer.getSource().on('tileloadstart', () => {
                        if (this.tilestoload === 0) {
                            this.props.setLayerLoading(id, true);
                        }
                        this.tilestoload++;
                    });
                    sublayer.getSource().on('tileloadend', () => {
                        this.tilestoload--;
                        if (this.tilestoload === 0) {
                            this.props.setLayerLoading(id, false);
                        }
                    });
                    sublayer.getSource().on('tileloaderror', () => {
                        this.tilestoload--;
                        if (this.tilestoload === 0) {
                            this.props.setLayerLoading(id, false);
                        }
                    });
                }
            });
        }
    }
    isValid = (layer) => {
        const layerCreator = LayerRegistry[this.props.type];
        this.valid = layerCreator && layerCreator.isValid ? layerCreator.isValid(layer) : true;
        return this.valid;
    }
}

module.exports = OpenlayersLayer;
