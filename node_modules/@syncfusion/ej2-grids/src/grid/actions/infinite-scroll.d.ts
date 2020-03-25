import { IGrid, IAction } from '../base/interface';
/**
 * Infinite Scrolling class
 */
export declare class InfiniteScroll implements IAction {
    private parent;
    private maxPage;
    private infiniteCache;
    private isDownScroll;
    private isUpScroll;
    private isScroll;
    private top;
    private enableContinuousScroll;
    private initialRender;
    private pressedKey;
    private isRemove;
    private isInitialCollapse;
    private prevScrollTop;
    private actions;
    private keys;
    private rowIndex;
    private cellIndex;
    /**
     * Constructor for the Grid infinite scrolling.
     * @hidden
     */
    constructor(parent?: IGrid);
    getModuleName(): string;
    /**
     * @hidden
     */
    addEventListener(): void;
    /**
     * @hidden
     */
    removeEventListener(): void;
    private onDataReady;
    private ensureIntialCollapse;
    private infiniteScrollHandler;
    private makeRequest;
    private infinitePageQuery;
    private intialPageQuery;
    private infiniteCellFocus;
    private appendInfiniteRows;
    private removeInfiniteCacheRows;
    private calculateScrollTop;
    private captionRowHeight;
    private removeTopRows;
    private removeBottomRows;
    private removeCaptionRows;
    private resetInfiniteBlocks;
    private setCache;
    private setInitialCache;
    private setInitialGroupCache;
    private resetContentModuleCache;
    /**
     * @hidden
     */
    destroy(): void;
}
