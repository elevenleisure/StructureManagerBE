import { Player } from "@minecraft/server";
import { playerHotbar } from "./preview.js";

export function getPlayerInventory(player: Player) {
    const inventory = player.getComponent("minecraft:inventory")?.container;
    if (!inventory) {
        throw new Error(`The player has no inventory`);
    }
    return inventory;
}
export function saveHotbar(player: Player) {
    const inventory = getPlayerInventory(player);
    playerHotbar.set(player.name, Array.from({ length: 9 }, (_, i) => inventory.getItem(i)));
}
export function clearHotbar(player: Player) {
    const inventory = getPlayerInventory(player);
    Array.from({ length: 9 }).forEach((_, i) => {
        inventory.setItem(i);
    });
}
export function restoreHotbar(player: Player) {
    const inventory = getPlayerInventory(player);
    const hotbar = playerHotbar.get(player.name);
    if (!hotbar) return;

    Array.from({ length: 9 }).forEach((_, i) => {
        inventory.setItem(i, hotbar[i]);
    });
    playerHotbar.delete(player.name);
}

export function getSelectedItem(player: Player) {
    const inventory = getPlayerInventory(player);
    return inventory.getItem(player.selectedSlotIndex);
}
