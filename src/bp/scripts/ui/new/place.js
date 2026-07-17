import { Dialog } from "../../lib/ui/dialog.js";
import { DialogButton, DialogDropdown, DialogDropdownItem, DialogHeader, DialogSlider, DialogSpacer, DialogTextField, DialogToggle } from "../../lib/ui/dialogComponent.js";
import { NumberTextField, Vector3TextField } from "./component.js";
import { loadStructure, StructureAnimationModes, StructureMirrorAxes, StructureRotations } from "../../utils/structure.js";
import { showError, showStructureAction } from "./browse.js";
import { DataDrivenScreenClosedReason } from "@minecraft/server-ui";
import { startSelectPlace } from "../../utils/preview.js";
export function showPlace(player, structure) {
    const dialog = new Dialog(player, "放置");
    const placeLocationTextField = new Vector3TextField("放置位置");
    const rotation = new DialogDropdown("旋转", [
        new DialogDropdownItem("无旋转"), new DialogDropdownItem("旋转90°"), new DialogDropdownItem("旋转180°"), new DialogDropdownItem("旋转270°")
    ]);
    const mirror = new DialogDropdown("镜像", [
        new DialogDropdownItem("无镜像"), new DialogDropdownItem("x"), new DialogDropdownItem("z"), new DialogDropdownItem("xz")
    ]);
    const pickPlaceLocation = new DialogButton("选取", async () => {
        try {
            const { placeLocation, structureRotationIndex } = await startSelectPlace(player, structure.size, placeLocationTextField.changed ? placeLocationTextField.valueOrUndefined : undefined, rotation.currentItemIndex);
            placeLocationTextField.value = placeLocation;
            rotation.currentItemIndex = structureRotationIndex;
        }
        catch (e) { }
        dialog.show();
    }, true);
    const animationMode = new DialogDropdown("动画模式", [
        new DialogDropdownItem("无动画"), new DialogDropdownItem("逐方块"), new DialogDropdownItem("逐层")
    ]);
    const animationSeconds = new NumberTextField("动画秒数", 0);
    animationSeconds.visible = false;
    animationMode.onChange = index => {
        animationSeconds.visible = index !== 0;
    };
    const integrity = new DialogSlider("完整度", 0, 100, 100);
    const integritySeed = new DialogTextField("完整度种子");
    integritySeed.visible = false;
    integrity.onChange = value => {
        integritySeed.visible = value !== 100;
    };
    const includeBlocks = new DialogToggle("包括方块", true);
    const includeEntities = new DialogToggle("包括实体", true);
    const waterlogged = new DialogToggle("含水方块");
    waterlogged.description = "加载结构时，使可含水方块在加载区域的水源方块上可以加载为含水方块。";
    const placeButton = new DialogButton("放置", () => {
        try {
            loadStructure(structure.id, player.dimension, placeLocationTextField.value, StructureAnimationModes[animationMode.currentItemIndex].animationMode, animationSeconds.value, includeBlocks.toggled, includeEntities.toggled, integrity.currentValue / 100, integritySeed.text.trim() === "" ? undefined : integritySeed.text, StructureMirrorAxes[mirror.currentItemIndex].mirrorAxis, StructureRotations[rotation.currentItemIndex].rotation, waterlogged.toggled);
        }
        catch (e) {
            showError(player, e.message, () => dialog.show());
        }
    }, true);
    dialog.add(new DialogHeader("位置"), new DialogSpacer(), placeLocationTextField, rotation, mirror, new DialogSpacer(), pickPlaceLocation, new DialogSpacer(), new DialogHeader("动画"), new DialogSpacer(), animationMode, animationSeconds, new DialogHeader("完整度"), new DialogSpacer(), integrity, integritySeed, new DialogHeader("附加选项"), new DialogSpacer(), includeBlocks, includeEntities, waterlogged, new DialogSpacer(), placeButton).setOnClose(reason => {
        if (reason === DataDrivenScreenClosedReason.ClientClosed)
            showStructureAction(player, structure);
    }).closeButton().show();
}
