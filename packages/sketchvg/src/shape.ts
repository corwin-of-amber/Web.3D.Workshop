import _ from 'lodash';
import EJSON from 'ejson';
import Flatten from '@flatten-js/core';



class Polyline {
    vertices: Vertex[] = []

    createVertex(at: Point2D, side?: Side) {
        var u = new Vertex(at);
        this.addVertex(u);
        return u;
    }

    addVertex(u: Vertex, side?: Side) {
        var after = this.vertices.slice(-1)[0];
        this.vertices.push(u);
        if (after) this.addSide(after, u, side);
    }

    weld(side?: Side) {
        var u = this.vertices.slice(-1)[0],
            v = this.vertices[0];
        if (u !== v) this.addSide(u, v, side);
    }

    toPath() {
        var vs = this.vertices;
        if (vs.length == 0) return "";

        return [`M${vs[0].toPath()}`,
                ...vs.map(u => u.sides[1]).filter(l => l).map(l => l.toPath()),
                vs[0].sides[0] ? 'z' : '']
            .join('');
    }

    addSide(u: Vertex, v: Vertex, side: Side = new StraightSide) {
        side.endpoints = [u, v];
        u.sides[1] = side;
        v.sides[0] = side;
        return side;
    }

    get sides() { return this.itersides(); }
    *itersides() {
        for (let v of this.vertices)
            if (v.sides[0]) yield v.sides[0];
    }

    hitTest(at: Point2D) {
        return _.minBy([...this.sides].map(l => ({side:l, ...l.hitTest(at)}))
                       .filter(x => x.at), h => h.dist)
    }

    /* EJSON */
    typeName() { return Polyline.name; }
    toJSONValue() {
        return {
            vertices: this.vertices.map(u => EJSON.toJSONValue(u)),
            sides: this.vertices.map(u => EJSON.toJSONValue(u.sides[0]))
        };
    }
    static fromJSONValue(v: {vertices: Vertex[], sides: Side[]}) {
        v.vertices = v.vertices.map(EJSON.fromJSONValue);
        v.sides    = v.sides   .map(EJSON.fromJSONValue);
        var p = new Polyline();
        for (let [u, side] of _.zip(v.vertices, v.sides))
            p.addVertex(u, side);
        if (v.sides[0]) p.weld(v.sides[0]);
        return p;
    }
}

EJSON.addType(Polyline.name, Polyline.fromJSONValue);


class Vertex {
    at: Point2D
    sides: [Side, Side]
    constructor(at: Point2D) {
        this.at = at;
        this.sides = [null, null];  // lone
    }

    toPath() { return `${this.at.x} ${this.at.y}`; }

    /* EJSON */
    typeName() { return Vertex.name; }
    toJSONValue() { return {x: this.at.x, y: this.at.y}; }
    static fromJSONValue(v: Point2D) { return new Vertex(v); }
}

EJSON.addType(Vertex.name, Vertex.fromJSONValue);


abstract class Side {
    endpoints: [Vertex, Vertex]
    toPath(includeStart = false) {
        return (includeStart ? this.endpoints[0].toPath() : '') + this._cmd();
    }
    abstract _cmd(): string
    abstract hitTest(at: Point2D): {dist: number, at: Point2D};
}

class StraightSide extends Side {
    _cmd() { return `L${this.endpoints[1].toPath()}`; }
    hitTest(at: Point2D) {
        let [d, seg] = Flatten.point(at.x, at.y)
                       .distanceTo(this._segment);
        return {dist: d, at: seg.pe};
    }
    get _segment() {
        let [p1, p2] = this.endpoints;
        return Flatten.segment(p1.at.x, p1.at.y, p2.at.x, p2.at.y);
    }

    /* EJSON */
    typeName() { return StraightSide.name; }
    toJSONValue() { return {}; }
    static fromJSONValue() { return new StraightSide; }
}

EJSON.addType(StraightSide.name, StraightSide.fromJSONValue);


type Point2D = {x: number, y: number};


export { Polyline, Vertex, Side, StraightSide, Point2D }