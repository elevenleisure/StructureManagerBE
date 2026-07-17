import { StructureSaveMode } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { showBrowseForm, showErrorForm } from "./browse.js";
import { hasStructure, overrideStructure } from "../../utils/structure.js";
import { Vector3Utils } from "../../lib/math/minecraft-math.js";
import { startSelectSave } from "../../utils/preview.js";
export function showCreateForm(player, data) {
    if (!data) {
        data = {};
    }
    const form = new ModalFormData()
        .title("创建新结构 - 1/4")
        .label("这会在你的世界中创建一个新的结构。\n\n")
        .textField("欲保存的结构名", data?.structureId ? data.structureId : "")
        .submitButton("下一步");
    form.show(player).then(response => next(response));
    async function next(response) {
        if (response.canceled) {
            showBrowseForm(player);
            return;
        }
        const structureId = response.formValues[1];
        if (hasStructure(structureId)) {
            const response2 = await new ActionFormData()
                .title("覆盖？")
                .body(`世界上已经存在一个名为${structureId}的结构了，你确定要覆盖它吗？`)
                .button("确定")
                .button("取消")
                .show(player);
            if (response2.canceled) {
                form.show(player).then(_response => next(_response));
                return;
            }
            switch (response2.selection) {
                case 0:
                    data.structureId = structureId;
                    showCreateForm2(player, data);
                    break;
                case 1:
                    form.show(player).then(_response => next(_response));
                    break;
            }
        }
        else {
            data.structureId = structureId;
            showCreateForm2(player, data);
        }
    }
}
function showCreateForm2(player, data) {
    const form = new ActionFormData()
        .title("创建新结构 - 2/4")
        .label("确定结构的体积尺寸\n\n你要如何确定结构的体积尺寸？")
        .button("手动输入\n通过2个顶点确定区域")
        .button("手动输入\n通过位置和尺寸确定区域")
        .button("选取\n通过工具确定区域");
    form.show(player).then(response => next(response));
    async function next(response) {
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
                }
                catch (e) {
                    form.show(player).then(response => next(response));
                    return;
                }
                break;
        }
    }
}
function showCreateForm2points(player, data) {
    const form = new ModalFormData()
        .title("创建新结构 - 2/4")
        .label("通过2个顶点确定区域\n\n")
        .textField("起始点x", "0")
        .textField("起始点y", "0")
        .textField("起始点z", "0")
        .textField("终止点x", "0")
        .textField("终止点y", "0")
        .textField("终止点z", "0")
        .submitButton("下一步");
    form.show(player).then(response => next(response));
    async function next(response) {
        if (response.canceled) {
            showBrowseForm(player);
            return;
        }
        try {
            const formValues = response.formValues;
            const pos1x = Number(formValues[1]);
            if (!isFinite(pos1x))
                throw new Error("起始点x必须是一个有效的数字。");
            const pos1y = Number(formValues[2]);
            if (!isFinite(pos1y))
                throw new Error("起始点y必须是一个有效的数字。");
            const pos1z = Number(formValues[3]);
            if (!isFinite(pos1z))
                throw new Error("起始点z必须是一个有效的数字。");
            const pos2x = Number(formValues[4]);
            if (!isFinite(pos2x))
                throw new Error("终止点x必须是一个有效的数字。");
            const pos2y = Number(formValues[5]);
            if (!isFinite(pos2y))
                throw new Error("终止点y必须是一个有效的数字。");
            const pos2z = Number(formValues[6]);
            if (!isFinite(pos2z))
                throw new Error("终止点z必须是一个有效的数字。");
            data.pos1 = { x: pos1x, y: pos1y, z: pos1z };
            data.pos2 = { x: pos1x, y: pos2y, z: pos2z };
            showCreateForm3(player, data);
        }
        catch (e) {
            showErrorForm(player, e.message, () => {
                form.show(player).then(response => next(response));
            });
        }
    }
}
function showCreateForm2size(player, data) {
    const form = new ModalFormData()
        .title("创建新结构 - 2/4")
        .label("通过位置和尺寸确定区域\n\n")
        .textField("起始点x", "0")
        .textField("起始点y", "0")
        .textField("起始点z", "0")
        .textField("尺寸x", "0")
        .textField("尺寸y", "0")
        .textField("尺寸z", "0")
        .submitButton("下一步");
    form.show(player).then(response => next(response));
    async function next(response) {
        if (response.canceled) {
            showBrowseForm(player);
            return;
        }
        try {
            const formValues = response.formValues;
            const posx = Number(formValues[1]);
            if (!isFinite(posx))
                throw new Error("起始点x必须是一个有效的数字。");
            const posy = Number(formValues[2]);
            if (!isFinite(posy))
                throw new Error("起始点y必须是一个有效的数字。");
            const posz = Number(formValues[3]);
            if (!isFinite(posz))
                throw new Error("起始点z必须是一个有效的数字。");
            const sizex = Number(formValues[4]);
            if (!isFinite(sizex))
                throw new Error("尺寸x必须是一个有效的数字。");
            const sizey = Number(formValues[5]);
            if (!isFinite(sizey))
                throw new Error("尺寸y必须是一个有效的数字。");
            const sizez = Number(formValues[6]);
            if (!isFinite(sizez))
                throw new Error("尺寸z必须是一个有效的数字。");
            data.pos1 = { x: posx, y: posy, z: posz };
            data.pos2 = Vector3Utils.add(data.pos1, { x: sizex - 1, y: sizey - 1, z: sizez - 1 });
            showCreateForm3(player, data);
        }
        catch (e) {
            showErrorForm(player, e.message, () => {
                form.show(player).then(response => next(response));
            });
        }
    }
}
function showCreateForm3(player, data) {
    const form = new ModalFormData()
        .title("创建新结构 - 3/4")
        .label("额外的保存选项\n\n")
        .toggle("包括方块", { defaultValue: true })
        .toggle("包括实体", { defaultValue: true })
        .toggle("保存至世界", { defaultValue: true, tooltip: "若开启，新的结构将会被永久保存到世界中。若关闭，新的结构将会被临时保存至内存中。一旦你退出了世界，它就会永远消失。" })
        .submitButton("下一步");
    form.show(player).then(response => next(response));
    async function next(response) {
        if (response.canceled) {
            showBrowseForm(player);
            return;
        }
        const formValues = response.formValues;
        data.includeBlocks = formValues[1];
        data.includeEntities = formValues[2];
        data.saveMode = formValues[3] ? StructureSaveMode.World : StructureSaveMode.Memory;
        showCreateForm4(player, data);
    }
}
function showCreateForm4(player, data) {
    try {
        overrideStructure(data.structureId, player.dimension, data.pos1, data.pos2, data.includeBlocks, data.includeEntities, data.saveMode);
        new ActionFormData()
            .title("创建新结构 - 4/4")
            .body("你的结构已经保存。")
            .button("确定")
            .show(player)
            .then(() => showBrowseForm(player));
    }
    catch (e) {
        new ActionFormData()
            .title("发生致命错误！")
            .body(`你的结构在保存时出现了异常情况，请重新尝试。\n\n错误详情：\n${e.message}`)
            .button("确定")
            .show(player)
            .then(() => showBrowseForm(player));
    }
}
