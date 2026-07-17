import { system } from "@minecraft/server";

export const sleep = (tick: number) => new Promise(resolve => system.runTimeout(() => { resolve(undefined) }, tick));
