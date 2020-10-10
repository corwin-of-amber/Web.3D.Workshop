

class Polyline {
    vertices: Vertex[] = []

    createVertex(at: Point2D) {
        var u = new Vertex(at),
            after = this.vertices.slice(-1)[0];
        this.vertices.push(u);
        if (after) this.addSide(after, u);
    }

    weld() {
        var u = this.vertices.slice(-1)[0],
            v = this.vertices[0];
        if (u !== v) this.addSide(u, v);
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
}


class Vertex {
    at: Point2D
    sides: [Side, Side]
    constructor(at: Point2D) {
        this.at = at;
        this.sides = [null, null];  // lone
    }

    toPath() { return `${this.at.x} ${this.at.y}`; }
}

abstract class Side {
    endpoints: [Vertex, Vertex]
    toPath(includeStart = false) {
        return (includeStart ? this.endpoints[0].toPath() : '') + this._cmd();
    }
    abstract _cmd(): string
}

class StraightSide extends Side {
    _cmd() { return `L${this.endpoints[1].toPath()}`; }
}


type Point2D = {x: number, y: number};


export { Polyline, Vertex, Side, StraightSide, Point2D }