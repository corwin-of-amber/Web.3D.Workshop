import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { BluePrint } from './blueprint';
import './index.css';
import { OtherControls } from './controls';



class Scene {

    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.Renderer
    controls: OtherControls
    clock: THREE.Clock

    constructor() {
        var scene = new THREE.Scene();
        scene.background = new THREE.Color( 0x505050 );

        var camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 1000 );
        camera.target = new THREE.Vector3( 0, 0, 0 );
        camera.startPosition = new THREE.Vector3( 8, 4, 8 );
        //camera.position.set(8, 4, 8);
        camera.position.set(8, 4, 8);

        // Lights!
        var lights = [];
        lights[ 0 ] = new THREE.AmbientLight( 0xffffff, 0.1 );
        lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
        lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );
        lights[ 3 ] = new THREE.PointLight( 0xffffff, 1, 0.1 );
        lights[ 4 ] = new THREE.DirectionalLight( 0xffffff, 0.1 );

        lights[ 1 ].position.set( 0, 200, 0 );
        lights[ 2 ].position.set( 200, 200, 100 );
        lights[ 3 ].position.set( -200, -200, -100 );
        lights[ 4 ].position.set( -0.5, -0.5, 0.866 );

        for (let l of lights) scene.add(l);

        Object.assign(this, {scene, camera, lights});
    }

    render(container = document.body) {
        var renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setPixelRatio( window.devicePixelRatio );
        container.appendChild( renderer.domElement );

        this.renderer = renderer;

        this.controls = new OtherControls( this.camera, renderer.domElement );

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize( window.innerWidth, window.innerHeight );
        }, false );

        this.clock = new THREE.Clock();

        this._renderLoop();
    }

    _renderLoop() {
        const render = () => {
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame( render );
        };
        render();
    }

}


function main() {
    var blueprint = new BluePrint();
    blueprint.create('cone', 1);

    var scene = new Scene();
    for (let o of blueprint.objects) scene.scene.add(o);

    blueprint.on('collection:remove', obj => scene.scene.remove(obj));
    blueprint.on('collection:add', obj => scene.scene.add(obj));

    scene.render();

    document.getElementById('selector').addEventListener( 'change', (ev) => {
        blueprint.clear();
        blueprint.create((<any>ev.target).value, 1);
    });

    Object.assign(window, {blueprint, scene});
}


Object.assign(window, {main});
