import { StructureSaveMode, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { showCreateForm } from "./create.js";
import { cloneStructure, deleteStructure, getAllStructureId, praseStructureId, renameStructure } from "../../utils/structure.js";
import { showPlaceForm } from "./place.js";
import { Config, setPlayerConfig } from "../../utils/config.js";
export async function showBrowseForm(player) {
    const response = await new ActionFormData()
        .title("总览")
        .button("新建结构")
        .button("搜索结构")
        .button("浏览所有结构")
        .divider()
        .button("使用新表单")
        .button("关闭")
        .show(player);
    if (response.canceled)
        return;
    switch (response.selection) {
        case 0:
            showCreateForm(player);
            break;
        case 1:
            new ModalFormData()
                .title("搜索")
                .textField("欲搜索字段", "")
                .submitButton("完成")
                .show(player)
                .then(response => {
                if (response.canceled) {
                    showBrowseForm(player);
                    return;
                }
                showBrowseStructureForm(player, response.formValues[0].trim());
            });
            break;
        case 2:
            showBrowseStructureForm(player);
            break;
        case 3:
            showUseNewForm(player);
            break;
    }
}
export async function showBrowseStructureForm(player, search) {
    let structureIds = getAllStructureId();
    if (search) {
        const _structureIds = [];
        structureIds.forEach(value => {
            if (value.includes(search))
                _structureIds.push(value);
        });
        structureIds = _structureIds;
    }
    let currentPage = 1;
    let maxPage = Math.ceil(structureIds.length / 10);
    showBrowseStructureFormNext(player, currentPage, maxPage, structureIds);
}
function showBrowseStructureFormNext(player, currentPage, maxPage, structureIds) {
    const form = new ActionFormData()
        .title("结构")
        .body(`总共有 ${structureIds.length} 个结构可用。`)
        .label(`第${currentPage}/${maxPage}页`);
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
            form.button(`$b§l${path}§r\n命名空间： §d${namespace}§r §c该结构处于无效状态`);
        }
        else {
            const { namespace, path } = praseStructureId(structure.id);
            form.button(`§b§l${path}§r\n命名空间： §d${namespace}§r 方块数量：§2${structure.size.x * structure.size.y * structure.size.z}§r`);
        }
        itemCount++;
    }
    if (hasPreviousButton)
        form.button("上一页");
    if (hasNextButton)
        form.button("下一页");
    form.show(player).then(response => {
        if (response.canceled) {
            showBrowseForm(player);
            return;
        }
        const selection = response.selection;
        if (selection < itemCount) {
            showStructureActionForm(player, structureIds[(currentPage - 1) * 10 + selection]);
        }
        else if (hasPreviousButton && hasNextButton) {
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
        }
        else if (hasPreviousButton) {
            currentPage--;
            showBrowseStructureFormNext(player, currentPage, maxPage, structureIds);
        }
        else if (hasNextButton) {
            currentPage++;
            showBrowseStructureFormNext(player, currentPage, maxPage, structureIds);
        }
    });
}
export function showStructureActionForm(player, sourceStructure) {
    const structure = typeof sourceStructure === "string" ? world.structureManager.get(sourceStructure) : sourceStructure;
    if (!structure || !structure.isValid) {
        new ActionFormData()
            .body("无效的结构ID")
            .button("确定")
            .show(player)
            .then(() => showBrowseStructureForm(player));
        return;
    }
    const { namespace, path } = praseStructureId(structure.id);
    new ActionFormData()
        .title("结构")
        .body(`§b${path}§r\n命名空间：§d${namespace}§r\n尺寸：§c${structure.size.x}§rx§a${structure.size.y}§rx§9${structure.size.z}§r （共计${structure.size.x * structure.size.y * structure.size.z}个方块）§r`)
        .button("放置")
        .button("重命名")
        .button("复制")
        .button("删除")
        .button("关闭")
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
function showRenameStructureForm(player, structure) {
    new ModalFormData()
        .title("重命名")
        .textField("新的结构ID", "", { defaultValue: structure.id })
        .submitButton("完成")
        .show(player)
        .then(response => {
        if (response.canceled) {
            showStructureActionForm(player, structure);
            return;
        }
        try {
            const newStructureId = response.formValues[0];
            renameStructure(structure, newStructureId);
            showStructureActionForm(player, newStructureId);
        }
        catch (e) {
            showErrorForm(player, e.message, () => showStructureActionForm(player, structure));
        }
    });
}
function showCloneStructureForm(player, structure) {
    new ModalFormData()
        .title("复制")
        .textField("新的结构ID", "", { defaultValue: structure.id })
        .toggle("保存至世界", { defaultValue: true, tooltip: "若开启，新的结构将会被永久保存到世界中。若关闭，新的结构将会被临时保存至内存中。一旦你退出了世界，它就会永远消失。" })
        .submitButton("完成")
        .show(player)
        .then(response => {
        if (response.canceled) {
            showStructureActionForm(player, structure);
            return;
        }
        try {
            const newStructureId = response.formValues[0];
            const saveMode = response.formValues[1] ? StructureSaveMode.World : StructureSaveMode.Memory;
            cloneStructure(structure, newStructureId, saveMode);
            showStructureActionForm(player, newStructureId);
        }
        catch (e) {
            showErrorForm(player, e.message, () => showStructureActionForm(player, structure));
        }
    });
}
function showDeleteStructureForm(player, structure) {
    new ActionFormData()
        .body(`你确定要删除结构 ${structure.id} 吗？`)
        .button("确定")
        .button("取消")
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
                }
                catch (e) {
                    showErrorForm(player, e.message, () => showStructureActionForm(player, structure));
                }
                break;
            case 1:
                showStructureActionForm(player, structure);
                break;
        }
    });
}
export function showErrorForm(player, message, callback) {
    new ActionFormData()
        .title("错误")
        .body(message)
        .button("确定")
        .show(player)
        .then(() => {
        callback();
    });
}
function showUseNewForm(player) {
    new ActionFormData()
        .title("提示")
        .body("新的 Ore UI 风格表单仍然在测试中，在使用过程中可能会出现一些未知的问题。\n\n目前已知问题：\n在“基础游戏版本”（常见于由模板创建的世界）低于26.30时新表单无法正常工作。\n\n如果新表单出现问题可以使用命令/smanager-config useNewForm false手动关闭。你确定要继续吗？")
        .button("确定")
        .button("取消")
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
    });
}
