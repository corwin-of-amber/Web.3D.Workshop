import { EventEmitter } from 'events';
import $ from 'jquery';

import $svg, { DraggableEventUIParams } from '../dom';
import { Point2D } from '../shape';
import { ShapeComponent } from './shape';



class SketchComponent extends EventEmitter {
    svg: JQuery<SVGSVGElement>
    draw: JQuery<SVGGElement>
    mark: JQuery<SVGGElement>
    ctrl: JQuery<SVGGElement>

    selection: Set<ShapeComponent> = new Set

    constructor(svg: JQuery<SVGSVGElement>) {
        super();
        this.svg = svg;
        this.draw = $(svg[0].querySelector('.draw') as SVGGElement);
        this.mark = $(svg[0].querySelector('.mark') as SVGGElement);
        this.ctrl = $(svg[0].querySelector('.ctrl') as SVGGElement);

        this.createMarkShadows();
        this.bindEvents();
    }

    createMarkShadows() {
        for (let shape of this.draw.children()) {
            this.mark.append(<any>shape.cloneNode());
        }    
    }

    bindEvents() {
        this.svg.on('mousedown', ev => this.onMouseDown(ev));
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

    removeControl(widget: ControlWidget) {
        widget.el.remove();
    }

    select(component: ShapeComponent) {
        this.deselectAll();
        component.select();
        this.selection.add(component);
    }

    deselectAll() {
        for (let c of this.selection) c.deselect();
        this.selection.clear();
    }

    onMouseDown(ev: JQuery.MouseDownEvent) {
        this.emit(ev.type, this._mkMouseEvent(ev));
    }

    _mkMouseEvent<E extends JQuery.MouseEventBase>(ev: E) {
        var evat: SketchEvent<E> = ev;
        evat.at = $svg.coordDOMToSVG(this.svg, ev.offsetX, ev.offsetY);
        return evat;
    }
}

interface SketchComponent {
    on(type: 'mousedown', h: (ev: SketchEvent<JQuery.MouseDownEvent>) => void): this;
}


abstract class ControlWidget extends EventEmitter {
    el: JQuery<SVGCircleElement>
    mounted() { }

    hide(tog = true) { this.el.toggleClass('ctrl--hide', tog); }
    unhide() { this.hide(false); }
}

class Knob extends ControlWidget {
    constructor(at: Point2D, cssClasses: string[] = []) {
        super();
        this.el = $svg<SVGCircleElement>('circle').attr({cx: at.x, cy: at.y});
        this.el.addClass(['knob', ...cssClasses]);
        this.el.on('mousedown', ev => this.onMouseDown(ev));
    }

    mounted() {
        $svg.draggable(this.el, {
            drag: (event, ui: DraggableEventUIParams) => {
                this.emit('move', {target: this, at: ui.center});
            }
        });
    }

    onMouseDown(ev: JQuery.MouseDownEvent) {
        ev.stopPropagation();
        this.emit(ev.type, ev);
    }
}

type SketchEvent<E> = E & {at?: Point2D};



export { SketchComponent, ControlWidget, Knob, SketchEvent }
