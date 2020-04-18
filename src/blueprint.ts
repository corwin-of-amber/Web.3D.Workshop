import { EventEmitter } from 'events';
import * as THREE from 'three';



class BluePrint extends EventEmitter {

    objects: any[]
    factory: ObjectFactory
    floor: THREE.Mesh

    constructor() {
        super();
        this.objects = [];
        this.factory = new ObjectFactory();
        this.floor = this.createFloor();
    }

    add(geometry: THREE.Geometry, y = 0, material = this.factory.material) {
        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.y = y;
        this.emit('collection:add', mesh);
        this.objects.push(mesh);
        return mesh;
    }

    create(shape: string, y?: number, material?: THREE.Material) {
        return this.add(this.factory[shape](), y, material);
    }

    createFloor(material?: THREE.Material) {
        var geometry = new THREE.BoxGeometry( 7, 0.03, 7 );
        return this.add(geometry, 0, material);
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

    cone() { return new THREE.ConeGeometry( 1, 2, 60 ); }
    squareColumn() { return new THREE.BoxGeometry( 1, 2, 1 ); }
}



export { BluePrint, ObjectFactory }