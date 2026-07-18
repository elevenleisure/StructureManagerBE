import { Player } from "@minecraft/server";
import { startSelectSave } from "../../utils/preview.js";
import { Dialog } from "../../lib/ui/dialog.js";
import { DialogButton, DialogDivider, DialogHeader, DialogLabel, DialogSpacer, DialogTextField, DialogToggle } from "../../lib/ui/dialogComponent.js";
import { StructureSaveModeDropdown, Vector3TextField } from "./component.js";
import { hasStructure, overrideStructure } from "../../utils/structure.js";
import { showBrowse, showError, showStructureAction } from "./browse.js";
import { DataDrivenScreenClosedReason } from "@minecraft/server-ui";
import { RawMessageBuilder } from "../../utils/str.js";

export function showCreate(player: Player) {
    const dialog = new Dialog(player, RawMessageBuilder.translate("ui.structure.action.create.new.title"));

    const structureIdTextField = new DialogTextField(RawMessageBuilder.translate("ui.structure.action.create.1.structureId"));
    const pos1TextFields = new Vector3TextField(RawMessageBuilder.translate("ui.structure.action.create.new.from"));
    const pos2TextFields = new Vector3TextField(RawMessageBuilder.translate("ui.structure.action.create.new.to"));
    const pickButton = new DialogButton(RawMessageBuilder.translate("ui.structure.action.create.new.pick"), async () => {
        try {
            const { pos1, pos2 } = await startSelectSave(player, pos1TextFields.changed ? pos1TextFields.valueOrUndefined : undefined, pos2TextFields.changed ? pos2TextFields.valueOrUndefined : undefined);
            pos1TextFields.value = pos1;
            pos2TextFields.value = pos2;
        } catch (e) {}
        dialog.show();
    }, true);
    const includeBlocksToggle = new DialogToggle(RawMessageBuilder.translate("ui.structure.action.include.blocks.toggle.label"), true);
    const includeEntitiesToggle = new DialogToggle(RawMessageBuilder.translate("ui.structure.action.include.entities.toggle.label"), true);
    const saveModeDropdown = new StructureSaveModeDropdown();
    const saveButton = new DialogButton(RawMessageBuilder.translate("ui.common.ok"), () => {
        function tryOverrideStructure() {
            try {
                overrideStructure(
                    structureIdTextField.text,
                    player.dimension,
                    pos1TextFields.value,
                    pos2TextFields.value,
                    includeBlocksToggle.toggled,
                    includeEntitiesToggle.toggled,
                    saveModeDropdown.structureSaveMode
                );
                showStructureAction(player, structureIdTextField.text);
            } catch (e) {
                showError(player, (e as Error).message, () => dialog.show());
            }
        }
        if (hasStructure(structureIdTextField.text)) {
            new Dialog(player, RawMessageBuilder.translate("ui.structure.action.create.1.override.title"))
                .add(
                    new DialogSpacer(),
                    new DialogLabel(RawMessageBuilder.translate("ui.structure.action.create.1.override.message", structureIdTextField.text)),
                    new DialogSpacer(),
                    new DialogButton(RawMessageBuilder.translate("ui.common.yes"), () => tryOverrideStructure(), true)
                )
                .setOnClose(() => dialog.show())
                .closeButton()
                .show();
        } else {
            tryOverrideStructure();
        }
    }, true);

    dialog.add(
        structureIdTextField,
        new DialogSpacer(),
        new DialogHeader(RawMessageBuilder.translate("ui.structure.action.create.new.volume")),
        new DialogSpacer(),
        pos1TextFields,
        pos2TextFields,
        new DialogSpacer(),
        pickButton,
        new DialogDivider(),
        new DialogHeader(RawMessageBuilder.translate("ui.structure.action.create.new.option")),
        new DialogSpacer(),
        includeBlocksToggle,
        includeEntitiesToggle,
        saveModeDropdown,
        new DialogSpacer(),
        saveButton
    ).setOnClose(reason => {
        if (reason === DataDrivenScreenClosedReason.ClientClosed) showBrowse(player)
    }).closeButton().show();
}