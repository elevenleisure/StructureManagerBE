import { Player, Structure, StructureSaveMode, world } from "@minecraft/server";
import { Dialog } from "../../lib/ui/dialog.js";
import { DialogButton, DialogComponentGroup, DialogDivider, DialogDropdown, DialogDropdownItem, DialogLabel, DialogSpacer, DialogTextField } from "../../lib/ui/dialogComponent.js";
import { DataDrivenScreenClosedReason } from "@minecraft/server-ui";
import { cloneStructure, deleteStructure, getAllStructureId, praseStructureId, renameStructure } from "../../utils/structure.js";
import { showCreate } from "./create.js";
import { showPlace } from "./place.js";
import { RawMessageBuilder } from "../../utils/str.js";
import { structureDialogItem, StructureSaveModeDropdown } from "./component.js";
import { ListDialog } from "../../lib/ui/listDialog.js";

export function showBrowse(player: Player) {
    const structureManager = world.structureManager;
    new ListDialog(
        player,
        RawMessageBuilder.translate("ui.browse.title"),
        new structureDialogItem(),
        getAllStructureId(),
        new DialogComponentGroup(
            new DialogSpacer(),
            new DialogButton(RawMessageBuilder.translate("ui.browse.create"), () => showCreate(player), true),
            new DialogDivider(),
            new DialogSpacer(),
        ),
        undefined,
    ).closeButton().show();
}

export function showStructureAction(player: Player, sourceStructure: Structure | string) {
    const structure = typeof sourceStructure === "string" ? world.structureManager.get(sourceStructure) : sourceStructure;
    const dialog = new Dialog(player, RawMessageBuilder.translate("ui.browse.structure.title"));
    if (!structure || !structure.isValid) {
        dialog.add(
            new DialogLabel(RawMessageBuilder.translate("ui.structure.action.invalid.id"))
        ).setOnClose(() => showBrowse(player)).closeButton().show();
        return;
    }
    const { namespace, path } = praseStructureId(structure.id);
    dialog.add(
        new DialogLabel(` §b${path}`),
        new DialogSpacer(),
        new DialogLabel(RawMessageBuilder.translate("ui.browse.structure.structureInformation.new.namespace", namespace)),
        new DialogSpacer(),
        new DialogLabel(RawMessageBuilder.translate("ui.structure.action.structureInformation.new", structure.size.x, structure.size.y, structure.size.z, structure.size.x * structure.size.y * structure.size.z)),
        new DialogSpacer(),
        new DialogDivider(),
        new DialogButton(RawMessageBuilder.translate("ui.structure.action.place"), () => showPlace(player, structure), true),
        new DialogButton(RawMessageBuilder.translate("ui.structure.action.rename"), () => showRenameStructure(player, structure), true),
        new DialogButton(RawMessageBuilder.translate("ui.structure.action.clone"), () => showCloneStructure(player, structure), true),
        new DialogButton(RawMessageBuilder.translate("ui.structure.action.delete"), () => showDeleteStructure(player, structure), true)
    ).setOnClose(() => showBrowse(player)).closeButton().show();
}

function showRenameStructure(player: Player, structure: Structure) {
    const dialog = new Dialog(player, RawMessageBuilder.translate("ui.structure.action.rename.title"));
    const newStructureIdTextField = new DialogTextField(RawMessageBuilder.translate("ui.structure.action.rename.new"), structure.id);
    dialog.add(
        newStructureIdTextField,
        new DialogSpacer(),
        new DialogButton(RawMessageBuilder.translate("ui.common.ok"), () => {
            try {
                renameStructure(structure, newStructureIdTextField.text);
            } catch (e) {
                showError(player, (e as Error).message, () => dialog.show());
            }
        }, true)
    ).setOnClose((reason) => showStructureAction(player, reason === DataDrivenScreenClosedReason.ServerClosed ? newStructureIdTextField.text : structure)).closeButton().show();
}

function showCloneStructure(player: Player, structure: Structure) {
    const dialog = new Dialog(player, RawMessageBuilder.translate("ui.structure.action.clone.title"));
    const newStructureIdTextField = new DialogTextField(RawMessageBuilder.translate("ui.structure.action.clone.new"), `${structure.id}(1)`);
    const saveToWorldDropdown = new StructureSaveModeDropdown();
    dialog.add(
        newStructureIdTextField,
        saveToWorldDropdown,
        new DialogSpacer(),
        new DialogButton(RawMessageBuilder.translate("ui.common.ok"), () => {
            try {
                cloneStructure(structure, newStructureIdTextField.text, saveToWorldDropdown.structureSaveMode);
            } catch (e) {
                showError(player, (e as Error).message, () => dialog.show());
            }
        }, true)
    ).setOnClose((reason) => showStructureAction(player, reason === DataDrivenScreenClosedReason.ServerClosed ? newStructureIdTextField.text : structure)).closeButton().show();
}

function showDeleteStructure(player: Player, structure: Structure) {
    const dialog = new Dialog(player, RawMessageBuilder.translate("ui.structure.action.delete.title"));
    dialog.add(
        new DialogLabel(RawMessageBuilder.translate("ui.structure.action.delete.message", structure.id)),
        new DialogSpacer(),
        new DialogButton(RawMessageBuilder.translate("ui.common.ok"), () => {
            try {
                deleteStructure(structure);
            } catch (e) {
                showError(player, (e as Error).message, () => showStructureAction(player, structure));
            }
        }, true)
    ).setOnClose(() => showBrowse(player)).closeButton().show();
}

export function showError(player: Player, errorMessage: string, callback?: (reason: DataDrivenScreenClosedReason) => void) {
    new Dialog(player, RawMessageBuilder.translate("ui.error.title"))
        .add(new DialogSpacer(), new DialogLabel(`§c${errorMessage}`))
        .setOnClose(callback)
        .closeButton()
        .show();
}