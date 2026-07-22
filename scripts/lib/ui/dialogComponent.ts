import { CustomForm, DropdownItemData, ObservableBoolean, ObservableNumber, ObservableString, ObservableUIRawMessage, UIRawMessage } from "@minecraft/server-ui";
import { toObservableRawMessage } from "./utils/observableUtils.js";
import { RawMessage } from "@minecraft/server";

export abstract class DialogComponent {
    public abstract addToCustomForm(customForm: CustomForm): void;
    public abstract set visible(visible: boolean);
    public abstract get visible(): boolean;
    public abstract clone(): DialogComponent;
}

export abstract class DialogBasicComponent extends DialogComponent {
    protected _visible: ObservableBoolean;

    constructor() {
        super();
        this._visible = new ObservableBoolean(true, { clientWritable: true });
    }

    public set visible(visible: boolean) {
        this._visible.setData(visible);
    }

    public get visible(): boolean {
        return this._visible.getData();
    }
}

export abstract class DialogInteractiveComponent extends DialogBasicComponent {
    protected _label: ObservableUIRawMessage;
    protected _description: ObservableUIRawMessage | undefined;
    protected _disabled: ObservableBoolean;

    constructor(label: string | UIRawMessage) {
        super();
        this._label = toObservableRawMessage(label);
        this._description = undefined;
        this._disabled = new ObservableBoolean(false, { clientWritable: true });
    }

    public set disabled(disabled: boolean) {
        this._disabled.setData(disabled);
    }

    public get disabled(): boolean {
        return this._disabled.getData();
    }

    public set label(label: string | UIRawMessage) {
        if (typeof label === "string") {
            this._label.setData({ text: label });
        } else {
            this._label.setData(label);
        }
    }

    public get label(): UIRawMessage {
        return this._label.getData();
    }

    public get stringLabel(): string | undefined {
        return this._label.getData().rawtext?.at(0)?.text;
    }

    public set description(tooltip: string | UIRawMessage) {
        if (!this._description) {
            this._description = new ObservableUIRawMessage({ text: "" }, { clientWritable: true });
        }
        if (typeof tooltip === "string") {
            this._description.setData({ text: tooltip });
        } else {
            this._description.setData(tooltip);
        }
    }

    public get description(): UIRawMessage | undefined {
        return this._description?.getData();
    }

    public get stringTooltip(): string | undefined {
        return this._description?.getData().text;
    }
}

export class DialogComponentGroup extends DialogComponent {
    protected _components: DialogComponent[];
    protected _visible: boolean;

    constructor(...components: DialogComponent[]) {
        super();
        this._components = components;
        this._visible = true;
    }

    public set visible(visible: boolean) {
        this._components.forEach(component => {
            component.visible = visible;
        });
        this._visible = visible;
    }

    public get visible(): boolean {
        return this._visible
    }

    public get components(): DialogComponent[] {
        return this._components;
    }

    public push(...components: DialogComponent[]) {
        this._components.push(...components);
    }
    
    public addToCustomForm(customForm: CustomForm): void {
        this._components.forEach(component => {
            component.addToCustomForm(customForm);
        });
    }

    public clone(): DialogComponentGroup {
        return new DialogComponentGroup(...this.components.map(component => component.clone()));
    }
}

export class DialogButton extends DialogInteractiveComponent {
    protected _tooltip: ObservableUIRawMessage | undefined;
    public onClick: (() => void) | undefined;
    public closeDialogAfterClick: boolean;

    constructor(label: string | UIRawMessage, onClick?: (() => void) | undefined, closeDialogAfterClick?: boolean) {
        super(label);
        this._tooltip = undefined;
        this.onClick = onClick;
        this.closeDialogAfterClick = closeDialogAfterClick ?? false;
    }

    public click() {
        if (this.onClick) this.onClick();
    }

    public override addToCustomForm(customForm: CustomForm): void {
        customForm.button(this._label, () => {
            if (this.closeDialogAfterClick) customForm.close();
            this.click();
        }, {
            tooltip: this._tooltip,
            disabled: this._disabled,
            visible: this._visible
        });
    }

    public set tooltip(tooltip: RawMessage) {
        if (!this._tooltip) this._tooltip = new ObservableUIRawMessage(tooltip);
        else this._tooltip.setData(tooltip);
    }

    public clone(): DialogButton {
        const cloned = new DialogButton(this._label.getData(), this.onClick, this.closeDialogAfterClick);
        if (this._description) cloned.description = this._description.getData();
        cloned.disabled = this._disabled.getData();
        cloned.visible = this._visible.getData();
        return cloned;
    }
}

