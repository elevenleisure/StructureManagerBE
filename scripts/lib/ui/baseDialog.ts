import { InvalidEntityError, Player, system } from "@minecraft/server";
import { CustomForm, DataDrivenScreenClosedReason, FormVisibilityError, InvalidFormModificationError, ObservableUIRawMessage, UIRawMessage } from "@minecraft/server-ui";
import { toObservableRawMessage } from "./utils/observableUtils.js";

export class BaseDialog {
    protected _title: ObservableUIRawMessage;
    protected customForm: CustomForm;
    public onClose: ((reason: DataDrivenScreenClosedReason) => void) | undefined;
    readonly player: Player;

    constructor(player: Player, title: string | UIRawMessage) {
        this._title = toObservableRawMessage(title);
        this.player = player;
        this.customForm = new CustomForm(player, this._title);
    }

    public set title(title: string | UIRawMessage) {
        if (typeof title === "string") {
            this._title.setData({ rawtext: [{ text: title }] });
        } else {
            this._title.setData(title);
        }
    }

    public get title(): UIRawMessage {
        return this._title.getData();
    }

    public get stringTitle(): string | undefined {
        return this._title.getData().rawtext?.at(0)?.text;
    }

    public setOnClose(onClose: ((reason: DataDrivenScreenClosedReason) => void) | undefined): BaseDialog {
        this.onClose = onClose;
        return this;
    }

    /**
     * Returns true if the form is currently being shown to the
     * player, false otherwise.
     *
     */
    public get isShowing(): boolean {
        return this.customForm.isShowing();
    }

    /**
     * Adds a close button to the form at the bottom and as an 'X' in the corner. Returns the form instance to allow method chaining.
     * 
     * @throws {InvalidFormModificationError} when attempting to modify a form after it has already been shown to a player.
     */
    public closeButton() {
        this.customForm.closeButton();
        return this;
    }

    /**
     * Shows the form to the player. Returns a promise that
     * resolves with a DataDrivenScreenClosedReason indicating how
     * the form was closed.
     *
     * @async
     * @throws {EngineError | FormVisibilityError | InvalidEntityError} This function can throw errors.
     */
    public show(tickDelay?: number) {
        system.runTimeout(async () => {
            const reason = await this.customForm.show();
            if (this.onClose) this.onClose(reason);
        }, tickDelay ?? 1);
        return this;
    }

    /**
     * Closes the form if it is currently being shown to the
     * player. Throws a FormVisibilityError if the form is not
     * currently open.
     *
     * @throws {EngineError | FormVisibilityError | InvalidEntityError} This function can throw errors.
     */
    public close() {
        this.customForm.close();
    }
}