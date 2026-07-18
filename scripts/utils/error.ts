import { RawMessage } from "@minecraft/server";
import { RawMessageBuilder } from "./str.js";

export class ErrorWithRawMessage extends Error {
    public readonly rawMessage: RawMessage;
    constructor(message?: RawMessage, options?: ErrorOptions) {
        super("", options);
        this.rawMessage = message ?? RawMessageBuilder.text("");
    }
}