import { ObservableBoolean, ObservableNumber, ObservableString, ObservableUIRawMessage } from "@minecraft/server-ui";
import { toObservableRawMessage } from "./utils/observableUtils.js";
export class DialogComponent {
    attributes = {};
    setAttribute(key, value) {
        this.attributes[key] = value;
    }
    getAttribute(key) {
        return this.attributes[key];
    }
    removeAttribute(key) {
        return delete this.attributes[key];
    }
}
export class DialogBasicComponent extends DialogComponent {
    _visible;
    constructor() {
        super();
        this._visible = new ObservableBoolean(true, { clientWritable: true });
    }
    set visible(visible) {
        this._visible.setData(visible);
    }
    get visible() {
        return this._visible.getData();
    }
}
export class DialogInteractiveComponent extends DialogBasicComponent {
    _label;
    _description;
    _disabled;
    constructor(label) {
        super();
        this._label = toObservableRawMessage(label);
        this._description = undefined;
        this._disabled = new ObservableBoolean(false, { clientWritable: true });
    }
    set disabled(disabled) {
        this._disabled.setData(disabled);
    }
    get disabled() {
        return this._disabled.getData();
    }
    set label(label) {
        if (typeof label === "string") {
            this._label.setData({ text: label });
        }
        else {
            this._label.setData(label);
        }
    }
    get label() {
        return this._label.getData();
    }
    get stringLabel() {
        return this._label.getData().rawtext?.at(0)?.text;
    }
    set description(tooltip) {
        if (!this._description) {
            this._description = new ObservableUIRawMessage({ text: "" }, { clientWritable: true });
        }
        if (typeof tooltip === "string") {
            this._description.setData({ text: tooltip });
        }
        else {
            this._description.setData(tooltip);
        }
    }
    get description() {
        return this._description?.getData();
    }
    get stringTooltip() {
        return this._description?.getData().text;
    }
}
export class DialogComponentGroup extends DialogComponent {
    _components;
    _visible;
    constructor(...components) {
        super();
        this._components = components;
        this._visible = true;
    }
    set visible(visible) {
        this._components.forEach(component => {
            component.visible = visible;
        });
        this._visible = visible;
    }
    get visible() {
        return this._visible;
    }
    get components() {
        return this._components;
    }
    addToCustomForm(customForm) {
        this._components.forEach(component => {
            component.addToCustomForm(customForm);
        });
    }
}
export class DialogButton extends DialogInteractiveComponent {
    onClick;
    closeDialogAfterClick;
    constructor(label, onClick, closeDialogAfterClick) {
        super(label);
        this.onClick = onClick;
        this.closeDialogAfterClick = closeDialogAfterClick ?? false;
    }
    click() {
        if (this.onClick)
            this.onClick();
    }
    addToCustomForm(customForm) {
        customForm.button(this._label, () => {
            if (this.closeDialogAfterClick)
                customForm.close();
            this.click();
        }, {
            tooltip: this._description,
            disabled: this._disabled,
            visible: this._visible
        });
    }
}
export class DialogDivider extends DialogBasicComponent {
    constructor() {
        super();
    }
    addToCustomForm(customForm) {
        customForm.divider({
            visible: this._visible
        });
    }
}
export class DialogDropdown extends DialogInteractiveComponent {
    _currentItemIndex;
    onChange;
    items;
    constructor(label, items, defaultIndex) {
        super(label);
        this.items = items;
        this._currentItemIndex = new ObservableNumber(defaultIndex ?? 0, { clientWritable: true });
        this._currentItemIndex.subscribe(itemIndex => {
            if (this.onChange)
                this.onChange(itemIndex);
        });
    }
    set currentItemIndex(itemIndex) {
        this._currentItemIndex.setData(itemIndex);
    }
    get currentItemIndex() {
        return this._currentItemIndex.getData();
    }
    addToCustomForm(customForm) {
        const items = [];
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
}
export class DialogDropdownItem {
    _label;
    _description;
    constructor(label, description) {
        this._label = toObservableRawMessage(label);
        if (description)
            this._description = toObservableRawMessage(description);
    }
    set label(label) {
        if (typeof label === "string") {
            this._label.setData({ text: label });
        }
        else {
            this._label.setData(label);
        }
    }
    get label() {
        return this._label.getData();
    }
    get stringLabel() {
        return this._label.getData().text;
    }
    set description(description) {
        if (!this._description) {
            this._description = new ObservableUIRawMessage({ text: "" });
        }
        if (typeof description === "string") {
            this._description.setData({ text: description });
        }
        else {
            this._description.setData(description);
        }
    }
    get description() {
        return this._description?.getData();
    }
    get stringdescription() {
        return this._description?.getData().text;
    }
}
export class DialogLabel extends DialogBasicComponent {
    _label;
    constructor(label) {
        super();
        this._label = toObservableRawMessage(label);
    }
    set label(label) {
        if (typeof label === "string") {
            this._label.setData({ text: label });
        }
        else {
            this._label.setData(label);
        }
    }
    get label() {
        return this._label.getData();
    }
    get stringLabel() {
        return this._label.getData().text;
    }
    addToCustomForm(customForm) {
        customForm.label(this._label, {
            visible: this._visible
        });
    }
}
export class DialogHeader extends DialogLabel {
    constructor(text) {
        super(text);
    }
    addToCustomForm(customForm) {
        customForm.header(this._label, {
            visible: this._visible
        });
    }
}
export class DialogSlider extends DialogInteractiveComponent {
    _currentValue;
    _min;
    _max;
    _step;
    onChange;
    constructor(label, min, max, defaultValue, step) {
        super(label);
        this._min = new ObservableNumber(min, { clientWritable: true });
        this._max = new ObservableNumber(max, { clientWritable: true });
        this._currentValue = new ObservableNumber(defaultValue ?? min, { clientWritable: true });
        this._step = new ObservableNumber(step ?? 1, { clientWritable: true });
        this._currentValue.subscribe((value) => {
            if (this.onChange)
                this.onChange(value);
        });
    }
    set currentValue(value) {
        this._currentValue.setData(value);
    }
    get currentValue() {
        return this._currentValue.getData();
    }
    set min(min) {
        this._min.setData(min);
    }
    get min() {
        return this._currentValue.getData();
    }
    set max(max) {
        this._max.setData(max);
    }
    get max() {
        return this._max.getData();
    }
    set step(step) {
        this._step.setData(step);
    }
    get step() {
        return this._step.getData();
    }
    addToCustomForm(customForm) {
        customForm.slider(this._label, this._currentValue, this._min, this._max, {
            step: this._step,
            description: this._description,
            disabled: this._disabled,
            visible: this._visible
        });
    }
}
export class DialogSpacer extends DialogBasicComponent {
    constructor() {
        super();
    }
    addToCustomForm(customForm) {
        customForm.spacer({
            visible: this._visible
        });
    }
}
export class DialogTextField extends DialogInteractiveComponent {
    _text;
    onChange;
    constructor(label, defaultText) {
        super(label);
        this._text = new ObservableString(defaultText ?? "", { clientWritable: true });
        this._text.subscribe((text) => {
            if (this.onChange)
                this.onChange(text);
        });
    }
    set text(text) {
        this._text.setData(text);
    }
    get text() {
        return this._text.getData();
    }
    addToCustomForm(customForm) {
        customForm.textField(this._label, this._text, {
            description: this._description,
            disabled: this._disabled,
            visible: this._visible
        });
    }
}
export class DialogToggle extends DialogInteractiveComponent {
    _toggled;
    onChange;
    constructor(label, defaultValue) {
        super(label);
        this._toggled = new ObservableBoolean(defaultValue ?? false, { clientWritable: true });
        this._toggled.subscribe((toggled) => {
            if (this.onChange)
                this.onChange(toggled);
        });
    }
    set toggled(toggled) {
        this._toggled.setData(toggled);
    }
    get toggled() {
        return this._toggled.getData();
    }
    addToCustomForm(customForm) {
        customForm.toggle(this._label, this._toggled, {
            description: this.description,
            disabled: this._disabled,
            visible: this._visible
        });
    }
}
