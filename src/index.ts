import * as THREE from 'three';

import { Blueprint, ReactiveSink } from './blueprint';
import './index.css';
import { OtherControls } from './controls';

import { SketchEditor } from '../packages/sketchvg/src/index';



class Scene {

    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    lights: THREE.Light[]
    renderer: THREE.Renderer
    controls: OtherControls
    clock: THREE.Clock

    constructor() {
        var scene = new THREE.Scene();
        scene.background = new THREE.Color( 0x505050 );

        var camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 1000 );
        camera.position.set(8, 4, 8);

        // Lights!
        var lights: THREE.Light[] = [
            new THREE.AmbientLight( 0xffffff, 0.1 ),
            new THREE.PointLight( 0xffffff, 1, 0 ),
            new THREE.PointLight( 0xffffff, 1, 0 ),
            //new THREE.PointLight( 0xffffff, 1, 0.1 ),
            //new THREE.DirectionalLight( 0xffffff, 0.1 )
        ];

        lights[ 1 ].position.set( 0, 200, 0 );
        lights[ 2 ].position.set( -200, 200, -400 );
        //lights[ 3 ].position.set( 200, 200, -100 );
        //lights[ 4 ].position.set( 0.5, -0.5, -0.866 );

        for (let l of lights) scene.add(l);

        Object.assign(this, {scene, camera, lights});
    }

    render(container = document.body) {
        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setPixelRatio( window.devicePixelRatio );
        container.appendChild( renderer.domElement );

        this.renderer = renderer;

        this.controls = new OtherControls( this.camera, renderer.domElement );
        //this.controls.spin = {lon: 0.2};

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
            setTimeout( render, 200 );
        };
        render();
    }

}


import { Polyline } from '../packages/sketchvg/src/shape';
import EJSON from 'ejson';
import $ from 'jquery';
import { PolylineComponent } from '../packages/sketchvg/src/components/shape';


function createSVGEditor() {
    var shape = new Polyline();
    shape.createVertex({x: -75, y: 75});
    shape.createVertex({x: -45, y: 25});
    shape.createVertex({x:   0, y: 50});
    //shape.weld();

    shape = load() || shape;

    var editor = new SketchEditor($<SVGSVGElement>('#panel svg')),
        p = editor.newPolyline(shape);

    window.addEventListener('beforeunload', () => save(shape));

    return editor;
}

function load() {
    var l = localStorage['editing-shape'];
    return l && EJSON.parse(l);
}

function save(p: any) {
    if (p)
        localStorage['editing-shape'] = EJSON.stringify(p);
}

function main() {
    var editor = createSVGEditor(),
        svg = editor.sketch.svg[0];

    var blueprint = new Blueprint();
    //blueprint.create(svg.querySelector('[name=cone]'), 1);

    for (const sc of editor.shapes) {
        if (sc instanceof PolylineComponent) {
            let compute = (s: Polyline) => blueprint.factory.surfaceOfRevolution(s, 32, 20),
                obj = blueprint.factory.withWireframe(
                    ReactiveSink.seq(sc.shape, compute, g => blueprint.factory.mesh(g)));
            blueprint.add(obj, 1.5);

            sc.on('change', () => obj.update(sc.shape));
        }
    }

    var scene = new Scene();
    for (let o of blueprint.objects) scene.scene.add(o.obj);

    blueprint.on('collection:remove', o => scene.scene.remove(o.obj));
    blueprint.on('collection:add', o => scene.scene.add(o.obj));

    scene.render();

    var selector = <any>document.getElementById('selector');

    function select(shape: SVGElement) {
        blueprint.clear();
        blueprint.create(shape, 1);
    }

    /*
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
    */

    Object.assign(window, {blueprint, scene, editor});
}


Object.assign(window, {main, THREE});