export class DialogDivider extends DialogBasicComponent {
    constructor() {
        super();
    }

    public override addToCustomForm(customForm: CustomForm): void {
        customForm.divider({
            visible: this._visible
        });
    }

    public clone(): DialogDivider {
        const cloned = new DialogDivider();
        cloned.visible = this._visible.getData();
        return cloned;
    }
}

export class DialogDropdown extends DialogInteractiveComponent {
    protected _currentItemIndex: ObservableNumber;
    public onChange: ((itemIndex: number) => void) | undefined;
    readonly items: DialogDropdownItem[];

    constructor(label: string | UIRawMessage, items: DialogDropdownItem[], defaultIndex?: number) {
        super(label);
        this.items = items;
        this._currentItemIndex = new ObservableNumber(defaultIndex ?? 0, { clientWritable: true });

        this._currentItemIndex.subscribe(itemIndex => {
            if (this.onChange) this.onChange(itemIndex);
        });

    }

    public set currentItemIndex(itemIndex: number) {
        this._currentItemIndex.setData(itemIndex);
    }

    public get currentItemIndex(): number {
        return this._currentItemIndex.getData();
    }

    public override addToCustomForm(customForm: CustomForm): void {
        const items: DropdownItemData[] = [];
        this.items.forEach((element, index) => {
            items.push({
                value: index,
                label: element.label,
                description: element.description
            });
        });
        customForm.dropdown(this._label, this._currentItemIndex, items, {
            description: this._description,
            disabled: this._disabled,
            visible: this._visible
        });
    }

    public clone(): DialogDropdown {
        const cloned = new DialogDropdown(this._label.getData(), this.items.map(item => item.clone()), this._currentItemIndex.getData());
        cloned.onChange = this.onChange;
        if (this._description) cloned.description = this._description.getData();
        cloned.disabled = this._disabled.getData();
        cloned.visible = this._visible.getData();
        return cloned;
    }
}

export class DialogDropdownItem {
    protected _label: ObservableUIRawMessage;
    protected _description: ObservableUIRawMessage | undefined;

    constructor(label: string | UIRawMessage, description?: string | UIRawMessage) {
        this._label = toObservableRawMessage(label);
        if (description) this._description = toObservableRawMessage(description);
    }

    public set label(label: string | UIRawMessage) {
        if (typeof label === "string") {
            this._label.setData({ text: label });
        } else {
            this._label.setData(label);
        }
    }

    public get label(): UIRawMessage {
        return this._label.getData();
    }

    public get stringLabel(): string | undefined {
        return this._label.getData().text;
    }

    public set description(description: string | UIRawMessage) {
        if (!this._description) {
            this._description = new ObservableUIRawMessage({ text: "" });
        }
        if (typeof description === "string") {
            this._description.setData({ text: description });
        } else {
            this._description.setData(description);
        }
    }

    public get description(): UIRawMessage | undefined {
        return this._description?.getData();
    }

    public get stringdescription(): string | undefined {
        return this._description?.getData().text;
    }

    public clone(): DialogDropdownItem {
        const cloned = new DialogDropdownItem(this._label.getData(), this._description?.getData());
        return cloned;
    }
}

export class DialogLabel extends DialogBasicComponent {
    protected _label: ObservableUIRawMessage;

    constructor(label: string | UIRawMessage) {
        super();
        this._label = toObservableRawMessage(label);
    }

    public set label(label: string | UIRawMessage) {
        if (typeof label === "string") {
            this._label.setData({ text: label });
        } else {
            this._label.setData(label);
        }
    }

    public get label(): UIRawMessage {
        return this._label.getData();
    }

    public get stringLabel(): string | undefined {
        return this._label.getData().text;
    }

    public override addToCustomForm(customForm: CustomForm): void {
        customForm.label(this._label, {
            visible: this._visible
        });
    }

    public clone(): DialogLabel {
        const cloned = new DialogLabel(this._label.getData());
        cloned.visible = this._visible.getData();
        return cloned;
    }
}

export class DialogHeader extends DialogLabel {
    constructor(text: string | UIRawMessage) {
        super(text);
    }

    public override addToCustomForm(customForm: CustomForm): void {
        customForm.header(this._label, {
            visible: this._visible
        });
    }

    public clone(): DialogHeader {
        return super.clone();
    }
}

