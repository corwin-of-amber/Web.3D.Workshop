import * as THREE from 'three';

import { Blueprint, Reactive, ReactiveSink, RMesh, ReactiveMeshFromGeometry } from './blueprint';
import { TrackballControls } from './controls/TrackballControls';
import './index.css';

import { SketchEditor } from '../packages/sketchvg/src/index';



class Scene {

    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    lights: THREE.Light[]
    renderer: THREE.Renderer
    controls: TrackballControls
    clock: THREE.Clock

    renderLoop: RenderLoop

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

        lights[ 1 ].position.set( 5, 2, -5 );
        lights[ 2 ].position.set( -20, 20, -40 );
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

        this.controls = new TrackballControls( this.camera, renderer.domElement );
        this.controls.rotateSpeed = 1.0;
        this.controls.mouseButtons.LEFT = 0; // ??
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
        var rl = new RenderLoop(() => {
                var delta = this.clock.getDelta();
                this.controls.update(delta * 30);
                this.renderer.render(this.scene, this.camera);
            },
            () => this.controls.currSpeed > 0.0015);

        this.controls.addEventListener( 'start', rl.urgent );
        this.renderLoop = rl;
    }

}

class RenderLoop {
    urgent = () => {}

    constructor(eachFrame: () => void, high = () => false) {
        var _fuel = 0,
            fuel = () => (_fuel > 0) ? _fuel-- : 0,
            _timeout: NodeJS.Timeout = undefined;

        this.urgent = () => {
            if (_timeout) {
                clearTimeout(_timeout); _timeout = undefined;
                requestAnimationFrame( render );
            }
            _fuel = 100;
        };

        const render = () => {
            if (high() || fuel()) {
                requestAnimationFrame( render );
                _timeout = undefined;
            }
            else {
                _timeout = setTimeout(render, 41);
            }

            eachFrame();
        };
        render();        
    }
}


import EJSON from 'ejson';
import $ from 'jquery';
import { Oval, Polyline } from '../packages/sketchvg/src/shape';
import { OvalComponent, PolylineComponent, ShapeComponent } from '../packages/sketchvg/src/components/shape';
import { StraightRuleComponent } from '../packages/sketchvg/src/components/rule';

import * as hastebin from 'hastebin/client';


async function createSVGEditor() {
    var shape = new Polyline();
    shape.createVertex({x: -75, y: 75});
    shape.createVertex({x: -45, y: 25});
    shape.createVertex({x:   0, y: 50});
    //shape.weld();

    shape = (await h.load()) || l.load() || shape;

    var editor = {
        curve: new SketchEditor($<SVGSVGElement>('#panel #curve')),
        perimeter: new SketchEditor($<SVGSVGElement>('#panel #perimeter'))
    };
    editor.curve.newPolyline(shape);
    editor.curve.add(new StraightRuleComponent(editor.curve.sketch, {axis: 'x', at: 0}));

    editor.perimeter.newOval(new Oval({x: 0, y: 0}, {x: 75, y: 75}));

    window.addEventListener('beforeunload', () => l.save(shape));

    return editor;
}


class LocalStore {
    key: string;

    constructor(key: string) { this.key = key; }

    load() {
        var l = localStorage[this.key];
        return l && EJSON.parse(l);
    }

    save(p: any) {
        p && (localStorage[this.key] = EJSON.stringify(p));
    }
}

var l = new LocalStore('editing-shape');


class HastebinShare {
    h = new hastebin.haste();

    save(p: any) {
        var hd = this.h.getDocument();
        return new Promise((resolve, reject) =>
            hd.save(EJSON.stringify(p), 
                (err: {}, ret: {}) => err ? reject(err) : resolve(ret)));
    }

    load(key?: string): Promise<any> {
        key = key || window.location.search.slice(1);
        if (!key) return undefined;
        return new Promise(resolve => this.h.getDocument(key, (ret: any) =>
            resolve(ret && EJSON.parse(ret.data))));
    }
}

var h: HastebinShare;


async function main() {
    h = new HastebinShare;
    h.h.config.baseURL = 'https://hastbp.herokuapp.com';

    var editor = await createSVGEditor();

    var blueprint = new Blueprint();

    var sor = {
        curve: editor.curve.shapes.find(sc => sc instanceof PolylineComponent),
        revolve: editor.perimeter.shapes.find(sc => sc instanceof OvalComponent),
    } as {curve: PolylineComponent, revolve: OvalComponent};

    var objStyle = 'wired';

    if (sor.curve && sor.revolve) {
        let get = () => [sor.curve.shape, sor.revolve.shape] as [Polyline, Oval],
            compute = ([s,r]: [Polyline, Oval]) =>
                blueprint.factory.surfaceOfRevolution(s, r, 32, 20);

        var u0 = new Reactive.Source<[Polyline, Oval]>(),
            u1 = Reactive.intermediate(u0, compute),
            u2 = Reactive.sink(u1, Reactive.maintain(
                    g => blueprint.factory._mesh(g),
                    (o, g) => o.geometry = g
                ));

        u0.set(get());

        if (objStyle == 'wired') {
            var u3 = Reactive.sink(u1, Reactive.maintain(
                        g => blueprint.factory.wireframe(g),
                        (o, g) => o.geometry = new THREE.WireframeGeometry(g)
                    ));

            u0.set(get());
            u2.obj.material = blueprint.factory._offsetMaterial(u2.obj.material); // prevent z-fighting betweein lines and faces
            u2.obj.add(u3.obj);
        }

        blueprint.add(u2, 1.5);
        for (const sc of [sor.curve, sor.revolve] as ShapeComponent[]) {
            sc.on('change', () => { u0.set(get()); scene.renderLoop.urgent(); });
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

    Object.assign(window, {blueprint, scene, editor, sor, hastebin, h});
}


Object.assign(window, {main, THREE});
