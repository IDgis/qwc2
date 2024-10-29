import React from 'react';

import { Viewer, Cartesian3, Math as CesiumMath, Cesium3DTileset, WebMapServiceImageryProvider, WebMapTileServiceImageryProvider, ImageryLayer, Terrain, CesiumTerrainProvider } from 'cesium/Cesium';
import "cesium/Widgets/widgets.css";

import './style/Demo3D.css';

class Demo3D extends React.Component {

    state = {
        active: false,
        viewer: null
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
        console.log("attach");

        const viewer = new Viewer(this.targetRef.current, {
            animation: false, // Disable the animation widget
            timeline: false, // Disable the timeline widget
            fullscreenButton: false, // Disable the fullscreen button
            homeButton: false, // Disable the home button
            infoBox: false, // Disable the info box
            selectionIndicator: false, // Disable the selection indicator
            navigationHelpButton: false, // Disable the navigation help button
            sceneModePicker: false, // Disable the scene mode picker
            baseLayerPicker: false, // Disable the base layer picker
            geocoder: false, // Disable the geocoder
            vrButton: false, // Disable the VR button
    
            baseLayer: false,
            terrain: new Terrain(CesiumTerrainProvider.fromUrl('https://api.pdok.nl/kadaster/3d-basisvoorziening/ogc/v1_0/collections/digitaalterreinmodel/quantized-mesh'))
        });
    
        viewer.scene.globe.depthTestAgainstTerrain = true;

        viewer.scene.camera.setView({
            destination: new Cartesian3.fromDegrees(
              4.31707256,
              52.0871042,
              300,
            ),
            orientation: {
              heading: CesiumMath.toRadians(0.0),
              pitch: CesiumMath.toRadians(-45.0),
              roll: 0.0,
            },
        });

        const provider = new WebMapServiceImageryProvider({
            url: "https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0",
            layers: "Actueel_orthoHR",
            parameters : {
              format: "image/jpeg",
              transparent: false
            }
        });
  
        const imageryLayer = new ImageryLayer(provider)
        viewer.imageryLayers.add(imageryLayer);

        this.setState({...this.state, viewer});
    }

    dispose() {
        console.log("dispose");

        this.state.viewer?.destroy();
        this.setState({...this.state, viewer: null})
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
