import { startSelectSave } from "../../utils/preview.js";
import { Dialog } from "../../lib/ui/dialog.js";
import { DialogButton, DialogDivider, DialogHeader, DialogLabel, DialogSpacer, DialogTextField, DialogToggle } from "../../lib/ui/dialogComponent.js";
import { StructureSaveModeDropdown, Vector3TextField } from "./component.js";
import { hasStructure, overrideStructure } from "../../utils/structure.js";
import { showBrowse, showError, showStructureAction } from "./browse.js";
import { DataDrivenScreenClosedReason } from "@minecraft/server-ui";
export function showCreate(player) {
    const dialog = new Dialog(player, "新建结构");
    const structureIdTextField = new DialogTextField("欲保存的结构名");
    const pos1TextFields = new Vector3TextField("起始点");
    const pos2TextFields = new Vector3TextField("终止点");
    const pickButton = new DialogButton("选取", async () => {
        try {
            const { pos1, pos2 } = await startSelectSave(player, pos1TextFields.changed ? pos1TextFields.valueOrUndefined : undefined, pos2TextFields.changed ? pos2TextFields.valueOrUndefined : undefined);
            pos1TextFields.value = pos1;
            pos2TextFields.value = pos2;
        }
        catch (e) { }
        dialog.show();
    }, true);
    const includeBlocksToggle = new DialogToggle("包括方块", true);
    const includeEntitiesToggle = new DialogToggle("包括实体", true);
    const saveModeDropdown = new StructureSaveModeDropdown();
    const saveButton = new DialogButton("保存", () => {
        function tryOverrideStructure() {
            try {
                overrideStructure(structureIdTextField.text, player.dimension, pos1TextFields.value, pos2TextFields.value, includeBlocksToggle.toggled, includeEntitiesToggle.toggled, saveModeDropdown.structureSaveMode);
                showStructureAction(player, structureIdTextField.text);
            }
            catch (e) {
                showError(player, e.message, () => dialog.show());
            }
        }
        if (hasStructure(structureIdTextField.text)) {
            new Dialog(player, "覆盖?")
                .add(new DialogSpacer(), new DialogLabel(`世界上已经存在一个名为${structureIdTextField.text}的结构了，你确定要覆盖它吗？`), new DialogSpacer(), new DialogButton("确定", () => tryOverrideStructure(), true))
                .setOnClose(() => dialog.show())
                .closeButton()
                .show();
        }
        else {
            tryOverrideStructure();
        }
    }, true);
    dialog.add(structureIdTextField, new DialogSpacer(), new DialogHeader("体积尺寸"), new DialogSpacer(), pos1TextFields, pos2TextFields, new DialogSpacer(), pickButton, new DialogDivider(), new DialogHeader("保存选项"), new DialogSpacer(), includeBlocksToggle, includeEntitiesToggle, saveModeDropdown, new DialogSpacer(), saveButton).setOnClose(reason => {
        if (reason === DataDrivenScreenClosedReason.ClientClosed)
            showBrowse(player);
    }).closeButton().show();
}
