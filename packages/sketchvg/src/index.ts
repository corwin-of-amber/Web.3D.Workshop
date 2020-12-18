import { Polyline } from './shape';
import { SketchComponent } from './components/sketch';
import { PolylineComponent, ShapeComponent } from './components/shape';
import './editor.css';


class SketchEditor {
    sketch: SketchComponent
    shapes: ShapeComponent[]

    constructor(svg: JQuery<SVGSVGElement>) {
        this.sketch = new SketchComponent(svg);
        this.shapes = [];
        this._bindEvents();
    }

    _bindEvents() {
        this.sketch.on('mousedown', (ev) => {
            if (ev.altKey && this.sketch.selection.size > 0) {
                let p = this.sketch.selection.values().next().value;  /** @oops has type `any` */
                p.edit(ev.at);
            }
            else {
                this.sketch.deselectAll();
            }
        });
    }

    newPolyline(shape: Polyline) {
        var p = new PolylineComponent(this.sketch, shape);
        p.on('click', (ev) => {
            this.sketch.select(p); p.hit(ev.at);
        });
        this.shapes.push(p);
        return p;
    }
}


export { SketchEditor }