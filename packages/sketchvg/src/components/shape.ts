import { EventEmitter } from 'events';
import $ from 'jquery';

import $svg from '../dom';
import { Point2D, Polyline, Vertex, Side, BezierSide,
         Direction, Oval } from '../shape';
import { SketchComponent, SketchEvent, Knob } from './sketch';

import fp = Point2D.fp;



abstract class ShapeComponent extends EventEmitter {
    abstract select(at?: Point2D): void
    abstract deselect(): void
    abstract hit(at: Point2D): boolean
    abstract edit(at: Point2D): boolean
}

interface ShapeComponent {
    on(type: 'click', h: (ev: SketchEvent<JQuery.ClickEvent>) => void): this;
    on(type: 'change', h: (t: this) => void): this;
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
        this.emit('change');
    }

    select() {
        this.knobs = this.shape.vertices.map(u => this._mkknob(u)).concat(
            ...[...this.shape.sides].map(s => this._mkctrls(s)));
    }

    deselect() {
        if (this.spot) this.onto.removeControl(this.spot);
        if (this.knobs) this.knobs.forEach(k => this.onto.removeControl(k));
        this.knobs = this.spot = undefined;
    }

    _mkknob(u: Vertex) {
        var knob = new VertexKnob(u.at);
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

    _mkctrl(side: Side, at: Point2D, knob?: Knob) {
        var bside = side instanceof BezierSide ? side
            : this.shape.replaceSide(side, new BezierSide([at]));
        if (!knob) {
            this.onto.addControl(knob = new Knob(at, true, ['ephemeral']));
        }
        knob.on('move', ({at}) => {
            bside.ctrl[0] = at;
            this.update();
            if (this.spot && this.spot !== knob) this.unhit();
        });
        return knob;
    }

    _mkctrls(side: Side) {
        var at = side instanceof BezierSide ? side.ctrl : [];
        return at.map(p => this._mkctrl(side, p));
    }

    _mkspot(at: Point2D, side: Side) {
        var knob = new SpotKnob(at, side, !(side instanceof BezierSide),
                                ['ephemeral']);
        this.onto.addControl(knob);
        var moveh = ({at}) => {
            if (this.spot === knob) this.spot = undefined;
            knob.removeListener('move', moveh)
            this.knobs.push(this._mkctrl(side, at, knob));
        };
        knob.on('move', moveh);
        return knob;
    }

    hit(at: Point2D) {
        this.unhit();

        let h = this.shape.hitTest(at);
        if (h) {
            var knob = this._mkspot(h.at, h.side);
            this.onto.addControl(knob);
            this.spot = knob;
            this.addDir = knob.residesOn.getDirection(h.at);
        }
        return !!h;
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
        return true;
    }
}


class OvalComponent extends ShapeComponent {
    onto: SketchComponent
    shape: Oval
    elements: JQuery<SVGElement>
    knobs: Knob[]
    spot: SpotKnob<Side>

    constructor(onto: SketchComponent, shape: Oval) {
        super();
        this.onto = onto;
        this.shape = shape;
        this.elements = this.render();
    }

    render() {
        var p = $svg('circle').attr(this._attrs())
        return this.onto.addShape(p)
            .on('click', (ev) => this.emit('click', this.onto._mkMouseEvent(ev)));
    }

    update() {
        for (let e of this.elements) {
            $(e).attr(this._attrs());
        }
        this.emit('change');
    }

    _attrs() { 
        return {cx: this.shape.center.x, cy: this.shape.center.y, 
                r: this.shape.radii.x};  /** @todo */
    }

    select(at?: Point2D) {
        var cknob = new VertexKnob(this.shape.center),
            rknob = new VertexKnob({x: this.shape.center.x + this.shape.radii.x, y: this.shape.center.y});
        for (let knob of [cknob, rknob]) {
            knob.on('move', () => {
                this.shape.center = cknob.at;
                /** @todo only circle for now */
                this.shape.radii.x = this.shape.radii.y = 
                    fp(rknob.at).distanceTo(fp(cknob.at))[0];
                this.update();
            });
        }
        this.onto.addControl(cknob);
        this.onto.addControl(rknob);
        this.knobs = [cknob, rknob];
        if (at) this.hit(at);
    }

    deselect(): void {
        if (this.knobs) this.knobs.forEach(k => this.onto.removeControl(k));
        this.knobs = undefined;
    }

    hit(at: Point2D) {
        var {at: kat} = this.shape.hitTest(at);
        this.knobs[1].move(kat);
        return true;
    }

    edit(at: Point2D) {
        return false;
    }    
}


class VertexKnob extends Knob {

}

class SpotKnob<Obj> extends Knob {
    residesOn: Obj

    constructor(at: Point2D, residesOn: Obj, mobile?: boolean, cssClasses?: string[]) {
        super(at, mobile, cssClasses);
        this.residesOn = residesOn;
    }

    //mounted() { /** @oops disable dragging */ }
}



export { ShapeComponent, PolylineComponent, OvalComponent }
