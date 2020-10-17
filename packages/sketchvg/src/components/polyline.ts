import $ from 'jquery';

import $svg from '../dom';
import { Point2D, Polyline } from '../shape';
import { SketchComponent, Knob } from './sketch';



class PolylineComponent {
    onto: SketchComponent
    shape: Polyline
    elements: JQuery<SVGElement>
    knobs: Knob[]
    spot: Knob

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
        this.knobs = this.shape.vertices.map(u => {
            var knob = new Knob(u.at);
            this.onto.addControl(knob);
            knob.on('move', ({at}) => {
                u.at = at; this.update();
            });
            return knob;
        });
    }

    hit(at: Point2D) {
        if (this.spot) this.onto.removeControl(this.spot);

        let h = this.shape.hitTest(at),
            knob = new Knob(h.at, ['ephemeral']);
        this.onto.addControl(knob);
        this.spot = knob;
    }
}



export { PolylineComponent }
