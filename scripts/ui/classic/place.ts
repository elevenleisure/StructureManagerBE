import { Player, Structure, StructureAnimationMode, StructureMirrorAxis, StructureRotation, Vector3 } from "@minecraft/server";
import { ActionFormData, ActionFormResponse, ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import { showErrorForm, showStructureActionForm } from "./browse.js";
import { startSelectPlace, startSelectSave } from "../../utils/preview.js";
import { loadStructure, StructureAnimationModes, StructureMirrorAxes, StructureRotations } from "../../utils/structure.js";

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
        .title("放置结构 - 1/3")
        .label("这会在指定的位置放置结构。\n\n你要如何确定放置位置与旋转？")
        .button("手动输入")
        .button("选取\n通过工具确定放置位置与旋转");
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
            .title("放置结构 - 1/3")
            .label("输入放置位置和旋转。\n\n")
            .textField("放置位置x", "0")
            .textField("放置位置y", "0")
            .textField("放置位置z", "0")
            .dropdown("旋转", ["无旋转", "旋转90°", "旋转180°", "旋转270°"])
            .submitButton("下一步");
        form.show(player).then(response => next(response));
        
        async function next(response: ModalFormResponse) {
            if (response.canceled) {
                showStructureActionForm(player, data.structure);
                return;
            }
            try {
                const formValues = response.formValues!;
                const placeLocationx = Number(formValues[1]);
                if (!isFinite(placeLocationx)) throw new Error("放置位置x必须是一个有效的数字。");
                
                const placeLocationy = Number(formValues[2]);
                if (!isFinite(placeLocationy)) throw new Error("放置位置y必须是一个有效的数字。");
                
                const placeLocationz = Number(formValues[3]);
                if (!isFinite(placeLocationz)) throw new Error("放置位置z必须是一个有效的数字。");

                data.placeLocation = {x: placeLocationx, y: placeLocationy, z: placeLocationz};
                data.rotation = StructureRotations[formValues[4] as number].rotation;

                showCreateForm2(player, data);
            } catch (e) {
                showErrorForm(player, (e as Error).message, () => {
                    form.show(player).then(response => next(response));
                });
            }
        }
}

function showCreateForm2(player: Player, data: PlaceData) {
    const form = new ModalFormData()
        .title("放置结构 - 2/3")
        .label("选择额外放置选项。")
        .dropdown("镜像模式", ["无镜像", "x", "z", "xz"])
        .dropdown("动画模式", ["无动画", "逐方块", "逐层"])
        .textField("动画秒数", "0")
        .slider("完整度", 0, 100, {defaultValue: 100})
        .textField("完整度种子", "随机")
        .toggle("包括方块", {defaultValue: true})
        .toggle("包括实体", {defaultValue: true})
        .toggle("含水方块", {defaultValue: false, tooltip: "加载结构时，使可含水方块在加载区域的水源方块上可以加载为含水方块。"})
        .submitButton("下一步")
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
            if (!isFinite(animationSeconds)) throw new Error("动画秒数必须是一个有效的数字。");

            data.animationSeconds = animationSeconds;
            data.integrity = formValues[4] as number;
            data.integritySeed = (formValues[5] as string).trim() === "" ? undefined : formValues[5] as string;
            data.includeBlocks = formValues[6] as boolean;
            data.includeEntities = formValues[7] as boolean;
            data.waterlogged = formValues[8] as boolean;

            showCreateForm3(player, data);
        } catch (e) {
            showErrorForm(player, (e as Error).message, () => {
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
            .title("放置结构 - 3/3")
            .body("你的结构已经放置。")
            .button("确定")
            .show(player);
    } catch (e) {
        new ActionFormData()
            .title("发生致命错误！")
            .body(`你的结构在加载时出现了异常情况，请重新尝试。\n\n错误详情：\n${(e as Error).message}`)
            .button("确定")
            .show(player)
            .then(() => showStructureActionForm(player, data.structure));
    }
}
