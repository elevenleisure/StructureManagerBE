import { system } from "@minecraft/server";
export function tell(player, message) {
    system.run(() => {
        player.runCommand(`tellraw @s {"rawtext":[{"text": "${message}"}]}`);
    });
}
export class RawMessageBuilder {
    static text(text) {
        return { text: text };
    }
    static translate(key) {
        return { translate: key };
    }
}
