import { system } from "@minecraft/server";
export const sleep = (tick) => new Promise(resolve => system.runTimeout(() => { resolve(undefined); }, tick));
