import $ from 'jquery';

import { Polyline } from './shape';
import { SketchComponent } from './components/sketch';
import { PolylineComponent } from './components/polyline';
import './editor.css';


function main() {
    var shape = new Polyline();
    shape.createVertex({x: -75, y: 75});
    shape.createVertex({x: -45, y: 25});
    shape.createVertex({x: -15, y: 75});
    shape.weld();

    var sketch = new SketchComponent($<SVGSVGElement>('#panel svg'));

    /*
    var svg = pad.svg[0], //document.querySelector('#panel svg'),
        sketch = svg.querySelector('.sketch'),
        mark = svg.querySelector('.mark'),
        ctrl = svg.querySelector('.ctrl'); */
    var p = new PolylineComponent(sketch, shape);

    p.select();

    sketch.on('mousedown', ev => p.hit(ev.at));

    Object.assign(window, {p});
}

$(main);