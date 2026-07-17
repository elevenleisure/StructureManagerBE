import { Player, RawMessage, system } from "@minecraft/server";

export function tell(player: Player, message: string) {
    system.run(() => {
        player.runCommand(`tellraw @s {"rawtext":[{"text": "${message}"}]}`)
    })
}

export class RawMessageBuilder {
    static text(text: string): RawMessage {
        return {text: text};
    }

    static translate(key: string): RawMessage {
        return {translate: key}
    }
}