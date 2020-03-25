import { isNullOrUndefined, remove } from '@syncfusion/ej2-base';
import * as events from '../base/constant';
import { getScrollBarWidth } from '../base/util';
/**
 * Infinite Scrolling class
 */
var InfiniteScroll = /** @class */ (function () {
    /**
     * Constructor for the Grid infinite scrolling.
     * @hidden
     */
    function InfiniteScroll(parent) {
        this.infiniteCache = {};
        this.isDownScroll = false;
        this.isUpScroll = false;
        this.isScroll = true;
        this.enableContinuousScroll = false;
        this.initialRender = true;
        this.isRemove = false;
        this.isInitialCollapse = false;
        this.prevScrollTop = 0;
        this.actions = ['filtering', 'searching', 'grouping', 'ungrouping', 'reorder'];
        this.keys = ['downArrow', 'upArrow', 'PageUp', 'PageDown'];
        this.parent = parent;
        this.addEventListener();
    }
    InfiniteScroll.prototype.getModuleName = function () {
        return 'infiniteScroll';
    };
    /**
     * @hidden
     */
    InfiniteScroll.prototype.addEventListener = function () {
        this.parent.on(events.dataReady, this.onDataReady, this);
        this.parent.on(events.infinitePageQuery, this.infinitePageQuery, this);
        this.parent.on(events.infiniteScrollHandler, this.infiniteScrollHandler, this);
        this.parent.on(events.beforeCellFocused, this.infiniteCellFocus, this);
        this.parent.on(events.appendInfiniteContent, this.appendInfiniteRows, this);
        this.parent.on(events.removeInfiniteRows, this.removeInfiniteCacheRows, this);
        this.parent.on(events.resetInfiniteBlocks, this.resetInfiniteBlocks, this);
        this.parent.on(events.setInfiniteCache, this.setCache, this);
        this.parent.on(events.initialCollapse, this.ensureIntialCollapse, this);
        this.parent.on(events.keyPressed, this.infiniteCellFocus, this);
    };
    /**
     * @hidden
     */
    InfiniteScroll.prototype.removeEventListener = function () {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(events.dataReady, this.onDataReady);
        this.parent.off(events.infinitePageQuery, this.infinitePageQuery);
        this.parent.off(events.infiniteScrollHandler, this.infiniteScrollHandler);
        this.parent.off(events.beforeCellFocused, this.infiniteCellFocus);
        this.parent.off(events.appendInfiniteContent, this.appendInfiniteRows);
        this.parent.off(events.removeInfiniteRows, this.removeInfiniteCacheRows);
        this.parent.off(events.resetInfiniteBlocks, this.resetInfiniteBlocks);
        this.parent.off(events.setInfiniteCache, this.setCache);
        this.parent.off(events.initialCollapse, this.ensureIntialCollapse);
        this.parent.off(events.keyPressed, this.infiniteCellFocus);
    };
    InfiniteScroll.prototype.onDataReady = function (e) {
        if (!isNullOrUndefined(e.count)) {
            this.maxPage = Math.ceil(e.count / this.parent.pageSettings.pageSize);
        }
    };
    InfiniteScroll.prototype.ensureIntialCollapse = function (isExpand) {
        this.isInitialCollapse = !isExpand;
    };
    InfiniteScroll.prototype.infiniteScrollHandler = function (e) {
        var _this = this;
        if (e.target.classList.contains('e-content') && this.parent.infiniteScrollSettings.enableScroll) {
            var scrollEle = this.parent.getContent().firstElementChild;
            var direction = this.prevScrollTop < scrollEle.scrollTop ? 'down' : 'up';
            this.prevScrollTop = scrollEle.scrollTop;
            var rows = this.parent.getRows();
            var index = parseInt(rows[rows.length - 1].getAttribute('aria-rowindex'), 10) + 1;
            var prevPage = this.parent.pageSettings.currentPage;
            var args = void 0;
            var floor = Math.floor(e.target.scrollHeight - e.target.scrollTop);
            var round = Math.round(e.target.scrollHeight - e.target.scrollTop);
            var isBottom = (floor === e.target.clientHeight || round === e.target.clientHeight);
            if (this.isScroll && isBottom && (this.parent.pageSettings.currentPage <= this.maxPage - 1 || this.enableContinuousScroll)) {
                if (this.parent.infiniteScrollSettings.enableCache) {
                    this.isUpScroll = false;
                    this.isDownScroll = true;
                    setTimeout(function () {
                        _this.isScroll = true;
                    }, 600);
                }
                var rows_1 = [].slice.call(this.parent.getContent()
                    .querySelectorAll('.e-row'));
                var row = rows_1[rows_1.length - 1];
                var rowIndex = parseInt(row.getAttribute('aria-rowindex'), 10);
                this.parent.pageSettings.currentPage = Math.ceil(rowIndex / this.parent.pageSettings.pageSize) + 1;
                args = {
                    requestType: 'infiniteScroll',
                    currentPage: this.parent.pageSettings.currentPage,
                    prevPage: prevPage,
                    startIndex: index,
                    direction: 'down'
                };
                this.makeRequest(args);
            }
            if (this.isScroll && this.parent.infiniteScrollSettings.enableCache && e.target.scrollTop === 0
                && this.parent.pageSettings.currentPage !== 1) {
                if (this.parent.infiniteScrollSettings.enableCache) {
                    this.isDownScroll = false;
                    this.isUpScroll = true;
                    setTimeout(function () {
                        _this.isScroll = true;
                    }, 600);
                }
                var row = [].slice.call(this.parent.getContent()
                    .querySelectorAll('.e-row'))[this.parent.pageSettings.pageSize - 1];
                var rowIndex = parseInt(row.getAttribute('aria-rowindex'), 10);
                this.parent.pageSettings.currentPage = Math.ceil(rowIndex / this.parent.pageSettings.pageSize) - 1;
                if (this.parent.pageSettings.currentPage) {
                    args = {
                        requestType: 'infiniteScroll',
                        currentPage: this.parent.pageSettings.currentPage,
                        prevPage: prevPage,
                        direction: 'up'
                    };
                    this.makeRequest(args);
                }
            }
            if (this.parent.infiniteScrollSettings.enableCache && !this.isScroll && isNullOrUndefined(args)) {
                if (this.isDownScroll || this.isUpScroll) {
                    this.parent.getContent().firstElementChild.scrollTop = this.top;
                }
            }
        }
    };
    InfiniteScroll.prototype.makeRequest = function (args) {
        var _this = this;
        if (this.parent.pageSettings.currentPage !== args.prevPage) {
            if (isNullOrUndefined(this.infiniteCache[args.currentPage]) && args.direction !== 'up') {
                this.parent.notify('model-changed', args);
            }
            else {
                setTimeout(function () {
                    _this.parent.notify(events.refreshInfiniteModeBlocks, args);
                }, 100);
            }
        }
    };
    InfiniteScroll.prototype.infinitePageQuery = function (query) {
        if (this.initialRender) {
            this.initialRender = false;
            this.intialPageQuery(query);
        }
        else {
            query.page(this.parent.pageSettings.currentPage, this.parent.pageSettings.pageSize);
        }
    };
    InfiniteScroll.prototype.intialPageQuery = function (query) {
        if (this.parent.infiniteScrollSettings.enableCache
            && this.parent.infiniteScrollSettings.initialBlocks > this.parent.infiniteScrollSettings.maxBlock) {
            this.parent.infiniteScrollSettings.initialBlocks = this.parent.infiniteScrollSettings.maxBlock;
        }
        else {
            var pageSize = this.parent.pageSettings.pageSize * this.parent.infiniteScrollSettings.initialBlocks;
            query.page(1, pageSize);
        }
    };
    InfiniteScroll.prototype.infiniteCellFocus = function (e) {
        if (e.byKey && (e.keyArgs.action === 'upArrow' || e.keyArgs.action === 'downArrow')) {
            this.pressedKey = e.keyArgs.action;
        }
        else if (e.key === 'PageDown' || e.key === 'PageUp') {
            this.pressedKey = e.key;
        }
    };
    InfiniteScroll.prototype.appendInfiniteRows = function (e) {
        var _this = this;
        var target = document.activeElement;
        var isInfiniteScroll = this.parent.infiniteScrollSettings.enableScroll && e.args.requestType === 'infiniteScroll';
        if (isInfiniteScroll && e.args.direction === 'up') {
            e.tbody.insertBefore(e.frag, e.tbody.firstElementChild);
        }
        else {
            e.tbody.appendChild(e.frag);
        }
        this.parent.contentModule.getTable().appendChild(e.tbody);
        if (isInfiniteScroll) {
            if (this.parent.infiniteScrollSettings.enableCache && this.isRemove) {
                if (e.args.direction === 'down') {
                    var startIndex = (this.parent.pageSettings.currentPage -
                        this.parent.infiniteScrollSettings.maxBlock) * this.parent.pageSettings.pageSize;
                    this.parent.contentModule.visibleRows =
                        e.rows.slice(startIndex, e.rows.length);
                }
                if (e.args.direction === 'up') {
                    var startIndex = (this.parent.pageSettings.currentPage - 1) * this.parent.pageSettings.pageSize;
                    var endIndex = ((this.parent.pageSettings.currentPage
                        + this.parent.infiniteScrollSettings.maxBlock) - 1) * this.parent.pageSettings.pageSize;
                    this.parent.contentModule.visibleRows =
                        e.rows.slice(startIndex, endIndex);
                }
                this.parent.contentModule.rowElements =
                    [].slice.call(this.parent.getContent().querySelectorAll('.e-row'));
                this.parent.getContent().firstElementChild.scrollTop = this.top;
            }
            if (this.keys.some(function (value) { return value === _this.pressedKey; })) {
                if (this.pressedKey === 'downArrow' || (this.parent.infiniteScrollSettings.enableCache && this.pressedKey === 'upArrow')) {
                    this.parent.focusModule.onClick({ target: target }, true);
                }
                if (this.pressedKey === 'PageDown') {
                    var row = this.parent.getRowByIndex(e.args.startIndex);
                    if (row) {
                        row.cells[0].focus();
                    }
                }
                if (this.pressedKey === 'PageUp') {
                    e.tbody.querySelector('.e-row').cells[0].focus();
                }
            }
            this.pressedKey = undefined;
        }
    };
    InfiniteScroll.prototype.removeInfiniteCacheRows = function (e) {
        var isInfiniteScroll = this.parent.infiniteScrollSettings.enableScroll && e.args.requestType === 'infiniteScroll';
        if (isInfiniteScroll && this.parent.infiniteScrollSettings.enableCache && this.isRemove) {
            var rows = [].slice.call(this.parent.getContentTable().querySelectorAll('.e-row'));
            if (e.args.direction === 'down') {
                if (this.parent.allowGrouping && this.parent.groupSettings.columns.length) {
                    var captionRows = [].slice.call(this.parent.getContentTable().querySelectorAll('tr'));
                    this.removeCaptionRows(captionRows, e.args);
                }
                this.removeTopRows(rows, this.parent.pageSettings.pageSize - 1);
            }
            if (e.args.direction === 'up') {
                if (this.parent.allowGrouping && this.parent.groupSettings.columns.length) {
                    var captionRows = [].slice.call(this.parent.getContentTable().querySelectorAll('tr'));
                    this.removeCaptionRows(captionRows, e.args);
                }
                else {
                    this.removeBottomRows(rows, rows.length - 1, e.args);
                }
            }
            this.isScroll = false;
            this.top = this.calculateScrollTop(e.args);
        }
    };
    InfiniteScroll.prototype.calculateScrollTop = function (args) {
        var top = 0;
        var scrollCnt = this.parent.getContent().firstElementChild;
        if (args.direction === 'down') {
            if (this.parent.allowGrouping && this.parent.groupSettings.columns.length && !this.isInitialCollapse) {
                top = this.captionRowHeight();
            }
            var captionRows = [].slice.call(this.parent.getContent().firstElementChild.querySelectorAll('tr:not(.e-row)'));
            var captionCount = 0;
            if (this.isInitialCollapse && !isNullOrUndefined(captionRows)) {
                captionCount = Math.round((captionRows.length - 1) / this.parent.groupSettings.columns.length);
            }
            var value = captionCount ? captionCount
                : this.parent.pageSettings.pageSize * (this.parent.infiniteScrollSettings.maxBlock - 1);
            var currentViewRowCount = 0;
            var i = 0;
            while (currentViewRowCount < scrollCnt.clientHeight) {
                i++;
                currentViewRowCount = i * this.parent.getRowHeight();
            }
            i = i - 1;
            top += (value - i) * this.parent.getRowHeight();
        }
        if (args.direction === 'up') {
            if (this.parent.allowGrouping && this.parent.groupSettings.columns.length && !this.isInitialCollapse) {
                top = this.infiniteCache[this.parent.pageSettings.currentPage].length * this.parent.getRowHeight();
            }
            else if (this.isInitialCollapse) {
                var groupedData = this.infiniteCache[this.parent.pageSettings.currentPage];
                var count = 0;
                for (var i = 0; i < groupedData.length; i++) {
                    if (groupedData[i].isCaptionRow) {
                        count++;
                    }
                }
                top += Math.round(count / this.parent.groupSettings.columns.length) * this.parent.getRowHeight();
            }
            else {
                top += (this.parent.pageSettings.pageSize * this.parent.getRowHeight() + getScrollBarWidth());
            }
        }
        return top;
    };
    InfiniteScroll.prototype.captionRowHeight = function () {
        var rows = [].slice.call(this.parent.getContent().querySelectorAll('tr:not(.e-row)'));
        return rows.length * this.parent.getRowHeight();
    };
    InfiniteScroll.prototype.removeTopRows = function (rows, maxIndx) {
        for (var i = 0; i <= maxIndx; i++) {
            remove(rows[i]);
        }
    };
    InfiniteScroll.prototype.removeBottomRows = function (rows, maxIndx, args) {
        var cnt = 0;
        if (this.infiniteCache[args.prevPage].length < this.parent.pageSettings.pageSize) {
            cnt = this.parent.pageSettings.pageSize - this.infiniteCache[args.prevPage].length;
        }
        for (var i = maxIndx; cnt < this.parent.pageSettings.pageSize; i--) {
            cnt++;
            remove(rows[i]);
        }
    };
    InfiniteScroll.prototype.removeCaptionRows = function (rows, args) {
        if (args.direction === 'down') {
            var lastRow = this.parent.getRows()[this.parent.pageSettings.pageSize];
            var lastRowIndex = parseInt(lastRow.getAttribute('aria-rowindex'), 10) - 1;
            var k = 0;
            for (var i = 0; k < lastRowIndex; i++) {
                if (!rows[i].classList.contains('e-row')) {
                    remove(rows[i]);
                }
                else {
                    k = parseInt(rows[i].getAttribute('aria-rowindex'), 10);
                }
            }
        }
        if (args.direction === 'up') {
            var rowElements = [].slice.call(this.parent.getContent().querySelectorAll('.e-row'));
            var lastIndex = parseInt(rowElements[rowElements.length - 1].getAttribute('aria-rowindex'), 10);
            var page = Math.ceil(lastIndex / this.parent.pageSettings.pageSize);
            var startIndex = 0;
            for (var i = this.parent.pageSettings.currentPage + 1; i < page; i++) {
                startIndex += this.infiniteCache[i].length;
            }
            for (var i = startIndex; i < rows.length; i++) {
                remove(rows[i]);
            }
        }
    };
    InfiniteScroll.prototype.resetInfiniteBlocks = function (args) {
        var isInfiniteScroll = this.parent.infiniteScrollSettings.enableScroll && args.requestType !== 'infiniteScroll';
        if (!this.initialRender && !isNullOrUndefined(this.parent.infiniteScrollModule) && isInfiniteScroll) {
            if (this.actions.some(function (value) { return value === args.requestType; })) {
                this.initialRender = true;
                this.parent.getContent().firstElementChild.scrollTop = 0;
                this.parent.pageSettings.currentPage = 1;
                this.infiniteCache = {};
                this.resetContentModuleCache({});
                this.isRemove = false;
                this.top = 0;
                this.isInitialCollapse = false;
                this.parent.contentModule.isRemove = this.isRemove;
            }
        }
    };
    InfiniteScroll.prototype.setCache = function (e) {
        if (this.parent.infiniteScrollSettings.enableScroll && this.parent.infiniteScrollSettings.enableCache) {
            if (!Object.keys(this.infiniteCache).length) {
                this.setInitialCache(e.modelData);
            }
            if (isNullOrUndefined(this.infiniteCache[this.parent.pageSettings.currentPage])) {
                this.infiniteCache[this.parent.pageSettings.currentPage] = e.modelData;
                this.resetContentModuleCache(this.infiniteCache);
            }
            if (e.isInfiniteScroll && !this.isRemove) {
                this.isRemove = (this.parent.pageSettings.currentPage - 1) % this.parent.infiniteScrollSettings.maxBlock === 0;
                this.parent.contentModule.isRemove = this.isRemove;
            }
        }
    };
    InfiniteScroll.prototype.setInitialCache = function (data) {
        for (var i = 1; i <= this.parent.infiniteScrollSettings.initialBlocks; i++) {
            var startIndex = (i - 1) * this.parent.pageSettings.pageSize;
            var endIndex = i * this.parent.pageSettings.pageSize;
            if (this.parent.allowGrouping && this.parent.groupSettings.columns.length) {
                this.setInitialGroupCache(data, i, startIndex, endIndex);
            }
            else {
                this.infiniteCache[i] = data.slice(startIndex, endIndex);
                this.resetContentModuleCache(this.infiniteCache);
            }
        }
    };
    InfiniteScroll.prototype.setInitialGroupCache = function (data, index, sIndex, eIndex) {
        var pageData = [];
        var startIndex = 0;
        for (var i = 1; i <= Object.keys(this.infiniteCache).length; i++) {
            startIndex += this.infiniteCache[i].length;
        }
        var k = sIndex;
        for (var i = startIndex; i < data.length && k < eIndex; i++) {
            if (data[i].index < eIndex || data[i].isCaptionRow) {
                k = data[i].isCaptionRow ? k : data[i].index;
                pageData.push(data[i]);
            }
            if (data[i].index >= eIndex || data[i].index === eIndex - 1) {
                break;
            }
        }
        this.infiniteCache[index] = pageData;
        this.resetContentModuleCache(this.infiniteCache);
    };
    InfiniteScroll.prototype.resetContentModuleCache = function (data) {
        this.parent.contentModule.infiniteCache = data;
    };
    /**
     * @hidden
     */
    InfiniteScroll.prototype.destroy = function () {
        this.removeEventListener();
    };
    return InfiniteScroll;
}());
export { InfiniteScroll };
