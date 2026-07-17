import { CommandPermissionLevel, CustomCommand, CustomCommandParamType, CustomCommandStatus, Player, system } from "@minecraft/server";
import { showBrowse } from "./ui/new/browse.js";
import { showBrowseForm } from "./ui/classic/browse.js";
import { availableConfig, Config, getPlayerConfigOr, setPlayerConfig } from "./utils/config.js";

system.beforeEvents.startup.subscribe(event => {

    event.customCommandRegistry.registerEnum("smanager:config", availableConfig);
    const openGuiCommand: CustomCommand = {
        name: "smanager:smanager",
        description: "打开结构管理器的主界面",
        permissionLevel: CommandPermissionLevel.Admin
    }

    event.customCommandRegistry.registerCommand(openGuiCommand, origin => {
        if (!(origin.sourceEntity && origin.sourceEntity instanceof Player)) {
            return {
                status: CustomCommandStatus.Failure,
                message: "执行者必须是一个有效的玩家"
            }
        }
        system.run(() => {
            if (getPlayerConfigOr(origin.sourceEntity as Player, Config.useNewForm, false)) {
                showBrowse(origin.sourceEntity as Player);
            } else {
                showBrowseForm(origin.sourceEntity as Player);
            }
        });
        return {
            status: CustomCommandStatus.Success
        };
    });

    const configCommand: CustomCommand = {
        name: "smanager:smanager-config",
        description: "修改结构管理器的配置",
        permissionLevel: CommandPermissionLevel.Admin,
        mandatoryParameters: [
            {
                type: CustomCommandParamType.Enum,
                name: "smanager:config"
            },
            {
                type: CustomCommandParamType.String,
                name: "value"
            }
        ]
    }

    event.customCommandRegistry.registerCommand(configCommand, (origin, config: string, value: string) => {
        if (!(origin.sourceEntity && origin.sourceEntity instanceof Player)) {
            return {
                status: CustomCommandStatus.Failure,
                message: "执行者必须是一个有效的玩家"
            }
        }
        try {
            setPlayerConfig(origin.sourceEntity, config, value);
            return {
                status: CustomCommandStatus.Success,
                message: `已将配置${config}的值设为${value}`
            }
        } catch (e) {
            return {
                status: CustomCommandStatus.Failure,
                message: (e as Error).message
            };
        }
    });

});