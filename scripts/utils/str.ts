import { Player, RawMessage, system } from "@minecraft/server";

export function tell(player: Player, message: string | RawMessage) {
    system.run(() => {
        if (typeof message === "string") {
        player.runCommand(`tellraw @s {"rawtext":[{"text": "${message}"}]}`)
            player.runCommand(`tellraw @s {"rawtext":[{"text": "${message}"}]}`)
        } else {
            player.runCommand(`tellraw @s {"rawtext":[${JSON.stringify(message)}]}`)
        }
    })
}

export class RawMessageBuilder {
    static text(text: string): RawMessage {
        return { text: text };
    }

    static translate(key: string, ...withText: unknown[]): RawMessage {
        return { translate: key, with: withText.map(v => String(v)) };
    }
}