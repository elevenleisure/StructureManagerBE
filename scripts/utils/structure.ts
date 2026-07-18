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
    {rotation: StructureRotation.None, translate: "ui.structure.action.rotation.0.label"},
    {rotation: StructureRotation.Rotate90, translate: "ui.structure.action.rotation.90.label"},
    {rotation: StructureRotation.Rotate180, translate: "ui.structure.action.rotation.180.label"},
    {rotation: StructureRotation.Rotate270, translate: "ui.structure.action.rotation.270.label"}
];

export const StructureAnimationModes = [
    {animationMode: StructureAnimationMode.None, translate: "ui.structure.action.animation.none.label"},
    {animationMode: StructureAnimationMode.Blocks, translate: "ui.structure.action.animation.blocks.label"},
    {animationMode: StructureAnimationMode.Layers, translate: "ui.structure.action.animation.layers.label"},
];

export const StructureMirrorAxes = [
    {mirrorAxis: StructureMirrorAxis.None, translate: "ui.structure.action.mirror.none.label"},
    {mirrorAxis: StructureMirrorAxis.X, translate: "ui.structure.action.mirror.x.label"},
    {mirrorAxis: StructureMirrorAxis.Z, translate: "ui.structure.action.mirror.z.label"},
    {mirrorAxis: StructureMirrorAxis.XZ, translate: "ui.structure.action.mirror.xz.label"}
]

export function saveStructure(structureId: string, dimension: Dimension, from: Vector3, to: Vector3, includeBlocks?: boolean, includeEntities?: boolean, saveMode?: StructureSaveMode) {
    structureId = padNamespace(structureId);
    if (hasStructure(structureId)) throw new Error(`Repetitive structure Id: ${structureId}`);
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
        throw new Error("The structure can not be deleted.");
    }
}

export function cloneStructure(structure: Structure | string, structureId: string, saveMode?: StructureSaveMode) {
    let sourceStructure: Structure;
    if (typeof structure === "string") {
        let _structure = world.structureManager.get(structure);
        if (_structure && _structure.isValid) sourceStructure = _structure;
        else throw new Error(`Invalid structure Id: ${structure}`);
    } else {
        sourceStructure = structure
    }
    const { namespace, path } = praseStructureId(structureId);


    const newStructureId = `${namespace}:${path}`;
    if (hasStructure(newStructureId)) throw new Error(`Repetitive structure Id: ${structure}`);
    
    sourceStructure.saveAs(newStructureId, saveMode)
}

export function renameStructure(structure: Structure | string, newStructureId: string) {
    if ((typeof structure === "string" ? structure : structure.id) === newStructureId) return;
    try {
        cloneStructure(structure, newStructureId);
        deleteStructure(structure)
    } catch (e) {
        throw new Error("The structure can not be renamed.");
    }
}

export function getAllStructureId() {
    return world.structureManager.getWorldStructureIds().concat(world.structureManager.getPackStructureIds());
}

export function hasStructure(structure: Structure | string) {
    return getAllStructureId().includes(typeof structure === "string" ? padNamespace(structure) : structure.id);
}