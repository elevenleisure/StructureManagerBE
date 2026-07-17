import { ObservableString, ObservableUIRawMessage, UIRawMessage } from "@minecraft/server-ui";

export function toObservableRawMessage(text: string | UIRawMessage): ObservableUIRawMessage {
    if (typeof text === "string") return new ObservableUIRawMessage({ rawtext: [{ text: text }] }, {clientWritable:true});
    else return new ObservableUIRawMessage(text, {clientWritable:true});
}