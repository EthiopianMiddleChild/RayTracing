var objects = [];
var lights = [];

class object {
    constructor(_pos, _rot, _scale, _clr, _emmClr, _emmInteg, _roughness, _type, _points, _tris) {
        this.trans = {
            "pos": { "x": _pos.x, "y": _pos.y, "z": _pos.z },
            "rot": { "x": _rot.x, "y": _rot.y, "z": _rot.z },
            "scale": { "x": _scale.x, "y": _scale.y, "z": _scale.z }
        };
        this.clr = _clr;
        this.emmClr = _emmClr;
        this.emmInteg = _emmInteg;
        this.roughness = _roughness;
        this.type = _type;
        this.orientation;
        if (this.type == "Mesh") {
            this.points = _points;
            this.tris = _tris;
            this.update();
        }
        console.log(this);
    }
    update() {
        this.orientation = AngToDir(this.trans.rot);
        this.negCorner = Vector3(0, 0, 0);
        this.posCorner = Vector3(0, 0, 0);
        let fnlVec = (_raw) => {
            let defVec = VectorMult(_raw, this.trans.scale);
            let forVec = VectorScalarMult(this.orientation.front, defVec.x);
            let rigVec = VectorScalarMult(this.orientation.right, defVec.y);
            let upVec = VectorScalarMult(this.orientation.up, defVec.z);
            return VectorAdd(VectorAdd(forVec, rigVec), upVec);
        }
        for (let i = 0; i < this.points.length; i++) {
            let p = fnlVec(this.points[i]);
            this.negCorner = Vector3(Math.min(p.x, this.negCorner.x), Math.min(p.y, this.negCorner.y), Math.min(p.z, this.negCorner.z));
            this.posCorner = Vector3(Math.max(p.x, this.posCorner.x), Math.max(p.y, this.posCorner.y), Math.max(p.z, this.posCorner.z));
        }
        // console.log(Dist(Vector3(0, 0, 0), VectorAdd(VectorAdd(this.orientation.front, this.orientation.up), this.orientation.right)));
        // console.log(this.trans);
        // console.log(Dist(fnlVec(this.points[0]), fnlVec(this.points[7])));
    }

}

class cam {
    constructor(_pos, _rot, _fov) {
        this.trans = {
            "pos": { "x": _pos.x, "y": _pos.y, "z": _pos.z },
            "rot": { "x": _rot.x, "y": _rot.y, "z": _rot.z }
        };
        this.fov = _fov * (Math.PI / 180);
        this.type = "Cam";
    }
}

class light {
    constructor(_pos, _rad, _integ, _clr) {
        this.trans = {
            "pos": { "x": _pos.x, "y": _pos.y, "z": _pos.z },
            "rad": _rad
        };
        this.emmInteg = _integ;
        this.emmClr = _clr;
        this.type = "Light";
    }
    calcPower(_vec3) {
        let dist = this.closestDist(_vec3);
        return this.emmInteg * InverseSquareLaw(dist, _vec3);
    }
    closestDist(vec3) {
        let objDistToPoint = Dist(this.trans.pos, vec3);
        return objDistToPoint - this.trans.rad;
    }
}

class World {
    constructor(_skyPwr, _sunPwr, _groundClr, _zenithClr, _horizonClr, _sunClr, _sunElavation, _sunAngle) {
        this.skyPwr = _skyPwr;
        this.sunPwr = _sunPwr;
        this.groundClr = _groundClr;
        this.zenithClr = _zenithClr;
        this.horizonClr = _horizonClr;
        this.sunClr = _sunClr;
        this.sunElavation = _sunElavation;
        this.sunAngle = _sunAngle;
    }
    getSunDir() {
        return normalize(Vector3(Math.cos(this.sunAngle) * Math.cos(this.sunElavation), Math.sin(this.sunAngle) * Math.cos(this.sunElavation), Math.sin(this.sunElavation)));
    }
    getColor(_dir) {
        let skyClr = ColorLerp(this.horizonClr, this.zenithClr, Math.pow(smoothStep(0, 0.4, _dir.z), 0.35));
        let sunFocus = 100;
        let sun = Math.pow(Math.max(0, VectorDotProduct(_dir, this.getSunDir())), sunFocus) * this.sunPwr;

        let ground = smoothStep(-0.01, 0, _dir.z);
        skyClr = ColorLerp(this.groundClr, skyClr, ground);
        let sunMask = ground >= 1;
        return ColorAdd(ColorScalarMult(skyClr, this.skyPwr), ColorScalarMult(ColorScalarMult(this.sunClr, sun), sunMask));
    }

}

