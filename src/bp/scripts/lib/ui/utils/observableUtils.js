import { ObservableUIRawMessage } from "@minecraft/server-ui";
export function toObservableRawMessage(text) {
    if (typeof text === "string")
        return new ObservableUIRawMessage({ rawtext: [{ text: text }] }, { clientWritable: true });
    else
        return new ObservableUIRawMessage(text, { clientWritable: true });
}
