import { Player, Structure, StructureSaveMode, world } from "@minecraft/server";
import { Dialog } from "../../lib/ui/dialog.js";
import { DialogButton, DialogComponentGroup, DialogDivider, DialogDropdown, DialogDropdownItem, DialogLabel, DialogSpacer, DialogTextField } from "../../lib/ui/dialogComponent.js";
import { DataDrivenScreenClosedReason } from "@minecraft/server-ui";
import { cloneStructure, deleteStructure, getAllStructureId, praseStructureId, renameStructure } from "../../utils/structure.js";
import { showCreate } from "./create.js";
import { showPlace } from "./place.js";

export function showBrowse(player: Player) {
    const structureManager = world.structureManager;
    const structureComponentGroupMap: Record<string, DialogComponentGroup> = {};

    const dialog = new Dialog(player, "总览");

    const search = new DialogTextField("搜索结构");
    search.onChange = text => {
        for (const key in structureComponentGroupMap) {
            if (Object.prototype.hasOwnProperty.call(structureComponentGroupMap, key)) {
                const element = structureComponentGroupMap[key];
                element.visible = key.includes(text.trim());
            }
        }
    };

    dialog.add(
        search,
        new DialogSpacer(),
        new DialogButton("新建结构", () => showCreate(player), true),
        new DialogDivider(),
        new DialogSpacer(),
    );

    getAllStructureId().forEach(structureId => {
        const { namespace, path } = praseStructureId(structureId);
        const structure = structureManager.get(structureId);
        if (!structure || !structure.isValid) return;
        const btn = new DialogButton("查看", () => showStructureAction(player, structure), true);
        const group = new DialogComponentGroup(
            new DialogLabel(` §b${path}`),
            new DialogSpacer(),
            new DialogLabel(` 命名空间：§d${namespace}`),
            new DialogSpacer(),
            new DialogLabel(` 方块数量：§2${structure.size.x * structure.size.y * structure.size.z}`),
            new DialogSpacer(),
            btn,
            new DialogDivider()
        );
        structureComponentGroupMap[structureId] = group;
        dialog.add(group);
    });
    

    dialog.closeButton().show();
}

export function showStructureAction(player: Player, sourceStructure: Structure | string) {
    const structure = typeof sourceStructure === "string" ? world.structureManager.get(sourceStructure) : sourceStructure;
    const dialog = new Dialog(player, `结构`);
    if (!structure || !structure.isValid) {
        dialog.add(
            new DialogLabel("无效的结构ID！")
        ).setOnClose(() => showBrowse(player)).closeButton().show();
        return;
    }
    const { namespace, path } = praseStructureId(structure.id);
    dialog.add(
        new DialogLabel(` §b${path}`),
        new DialogSpacer(),
        new DialogLabel(` 命名空间：§d${namespace}`),
        new DialogSpacer(),
        new DialogLabel(`尺寸：§c${structure.size.x}§rx§a${structure.size.y}§rx§9${structure.size.z}§r （共计${structure.size.x * structure.size.y * structure.size.z}个方块）`),
        new DialogSpacer(),
        new DialogDivider(),
        new DialogButton("放置", () => showPlace(player, structure), true),
        new DialogButton("重命名", () => showRenameStructure(player, structure), true),
        new DialogButton("复制", () => showCloneStructure(player, structure), true),
        new DialogButton("删除", () => showDeleteStructure(player, structure), true)
    ).setOnClose(() => showBrowse(player)).closeButton().show();
}

function showRenameStructure(player: Player, structure: Structure) {
    const dialog = new Dialog(player, "重命名");
    const newStructureIdTextField = new DialogTextField("新的结构ID", structure.id);
    dialog.add(
        newStructureIdTextField,
        new DialogSpacer(),
        new DialogButton("重命名", () => {
            try {
                renameStructure(structure, newStructureIdTextField.text);
            } catch (e) {
                showError(player, (e as Error).message, () => dialog.show());
            }
        }, true)
    ).setOnClose((reason) => showStructureAction(player, reason === DataDrivenScreenClosedReason.ServerClosed ? newStructureIdTextField.text : structure)).closeButton().show();
}

function showCloneStructure(player: Player, structure: Structure) {
    const dialog = new Dialog(player, "复制");
    const newStructureIdTextField = new DialogTextField("新的结构ID", `${structure.id}的副本`);
    const saveToWorldDropdown = new DialogDropdown("保存模式", [
        new DialogDropdownItem("保存至世界"), new DialogDropdownItem("保存至内存")
    ]);
    saveToWorldDropdown.description = "复制的结构将会被永久保存到世界中";
    saveToWorldDropdown.onChange = value => {
        saveToWorldDropdown.description = value === 0 ? "复制的结构将会被永久保存到世界中": "复制的结构将会被临时保存至内存中。一旦你退出了世界，它就会永远消失。";
    }
    dialog.add(
        newStructureIdTextField,
        saveToWorldDropdown,
        new DialogSpacer(),
        new DialogButton("复制", () => {
            try {
                cloneStructure(structure, newStructureIdTextField.text, saveToWorldDropdown.currentItemIndex === 0 ? StructureSaveMode.World : StructureSaveMode.Memory);
            } catch (e) {
                showError(player, (e as Error).message, () => dialog.show());
            }
        }, true)
    ).setOnClose((reason) => showStructureAction(player, reason === DataDrivenScreenClosedReason.ServerClosed ? newStructureIdTextField.text : structure)).closeButton().show();
}

function showDeleteStructure(player: Player, structure: Structure) {
    const dialog = new Dialog(player, "删除？");
    dialog.add(
        new DialogLabel(`你确定要删除结构 ${structure.id} 吗？`),
        new DialogSpacer(),
        new DialogButton("确定", () => {
            try {
                deleteStructure(structure);
            } catch (e) {
                showError(player, (e as Error).message, () => showStructureAction(player, structure));
            }
        }, true)
    ).setOnClose(() => showStructureAction(player, structure)).closeButton().show();
}

export function showError(player: Player, errorMessage: string, callback?: (reason: DataDrivenScreenClosedReason) => void) {
    new Dialog(player, "错误")
        .setOnClose(callback)
        .add(new DialogSpacer(), new DialogLabel(`§c${errorMessage}`))
        .closeButton()
        .show();
}