function addObject(_type, _pos, _i1, _i2, _i3, _i4, _i5, _i6, _i7, _i8) {
    switch (_type) {
        case "Cam":
            /*
            rot = i1;
            fov = i2;
            */
            objects.push(new cam(_pos, _i1, _i2));
            Cam = objects[objects.length - 1];
            break;
        case "Light":
            /*
            rad = i1;
            integ = i2;
            clr = i3;
            roughness = i4;
            */
            var newLight = new light(_pos, _i1, _i2, _i3, _i4);
            lights.push(newLight);
            break;
        case "Custom":
            /*
            rot = i1;
            scale = i2;
            clr = i3;
            roughness = i4;
            points = i5;
            tris = i6;
            */
            objects.push(new object(_pos, _i1, _i2, _i3, _i4, _i5, _i6, "Mesh", _i7, _i7));
            (_pos, _rot, _scale, _clr, _emmClr, _integ, _roughness, _type, _points, _tris)
            break;
        case "Cube":
            /*
            rot = i1;
            scale = i2;
            clr = i3;
            roughness = i4;
            points = i5;
            tris = i6;
            */
            let cubeVerts = [Vector3(-1, -1, -1), Vector3(1, -1, -1), Vector3(-1, 1, -1), Vector3(1, 1, -1), Vector3(-1, -1, 1), Vector3(1, -1, 1), Vector3(-1, 1, 1), Vector3(1, 1, 1)];
            let cubeTris = [0, 2, 3, 0, 3, 1, 4, 6, 2, 4, 2, 0, 5, 7, 6, 5, 6, 4, 1, 3, 7, 1, 7, 5, 4, 0, 1, 4, 1, 5, 2, 6, 7, 2, 7, 3];
            objects.push(new object(_pos, _i1, _i2, _i3, _i4, _i5, _i6, "Mesh", cubeVerts, cubeTris));
            break;
        case "Plane":
            /*
            rot = i1;
            scale = i2;
            clr = i3;
            emmClr = i4;
            emmInteg = i5;
            roughness = i6;
            */
            let planeVerts = [Vector3(-1, -1, 0), Vector3(1, -1, 0), Vector3(-1, 1, 0), Vector3(1, 1, 0)];
            let planeTris = [0, 3, 2, 0, 1, 3];
            objects.push(new object(_pos, _i1, _i2, _i3, _i4, _i5, _i6, "Mesh", planeVerts, planeTris));
            break;
        case "Cylinder":
            /*
            rot = i1;
            scale = i2;
            clr = i3;
            emmClr = i4;
            emmInteg = i5;
            roughness = i6;
            rings = i7[0];
            colss = i7[1];
            */
            let cylinderData = makeCylinder(Math.max(_i5[0], 2), Math.max(_i5[1], 3));
            objects.push(new object(_pos, _i1, _i2, _i3, _i4, _i5, _i6, "Mesh", cylinderData.verts, cylinderData.tris));
            break;
        default:
            /*
            rot = i1;
            scale = i2;
            clr = i3;
            emmClr = i4;
            emmInteg = i5;
            */
            objects.push(new object(_pos, _i1, Vector3(_i2, 0, 0), _i3, _i4, _i5, _i6, _type));
            break;
    }
}

function makeCylinder(_rings, _cols) {
    let verts = [];
    verts.push(Vector3(0, 0, -1));
    for (let r = 0; r < _rings; r++) {
        for (let c = 0; c < _cols; c++) {
            let x = Math.cos(2 * Math.PI * c / (_cols));
            let y = -Math.sin(2 * Math.PI * c / (_cols));
            let z = -1 + (2 * r / (_rings - 1));
            let circle = normalize(Vector3(x, y, 0));
            verts.push(VectorAdd(circle, Vector3(0, 0, z)));
        }
    }
    verts.push(Vector3(0, 0, 1));
    let tris = [];
    for (let r = 1; r <= _rings + 1; r++) {
        for (let c = 1; c <= _cols; c++) {
            switch (r) {
                case 1:
                    tris.push(0, c, c >= _cols ? 1 : c + 1);
                    break;
                case _rings + 1:
                    tris.push(((_rings - 1) * _cols) + c, (_rings * _cols) + 1, c >= _cols ? ((_rings - 1) * _cols) + 1 : ((_rings - 1) * _cols) + c + 1);
                    break
                default:
                    tris.push((r - 2) * _cols + c, (r - 1) * _cols + c, c >= _cols ? (r - 1) * _cols + 1 : (r - 1) * _cols + c + 1);
                    tris.push((r - 2) * _cols + c, c >= _cols ? (r - 1) * _cols + 1 : (r - 1) * _cols + c + 1, c >= _cols ? r - 1 : (r - 2) * _cols + c + 1);
                    break;
            }
        }
    }
    return { "verts": verts, "tris": tris };
}