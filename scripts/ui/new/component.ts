import { CustomForm, UIRawMessage } from "@minecraft/server-ui";
import { DialogDropdown, DialogDropdownItem, DialogInteractiveComponent, DialogTextField } from "../../lib/ui/dialogComponent.js";
import { StructureSaveMode, Vector3 } from "@minecraft/server";

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

export class Vector3TextField extends DialogInteractiveComponent {
    protected xTextField: DialogTextField;
    protected yTextField: DialogTextField;
    protected zTextField: DialogTextField;
    private _changed: boolean = false;

    constructor(label: string) {
        super(label);
        this.xTextField = new DialogTextField(`${label}x`, "0");
        this.yTextField = new DialogTextField(`${label}y`, "0");
        this.zTextField = new DialogTextField(`${label}z`, "0");
        const change = () => this._changed = true;
        this.xTextField.onChange = change;
        this.yTextField.onChange = change;
        this.zTextField.onChange = change;
        this._label.subscribe(raw => {
            this.xTextField.label = `${raw.text}x`;
            this.yTextField.label = `${raw.text}y`;
            this.zTextField.label = `${raw.text}z`;
        });
        this._disabled.subscribe(v => {
            this.xTextField.disabled = v;
            this.yTextField.disabled = v;
            this.zTextField.disabled = v;
        });
        this._visible.subscribe(v => {
            this.xTextField.visible = v;
            this.yTextField.visible = v;
            this.zTextField.visible = v;
        });
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

    public addToCustomForm(customForm: CustomForm): void {
        this.xTextField.addToCustomForm(customForm);
        this.yTextField.addToCustomForm(customForm);
        this.zTextField.addToCustomForm(customForm);
    }
    
}

export class StructureSaveModeDropdown extends DialogDropdown {
    constructor() {
        super("保存模式", [
            new DialogDropdownItem("保存至世界"), new DialogDropdownItem("保存至内存")
        ]);
        this.description = "新的结构将会被永久保存到世界中";
        this.onChange = value => {
            this.description = value === 0 ? "新的结构将会被永久保存到世界中": "新的结构将会被临时保存至内存中。一旦你退出了世界，它就会永远消失。";
        }
    }

    public set structureSaveMode(structureSaveMode: StructureSaveMode) {
        this.currentItemIndex = structureSaveMode === StructureSaveMode.World ? 0 : 1;
    }

    public get structureSaveMode(): StructureSaveMode {
        return this.currentItemIndex === 0 ? StructureSaveMode.World : StructureSaveMode.Memory;
    }
}