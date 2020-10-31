import { EventEmitter } from 'events';
import $ from 'jquery';

import $svg from '../dom';
import { Point2D, Polyline, Vertex } from '../shape';
import { SketchComponent, Knob } from './sketch';



abstract class ShapeComponent extends EventEmitter {
    abstract select(): void
    abstract deselect(): void
    abstract hit(at: Point2D): void
    abstract edit(at: Point2D): void
}


class PolylineComponent extends ShapeComponent {
    onto: SketchComponent
    shape: Polyline
    elements: JQuery<SVGElement>
    knobs: Knob[]
    spot: Knob

    constructor(onto: SketchComponent, shape: Polyline) {
        super();
        this.onto = onto;
        this.shape = shape;
        this.elements = this.render();
    }

    render() {
        var p = $svg('path').attr('d', this.shape.toPath());
        return this.onto.addShape(p)
            .on('click', (ev) => this.emit('click', ev));
    }

    update() {
        for (let e of this.elements) {
            $(e).attr('d', this.shape.toPath());
        }
    }

    select() {
        this.knobs = this.shape.vertices.map(u => this._mkknob(u));
    }

    deselect() {
        if (this.spot) this.onto.removeControl(this.spot);
        if (this.knobs) this.knobs.forEach(k => this.onto.removeControl(k));
        this.knobs = this.spot = undefined;
    }

    _mkknob(u: Vertex) {
        var knob = new Knob(u.at);
        this.onto.addControl(knob);
        knob.on('move', ({at}) => {
            u.at = at; this.update();
        });
        knob.on('mousedown', (ev) => {
            if (ev.altKey) {
                this.onto.removeControl(knob);
                this.shape.removeVertex(u); this.update();
            }
        });
        return knob;
    }

    hit(at: Point2D) {
        if (this.spot) this.onto.removeControl(this.spot);

        let h = this.shape.hitTest(at),
            knob = new Knob(h.at, ['ephemeral']);
        this.onto.addControl(knob);
        this.spot = knob;
    }

    edit(at: Point2D) {
        var u = this.shape.createVertex(at);
        this.knobs.push(this._mkknob(u));
        this.update();
    }
}



export { ShapeComponent, PolylineComponent }
