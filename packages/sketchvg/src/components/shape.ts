import { EventEmitter } from 'events';
import $ from 'jquery';

import $svg from '../dom';
import { Point2D, Polyline, Vertex, Side, Direction } from '../shape';
import { SketchComponent, SketchEvent, Knob } from './sketch';



abstract class ShapeComponent extends EventEmitter {
    abstract select(): void
    abstract deselect(): void
    abstract hit(at: Point2D): void
    abstract edit(at: Point2D): void
}

interface ShapeComponent {
    on(type: 'click', h: (ev: SketchEvent<JQuery.ClickEvent>) => void): this;
}


class PolylineComponent extends ShapeComponent {
    onto: SketchComponent
    shape: Polyline
    elements: JQuery<SVGElement>
    knobs: Knob[]
    spot: SpotKnob<Side>
    addDir: Direction = Direction.FORWARD

    constructor(onto: SketchComponent, shape: Polyline) {
        super();
        this.onto = onto;
        this.shape = shape;
        this.elements = this.render();
    }

    render() {
        var p = $svg('path').attr('d', this.shape.toPath());
        return this.onto.addShape(p)
            .on('click', (ev) => this.emit('click', this.onto._mkMouseEvent(ev)));
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
            this.unhit();  /** @todo only if affected */
            u.at = at; this.update();
        });
        knob.on('mousedown', (ev) => {
            if (ev.altKey) {
                this.unhit();  /** @todo only if affected */
                this.onto.removeControl(knob);
                this.shape.removeVertex(u); this.update();
            }
            else {
                this.unhit(); this.addDir = Direction.BACKWARD;
            }
        });
        return knob;
    }

    hit(at: Point2D) {
        this.unhit();

        let h = this.shape.hitTest(at),
            knob = new SpotKnob(h.at, h.side, ['ephemeral']);
        this.onto.addControl(knob);
        this.spot = knob;
        this.addDir = knob.residesOn.getDirection(h.at);
    }

    unhit() {
        if (this.spot) this.onto.removeControl(this.spot);
        this.spot = undefined;
    }

    edit(at: Point2D) {
        var u = this.spot ? this.shape.splitSide(this.spot.residesOn, at, this.addDir)
                          : this.shape.createVertex(at, this.addDir);
        this.spot?.hide?.();
        this.knobs.push(this._mkknob(u));
        this.update();
    }
}

class SpotKnob<Obj> extends Knob {
    residesOn: Obj

    constructor(at: Point2D, residesOn: Obj, cssClasses?: string[]) {
        super(at, cssClasses);
        this.residesOn = residesOn;
    }

    mounted() { /** @oops disable dragging */ }
}


export { ShapeComponent, PolylineComponent }
