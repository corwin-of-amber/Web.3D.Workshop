import { EventEmitter } from 'events';
import * as THREE from 'three';



class Blueprint extends EventEmitter {

    objects: any[]
    factory: ObjectFactory
    floor: THREE.Mesh

    constructor() {
        super();
        this.objects = [];
        this.factory = new ObjectFactory();
        this.floor = this.createFloor();
    }

    add(mesh: THREE.Mesh, y = 0) {
        mesh.position.y = y;
        this.emit('collection:add', mesh);
        this.objects.push(mesh);
        return mesh;
    }

    create(shape: SVGElement, y?: number, material?: THREE.Material) {
        return this.add(this.factory.fromShape(shape, this.floor), y);
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
        return new THREE.MeshLambertMaterial( { color: 0x404080, emissive: 0x072534 } );
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

    mesh(geometry: THREE.Geometry, material = this.material) {
        return new THREE.Mesh(geometry, material);
    }

    sizeOf(surface: THREE.Mesh) {
        return surface.geometry.boundingBox.getSize(new THREE.Vector3());
    }
}



export { Blueprint, ObjectFactory }