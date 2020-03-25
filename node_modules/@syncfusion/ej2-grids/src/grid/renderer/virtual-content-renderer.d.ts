import { IGrid, IRenderer, NotifyArgs, VirtualInfo, IModelGenerator } from '../base/interface';
import { Column } from '../models/column';
import { Row } from '../models/row';
import { ContentRender } from './content-renderer';
import { HeaderRender } from './header-renderer';
import { ServiceLocator } from '../services/service-locator';
import { VirtualRowModelGenerator } from '../services/virtual-row-model-generator';
/**
 * VirtualContentRenderer
 * @hidden
 */
export declare class VirtualContentRenderer extends ContentRender implements IRenderer {
    private count;
    private maxPage;
    private maxBlock;
    private prevHeight;
    private observer;
    private prevInfo;
    private currentInfo;
    /**
     * @hidden
     */
    vgenerator: VirtualRowModelGenerator;
    private header;
    private locator;
    private preventEvent;
    private actions;
    private content;
    private offsets;
    private tmpOffsets;
    private virtualEle;
    private offsetKeys;
    private isFocused;
    private isSelection;
    private selectedRowIndex;
    private isBottom;
    private rndrCount;
    private activeKey;
    private rowIndex;
    private cellIndex;
    private empty;
    private isAdd;
    private isCancel;
    private requestType;
    private editedRowIndex;
    private requestTypes;
    private isNormaledit;
    private virtualData;
    private emptyRowData;
    constructor(parent: IGrid, locator?: ServiceLocator);
    renderTable(): void;
    renderEmpty(tbody: HTMLElement): void;
    private refreshMvTbalTransform;
    private scrollListener;
    private block;
    private getInfoFromView;
    ensureBlocks(info: VirtualInfo): number[];
    /**
     * @hidden
     */
    vfTblTransform(info: VirtualInfo, left: number, top: number, e: NotifyArgs, cOffset: number, translate: number): void;
    appendContent(target: HTMLElement, newChild: DocumentFragment, e: NotifyArgs): void;
    private focusCell;
    private restoreEdit;
    private getVirtualEditedData;
    private restoreAdd;
    protected onDataReady(e?: NotifyArgs): void;
    private setVirtualHeight;
    private getPageFromTop;
    protected getTranslateY(sTop: number, cHeight: number, info?: VirtualInfo, isOnenter?: boolean): number;
    getOffset(block: number): number;
    private onEntered;
    private dataBound;
    eventListener(action: string): void;
    private getVirtualData;
    private editCancel;
    private editSuccess;
    private updateCurrentViewData;
    private getEditedDataIndex;
    private actionBegin;
    private virtualCellFocus;
    private ensureLastRow;
    private ensureFirstRow;
    private editActionBegin;
    private refreshCache;
    private actionComplete;
    private resetIsedit;
    private scrollAfterEdit;
    private createEmptyRowdata;
    private addActionBegin;
    private getRowObjectByIndex;
    getBlockSize(): number;
    getBlockHeight(): number;
    isEndBlock(index: number): boolean;
    getGroupedTotalBlocks(): number;
    getTotalBlocks(): number;
    getColumnOffset(block: number): number;
    getModelGenerator(): IModelGenerator<Column>;
    private resetScrollPosition;
    private onActionBegin;
    getRows(): Row<Column>[];
    getRowByIndex(index: number): Element;
    getMovableVirtualRowByIndex(index: number): Element;
    getRowCollection(index: number, isMovable: boolean, isRowObject?: boolean): Element | Object;
    getVirtualRowIndex(index: number): number;
    private refreshOffsets;
    refreshVirtualElement(): void;
    setVisible(columns?: Column[]): void;
    private selectVirtualRow;
}
/**
 * @hidden
 */
export declare class VirtualHeaderRenderer extends HeaderRender implements IRenderer {
    virtualEle: VirtualElementHandler;
    private gen;
    constructor(parent: IGrid, locator: ServiceLocator);
    renderTable(): void;
    appendContent(table: Element): void;
    refreshUI(): void;
    setVisible(columns?: Column[]): void;
    private setDisplayNone;
}
/**
 * @hidden
 */
export declare class VirtualElementHandler {
    wrapper: HTMLElement;
    placeholder: HTMLElement;
    content: HTMLElement;
    table: HTMLElement;
    renderWrapper(height?: number): void;
    renderPlaceHolder(position?: string): void;
    adjustTable(xValue: number, yValue: number): void;
    setWrapperWidth(width: string, full?: boolean): void;
    setVirtualHeight(height?: number, width?: string): void;
}
