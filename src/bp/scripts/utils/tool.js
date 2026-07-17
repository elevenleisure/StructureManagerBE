import { ItemLockMode, ItemStack, system, world } from "@minecraft/server";
import { getSelectedItem } from "./inventory.js";
import { RawMessageBuilder, tell } from "./str.js";
import { StructureRotations } from "./structure.js";
export class Tool {
    player;
    _onUse;
    _onUseWithBlock;
    _onHitWithBlock;
    _actionbarMessage;
    inUseCooldown = false;
    cooldownTick = 5;
    _shouldShowActionbarMessage = false;
    _onUseCallback;
    _onUseWithBlockCallback;
    _onHitWithBlockCallback;
    constructor(player) {
        this.player = player;
    }
    updateActionbarMessage() {
        if (this._actionbarMessage && getSelectedItem(this.player)?.type.id === this.item.type.id) {
            this.player.onScreenDisplay.setActionBar(this._actionbarMessage);
        }
        if (this._shouldShowActionbarMessage) {
            system.runTimeout(() => {
                this.updateActionbarMessage();
            }, 5);
        }
    }
    setCooldown() {
        this.inUseCooldown = true;
        system.runTimeout(() => {
            this.inUseCooldown = false;
        }, this.cooldownTick);
    }
    get shouldShowActionbarMessage() {
        return this._shouldShowActionbarMessage;
    }
    set shouldShowActionbarMessage(shouldShowActionbarMessage) {
        this._shouldShowActionbarMessage = shouldShowActionbarMessage;
    }
    set onUse(callback) {
        this._onUse = callback;
        if (this._onUse) {
            this._onUseCallback = world.beforeEvents.itemUse.subscribe(event => {
                if (this.inUseCooldown)
                    return;
                this.setCooldown();
                if (!(event.itemStack.type.id === this.item.type.id && event.source.name === this.player.name))
                    return;
                event.cancel = true;
                system.run(() => {
                    if (this._onUse)
                        this._onUse(event.source);
                });
            });
        }
        else if (this._onUseCallback) {
            world.beforeEvents.itemUse.unsubscribe(this._onUseCallback);
        }
    }
    set onUseWithBlock(callback) {
        this._onUseWithBlock = callback;
        if (this._onUseWithBlock) {
            this._onUseWithBlockCallback = world.beforeEvents.playerInteractWithBlock.subscribe(event => {
                if (this.inUseCooldown)
                    return;
                this.setCooldown();
                if (!(event.itemStack?.type.id === this.item.type.id && event.player.name === this.player.name))
                    return;
                event.cancel = true;
                system.run(() => {
                    if (this._onUseWithBlock)
                        this._onUseWithBlock(event.player, event.block);
                });
            });
        }
        else if (this._onUseWithBlockCallback) {
            world.beforeEvents.playerInteractWithBlock.unsubscribe(this._onUseWithBlockCallback);
        }
    }
    set onHitWithBlock(callback) {
        this._onHitWithBlock = callback;
        if (this._onHitWithBlock) {
            this._onHitWithBlockCallback = world.beforeEvents.playerBreakBlock.subscribe(event => {
                if (!(event.itemStack?.type.id === this.item.type.id && event.player.name === this.player.name))
                    return;
                event.cancel = true;
                system.run(() => {
                    if (this._onHitWithBlock)
                        this._onHitWithBlock(event.player, event.block);
                });
            });
        }
        else if (this._onHitWithBlockCallback) {
            world.beforeEvents.playerBreakBlock.unsubscribe(this._onHitWithBlockCallback);
        }
    }
    get actionbarMessage() {
        return this._actionbarMessage;
    }
    set actionbarMessage(actionbarMessage) {
        this._actionbarMessage = actionbarMessage;
        if (this._actionbarMessage) {
            this._shouldShowActionbarMessage = true;
            this.updateActionbarMessage();
        }
    }
    unsubscribeAll() {
        this.onUse = undefined;
        this.onUseWithBlock = undefined;
        this.onHitWithBlock = undefined;
    }
    reset() {
        this.unsubscribeAll();
        this._shouldShowActionbarMessage = false;
    }
}
export class VertexSelectionTool extends Tool {
    item;
    constructor(player) {
        super(player);
        this.item = new ItemStack("smanager:vertex_selection_tool");
        this.item.lockMode = ItemLockMode.slot;
    }
}
export class StructureRotationTool extends Tool {
    item;
    currentSelection = 0;
    constructor(player) {
        super(player);
        this.item = new ItemStack("smanager:structure_rotation_tool");
        this.item.lockMode = ItemLockMode.slot;
        this.onUse = player => {
            this.currentSelection = this.currentSelection === 3 ? 0 : this.currentSelection + 1;
            tell(player, `旋转模式：${StructureRotations[this.currentSelection].text}`);
        };
        this.actionbarMessage = RawMessageBuilder.text("右键/使用 - 下一个旋转模式");
    }
    get structureRotation() {
        return StructureRotations[this.currentSelection].rotation;
    }
}
export class CompletionTool extends Tool {
    item;
    constructor(player) {
        super(player);
        this.item = new ItemStack("smanager:completion_tool");
        this.item.lockMode = ItemLockMode.slot;
        this.actionbarMessage = RawMessageBuilder.text("右键/使用 - 完成");
    }
}
export class CancellationTool extends Tool {
    item;
    constructor(player) {
        super(player);
        this.item = new ItemStack("smanager:cancellation_tool");
        this.item.lockMode = ItemLockMode.slot;
        this.actionbarMessage = RawMessageBuilder.text("右键/使用 - 取消");
    }
}
export class ExtensionTool extends Tool {
    item;
    constructor(player) {
        super(player);
        this.item = new ItemStack("smanager:extension_tool");
        this.item.lockMode = ItemLockMode.slot;
        this.actionbarMessage = RawMessageBuilder.text("右键/使用 - 使选区往面向方向扩展1格");
    }
}
export class ContractionTool extends Tool {
    item;
    constructor(player) {
        super(player);
        this.item = new ItemStack("smanager:contraction_tool");
        this.item.lockMode = ItemLockMode.slot;
        this.actionbarMessage = RawMessageBuilder.text("右键/使用 - 使选区往面向方向收缩1格");
    }
}
export class MoveTool extends Tool {
    item;
    constructor(player) {
        super(player);
        this.item = new ItemStack("smanager:move_tool");
        this.item.lockMode = ItemLockMode.slot;
        this.actionbarMessage = RawMessageBuilder.text("对方块左键/长按 - 将区域的第一个点移动至方块位置\n对方块右键/点击 - 将区域的第二个点移动至方块位置");
    }
}
