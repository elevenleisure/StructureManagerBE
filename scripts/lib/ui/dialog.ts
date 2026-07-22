import { BaseDialog } from "./baseDialog.js";
import { DialogComponent } from "./dialogComponent.js";

export class Dialog extends BaseDialog {
    /**
     * Add components to dialog.
     * @throws {TypeError} 
     * @throws {InvalidFormModificationError} when attempting to modify a form after it has already been shown to a player.
     */
    public add(...components: DialogComponent[]): Dialog {
        components.forEach(component => {
            component.addToCustomForm(this.customForm);
        });
        return this;
    }
}