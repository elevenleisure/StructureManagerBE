import { Vector3Utils } from "../lib/math/minecraft-math.js";
export function toRadian(angle) {
    return angle * Math.PI / 180;
}
export function relative(v1, o) {
    return Vector3Utils.subtract(v1, o);
}
export function rotateX(v1, o, radian) {
    return Vector3Utils.add(o, Vector3Utils.rotateX(relative(v1, o), radian));
}
export function rotateY(v1, o, radian) {
    return Vector3Utils.add(o, Vector3Utils.rotateY(relative(v1, o), radian));
}
export function rotateZ(v1, o, radian) {
    return Vector3Utils.add(o, Vector3Utils.rotateZ(relative(v1, o), radian));
}
export function inRange(v, min, max) {
    return v <= max && v >= min;
}
export function getPlayerToward(player) {
    const rotation = player.getRotation();
    if (rotation.x < -45) {
        return { x: 0, y: 1, z: 0 };
    }
    else if (rotation.x > 45) {
        return { x: 0, y: -1, z: 0 };
    }
    else {
        if (inRange(rotation.y, 135, 180) || inRange(rotation.y, -180, -135)) {
            return { x: 0, y: 0, z: -1 };
        }
        else if (inRange(rotation.y, -135, -45)) {
            return { x: 1, y: 0, z: 0 };
        }
        else if (inRange(rotation.y, -45, 45)) {
            return { x: 0, y: 0, z: 1 };
        }
        else {
            return { x: -1, y: 0, z: 0 };
        }
    }
}
export function expandAABB(pos1, pos2, v) {
    if (pos1.x > pos2.x) {
        if (v.x > 0)
            pos1.x = pos1.x + v.x;
        else
            pos2.x = pos2.x + v.x;
    }
    else {
        if (v.x > 0)
            pos2.x = pos2.x + v.x;
        else
            pos1.x = pos1.x + v.x;
    }
    if (pos1.y > pos2.y) {
        if (v.y > 0)
            pos1.y = pos1.y + v.y;
        else
            pos2.y = pos2.y + v.y;
    }
    else {
        if (v.y > 0)
            pos2.y = pos2.y + v.y;
        else
            pos1.y = pos1.y + v.y;
    }
    if (pos1.z > pos2.z) {
        if (v.z > 0)
            pos1.z = pos1.z + v.z;
        else
            pos2.z = pos2.z + v.z;
    }
    else {
        if (v.z > 0)
            pos2.z = pos2.z + v.z;
        else
            pos1.z = pos1.z + v.z;
    }
}
export function contractAABB(pos1, pos2, v) {
    if (pos1.x > pos2.x) {
        if (v.x > 0)
            pos1.x = pos1.x - v.x;
        else
            pos2.x = pos2.x - v.x;
    }
    else {
        if (v.x > 0)
            pos2.x = pos2.x - v.x;
        else
            pos1.x = pos1.x - v.x;
    }
    if (pos1.y > pos2.y) {
        if (v.y > 0)
            pos1.y = pos1.y - v.y;
        else
            pos2.y = pos2.y - v.y;
    }
    else {
        if (v.y > 0)
            pos2.y = pos2.y - v.y;
        else
            pos1.y = pos1.y - v.y;
    }
    if (pos1.z > pos2.z) {
        if (v.z > 0)
            pos1.z = pos1.z - v.z;
        else
            pos2.z = pos2.z - v.z;
    }
    else {
        if (v.z > 0)
            pos2.z = pos2.z - v.z;
        else
            pos1.z = pos1.z - v.z;
    }
}
