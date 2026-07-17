import { AABB, Vector3 } from "@minecraft/server";
import { AABBUtils, Vector3Utils } from "../lib/math/minecraft-math.js";

export function createPreviewAABB(pos1: Vector3, pos2: Vector3) {
   
    const max = Vector3Utils.max(pos1, pos2);
    const min = Vector3Utils.min(pos1, pos2);
    return AABBUtils.createFromCornerPoints(min, Vector3Utils.add(max, {x: 1, y: 1, z: 1}));

}

export function getEdgeIntegerPoints(AABB: AABB): Vector3[] {
    const {x:x1, y:y1, z:z1} = AABBUtils.getMin(AABB);
    const {x:x2, y:y2, z:z2} = AABBUtils.getMax(AABB);
    const points: Vector3[] = [];
    const seen = new Set();
    
    const addPoint = (x: number, y: number, z: number) => {
        const key = `${x},${y},${z}`;
        if (!seen.has(key)) {
            seen.add(key);
            points.push({x, y, z});
        }
    };
    for (let x = x1; x <= x2; x++) {
        for (let y of [y1, y2]) {
            for (let z of [z1, z2]) {
                addPoint(x, y, z);
            }
        }
    }
    for (let y = y1 + 1; y < y2; y++) {
        for (let x of [x1, x2]) {
            for (let z of [z1, z2]) {
                addPoint(x, y, z);
            }
        }
    }
    for (let z = z1 + 1; z < z2; z++) {
        for (let x of [x1, x2]) {
            for (let y of [y1, y2]) {
                addPoint(x, y, z);
            }
        }
    }
    return points;
}
