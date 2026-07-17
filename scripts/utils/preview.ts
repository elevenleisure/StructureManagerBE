import { AABB, Dimension, ItemStack, Player, StructureRotation, system, Vector3, world } from "@minecraft/server";
import { createPreviewAABB, getEdgeIntegerPoints } from "./AABB.js";
import { saveHotbar, clearHotbar, getPlayerInventory, restoreHotbar } from "./inventory.js";
import { AABBUtils, Vector3Utils } from "../lib/math/minecraft-math.js";
import { VertexSelectionTool, StructureRotationTool, CompletionTool, CancellationTool, ExtensionTool, ContractionTool, MoveTool } from "./tool.js";
import { RawMessageBuilder, tell } from "./str.js";
import { expandAABB, getPlayerToward, contractAABB, relative } from "./math.js";


export const particleId = "smanager:selection";
export const playerHotbar = new Map<string, (ItemStack | undefined)[]>();

export function tryDrawParticle(source: Player | Dimension, location: Vector3) {
    try {
        source.spawnParticle(particleId, location);
    } catch (e) {}
}

export function drawBorder(source: Player | Dimension, AABB: AABB) {
    getEdgeIntegerPoints(AABB).forEach(v => {
        tryDrawParticle(source, v);
    });
}

export function startSelectSave(player: Player, defaultPos1?: Vector3, defaultPos2?: Vector3) {
    saveHotbar(player);
    clearHotbar(player);

    let pos1: Vector3 | undefined = defaultPos1;
    let pos2: Vector3 | undefined = defaultPos2;

    const vertexSelectionTool = new VertexSelectionTool(player);
    vertexSelectionTool.actionbarMessage = RawMessageBuilder.text("对方块左键/长按 - 选取第一个点\n对方块右键/点击 - 选取第二个点");
    vertexSelectionTool.onHitWithBlock = (player, block) => {
        pos1 = block.location;
        tell(player, `将第一选取点设为：(${block.x}, ${block.y}, ${block.z})`);
        draw();
    };
    vertexSelectionTool.onUseWithBlock = (player, block) => {
        pos2 = block.location;
        tell(player, `将第二选取点设为：(${block.x}, ${block.y}, ${block.z})`);
        draw();
    };

    const extensionTool = new ExtensionTool(player);
    extensionTool.onUse = player => {
        if (!(pos1 && pos2)) {
            tell(player, "你还没有选择一个区域");
            return;
        }
        expandAABB(pos1, pos2, getPlayerToward(player));
        draw();
    }
    const contractionTool = new ContractionTool(player);
    contractionTool.onUse = player => {
        if (!(pos1 && pos2)) {
            tell(player, "你还没有选择一个区域");
            return;
        }
        contractAABB(pos1, pos2, getPlayerToward(player));
        draw();
    }
    const moveTool = new MoveTool(player);
    moveTool.onHitWithBlock = (player, block) => {
        if (!(pos1 && pos2)) {
            tell(player, "你还没有选择一个区域");
            return;
        }
        const v = relative(pos2, pos1);
        pos1 = block.location;
        pos2 = Vector3Utils.add(pos1, v);
        tell(player, `将第一选取点移动至：(${block.x}, ${block.y}, ${block.z})`);
        draw();
    };
    moveTool.onUseWithBlock = (player, block) => {
        if (!(pos1 && pos2)) {
            tell(player, "你还没有选择一个区域");
            return;
        }
        const v = relative(pos1, pos2);
        pos2= block.location;
        pos1 = Vector3Utils.add(pos2, v);
        tell(player, `将第二选取点移动至：(${block.x}, ${block.y}, ${block.z})`);
        draw();
    };
    
    const completeTool = new CompletionTool(player);
    const cancelTool = new CancellationTool(player);

    const inventory = getPlayerInventory(player);
    inventory.setItem(0, vertexSelectionTool.item);
    inventory.setItem(1, extensionTool.item);
    inventory.setItem(2, contractionTool.item);
    inventory.setItem(3, moveTool.item);
    inventory.setItem(7, cancelTool.item);
    inventory.setItem(8, completeTool.item);

    let shouldDraw = true;

    function draw() {
        if (pos1 && pos2) drawBorder(player, createPreviewAABB(pos1, pos2));
    }

    function drawTimeout() {
        draw();
        if (shouldDraw) system.runTimeout(drawTimeout, 20);
    }

    player.selectedSlotIndex = 0;
    drawTimeout();
 
    function stop() {
        vertexSelectionTool.reset();
        extensionTool.reset();
        contractionTool.reset();
        moveTool.reset();
        completeTool.reset();
        cancelTool.reset();
        shouldDraw = false;
        clearHotbar(player);
        restoreHotbar(player);
    }

    return new Promise<{pos1: Vector3, pos2: Vector3}>((resolve, reject) => {
        completeTool.onUse = () => {
            if (!(pos1 && pos2)) {
                tell(player, "你还没有选取两个点。");
                return;
            }
            stop();
            resolve({
                pos1: pos1,
                pos2: pos2
            });
        }
        cancelTool.onUse = () => {
            stop();
            reject("cancel");
        };
    });
}

