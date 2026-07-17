import { playerHotbar } from "./preview.js";
export function getPlayerInventory(player) {
    const inventory = player.getComponent("minecraft:inventory")?.container;
    if (!inventory) {
        throw new Error(`The player has no inventory`);
    }
    return inventory;
}
export function saveHotbar(player) {
    const inventory = getPlayerInventory(player);
    playerHotbar.set(player.name, Array.from({ length: 9 }, (_, i) => inventory.getItem(i)));
    // logit(playerHotbars.get(player.name));
}
export function clearHotbar(player) {
    const inventory = getPlayerInventory(player);
    Array.from({ length: 9 }).forEach((_, i) => {
        inventory.setItem(i);
    });
}
export function restoreHotbar(player) {
    const inventory = getPlayerInventory(player);
    const hotbar = playerHotbar.get(player.name);
    // logit(playerHotbar.get(player.name));
    if (!hotbar)
        return;
    Array.from({ length: 9 }).forEach((_, i) => {
        inventory.setItem(i, hotbar[i]);
    });
    playerHotbar.delete(player.name);
}
export function getSelectedItem(player) {
    const inventory = getPlayerInventory(player);
    return inventory.getItem(player.selectedSlotIndex);
}
