import { UIRawMessage } from "@minecraft/server-ui";
import { DialogButton, DialogComponentGroup, DialogDivider, DialogDropdown, DialogDropdownItem, DialogLabel, DialogSpacer, DialogTextField } from "../../lib/ui/dialogComponent.js";
import { Player, RawMessage, StructureSaveMode, Vector3, world } from "@minecraft/server";
import { RawMessageBuilder } from "../../utils/str.js";
import { ListDialogItem } from "../../lib/ui/listDialog.js";
import { praseStructureId } from "../../utils/structure.js";
import { showStructureAction } from "./browse.js";

export class structureDialogItem extends ListDialogItem<String> {
    public itemComponentsTemp: DialogComponentGroup = new DialogComponentGroup(
        new DialogLabel(""),
        new DialogSpacer(),
        new DialogLabel({}),
        new DialogSpacer(),
        new DialogLabel({}),
        new DialogSpacer(),
        new DialogButton(RawMessageBuilder.translate("ui.browse.structure.view"), undefined, true),
        new DialogDivider()
    );

    public bindingComponent(player: Player, item: string, components: DialogComponentGroup): void {
        const structure = world.structureManager.get(item);
        const { namespace, path } = praseStructureId(item);
        (components.components[0] as DialogLabel).label = ` §b${path}`;
        (components.components[2] as DialogLabel).label = RawMessageBuilder.translate("ui.browse.structure.structureInformation.new.namespace", namespace);

        if (!(structure && structure.isValid)) {
            (components.components[4] as DialogLabel).label = RawMessageBuilder.translate("error.structure.invalid.id");
            (components.components[6] as DialogButton).visible = false;
        } else {
            (components.components[4] as DialogLabel).label = RawMessageBuilder.translate("ui.browse.structure.structureInformation.new.blocks", structure.size.x * structure.size.y * structure.size.z);
            (components.components[6] as DialogButton).visible = true;
            (components.components[6] as DialogButton).onClick = () => showStructureAction(player, structure);
        }
    }
}

export class NumberTextField extends DialogTextField {
    constructor(label: string | UIRawMessage, defaultValue?: number) {
        super(label, defaultValue?.toString());
        this._text.subscribe(text => {
            if (!isFinite(Number(text))) this.text = "0";
        });
    }

    public set value(value: number) {
        this.text = value.toString();
    }

    public get value() {
        const v = Number(this.text);
        return isFinite(v) ? v : 0;
    }
}

export class Vector3TextField extends DialogComponentGroup {
    protected xTextField: DialogTextField;
    protected yTextField: DialogTextField;
    protected zTextField: DialogTextField;
    private _changed: boolean = false;

    constructor(label: UIRawMessage) {
        super();
        function getRawMessage(rawMessage: RawMessage, text: string): RawMessage {
            const raw: RawMessage = {rawtext: []};
            raw.rawtext?.push(rawMessage);
            raw.rawtext?.push(RawMessageBuilder.text(text));
            return raw;
        }
        this.xTextField = new DialogTextField(getRawMessage(label, "x"), "0");
        this.yTextField = new DialogTextField(getRawMessage(label, "y"), "0");
        this.zTextField = new DialogTextField(getRawMessage(label, "z"), "0");
        const change = () => this._changed = true;
        this.xTextField.onChange = change;
        this.yTextField.onChange = change;
        this.zTextField.onChange = change;
        this.push(this.xTextField, this.yTextField, this.zTextField);
    }

    public get changed() {
        return this._changed;
    }

    public get isValid() {
        return isFinite(Number(this.xTextField.text)) && isFinite(Number(this.yTextField.text)) && isFinite(Number(this.zTextField.text))
    }

    public get value(): Vector3 {
        if (!this.isValid) throw new Error("Illegal input text.");
        return {
            x: Number(this.xTextField.text),
            y: Number(this.yTextField.text),
            z: Number(this.zTextField.text)
        };
    }

    public get valueOrUndefined(): Vector3 | undefined {
        if (!this.isValid) return undefined;
        return {
            x: Number(this.xTextField.text),
            y: Number(this.yTextField.text),
            z: Number(this.zTextField.text)
        };
    }

    public set value(value: Vector3) {
        this.xTextField.text = value.x.toString();
        this.yTextField.text = value.y.toString();
        this.zTextField.text = value.z.toString();
    }
}

export class StructureSaveModeDropdown extends DialogDropdown {
    constructor() {
        super(RawMessageBuilder.translate("ui.structure.action.saveMode.label"), [
            new DialogDropdownItem(RawMessageBuilder.translate("ui.structure.action.saveMode.world.label")), new DialogDropdownItem(RawMessageBuilder.translate("ui.structure.action.saveMode.memory.label"))
        ]);
        this.description = RawMessageBuilder.translate("ui.structure.action.saveMode.world.description");
        this.onChange = value => {
            this.description = value === 0 ? RawMessageBuilder.translate("ui.structure.action.saveMode.world.description"): RawMessageBuilder.translate("ui.structure.action.saveMode.memory.description");
        }
    }

    public set structureSaveMode(structureSaveMode: StructureSaveMode) {
        this.currentItemIndex = structureSaveMode === StructureSaveMode.World ? 0 : 1;
    }

    public get structureSaveMode(): StructureSaveMode {
        return this.currentItemIndex === 0 ? StructureSaveMode.World : StructureSaveMode.Memory;
    }
}