export function startSelectPlace(player: Player, size: Vector3, defaultPos?: Vector3, defaultStructureRotationIndex?: number) {
    saveHotbar(player);
    clearHotbar(player);
    let placeLocation: Vector3 | undefined = defaultPos;

    const structureRotationTool = new StructureRotationTool(player);
    if (defaultStructureRotationIndex) structureRotationTool.currentSelection = defaultStructureRotationIndex;

    const vertexSelectionTool = new VertexSelectionTool(player);
    vertexSelectionTool.actionbarMessage = RawMessageBuilder.text("对方块右键/点击 - 选取位置");
    vertexSelectionTool.onUseWithBlock = (player, block) => {
        placeLocation = block.location;
        tell(player, `将位置设为：(${placeLocation.x}, ${placeLocation.y}, ${placeLocation.z})`);
        draw();
    };
    
    const completeTool = new CompletionTool(player);
    const cancelTool = new CancellationTool(player);

    const inventory = getPlayerInventory(player);
    inventory.setItem(0, vertexSelectionTool.item);
    inventory.setItem(1, structureRotationTool.item);
    inventory.setItem(7, cancelTool.item);
    inventory.setItem(8, completeTool.item);

    let shouldDraw = true;

    function draw() {
        if (placeLocation) {
            let pos = Vector3Utils.add(placeLocation, size);
            if (structureRotationTool.currentSelection === 1 || structureRotationTool.currentSelection === 3) {
                pos = {x: pos.z - placeLocation.z + placeLocation.x, y: pos.y, z: pos.x - placeLocation.x + placeLocation.z};
            }
            drawBorder(player, AABBUtils.createFromCornerPoints(placeLocation, pos));
        }
    }

    function drawTimeout() {
        draw();
        if (shouldDraw) system.runTimeout(drawTimeout, 20);
    }

    player.selectedSlotIndex = 0;
    drawTimeout();

    function stop() {
        structureRotationTool.reset();
        vertexSelectionTool.reset();
        completeTool.reset();
        cancelTool.reset();
        shouldDraw = false;
        clearHotbar(player);
        restoreHotbar(player);
    }

    return new Promise<{placeLocation: Vector3, structureRotation: StructureRotation, structureRotationIndex: number}>((resolve, reject) => {
        completeTool.onUse = () => {
            if (!placeLocation) {
                world.sendMessage("你还没有选取位置。");
                return;
            }
            stop();
            resolve({
                placeLocation: placeLocation,
                structureRotation: structureRotationTool.structureRotation,
                structureRotationIndex: structureRotationTool.currentSelection
            });
        };
        cancelTool.onUse = () => {
            stop();
            reject("cancel");
        };
    });
}