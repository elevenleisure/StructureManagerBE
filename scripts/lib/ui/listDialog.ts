import { Player } from "@minecraft/server";
import { BaseDialog } from "./baseDialog.js";
import { UIRawMessage } from "@minecraft/server-ui";
import { DialogButton, DialogComponentGroup, DialogSpacer, DialogTextField } from "./dialogComponent.js";

export class ListDialog<T> extends BaseDialog {
    public readonly pageMaxItemCount: number;
    public items: T[];
    private itemComponents: DialogComponentGroup[];
    private listDialogItem: ListDialogItem<T>;
    private switchJumpButton: DialogButton;
    private previousPageButton: DialogButton;
    private nextPageButton: DialogButton;
    private jumpComponentGroup: DialogComponentGroup;
    private _maxPage: number;
    private _currentPage: number;
    private inJumpMode: boolean;

    constructor(
        player: Player,
        title: string | UIRawMessage,
        listDialogItem: ListDialogItem<T>,
        items?: T[],
        beforeListComponents?: DialogComponentGroup,
        afterListComponents?: DialogComponentGroup,
        pageMaxItemCount?: number,
        defaultCurrentPage?: number
    ) {
        super(player, title);
        this.items = items ?? [];
        this.pageMaxItemCount = pageMaxItemCount ?? 6;
        this._currentPage = defaultCurrentPage ?? 1;
        this._maxPage = Math.ceil(this.items.length / this.pageMaxItemCount);
        this.inJumpMode = false;

        this.listDialogItem = listDialogItem;
        this.itemComponents = [];
        if (beforeListComponents) beforeListComponents.addToCustomForm(this.customForm);
        new DialogSpacer().addToCustomForm(this.customForm);
        for (let i = 0; i < this.pageMaxItemCount; i++) {
            const cloned = listDialogItem.itemComponentsTemp.clone();
            this.itemComponents.push(cloned);
            cloned.addToCustomForm(this.customForm);
        }

        this.switchJumpButton = new DialogButton({}, () => {
                this.inJumpMode = !this.inJumpMode;
                this.setComponent();
            }
        );
        this.jumpComponentGroup = new DialogComponentGroup(
            new DialogTextField({translate: "dduilib.ui.dialog.list.jumpTo"}, this.currentPage.toString()),
            new DialogButton({translate: "dduilib.ui.dialog.list.jump"}, () => {
                const targetPage = Number((this.jumpComponentGroup.components[0] as DialogTextField).text);
                if (!isFinite(targetPage)) return;
                this.currentPage = targetPage;
            })
        );
        this.previousPageButton = new DialogButton({translate: "dduilib.ui.dialog.list.previousPage"}, () => {
            this.previousPage();
        });
        this.nextPageButton = new DialogButton({translate: "dduilib.ui.dialog.list.nextPage"}, () => {
            this.nextPage();
        });

        this.switchJumpButton.addToCustomForm(this.customForm);
        this.jumpComponentGroup.addToCustomForm(this.customForm);
        this.previousPageButton.addToCustomForm(this.customForm);
        this.nextPageButton.addToCustomForm(this.customForm);
        if (afterListComponents) afterListComponents.addToCustomForm(this.customForm);

        this.refreshPage();
    }

    private setComponent() {
        this.switchJumpButton.label = {translate: "dduilib.ui.dialog.list.pageInfo", with: [this.currentPage.toString(), this.maxPage.toString()]},
        (this.jumpComponentGroup.components[0] as DialogTextField).text = this.currentPage.toString();
        this.jumpComponentGroup.visible = this.inJumpMode;
        this.nextPageButton.visible = this.inJumpMode ? false : !(this.currentPage >= this.maxPage);
        this.previousPageButton.visible = this.inJumpMode ? false : !(this.currentPage <= 1);
    }

    public refreshPage() {
        for (let i = 0; i < this.pageMaxItemCount; i++) {
            const currentItem = this.items[(this.currentPage - 1) * this.pageMaxItemCount + i];
            const currentComponentGroup = this.itemComponents[i];
            if (currentItem === undefined) {
                currentComponentGroup.visible = false;
            } else {
                currentComponentGroup.visible = true;
                this.listDialogItem.bindingComponent(this.player, currentItem, currentComponentGroup);
            }
        }
        this._maxPage = Math.ceil(this.items.length / this.pageMaxItemCount);
        this.setComponent();
    }

    public nextPage() {
        if (this.currentPage >= this.maxPage) return;
        this.currentPage++;
    }

    public previousPage() {
        if (this.currentPage <= 1) return;
        this.currentPage--;
    }

    public set currentPage(page: number) {
        if (page < 1 || page > this.maxPage) return;
        this._currentPage = page;
        this.refreshPage();
    }

    public get currentPage(): number {
        return this._currentPage;
    }

    public get maxPage(): number {
        return this._maxPage;
    }
}

export abstract class ListDialogItem<T> {
    public abstract itemComponentsTemp: DialogComponentGroup;
    public abstract bindingComponent(player: Player, item: T, components: DialogComponentGroup): void;
    public get label(): string {
        return "";
    }
}