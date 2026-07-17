import { DialogDropdown, DialogDropdownItem, DialogInteractiveComponent, DialogTextField } from "../../lib/ui/dialogComponent.js";
import { StructureSaveMode } from "@minecraft/server";
export class NumberTextField extends DialogTextField {
    constructor(label, defaultValue) {
        super(label, defaultValue?.toString());
        this._text.subscribe(text => {
            if (!isFinite(Number(text)))
                this.text = "0";
        });
    }
    set value(value) {
        this.text = value.toString();
    }
    get value() {
        const v = Number(this.text);
        return isFinite(v) ? v : 0;
    }
}
export class Vector3TextField extends DialogInteractiveComponent {
    xTextField;
    yTextField;
    zTextField;
    _changed = false;
    constructor(label) {
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
    get changed() {
        return this._changed;
    }
    get isValid() {
        return isFinite(Number(this.xTextField.text)) && isFinite(Number(this.yTextField.text)) && isFinite(Number(this.zTextField.text));
    }
    get value() {
        if (!this.isValid)
            throw new Error("Illegal input text.");
        return {
            x: Number(this.xTextField.text),
            y: Number(this.yTextField.text),
            z: Number(this.zTextField.text)
        };
    }
    get valueOrUndefined() {
        if (!this.isValid)
            return undefined;
        return {
            x: Number(this.xTextField.text),
            y: Number(this.yTextField.text),
            z: Number(this.zTextField.text)
        };
    }
    set value(value) {
        this.xTextField.text = value.x.toString();
        this.yTextField.text = value.y.toString();
        this.zTextField.text = value.z.toString();
    }
    addToCustomForm(customForm) {
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
            this.description = value === 0 ? "新的结构将会被永久保存到世界中" : "新的结构将会被临时保存至内存中。一旦你退出了世界，它就会永远消失。";
        };
    }
    set structureSaveMode(structureSaveMode) {
        this.currentItemIndex = structureSaveMode === StructureSaveMode.World ? 0 : 1;
    }
    get structureSaveMode() {
        return this.currentItemIndex === 0 ? StructureSaveMode.World : StructureSaveMode.Memory;
    }
}
