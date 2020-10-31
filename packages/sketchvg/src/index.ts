import $ from 'jquery';
import EJSON from 'ejson';

import { Polyline } from './shape';
import { SketchComponent } from './components/sketch';
import { PolylineComponent } from './components/shape';
import './editor.css';


function main() {
    var shape = new Polyline();
    shape.createVertex({x: -75, y: 75});
    shape.createVertex({x: -45, y: 25});
    shape.createVertex({x:   0, y: 50});
    //shape.weld();

    shape = load() || shape;

    var sketch = new SketchComponent($<SVGSVGElement>('#panel svg'));

    /*
    var svg = pad.svg[0], //document.querySelector('#panel svg'),
        sketch = svg.querySelector('.sketch'),
        mark = svg.querySelector('.mark'),
        ctrl = svg.querySelector('.ctrl'); */
    var p = new PolylineComponent(sketch, shape);

    sketch.addComponent(p);
    sketch.on('mousedown', (ev) => {
        if (ev.altKey && sketch.selection.has(p)) p.edit(ev.at);
        else sketch.deselectAll();
    });
    //sketch.on('mousedown', ev => p.edit(ev.at));

    window.addEventListener('beforeunload', () => save(p.shape));

    Object.assign(window, {p, EJSON});
}

function load() {
    var l = localStorage['editing-shape'];
    return l && EJSON.parse(l);
}

function save(p: any) {
    if (p)
        localStorage['editing-shape'] = EJSON.stringify(p);
}

$(main);