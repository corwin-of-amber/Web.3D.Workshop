import { SketchEditor } from '../../packages/sketchvg/src/index'
import { Oval, Polyline } from '../../packages/sketchvg/src/shape';
import { OvalComponent, PolylineComponent, ShapeComponent } from '../../packages/sketchvg/src/components/shape';
import { StraightRuleComponent } from '../../packages/sketchvg/src/components/rule';



class SoRBundles {
    curve: CurveBundle
    revolve: RevolveBundle

    constructor(curve: {editor: SketchEditor, shape: {outline: Polyline}},
                revolve: {editor: SketchEditor, shape: {perimeter: Oval}}) {
        this.curve = new CurveBundle(curve.editor, curve.shape);
        this.revolve = new RevolveBundle(revolve.editor, revolve.shape);
    }

    get components(): ShapeComponent[] {
        return [].concat(this.curve.components, this.revolve.components);
    }

    static create(panel: JQuery<HTMLElement>,
                  curve: {outline: Polyline},
                  revolve: {perimeter: Oval}) {
        var e = SoRBundles.createEditors(panel);
        return {editor: e, 
                bundles: new SoRBundles({editor: e.curve, shape: curve},
                                        {editor: e.revolve, shape: revolve})};
    }

    static createEditors(panel: JQuery<HTMLElement>) {
        return {
            curve: new SketchEditor(<any>panel.find('#curve') as JQuery<SVGSVGElement>),
            revolve: new SketchEditor(<any>panel.find('#revolve') as JQuery<SVGSVGElement>),
        };
    }
}

class CurveBundle {
    outline: PolylineComponent
    axis: StraightRuleComponent

    constructor(editor: SketchEditor, shape: {outline: Polyline}) {
        this.outline = editor.newPolyline(shape.outline);
        this.axis = 
            editor.add(new StraightRuleComponent(editor.sketch, {axis: 'x', at: 0}));
    }

    get components(): ShapeComponent[] {
        return [this.outline, this.axis];
    }
}

class RevolveBundle {
    perimeter: OvalComponent

    constructor(editor: SketchEditor, shape: {perimeter: Oval}) {
        this.perimeter = editor.newOval(shape.perimeter);
    }

    get components(): ShapeComponent[] {
        return [this.perimeter];
    }
}



export { SoRBundles, CurveBundle, RevolveBundle }