import $ from 'jquery';

import { Point2D, Polyline } from './shape';
import $svg, { DraggableEventUIParams } from './dom';
import './editor.css';
import { EventEmitter } from 'events';


class SketchComponent {
    svg: JQuery<SVGSVGElement>
    draw: JQuery<SVGGElement>
    mark: JQuery<SVGGElement>
    ctrl: JQuery<SVGGElement>

    constructor(svg: JQuery<SVGSVGElement>) {
        this.svg = svg;
        this.draw = $(svg[0].querySelector('.draw') as SVGGElement);
        this.mark = $(svg[0].querySelector('.mark') as SVGGElement);
        this.ctrl = $(svg[0].querySelector('.ctrl') as SVGGElement);

        this.createMarkShadows();
    }

    createMarkShadows() {
        for (let shape of this.draw.children()) {
            this.mark.append(<any>shape.cloneNode());
        }    
    }

    addShape(shape: JQuery<SVGElement>) {
        var shadow = shape.clone();
        this.draw.append(shape);
        this.mark.append(shadow);
        return shape.add(<any>shadow);
    }

    addControl(widget: ControlWidget) {
        this.ctrl.append(widget.el);
        widget.mounted();
    }
}

class PolylineComponent {
    onto: SketchComponent
    shape: Polyline
    elements: JQuery<SVGElement>
    knobs: JQuery<Knob>

    constructor(onto: SketchComponent, shape: Polyline) {
        this.onto = onto;
        this.shape = shape;
        this.elements = this.render();
    }

    render() {
        var p = $svg('path').attr('d', this.shape.toPath());
        return this.onto.addShape(p);
    }

    update() {
        for (let e of this.elements) {
            $(e).attr('d', this.shape.toPath());
        }
    }

    select() {
        for (let u of this.shape.vertices) {
            var knob = new Knob(u.at);
            this.onto.addControl(knob);
            knob.on('move', ({at}) => {
                u.at = at; this.update();
            });
        }    
    }
}


abstract class ControlWidget extends EventEmitter {
    el: JQuery<SVGCircleElement>
    mounted() { }
}

class Knob extends ControlWidget {
    constructor(at: Point2D) {
        super();
        this.el = $svg<SVGCircleElement>('circle').attr({cx: at.x, cy: at.y});
        this.el.addClass('knob');
    }

    mounted() {
        $svg.draggable(this.el, {
            drag: (event, ui: DraggableEventUIParams) => {
                this.emit('move', {target: this, at: ui.center});
            }
        });
    }
}


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

    Object.assign(window, {p});
}

$(main);