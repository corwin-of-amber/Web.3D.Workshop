import assert from 'assert';
import { EventEmitter } from 'events';
import _ from 'lodash';
import * as THREE from 'three';
import { BezierSide, Point2D, Polyline, Side, StraightSide } from '../packages/sketchvg/src/shape';
import { Bezier } from 'bezier-js';



class Blueprint extends EventEmitter {

    objects: RMesh<any>[]
    factory: ObjectFactory
    floor: RMesh<any>

    constructor() {
        super();
        this.objects = [];
        this.factory = new ObjectFactory();
        this.floor = this.createFloor();
    }

    add<S>(rmesh: RMesh<S>, y = 0) {
        var mesh = rmesh.obj;
        mesh.position.y = y;
        this.emit('collection:add', mesh);
        this.objects.push(rmesh);
        return rmesh;
    }

    create(shape: SVGElement, y?: number, material?: THREE.Material) {
        return this.add(this.factory.fromShape(shape, this.floor.obj), y);
    }

    createFloor() {
        var geometry = new THREE.BoxGeometry( 7, 0.03, 7 ),
            material = new THREE.MeshLambertMaterial( { color: 0x504040, emissive: 0x101010 } );
        geometry.computeBoundingBox();
        return this.add(this.factory.mesh(geometry, material), 0);
    }

    clear() {
        for (let o of this.objects) {
            if (o != this.floor)
                this.emit('collection:remove', o);
        }
        this.objects = [this.floor];
    }

}


class ObjectFactory {

    material = ObjectFactory.defaultMaterial();

    static defaultMaterial(): THREE.Material {
        return new THREE.MeshPhongMaterial(
            { color: 0x404080, emissive: 0x071524 });
    }

    fromShape(shape: SVGElement, surface: THREE.Mesh) {
        if (shape instanceof SVGCircleElement)
            return this.coneFromCircle(shape, surface);
        else if (shape instanceof SVGRectElement)
            return this.boxFromRect(shape, surface);
        else
            throw new Error(`don't know what to do with '${shape.tagName}`);
    }

    coneFromCircle(circ: SVGCircleElement, surface: THREE.Mesh) {
        var radius = circ.r.baseVal.valueInSpecifiedUnits,
            surfaceSz = this.sizeOf(surface),
            g = new THREE.ConeGeometry( radius * surfaceSz.x / 200, 2, 60 );
        return this.mesh(g);
    }

    boxFromRect(rect: SVGRectElement, surface: THREE.Mesh) {
        var w = rect.width.baseVal.valueInSpecifiedUnits,
            h = rect.height.baseVal.valueInSpecifiedUnits,
            surfaceSz = this.sizeOf(surface),
            g = new THREE.BoxGeometry(w * surfaceSz.x / 200, 2, h * surfaceSz.z / 200);
        return this.mesh(g);
    }

    surfaceOfRevolution(shape: Polyline, hsects: number, vsects: number) {
        var g = new THREE.CylinderGeometry(1, 1, 1, hsects, vsects),
            curve = this.curveOfPolyline(shape);
        for (let v of g.vertices) {
            let p = curve(v.y + 0.5);  // v.y is in range [-.5, .5]
            v.x = v.x * p.x;   // scale (x,z) by p.x
            v.z = v.z * p.x;
            v.y = -p.y;
        }
        return g.scale(.02, .02, .02);
    }

    curveOfSegment(ps: Point2D, pe: Point2D) {
        return (r: number) => ({x: ps.x * (1 - r) + pe.x * r,
                                y: ps.y * (1 - r) + pe.y * r});
    }

    curveOfBezier(c: Bezier) {
        return (r: number) => c.get(r);
    }

    curveOfSide(s: Side) {
        var [p1, p2] = s.endpoints;
        if (s instanceof StraightSide)
            return this.curveOfSegment(p1.at, p2.at);
        else if (s instanceof BezierSide)
            return this.curveOfBezier(s._curve);
        else
            throw new Error(`unsupported side type, '${s.constructor.name}'`);
    }

