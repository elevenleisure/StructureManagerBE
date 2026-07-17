import { Player, Vector3 } from "@minecraft/server";

export enum Config {
    useNewForm = "useNewForm",
}

export enum AvailableConfigType {
    boolean,
    number,
    string
}

export const configType: Record<string, AvailableConfigType> = {};
configType[Config.useNewForm] = AvailableConfigType.boolean;


export const availableConfig = [Config.useNewForm];

export function setPlayerConfig(player: Player, config: Config | string, value?: boolean | number | string) {
    if (!(availableConfig as string[]).includes(config)) throw new Error("Config is not registered.");
    switch (configType[config]) {
        case AvailableConfigType.boolean:
            if (typeof value === "number") throw new TypeError("Illegal value");
            player.setDynamicProperty(config, value === undefined ? undefined : toBooleanStrict(value));
            break;
        case AvailableConfigType.number:
            if (typeof value === "boolean") throw new TypeError("Illegal value");
            player.setDynamicProperty(config, value === undefined ? undefined : toNumberStrict(value));
            break;
        case AvailableConfigType.string:
            player.setDynamicProperty(config, String(value));
            break;
        default:
            throw new Error("Unknown config type.");
    }
}

export function getPlayerConfig(player: Player, config: Config | string): boolean | number | string | undefined {
    if (!(availableConfig as string[]).includes(config)) return undefined;
    return player.getDynamicProperty(config) as boolean | number | string | undefined;
}

export function getPlayerConfigOr(player: Player, config: Config | string, defaultValue: boolean | number | string): boolean | number | string {
    if (!(availableConfig as string[]).includes(config)) return defaultValue;
    return (player.getDynamicProperty(config) ?? defaultValue) as boolean | number | string;
}

export function toBooleanStrict(value: string | boolean) {
    if (typeof value === "boolean") return value; 
    if (value === "true") {
        return true;
    } else if (value === "false") {
        return false;
    } else {
        throw new TypeError("Illegal value");
    }
}

export function toNumberStrict(value: string | number) {
    const num = Number(value);
    if (isFinite(num)) return num;
    else throw new TypeError("Illegal value");
}