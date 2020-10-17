import $ from 'jquery';

import $svg, { DraggableEventUIParams } from '../dom';
import { Point2D } from '../shape';
import { EventEmitter } from 'events';



class SketchComponent extends EventEmitter {
    svg: JQuery<SVGSVGElement>
    draw: JQuery<SVGGElement>
    mark: JQuery<SVGGElement>
    ctrl: JQuery<SVGGElement>

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

    onMouseDown(ev: JQuery.MouseDownEvent) {
        var at = $svg.coordDOMToSVG(this.svg, ev.offsetX, ev.offsetY);
        this.emit(ev.type, {at, ...ev});
    }
}


abstract class ControlWidget extends EventEmitter {
    el: JQuery<SVGCircleElement>
    mounted() { }
}

class Knob extends ControlWidget {
    constructor(at: Point2D, cssClasses: string[] = []) {
        super();
        this.el = $svg<SVGCircleElement>('circle').attr({cx: at.x, cy: at.y});
        this.el.addClass(['knob', ...cssClasses]);
    }

    mounted() {
        $svg.draggable(this.el, {
            drag: (event, ui: DraggableEventUIParams) => {
                this.emit('move', {target: this, at: ui.center});
            }
        });
    }
}



export { SketchComponent, ControlWidget, Knob }
