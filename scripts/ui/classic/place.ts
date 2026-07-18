import { Player, Structure, StructureAnimationMode, StructureMirrorAxis, StructureRotation, Vector3 } from "@minecraft/server";
import { ActionFormData, ActionFormResponse, ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import { showErrorForm, showStructureActionForm } from "./browse.js";
import { startSelectPlace } from "../../utils/preview.js";
import { loadStructure, StructureAnimationModes, StructureMirrorAxes, StructureRotations } from "../../utils/structure.js";
import { RawMessageBuilder } from "../../utils/str.js";
import { ErrorWithRawMessage } from "../../utils/error.js";

interface PlaceData {
    structure: Structure;
    placeLocation?: Vector3;
    rotation?: StructureRotation;
    mirror?: StructureMirrorAxis;
    animationMode?: StructureAnimationMode;
    animationSeconds?: number;
    integrity?: number;
    integritySeed?: string;
    includeBlocks?: boolean;
    includeEntities?: boolean;
    waterlogged?: boolean;
}

export function showPlaceForm(player: Player, structure: Structure) {
    const data: PlaceData = {structure: structure};
    const form = new ActionFormData()
        .title(RawMessageBuilder.translate("ui.structure.action.place.1.title"))
        .label(RawMessageBuilder.translate("ui.structure.action.place.1.message2"))
        .button(RawMessageBuilder.translate("ui.structure.action.place.1.action.1"))
        .button(RawMessageBuilder.translate("ui.structure.action.place.1.action.2"));
    form.show(player).then(response => next(response));

    async function next(response: ActionFormResponse) {
        if (response.canceled) {
            showStructureActionForm(player, structure);
            return;
        }
        switch (response.selection) {
            case 0:
                showPlaceUserInput(player, data);
                break;
            case 1:
                try {
                    const { placeLocation, structureRotation } = await startSelectPlace(player, structure.size);
                    data.placeLocation = placeLocation;
                    data.rotation = structureRotation;
                    showCreateForm2(player, data);
                } catch (e) {
                    form.show(player).then(response => next(response));
                    return;
                }
                break;
        }
    }
}

function showPlaceUserInput(player: Player, data: PlaceData) {
    const form = new ModalFormData()
            .title(RawMessageBuilder.translate("ui.structure.action.place.1.title"))
            .label(RawMessageBuilder.translate("ui.structure.action.place.1.message"))
            .textField(RawMessageBuilder.translate("ui.structure.action.place.1.placeLocation.x"), "0")
            .textField(RawMessageBuilder.translate("ui.structure.action.place.1.placeLocation.y"), "0")
            .textField(RawMessageBuilder.translate("ui.structure.action.place.1.placeLocation.z"), "0")
            .dropdown(RawMessageBuilder.translate("ui.structure.action.rotation.label"), [RawMessageBuilder.translate("ui.structure.action.rotation.0.label"), RawMessageBuilder.translate("ui.structure.action.rotation.90.label"), RawMessageBuilder.translate("ui.structure.action.rotation.180.label"), RawMessageBuilder.translate("ui.structure.action.rotation.270.label")])
            .submitButton(RawMessageBuilder.translate("ui.common.next"));
        form.show(player).then(response => next(response));
        
        async function next(response: ModalFormResponse) {
            if (response.canceled) {
                showStructureActionForm(player, data.structure);
                return;
            }
            try {
                const formValues = response.formValues!;
                const placeLocationx = Number(formValues[1]);
                if (!isFinite(placeLocationx)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.place.1.placeLocation.x")});
                
                const placeLocationy = Number(formValues[2]);
                if (!isFinite(placeLocationy)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.place.1.placeLocation.y")});
                
                const placeLocationz = Number(formValues[3]);
                if (!isFinite(placeLocationz)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.place.1.placeLocation.z")});

                data.placeLocation = {x: placeLocationx, y: placeLocationy, z: placeLocationz};
                data.rotation = StructureRotations[formValues[4] as number].rotation;

                showCreateForm2(player, data);
            } catch (e) {
                showErrorForm(player, (e as ErrorWithRawMessage).rawMessage, () => {
                    form.show(player).then(response => next(response));
                });
            }
        }
}

function showCreateForm2(player: Player, data: PlaceData) {
    const form = new ModalFormData()
        .title(RawMessageBuilder.translate("ui.structure.action.place.2.title"))
        .label(RawMessageBuilder.translate("ui.structure.action.place.2.message"))
        .dropdown(RawMessageBuilder.translate("ui.structure.action.mirror.label"), [RawMessageBuilder.translate("ui.structure.action.mirror.none.label"), RawMessageBuilder.translate("ui.structure.action.mirror.x.label"), RawMessageBuilder.translate("ui.structure.action.mirror.z.label"), RawMessageBuilder.translate("ui.structure.action.mirror.xz.label")])
        .dropdown(RawMessageBuilder.translate("ui.structure.action.animation.label"), [RawMessageBuilder.translate("ui.structure.action.animation.none.label"), RawMessageBuilder.translate("ui.structure.action.animation.blocks.label"), RawMessageBuilder.translate("ui.structure.action.animation.layers.label")])
        .textField(RawMessageBuilder.translate("ui.structure.action.animation.seconds.label"), "0")
        .slider(RawMessageBuilder.translate("ui.structure.action.integrity.label"), 0, 100, {defaultValue: 100})
        .textField(RawMessageBuilder.translate("ui.structure.action.integrity.seed.label"), RawMessageBuilder.translate("ui.structure.action.integrity.seed.random.label"))
        .toggle(RawMessageBuilder.translate("ui.structure.action.include.blocks.toggle.label"), {defaultValue: true})
        .toggle(RawMessageBuilder.translate("ui.structure.action.include.entities.toggle.label"), {defaultValue: true})
        .toggle(RawMessageBuilder.translate("ui.structure.action.waterlogged.toggle.label"), {defaultValue: false, tooltip: RawMessageBuilder.translate("ui.structure.action.waterlogged.toggle.tooltip")})
        .submitButton(RawMessageBuilder.translate("ui.common.next"))
    form.show(player).then(response => next(response));
        
    async function next(response: ModalFormResponse) {
        if (response.canceled) {
            showStructureActionForm(player, data.structure);
            return;
        }
        try {
            const formValues = response.formValues!;
            data.mirror = StructureMirrorAxes[formValues[1] as number].mirrorAxis;
            data.animationMode = StructureAnimationModes[formValues[2] as number].animationMode;

            const animationSeconds = Number(formValues[3]);
            if (!isFinite(animationSeconds)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.animation.seconds.label")});

            data.animationSeconds = animationSeconds;
            data.integrity = formValues[4] as number;
            data.integritySeed = (formValues[5] as string).trim() === "" ? undefined : formValues[5] as string;
            data.includeBlocks = formValues[6] as boolean;
            data.includeEntities = formValues[7] as boolean;
            data.waterlogged = formValues[8] as boolean;

            showCreateForm3(player, data);
        } catch (e) {
            showErrorForm(player, (e as ErrorWithRawMessage).rawMessage, () => {
                form.show(player).then(response => next(response));
            });
        }
    }
}
function showCreateForm3(player: Player, data: PlaceData) {
    try {
        loadStructure(
            data.structure.id,
            player.dimension,
            data.placeLocation!,
            data.animationMode!,
            data.animationSeconds!,
            data.includeBlocks!,
            data.includeEntities!,
            data.integrity! / 100,
            data.integritySeed!,
            data.mirror!,
            data.rotation!,
            data.waterlogged!
        );
        new ActionFormData()
            .title(RawMessageBuilder.translate("ui.structure.action.place.3.title"))
            .body(RawMessageBuilder.translate("ui.structure.action.place.3.message"))
            .button(RawMessageBuilder.translate("ui.common.ok"))
            .show(player);
    } catch (e) {
        new ActionFormData()
            .title(RawMessageBuilder.translate("ui.structure.action.place.3.error.title"))
            .body(RawMessageBuilder.translate("ui.structure.action.place.3.error.message", (e as Error).message))
            .button(RawMessageBuilder.translate("ui.common.ok"))
            .show(player)
            .then(() => showStructureActionForm(player, data.structure));
    }
}