    lengthOfSide(s: Side) {
        if (s instanceof StraightSide)
            return s._segment.length;
        else if (s instanceof BezierSide)
            return s._curve.length();
        else
            throw new Error(`unsupported side type, '${s.constructor.name}'`);
    }

    curveOfPolyline(poly: Polyline) {
        var sides = [...poly.sides];

        var lengths = sides.map(s => this.lengthOfSide(s)),
            acc = lengths[0];
        // compute all accumulated lengths
        for (var i = 1, size = lengths.length; i < size; ++i) {
            lengths[i] = acc = acc + lengths[i];
        }
        var curves = sides.map(s => this.curveOfSide(s));
        return (r: number) => {
            var atlen = r * acc,
                i = lengths.findIndex(l => atlen <= l);
            assert(i >= 0);
            var start = lengths[i - 1] || 0, end = lengths[i];
            return curves[i]((atlen - start) / (end - start));
        }        
    }

    mesh(geometry: THREE.Geometry, material = this.material) {
        return new ReactiveMeshFromGeometry(
            new THREE.Mesh(geometry, material));
    }

    _offsetMaterial(material: THREE.Material | THREE.Material[]) {
        if (Array.isArray(material))
            return material.map(m => this._offsetMaterial(m));
        var m = material.clone();
        m.polygonOffset = true;
        m.polygonOffsetFactor = 1;
        m.polygonOffsetUnits = 1;
        return m;
    }

    withWireframe<S>(rmesh: RMesh<S>) {
        var mesh = rmesh.obj,
            geom = () => {
                var geom = mesh.geometry; 
                assert(geom instanceof THREE.Geometry);
                return geom as THREE.Geometry;
            };
        var w = this.wireframe(geom());
        mesh.material = this._offsetMaterial(mesh.material); // prevent z-fighting betweein lines and faces
        mesh.add(w);
        return ReactiveSink.par(rmesh, () => w.geometry = new THREE.WireframeGeometry(geom()));
    }

    wireframe(geometry: THREE.Geometry) {
        var geo = new THREE.WireframeGeometry( geometry );

        var mat = new THREE.LineBasicMaterial(
              { color: 0xffffff, transparent: true, opacity: 0.3,
                linewidth: 5 });
        
        return new THREE.LineSegments( geo, mat );
    }

    sizeOf(surface: THREE.Mesh) {
        return surface.geometry.boundingBox.getSize(new THREE.Vector3());
    }
}



type RMesh<Spec> = ReactiveSink<Spec, THREE.Mesh>


class ReactiveSink<Spec, Obj> {
    obj: Obj
    update: (spec: Spec) => void

    constructor(obj: Obj, update: (spec: Spec) => void) {
        this.obj = obj;
        this.update = update;
    }

    static seq<Pre, Spec, Obj, Sink extends ReactiveSink<Spec, Obj>>
        (init: Pre, f: (pre: Pre) => Spec, mk: (spec: Spec) => Sink) {
        let intermediate = mk(f(init));
        return new ReactiveSink<Pre, Obj>(intermediate.obj,
            (pre: Pre) => intermediate.update(f(pre)));
    }

    static par<Spec, Obj>
        (sink: ReactiveSink<Spec, Obj>, f: (spec: Spec) => void) {
        return new ReactiveSink<Spec, Obj>(sink.obj, (spec: Spec) => {
            sink.update(spec); f(spec);
        });
    }
}


class ReactiveMeshFromGeometry extends ReactiveSink<THREE.Geometry, THREE.Mesh> {

    constructor(mesh: THREE.Mesh) {
        super(mesh, (geom: THREE.Geometry) => mesh.geometry = geom);
    }
}



export { Blueprint, ObjectFactory, ReactiveSink, ReactiveMeshFromGeometry, RMesh }