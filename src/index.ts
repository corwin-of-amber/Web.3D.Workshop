import * as THREE from 'three';

import { Blueprint } from './blueprint';
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
        this.controls.spin = {lon: 0.2};

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
    var svg = document.querySelector('#panel svg'),
        mark = svg.querySelector('.mark');
    for (let shape of svg.querySelectorAll('.sketch *')) {
        mark.appendChild(shape.cloneNode());
    }
    var blueprint = new Blueprint();
    blueprint.create(svg.querySelector('[name=cone]'), 1);

    var scene = new Scene();
    for (let o of blueprint.objects) scene.scene.add(o);

    blueprint.on('collection:remove', obj => scene.scene.remove(obj));
    blueprint.on('collection:add', obj => scene.scene.add(obj));

    scene.render();

    var selector = <any>document.getElementById('selector');

    function select(shape: SVGElement) {
        blueprint.clear();
        blueprint.create(shape, 1);
    }

    selector.addEventListener( 'change', (ev) => {
        blueprint.clear();
        var name = selector.value;
        select(svg.querySelector(`[name=${name}]`));
    });

    mark.addEventListener('click', ev => {
        var shape = (<SVGElement>ev.target); 
        selector.value = shape.getAttribute('name');
        select(shape);
    });

    Object.assign(window, {blueprint, scene});
}


Object.assign(window, {main, THREE});
