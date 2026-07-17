import { Dimension, Structure, StructureAnimationMode, StructureMirrorAxis, StructureRotation, StructureSaveMode, Vector3, world } from "@minecraft/server";


export function praseStructureId(structureId: string): {
    namespace: string;
    path: string;
} {
    const i = structureId.indexOf(":");
    if (i === -1) {
        return {
            namespace: "mystructure",
            path: structureId
        }
    } else {
        return {
            namespace: structureId.substring(0, i),
            path: structureId.substring(i + 1)
        }
    }
}

export function padNamespace(structureId: string) {
    const {namespace, path} = praseStructureId(structureId);
    return namespace + ":" + path;
}

export const StructureRotations = [
    {rotation: StructureRotation.None, text: "无旋转"},
    {rotation: StructureRotation.Rotate90, text: "旋转90°"},
    {rotation: StructureRotation.Rotate180, text: "旋转180°"},
    {rotation: StructureRotation.Rotate270, text: "旋转270°"}
];

export const StructureAnimationModes = [
    {animationMode: StructureAnimationMode.None, text: "无动画"},
    {animationMode: StructureAnimationMode.Blocks, text: "逐方块"},
    {animationMode: StructureAnimationMode.Layers, text: "逐层"},
];

export const StructureMirrorAxes = [
    {mirrorAxis: StructureMirrorAxis.None, text: "无镜像"},
    {mirrorAxis: StructureMirrorAxis.X, text: "x"},
    {mirrorAxis: StructureMirrorAxis.Z, text: "z"},
    {mirrorAxis: StructureMirrorAxis.XZ, text: "xz"}
]

export function saveStructure(structureId: string, dimension: Dimension, from: Vector3, to: Vector3, includeBlocks?: boolean, includeEntities?: boolean, saveMode?: StructureSaveMode) {
    structureId = padNamespace(structureId);
    if (hasStructure(structureId)) throw new Error(`重复的结构ID：${structureId}`);
    return overrideStructure(structureId, dimension, from, to, includeBlocks, includeEntities, saveMode);
}

export function overrideStructure(structureId: string, dimension: Dimension, from: Vector3, to: Vector3, includeBlocks?: boolean, includeEntities?: boolean, saveMode?: StructureSaveMode) {
    structureId = padNamespace(structureId);
    try {
        deleteStructure(structureId);
    } catch {}
    return world.structureManager.createFromWorld(structureId, dimension, from, to, {
        includeBlocks: includeBlocks,
        includeEntities: includeEntities,
        saveMode: saveMode
    });
}

export function loadStructure(structureId: string, dimension: Dimension, location: Vector3, animationMode?: StructureAnimationMode, animationSeconds?: number, includeBlocks?: boolean, includeEntities?: boolean, integrity?: number, integritySeed?: string, mirror?: StructureMirrorAxis, rotation?: StructureRotation, waterlogged?: boolean) {
    structureId = padNamespace(structureId);
    world.structureManager.place(structureId, dimension, location, {
        animationMode: animationMode,
        animationSeconds: animationSeconds,
        includeBlocks: includeBlocks,
        includeEntities: includeEntities,
        integrity: integrity,
        integritySeed: integritySeed,
        mirror: mirror,
        rotation: rotation,
        waterlogged: waterlogged
    });
}

export function deleteStructure(structure: Structure | string) {
    if (typeof structure === "string") structure = padNamespace(structure);
    if (!world.structureManager.delete(structure)) {
        throw new Error("无法删除该结构");
    }
}

export function cloneStructure(structure: Structure | string, structureId: string, saveMode?: StructureSaveMode) {
    let sourceStructure: Structure;
    if (typeof structure === "string") {
        let _structure = world.structureManager.get(structure);
        if (_structure && _structure.isValid) sourceStructure = _structure;
        else throw new Error(`无效的结构ID：${structure}`);
    } else {
        sourceStructure = structure
    }
    const { namespace, path } = praseStructureId(structureId);


    const newStructureId = `${namespace}:${path}`;
    if (hasStructure(newStructureId)) throw new Error(`重复的结构ID：${structure}`);
    
    sourceStructure.saveAs(newStructureId, saveMode)
}

export function renameStructure(structure: Structure | string, newStructureId: string) {
    if ((typeof structure === "string" ? structure : structure.id) === newStructureId) return;
    try {
        cloneStructure(structure, newStructureId);
        deleteStructure(structure)
    } catch (e) {
        deleteStructure(newStructureId);
        throw new Error("该结构无法被重命名");
    }
}

export function getAllStructureId() {
    return world.structureManager.getWorldStructureIds().concat(world.structureManager.getPackStructureIds());
}

export function hasStructure(structure: Structure | string) {
    return getAllStructureId().includes(typeof structure === "string" ? padNamespace(structure) : structure.id);
}