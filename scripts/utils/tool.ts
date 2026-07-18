import { Block, ItemLockMode, ItemStack, ItemUseBeforeEvent, Player, PlayerBreakBlockBeforeEvent, PlayerInteractWithBlockBeforeEvent, RawMessage, system, Vector3, world } from "@minecraft/server";
import { getSelectedItem } from "./inventory.js";
import { RawMessageBuilder, tell } from "./str.js";
import { StructureRotations } from "./structure.js";

export abstract class Tool {

    public abstract readonly item: ItemStack;
    protected player: Player;
    protected _onUse? : (player: Player) => void;
    protected _onUseWithBlock? : (player: Player, block: Block) => void;
    protected _onHitWithBlock? : (player: Player, block: Block) => void;
    protected _actionbarMessage? : RawMessage;
    protected inUseCooldown: boolean = false;
    protected cooldownTick: number = 5;
    protected _shouldShowActionbarMessage: boolean = false;
    private _onUseCallback?: (event: ItemUseBeforeEvent) => void;
    private _onUseWithBlockCallback?: (event: PlayerInteractWithBlockBeforeEvent) => void;
    private _onHitWithBlockCallback?: (event: PlayerBreakBlockBeforeEvent) => void;
    
    constructor(player: Player) {
        this.player = player;
    }

    protected updateActionbarMessage() {        
        if (this._actionbarMessage && getSelectedItem(this.player)?.type.id === this.item.type.id) {
            this.player.onScreenDisplay.setActionBar(this._actionbarMessage);
        }
        if (this._shouldShowActionbarMessage) {
            system.runTimeout(() => {
                this.updateActionbarMessage();
            }, 5);
        }
    }

    protected setCooldown() {
        this.inUseCooldown = true;
        system.runTimeout(() => {
            this.inUseCooldown = false;
        }, this.cooldownTick);
    }

    public get shouldShowActionbarMessage(): boolean {
        return this._shouldShowActionbarMessage;
    }

    public set shouldShowActionbarMessage(shouldShowActionbarMessage: boolean) {
        this._shouldShowActionbarMessage = shouldShowActionbarMessage;
    }

    public set onUse(callback: ((player: Player) => void) | undefined) {
        this._onUse = callback;
        if (this._onUse) {
            this._onUseCallback = world.beforeEvents.itemUse.subscribe(event => {
                if (this.inUseCooldown) return;
                this.setCooldown();
                if (!(event.itemStack.type.id === this.item.type.id && event.source.name === this.player.name)) return;
                event.cancel = true;
                system.run(() => {
                    if (this._onUse) this._onUse(event.source);
                });
            });
        } else if (this._onUseCallback) {
            world.beforeEvents.itemUse.unsubscribe(this._onUseCallback);
        }
    }

    public set onUseWithBlock(callback: ((player: Player, block: Block) => void) | undefined) {
        this._onUseWithBlock = callback;
        if (this._onUseWithBlock) {
            this._onUseWithBlockCallback = world.beforeEvents.playerInteractWithBlock.subscribe(event => {
                if (this.inUseCooldown) return;
                this.setCooldown();
                if (!(event.itemStack?.type.id === this.item.type.id && event.player.name === this.player.name)) return;
                event.cancel = true;
                system.run(() => {
                    if (this._onUseWithBlock) this._onUseWithBlock(event.player, event.block);
                });
            });
        } else if (this._onUseWithBlockCallback) {
            world.beforeEvents.playerInteractWithBlock.unsubscribe(this._onUseWithBlockCallback);
        }
    }

    public set onHitWithBlock(callback: ((player: Player, block: Block) => void) | undefined) {
        this._onHitWithBlock = callback;
        if (this._onHitWithBlock) {
            this._onHitWithBlockCallback = world.beforeEvents.playerBreakBlock.subscribe(event => {
                if (!(event.itemStack?.type.id === this.item.type.id && event.player.name === this.player.name)) return;
                event.cancel = true;
                system.run(() => {
                    if (this._onHitWithBlock) this._onHitWithBlock(event.player, event.block);
                });
            });
        } else if (this._onHitWithBlockCallback) {
            world.beforeEvents.playerBreakBlock.unsubscribe(this._onHitWithBlockCallback);
        }
    }

    public get actionbarMessage(): RawMessage | undefined {
        return this._actionbarMessage;
    }

    public set actionbarMessage(actionbarMessage: RawMessage | undefined) {
        this._actionbarMessage = actionbarMessage;
        if (this._actionbarMessage) {
            this._shouldShowActionbarMessage = true;
            this.updateActionbarMessage();
        }
    }

    public unsubscribeAll() {
        this.onUse = undefined;
        this.onUseWithBlock = undefined;
        this.onHitWithBlock = undefined;
    }

    public reset() {
        this.unsubscribeAll();
        this._shouldShowActionbarMessage = false;
    }
}

export class VertexSelectionTool extends Tool {
    public item: ItemStack;

    constructor(player: Player) {
        super(player);
        this.item = new ItemStack("smanager:vertex_selection_tool");
        this.item.lockMode = ItemLockMode.slot;
    }
}

export class StructureRotationTool extends Tool {
    public item: ItemStack;
    public currentSelection: number = 0;

    constructor(player: Player) {
        super(player);
        this.item = new ItemStack("smanager:structure_rotation_tool");
        this.item.lockMode = ItemLockMode.slot;

        this.onUse = player => {
            this.currentSelection = this.currentSelection === 3 ? 0 : this.currentSelection + 1;
            tell(player, {translate: "tool.structureRotation.selectPlace.message", with: RawMessageBuilder.translate(StructureRotations[this.currentSelection].translate)});
        };

        this.actionbarMessage = RawMessageBuilder.translate("tool.structureRotation.selectPlace.actionbarMessage");
    }

    public get structureRotation() {
        return StructureRotations[this.currentSelection].rotation;
    }
}

export class CompletionTool extends Tool {
    public item: ItemStack;
    constructor(player: Player) {
        super(player);
        this.item = new ItemStack("smanager:completion_tool");
        this.item.lockMode = ItemLockMode.slot;

        this.actionbarMessage = RawMessageBuilder.translate("tool.complete.selectSave.actionbarMessage");
    }
}

export class CancellationTool extends Tool {
    public item: ItemStack;
    constructor(player: Player) {
        super(player);
        this.item = new ItemStack("smanager:cancellation_tool");
        this.item.lockMode = ItemLockMode.slot;

        this.actionbarMessage = RawMessageBuilder.translate("tool.cancellation.selectSave.actionbarMessage");
    }
}

export class ExtensionTool extends Tool {
    public item: ItemStack;
    constructor(player: Player) {
        super(player);
        this.item = new ItemStack("smanager:extension_tool");
        this.item.lockMode = ItemLockMode.slot;

        this.actionbarMessage = RawMessageBuilder.translate("tool.extension.selectSave.actionbarMessage");
    }
}

export class ContractionTool extends Tool {
    public item: ItemStack;
    constructor(player: Player) {
        super(player);
        this.item = new ItemStack("smanager:contraction_tool");
        this.item.lockMode = ItemLockMode.slot;

        this.actionbarMessage = RawMessageBuilder.translate("tool.contraction.selectSave.actionbarMessage");
    }
}

export class MoveTool extends Tool {
    public item: ItemStack;
    constructor(player: Player) {
        super(player);
        this.item = new ItemStack("smanager:move_tool");
        this.item.lockMode = ItemLockMode.slot;

        this.actionbarMessage = RawMessageBuilder.translate("tool.move.selectSave.actionbarMessage");
    }
}

