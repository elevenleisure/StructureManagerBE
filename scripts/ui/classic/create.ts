import { Player, StructureSaveMode, Vector3 } from "@minecraft/server";
import { ActionFormData, ActionFormResponse, ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import { showBrowseForm, showErrorForm } from "./browse.js";
import { hasStructure, overrideStructure } from "../../utils/structure.js";
import { Vector3Utils } from "../../lib/math/minecraft-math.js";
import { startSelectSave } from "../../utils/preview.js";
import { RawMessageBuilder } from "../../utils/str.js";
import { ErrorWithRawMessage } from "../../utils/error.js";

interface createData {
    structureId?: string
    pos1?: Vector3,
    pos2?: Vector3,
    includeBlocks?: boolean,
    includeEntities?: boolean,
    saveMode?: StructureSaveMode
}

export function showCreateForm(player: Player, data?: createData) {
    if (!data) {
        data = {};
    }
    const form = new ModalFormData()
        .title(RawMessageBuilder.translate("ui.structure.action.create.1.title"))
        .label(RawMessageBuilder.translate("ui.structure.action.create.1.message"))
        .textField(RawMessageBuilder.translate("ui.structure.action.create.1.structureId"), data?.structureId ? data.structureId : "")
        .submitButton(RawMessageBuilder.translate("ui.common.next"));
    form.show(player).then(response => next(response));
    
    async function next(response: ModalFormResponse) {
        if (response.canceled) {
            showBrowseForm(player);
            return;
        }
        const structureId = response.formValues![1] as string;
        if (hasStructure(structureId)) {
            const response2 = await new ActionFormData()
                .title(RawMessageBuilder.translate("ui.structure.action.create.1.override.title"))
                .body(RawMessageBuilder.translate("ui.structure.action.create.1.override.message", structureId))
                .button(RawMessageBuilder.translate("ui.common.yes"))
                .button(RawMessageBuilder.translate("ui.common.no"))
                .show(player);
            
            if (response2.canceled) {
                form.show(player).then(_response => next(_response));
                return;
            }

            switch (response2.selection) {
                case 0:
                    data!.structureId = structureId;
                    showCreateForm2(player, data!);
                    break;
                case 1:
                    form.show(player).then(_response => next(_response));
                    break;
            }
        } else {
            data!.structureId = structureId;
            showCreateForm2(player, data!);
        }
    }
}

function showCreateForm2(player: Player, data: createData) {
    const form = new ActionFormData()
        .title(RawMessageBuilder.translate("ui.structure.action.create.2.title"))
        .label(RawMessageBuilder.text("ui.structure.action.create.2.message"))
        .button(RawMessageBuilder.translate("ui.structure.action.create.2.action.1"))
        .button(RawMessageBuilder.translate("ui.structure.action.create.2.action.2"))
        .button(RawMessageBuilder.translate("ui.structure.action.create.2.action.3"));
    form.show(player).then(response => next(response))

    async function next(response: ActionFormResponse) {
        if (response.canceled) {
            showBrowseForm(player);
            return;
        }
        switch (response.selection) {
            case 0:
                showCreateForm2points(player, data);
                break;
            case 1:
                showCreateForm2size(player, data);
                break;
            case 2:
                try {
                    const { pos1, pos2 } = await startSelectSave(player);
                    data.pos1 = pos1;
                    data.pos2 = pos2;
                    showCreateForm3(player, data);
                } catch (e) {
                    form.show(player).then(response => next(response));
                    return;
                }
                break;
        }
    }
}

function showCreateForm2points(player: Player, data: createData) {
    const form = new ModalFormData()
        .title(RawMessageBuilder.translate("ui.structure.action.create.2.title"))
        .label(RawMessageBuilder.translate("ui.structure.action.create.2.action.1.message"))
        .textField(RawMessageBuilder.translate("ui.structure.action.create.2.action.1.from.x"), "0")
        .textField(RawMessageBuilder.translate("ui.structure.action.create.2.action.1.from.y"), "0")
        .textField(RawMessageBuilder.translate("ui.structure.action.create.2.action.1.from.z"), "0")
        .textField(RawMessageBuilder.translate("ui.structure.action.create.2.action.1.to.x"), "0")
        .textField(RawMessageBuilder.translate("ui.structure.action.create.2.action.1.to.y"), "0")
        .textField(RawMessageBuilder.translate("ui.structure.action.create.2.action.1.to.z"), "0")
        .submitButton(RawMessageBuilder.translate("ui.common.next"));
    form.show(player).then(response => next(response));
    
    async function next(response: ModalFormResponse) {
        if (response.canceled) {
            showBrowseForm(player);
            return;
        }
        try {
            const formValues = response.formValues as string[];
            const pos1x = Number(formValues[1]);
            if (!isFinite(pos1x)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.create.2.action.1.from.x")});
            
            const pos1y = Number(formValues[2]);
            if (!isFinite(pos1y)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.create.2.action.1.from.y")});
            
            const pos1z = Number(formValues[3]);
            if (!isFinite(pos1z)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.create.2.action.1.from.z")});
            
            const pos2x = Number(formValues[4]);
            if (!isFinite(pos2x)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.create.2.action.1.to.x")});

            const pos2y = Number(formValues[5]);
            if (!isFinite(pos2y)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.create.2.action.1.to.y")})

            const pos2z = Number(formValues[6]);
            if (!isFinite(pos2z)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.create.2.action.1.to.z")})
        
            data.pos1 = {x: pos1x, y: pos1y, z: pos1z};
            data.pos2 = {x: pos1x, y: pos2y, z: pos2z};

            showCreateForm3(player, data);
        } catch (e) {
            showErrorForm(player, (e as ErrorWithRawMessage).rawMessage, () => {
                form.show(player).then(response => next(response));
            });
        }
    }
}

function showCreateForm2size(player: Player, data: createData) {
    const form = new ModalFormData()
        .title(RawMessageBuilder.translate("ui.structure.action.create.2.title"))
        .label(RawMessageBuilder.translate("ui.structure.action.create.2.action.2.message"))
        .textField(RawMessageBuilder.translate("ui.structure.action.create.2.action.2.location.x"), "0")
        .textField(RawMessageBuilder.translate("ui.structure.action.create.2.action.2.location.y"), "0")
        .textField(RawMessageBuilder.translate("ui.structure.action.create.2.action.2.location.z"), "0")
        .textField(RawMessageBuilder.translate("ui.structure.action.create.2.action.2.size.x"), "0")
        .textField(RawMessageBuilder.translate("ui.structure.action.create.2.action.2.size.y"), "0")
        .textField(RawMessageBuilder.translate("ui.structure.action.create.2.action.2.size.z"), "0")
        .submitButton(RawMessageBuilder.translate("ui.common.next"));
    form.show(player).then(response => next(response));
    
    async function next(response: ModalFormResponse) {
        if (response.canceled) {
            showBrowseForm(player);
            return;
        }
        try {
            const formValues = response.formValues as string[];
            const posx = Number(formValues[1]);
            if (!isFinite(posx)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.create.2.action.2.location.x")});
            
            const posy = Number(formValues[2]);
            if (!isFinite(posy)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.create.2.action.2.location.y")});
            
            const posz = Number(formValues[3]);
            if (!isFinite(posz)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.create.2.action.2.location.z")});
            
            const sizex = Number(formValues[4]);
            if (!isFinite(sizex)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.create.2.action.2.size.x")});

            const sizey = Number(formValues[5]);
            if (!isFinite(sizey)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.create.2.action.2.size.y")});

            const sizez = Number(formValues[6]);
            if (!isFinite(sizez)) throw new ErrorWithRawMessage({translate: "ui.error.message.invalid.number", with: RawMessageBuilder.translate("ui.structure.action.create.2.action.2.size.z")});
        
            data.pos1 = {x: posx, y: posy, z: posz};
            data.pos2 = Vector3Utils.add(data.pos1, {x: sizex - 1, y: sizey - 1, z: sizez - 1});

            showCreateForm3(player, data);
        } catch (e) {
            showErrorForm(player, (e as ErrorWithRawMessage).rawMessage, () => {
                form.show(player).then(response => next(response));
            });
        }
    }
}


function showCreateForm3(player: Player, data: createData) {
    const form = new ModalFormData()
        .title(RawMessageBuilder.translate("ui.structure.action.create.3.title"))
        .label(RawMessageBuilder.translate("ui.structure.action.create.3.message"))
        .toggle(RawMessageBuilder.translate("ui.structure.action.include.blocks.toggle.label"), {defaultValue: true})
        .toggle(RawMessageBuilder.translate("ui.structure.action.include.entities.toggle.label"), {defaultValue: true})
        .toggle(RawMessageBuilder.translate("ui.structure.action.saveMode.toggle.label"), {defaultValue: true, tooltip: RawMessageBuilder.translate("ui.structure.action.saveMode.toggle.tooltip")})
        .submitButton(RawMessageBuilder.translate("ui.common.next"));
    form.show(player).then(response => next(response));
    
    async function next(response: ModalFormResponse) {
        if (response.canceled) {
            showBrowseForm(player);
            return;
        }
        const formValues = response.formValues as boolean[];
        data.includeBlocks = formValues[1];
        data.includeEntities = formValues[2];
        data.saveMode = formValues[3] ? StructureSaveMode.World : StructureSaveMode.Memory;
        showCreateForm4(player, data);
    }
}

function showCreateForm4(player: Player, data: createData) {
    try {
        overrideStructure(
            data.structureId!,
            player.dimension,
            data.pos1!,
            data.pos2!,
            data.includeBlocks!,
            data.includeEntities!,
            data.saveMode!
        );
        new ActionFormData()
            .title(RawMessageBuilder.translate("ui.structure.action.create.4.title"))
            .body(RawMessageBuilder.translate("ui.structure.action.create.4.message"))
            .button(RawMessageBuilder.translate("ui.common.ok"))
            .show(player)
            .then(() => showBrowseForm(player));
    } catch (e) {
        new ActionFormData()
            .title(RawMessageBuilder.translate("ui.structure.action.create.4.error.title"))
            .body(RawMessageBuilder.translate("ui.structure.action.create.4.error.message", (e as Error).message))
            .button(RawMessageBuilder.translate("ui.common.ok"))
            .show(player)
            .then(() => showBrowseForm(player));
    }
}