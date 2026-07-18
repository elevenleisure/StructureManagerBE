import { Player, RawMessage, Structure, StructureSaveMode, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { showCreateForm } from "./create.js";
import { cloneStructure, deleteStructure, getAllStructureId, praseStructureId, renameStructure } from "../../utils/structure.js";
import { showPlaceForm } from "./place.js";
import { Config, setPlayerConfig } from "../../utils/config.js";
import { RawMessageBuilder } from "../../utils/str.js";


export async function showBrowseForm(player: Player) {
    const response = await new ActionFormData()
        .title(RawMessageBuilder.translate("ui.browse.title"))
        .button(RawMessageBuilder.translate("ui.browse.create"))
        .button(RawMessageBuilder.translate("ui.browse.search"))
        .button(RawMessageBuilder.translate("ui.browse.browseAll"))
        .divider()
        .button(RawMessageBuilder.translate("ui.browse.useNewForm"))
        .button(RawMessageBuilder.translate("ui.common.close"))
        .show(player);
    if (response.canceled) return;
    switch (response.selection) {
        case 0:
            showCreateForm(player);
            break;
        case 1:
            new ModalFormData()
                .title(RawMessageBuilder.translate("ui.common.search"))
                .textField(RawMessageBuilder.translate("ui.browse.search.description"), "")
                .submitButton(RawMessageBuilder.translate("ui.common.ok"))
                .show(player)
                .then(response => {
                    if (response.canceled) {
                        showBrowseForm(player);
                        return;
                    }
                    showBrowseStructureForm(player, (response.formValues![0] as string).trim());
                })
            break;
        case 2:
            showBrowseStructureForm(player);
            break;
        case 3:
            showUseNewForm(player);
            break;
    }
}

export async function showBrowseStructureForm(player: Player, search?: string) {
    let structureIds = getAllStructureId();
    if (search) {
        const _structureIds: string[] = [];
        structureIds.forEach(value => {
            if (value.includes(search)) _structureIds.push(value);
        });
        structureIds = _structureIds;
    }
    let currentPage = 1;
    let maxPage = Math.ceil(structureIds.length / 10);


    showBrowseStructureFormNext(player, currentPage, maxPage, structureIds);
}

function showBrowseStructureFormNext(player: Player, currentPage: number, maxPage: number, structureIds: string[]) {
    const form = new ActionFormData()
        .title(RawMessageBuilder.translate("ui.browse.structure.title"))
        .body(RawMessageBuilder.translate("ui.browse.structure.total", structureIds.length))
        .label(RawMessageBuilder.translate("ui.browse.structure.page.information", currentPage, maxPage));
    let itemCount = 0;
    let hasPreviousButton = maxPage !== 1 && currentPage > 1;
    let hasNextButton = maxPage !== 1 && currentPage < maxPage;
    for (let i = (currentPage - 1) * 10; i < structureIds.length; i++) {
        if (itemCount >= 10) {
            hasNextButton = true;
            break;
        }
        const element = structureIds[i];
        const structure = world.structureManager.get(element);
        if (!(structure && structure.isValid)) {
            const { namespace, path } = praseStructureId(element);
            form.button(RawMessageBuilder.translate("ui.browse.structure.structureInformation.invalid", path, namespace));
        } else {
            const { namespace, path } = praseStructureId(structure.id);
            form.button(RawMessageBuilder.translate("ui.browse.structure.structureInformation", path, namespace, structure.size.x * structure.size.y * structure.size.z));
        }
        itemCount++;
    }
    if (hasPreviousButton) form.button(RawMessageBuilder.translate("ui.browse.structure.page.previous"));
    if (hasNextButton) form.button(RawMessageBuilder.translate("ui.browse.structure.page.next"));
    form.show(player).then(response => {
        if (response.canceled) {
            showBrowseForm(player);
            return;
        }
        const selection = response.selection!;
        if (selection < itemCount) {
            showStructureActionForm(player, structureIds[(currentPage - 1) * 10 + selection]);
        } else if (hasPreviousButton && hasNextButton) {
            switch (selection) {
                case itemCount:
                    currentPage--;
                    showBrowseStructureFormNext(player, currentPage, maxPage, structureIds);
                    break;
                case itemCount + 1:
                    currentPage++;
                    showBrowseStructureFormNext(player, currentPage, maxPage, structureIds);
                    break;
            }
        } else if (hasPreviousButton) {
            currentPage--;
            showBrowseStructureFormNext(player, currentPage, maxPage, structureIds);
        } else if (hasNextButton) {
            currentPage++;
            showBrowseStructureFormNext(player, currentPage, maxPage, structureIds);
        }
    });
}
export function showStructureActionForm(player: Player, sourceStructure: Structure | string) {
    const structure = typeof sourceStructure === "string" ? world.structureManager.get(sourceStructure) : sourceStructure;
    if (!structure || !structure.isValid) {
        new ActionFormData()
            .body(RawMessageBuilder.translate("ui.structure.action.invalid.id"))
            .button(RawMessageBuilder.translate("ui.common.ok"))
            .show(player)
            .then(() => showBrowseStructureForm(player));
        return;
    }
    const { namespace, path } = praseStructureId(structure.id);
    new ActionFormData()
        .title(RawMessageBuilder.translate("ui.structure.action.title"))
        .body(RawMessageBuilder.translate("ui.structure.action.structureInformation", path, namespace, structure.size.x, structure.size.y, structure.size.z, structure.size.x * structure.size.y * structure.size.z))
        .button(RawMessageBuilder.translate("ui.structure.action.place"))
        .button(RawMessageBuilder.translate("ui.structure.action.rename"))
        .button(RawMessageBuilder.translate("ui.structure.action.clone"))
        .button(RawMessageBuilder.translate("ui.structure.action.delete"))
        .button(RawMessageBuilder.translate("ui.common.close"))
        .show(player)
        .then(response => {
            if (response.canceled) {
                showBrowseStructureForm(player);
                return;
            }
            switch (response.selection) {
                case 0:
                    showPlaceForm(player, structure);
                    break;
                case 1:
                    showRenameStructureForm(player, structure);
                    break;
                case 2:
                    showCloneStructureForm(player, structure);
                    break;
                case 3:
                    showDeleteStructureForm(player, structure);
                    break;
                case 4:
                    showBrowseStructureForm(player);
                    break;
            }
        });
}

function showRenameStructureForm(player: Player, structure: Structure) {
    new ModalFormData()
        .title(RawMessageBuilder.translate("ui.structure.action.rename.title"))
        .textField(RawMessageBuilder.translate("ui.structure.action.rename.new"), "", { defaultValue: structure.id })
        .submitButton(RawMessageBuilder.translate("ui.common.ok"))
        .show(player)
        .then(response => {
            if (response.canceled) {
                showStructureActionForm(player, structure);
                return;
            }
            try {
                const newStructureId = response.formValues![0] as string;
                renameStructure(structure, newStructureId);
                showStructureActionForm(player, newStructureId);
            } catch (e) {
                showErrorForm(player, (e as Error).message, () => showStructureActionForm(player, structure));
            }
        });
}

function showCloneStructureForm(player: Player, structure: Structure) {
    new ModalFormData()
        .title(RawMessageBuilder.translate("ui.structure.action.clone.title"))
        .textField(RawMessageBuilder.translate("ui.structure.action.clone.new"), "", { defaultValue: structure.id + "(1)" })
        .toggle(RawMessageBuilder.translate("ui.structure.action.saveMode.toggle.label"), { defaultValue: true, tooltip: RawMessageBuilder.translate("ui.structure.action.saveMode.toggle.tooltip")})
        .submitButton(RawMessageBuilder.translate("ui.common.ok"))
        .show(player)
        .then(response => {
            if (response.canceled) {
                showStructureActionForm(player, structure);
                return;
            }
            try {
                const newStructureId = response.formValues![0] as string;
                const saveMode = response.formValues![1] ? StructureSaveMode.World : StructureSaveMode.Memory;
                cloneStructure(structure, newStructureId, saveMode);
                showStructureActionForm(player, newStructureId);
            } catch (e) {
                showErrorForm(player, (e as Error).message, () => showStructureActionForm(player, structure));
            }
        });
}

function showDeleteStructureForm(player: Player, structure: Structure) {
    new ActionFormData()
        .title(RawMessageBuilder.translate("ui.structure.action.delete.title"))
        .body(RawMessageBuilder.translate("ui.structure.action.delete.message", structure.id))
        .button(RawMessageBuilder.translate("ui.common.ok"))
        .button(RawMessageBuilder.translate("ui.common.cancel"))
        .show(player)
        .then(response => {
            if (response.canceled) {
                showStructureActionForm(player, structure);
                return;
            }
            switch (response.selection) {
                case 0:
                    try {
                        deleteStructure(structure);
                        showBrowseStructureForm(player);
                    } catch (e) {
                        showErrorForm(player, (e as Error).message, () => showStructureActionForm(player, structure));
                    }
                    break;
                case 1:
                    showStructureActionForm(player, structure);
                    break;
            }
        });
}

export function showErrorForm(player: Player, message: string | RawMessage, callback: () => void) {
    new ActionFormData()
        .title(RawMessageBuilder.translate("ui.error.title"))
        .body(message)
        .button(RawMessageBuilder.translate("ui.common.ok"))
        .show(player)
        .then(() => {
            callback();
        })
}

function showUseNewForm(player: Player) {
    new ActionFormData()
        .title(RawMessageBuilder.translate("ui.browse.useNewForm.title"))
        .body(RawMessageBuilder.translate("ui.browse.useNewForm.message"))
        .button(RawMessageBuilder.translate("ui.common.yes"))
        .button(RawMessageBuilder.translate("ui.common.no"))
        .show(player)
        .then(response => {
            if (response.canceled) {
                showBrowseForm(player);
                return;
            }
            switch (response.selection) {
                case 0:
                    setPlayerConfig(player, Config.useNewForm, true);
                    break;
                case 1:
                    showBrowseForm(player);
                    break;
            }
        })
}