export class DialogSlider extends DialogInteractiveComponent {
    protected _currentValue: ObservableNumber;
    protected _min: ObservableNumber;
    protected _max: ObservableNumber;
    protected _step: ObservableNumber;
    public onChange: ((value: number) => void) | undefined;

    constructor(label: string | UIRawMessage, min: number, max: number, defaultValue?: number, step?: number) {
        super(label);
        this._min = new ObservableNumber(min, { clientWritable: true });
        this._max = new ObservableNumber(max, { clientWritable: true });
        this._currentValue = new ObservableNumber(defaultValue ?? min, { clientWritable: true });
        this._step = new ObservableNumber(step ?? 1, { clientWritable: true });

        this._currentValue.subscribe((value: number) => {
            if (this.onChange) this.onChange(value);
        });

    }

    public set currentValue(value: number) {
        this._currentValue.setData(value);
    }

    public get currentValue(): number {
        return this._currentValue.getData();
    }

    public set min(min: number) {
        this._min.setData(min);
    }

    public get min(): number {
        return this._currentValue.getData();
    }

    public set max(max: number) {
        this._max.setData(max);
    }

    public get max(): number {
        return this._max.getData();
    }

    public set step(step: number) {
        this._step.setData(step);
    }

    public get step(): number {
        return this._step.getData();
    }

    public override addToCustomForm(customForm: CustomForm): void {
        customForm.slider(this._label, this._currentValue, this._min, this._max, {
            step: this._step,
            description: this._description,
            disabled: this._disabled,
            visible: this._visible
        });
    }

    public clone(): DialogSlider {
        const cloned = new DialogSlider(this._label.getData(), this._min.getData(), this._max.getData(), this._currentValue.getData(), this._step.getData());
        cloned.onChange = this.onChange;
        if (this._description) cloned.description = this._description.getData();
        cloned.disabled = this._disabled.getData();
        cloned.visible = this._visible.getData();
        return cloned;
    }
}

export class DialogSpacer extends DialogBasicComponent {
    constructor() {
        super();
    }

    public override addToCustomForm(customForm: CustomForm): void {
        customForm.spacer({
            visible: this._visible
        });
    }

    public clone(): DialogSpacer {
        const cloned = new DialogSpacer();
        cloned.visible = this._visible.getData();
        return cloned;
    }
}

export class DialogTextField extends DialogInteractiveComponent {
    protected _text: ObservableString;
    public onChange: ((text: string) => void) | undefined;

    constructor(label: string | UIRawMessage, defaultText?: string) {
        super(label);
        this._text = new ObservableString(defaultText ?? "", { clientWritable: true });

        this._text.subscribe((text: string) => {
            if (this.onChange) this.onChange(text);
        });

    }

    public set text(text: string) {
        this._text.setData(text);
    }

    public get text(): string {
        return this._text.getData();
    }

    public override addToCustomForm(customForm: CustomForm): void {
        customForm.textField(this._label, this._text, {
            description: this._description,
            disabled: this._disabled,
            visible: this._visible
        });
    }

    public clone(): DialogTextField {
        const cloned = new DialogTextField(this._label.getData(), this._text.getData());
        cloned.onChange = this.onChange;
        if (this._description) cloned.description = this._description.getData();
        cloned.disabled = this._disabled.getData();
        cloned.visible = this._visible.getData();
        return cloned;
    }
}

export class DialogToggle extends DialogInteractiveComponent {
    protected _toggled: ObservableBoolean;
    public onChange: ((toggled: boolean) => void) | undefined;

    constructor(label: string | UIRawMessage, defaultValue?: boolean) {
        super(label);
        this._toggled = new ObservableBoolean(defaultValue ?? false, { clientWritable: true });

        this._toggled.subscribe((toggled: boolean) => {
            if (this.onChange) this.onChange(toggled);
        });

    }

    public set toggled(toggled: boolean) {
        this._toggled.setData(toggled);
    }

    public get toggled(): boolean {
        return this._toggled.getData();
    }

    public override addToCustomForm(customForm: CustomForm): void {
        customForm.toggle(this._label, this._toggled, {
            description: this.description,
            disabled: this._disabled,
            visible: this._visible
        });
    }

    public clone(): DialogToggle {
        const cloned = new DialogToggle(this._label.getData(), this._toggled.getData());
        cloned.onChange = this.onChange;
        if (this._description) cloned.description = this._description.getData();
        cloned.disabled = this._disabled.getData();
        cloned.visible = this._visible.getData();
        return cloned;
    }
}