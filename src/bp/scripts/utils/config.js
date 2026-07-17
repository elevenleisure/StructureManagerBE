export var Config;
(function (Config) {
    Config["useNewForm"] = "useNewForm";
})(Config || (Config = {}));
export var AvailableConfigType;
(function (AvailableConfigType) {
    AvailableConfigType[AvailableConfigType["boolean"] = 0] = "boolean";
    AvailableConfigType[AvailableConfigType["number"] = 1] = "number";
    AvailableConfigType[AvailableConfigType["string"] = 2] = "string";
})(AvailableConfigType || (AvailableConfigType = {}));
export const configType = {};
configType[Config.useNewForm] = AvailableConfigType.boolean;
export const availableConfig = [Config.useNewForm];
export function setPlayerConfig(player, config, value) {
    if (!availableConfig.includes(config))
        throw new Error("Config is not registered.");
    switch (configType[config]) {
        case AvailableConfigType.boolean:
            if (typeof value === "number")
                throw new TypeError("Illegal value");
            player.setDynamicProperty(config, value === undefined ? undefined : toBooleanStrict(value));
            break;
        case AvailableConfigType.number:
            if (typeof value === "boolean")
                throw new TypeError("Illegal value");
            player.setDynamicProperty(config, value === undefined ? undefined : toNumberStrict(value));
            break;
        case AvailableConfigType.string:
            player.setDynamicProperty(config, String(value));
            break;
        default:
            throw new Error("Unknown config type.");
    }
}
export function getPlayerConfig(player, config) {
    if (!availableConfig.includes(config))
        return undefined;
    return player.getDynamicProperty(config);
}
export function getPlayerConfigOr(player, config, defaultValue) {
    if (!availableConfig.includes(config))
        return defaultValue;
    return (player.getDynamicProperty(config) ?? defaultValue);
}
export function toBooleanStrict(value) {
    if (typeof value === "boolean")
        return value;
    if (value === "true") {
        return true;
    }
    else if (value === "false") {
        return false;
    }
    else {
        throw new TypeError("Illegal value");
    }
}
export function toNumberStrict(value) {
    const num = Number(value);
    if (isFinite(num))
        return num;
    else
        throw new TypeError("Illegal value");
}
