import { Player, Structure } from "@minecraft/server";
import { Dialog } from "../../lib/ui/dialog.js";
import { DialogButton, DialogDropdown, DialogDropdownItem, DialogHeader, DialogSlider, DialogSpacer, DialogTextField, DialogToggle } from "../../lib/ui/dialogComponent.js";
import { NumberTextField, Vector3TextField } from "./component.js";
import { loadStructure, StructureAnimationModes, StructureMirrorAxes, StructureRotations } from "../../utils/structure.js";
import { showError, showStructureAction } from "./browse.js";
import { DataDrivenScreenClosedReason } from "@minecraft/server-ui";
import { startSelectPlace } from "../../utils/preview.js";
import { RawMessageBuilder } from "../../utils/str.js";

export function showPlace(player: Player, structure: Structure) {
    const dialog = new Dialog(player, RawMessageBuilder.translate("ui.structure.action.place.new.title"));

    const placeLocationTextField = new Vector3TextField(RawMessageBuilder.translate("ui.structure.action.place.new.placeLocation"));
    const rotation = new DialogDropdown(RawMessageBuilder.translate("ui.structure.action.rotation.label"), [
        new DialogDropdownItem(RawMessageBuilder.translate("ui.structure.action.rotation.0.label")), new DialogDropdownItem(RawMessageBuilder.translate("ui.structure.action.rotation.90.label")), new DialogDropdownItem(RawMessageBuilder.translate("ui.structure.action.rotation.180.label")), new DialogDropdownItem(RawMessageBuilder.translate("ui.structure.action.rotation.270.label"))
    ]);
    const mirror = new DialogDropdown(RawMessageBuilder.translate("ui.structure.action.mirror.label"), [
        new DialogDropdownItem(RawMessageBuilder.translate("ui.structure.action.mirror.none.label")), new DialogDropdownItem(RawMessageBuilder.translate("ui.structure.action.mirror.x.label")), new DialogDropdownItem(RawMessageBuilder.translate("ui.structure.action.mirror.z.label")), new DialogDropdownItem(RawMessageBuilder.translate("ui.structure.action.mirror.xz.label"))
    ]);
    const pickPlaceLocation = new DialogButton(RawMessageBuilder.translate("ui.structure.action.place.new.pick"), async () => {
        try {
            const { placeLocation, structureRotationIndex } = await startSelectPlace(player, structure.size, placeLocationTextField.changed ? placeLocationTextField.valueOrUndefined : undefined, rotation.currentItemIndex);
            placeLocationTextField.value = placeLocation;
            rotation.currentItemIndex = structureRotationIndex;
        } catch (e) {}
        dialog.show();
    }, true);

    const animationMode = new DialogDropdown(RawMessageBuilder.translate("ui.structure.action.animation.label"), [
        new DialogDropdownItem(RawMessageBuilder.translate("ui.structure.action.animation.none.label")), new DialogDropdownItem(RawMessageBuilder.translate("ui.structure.action.animation.blocks.label")), new DialogDropdownItem(RawMessageBuilder.translate("ui.structure.action.animation.layers.label"))
    ]);
    const animationSeconds = new NumberTextField(RawMessageBuilder.translate("ui.structure.action.animation.seconds.label"), 0);
    animationSeconds.visible = false;
    animationMode.onChange = index => {
        animationSeconds.visible = index !== 0;
    };

    const integrity = new DialogSlider(RawMessageBuilder.translate("ui.structure.action.integrity.label"), 0, 100, 100);
    const integritySeed = new DialogTextField(RawMessageBuilder.translate("ui.structure.action.integrity.seed.label"));
    integritySeed.visible = false;
    integrity.onChange = value => {
        integritySeed.visible = value !== 100;
    }

    const includeBlocks = new DialogToggle(RawMessageBuilder.translate("ui.structure.action.include.blocks.toggle.label"), true);
    const includeEntities = new DialogToggle(RawMessageBuilder.translate("ui.structure.action.include.entities.toggle.label"), true);
    const waterlogged = new DialogToggle(RawMessageBuilder.translate("ui.structure.action.waterlogged.toggle.label"));
    waterlogged.description = RawMessageBuilder.translate("ui.structure.action.waterlogged.toggle.tooltip");

    const placeButton = new DialogButton(RawMessageBuilder.translate("ui.common.ok"), () => {
        try {
            loadStructure(
                structure.id,
                player.dimension,
                placeLocationTextField.value,
                StructureAnimationModes[animationMode.currentItemIndex].animationMode,
                animationSeconds.value,
                includeBlocks.toggled,
                includeEntities.toggled,
                integrity.currentValue / 100,
                integritySeed.text.trim() === "" ? undefined : integritySeed.text,
                StructureMirrorAxes[mirror.currentItemIndex].mirrorAxis,
                StructureRotations[rotation.currentItemIndex].rotation,
                waterlogged.toggled
            );
        } catch (e) {
            showError(player, (e as Error).message, () => dialog.show());
        }
    }, true);

    dialog.add(
        new DialogHeader(RawMessageBuilder.translate("ui.structure.action.place.new.placeLocation")),
        new DialogSpacer(),
        placeLocationTextField,
        rotation,
        mirror,
        new DialogSpacer(),
        pickPlaceLocation,
        new DialogSpacer(),
        new DialogHeader(RawMessageBuilder.translate("ui.structure.action.place.new.animation")),
        new DialogSpacer(),
        animationMode,
        animationSeconds,
        new DialogHeader(RawMessageBuilder.translate("ui.structure.action.place.new.integrity")),
        new DialogSpacer(),
        integrity,
        integritySeed,
        new DialogHeader(RawMessageBuilder.translate("ui.structure.action.place.new.option")),
        new DialogSpacer(),
        includeBlocks,
        includeEntities,
        waterlogged,
        new DialogSpacer(),
        placeButton
    ).setOnClose(reason => {
        if (reason === DataDrivenScreenClosedReason.ClientClosed) showStructureAction(player, structure);
    }).closeButton().show();
}