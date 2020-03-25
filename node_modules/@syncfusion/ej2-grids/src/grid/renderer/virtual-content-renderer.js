var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { remove, createElement, closest, formatUnit, Browser, extend } from '@syncfusion/ej2-base';
import { isNullOrUndefined } from '@syncfusion/ej2-base';
import { DataManager } from '@syncfusion/ej2-data';
import { dataReady, modelChanged, refreshVirtualBlock, contentReady } from '../base/constant';
import * as events from '../base/constant';
import { RenderType } from '../base/enum';
import { ContentRender } from './content-renderer';
import { HeaderRender } from './header-renderer';
import { InterSectionObserver } from '../services/intersection-observer';
import { VirtualRowModelGenerator } from '../services/virtual-row-model-generator';
import { isGroupAdaptive, getTransformValues } from '../base/util';
import { setStyleAttribute } from '@syncfusion/ej2-base';
/**
 * VirtualContentRenderer
 * @hidden
 */
var VirtualContentRenderer = /** @class */ (function (_super) {
    __extends(VirtualContentRenderer, _super);
    function VirtualContentRenderer(parent, locator) {
        var _this = _super.call(this, parent, locator) || this;
        _this.prevHeight = 0;
        _this.currentInfo = {};
        _this.preventEvent = false;
        _this.actions = ['filtering', 'searching', 'grouping', 'ungrouping'];
        _this.offsets = {};
        _this.tmpOffsets = {};
        _this.virtualEle = new VirtualElementHandler();
        _this.offsetKeys = [];
        _this.isFocused = false;
        _this.isSelection = false;
        _this.isBottom = false;
        _this.rndrCount = 0;
        _this.empty = undefined;
        _this.isCancel = false;
        _this.requestTypes = ['beginEdit', 'cancel', 'delete', 'add', 'save'];
        _this.isNormaledit = _this.parent.editSettings.mode === 'Normal';
        _this.virtualData = {};
        _this.emptyRowData = {};
        _this.locator = locator;
        _this.eventListener('on');
        _this.parent.on(events.columnVisibilityChanged, _this.setVisible, _this);
        _this.vgenerator = _this.generator;
        return _this;
    }
    VirtualContentRenderer.prototype.renderTable = function () {
        this.header = this.locator.getService('rendererFactory').getRenderer(RenderType.Header);
        _super.prototype.renderTable.call(this);
        this.virtualEle.table = this.getTable();
        this.virtualEle.content = this.content = this.getPanel().querySelector('.e-content');
        this.virtualEle.renderWrapper(this.parent.height);
        this.virtualEle.renderPlaceHolder();
        if (!this.parent.getFrozenColumns()) {
            this.virtualEle.wrapper.style.position = 'absolute';
        }
        var debounceEvent = (this.parent.dataSource instanceof DataManager && !this.parent.dataSource.dataSource.offline);
        var content = this.parent.getFrozenColumns() ? this.parent.getMovableVirtualContent() : this.content;
        var opt = {
            container: content, pageHeight: this.getBlockHeight() * 2, debounceEvent: debounceEvent,
            axes: this.parent.enableColumnVirtualization ? ['X', 'Y'] : ['Y']
        };
        this.observer = new InterSectionObserver(this.virtualEle.wrapper, opt);
    };
    VirtualContentRenderer.prototype.renderEmpty = function (tbody) {
        this.getTable().appendChild(tbody);
        this.virtualEle.adjustTable(0, 0);
    };
    VirtualContentRenderer.prototype.refreshMvTbalTransform = function () {
        var mCont = this.parent.getMovableVirtualContent();
        var fCont = this.parent.getFrozenVirtualContent();
        var mContTV = getTransformValues(mCont.firstElementChild);
        var fContTV = getTransformValues(fCont.firstElementChild);
        var top = mCont.scrollTop;
        if (top > 0 && mContTV.height !== fContTV.height) {
            mCont.firstElementChild.style.transform = "translate(" + mContTV.width + "px, " + fContTV.height + "px)";
        }
    };
    VirtualContentRenderer.prototype.scrollListener = function (scrollArgs) {
        this.scrollAfterEdit();
        if (this.parent.enablePersistence) {
            this.parent.scrollPosition = scrollArgs.offset;
        }
        if (this.preventEvent || this.parent.isDestroyed) {
            this.preventEvent = false;
            return;
        }
        if (isNullOrUndefined(document.activeElement)) {
            this.isFocused = false;
        }
        else {
            this.isFocused = this.content === closest(document.activeElement, '.e-content') || this.content === document.activeElement;
        }
        if (this.parent.enableColumnVirtualization && this.parent.getFrozenColumns() && scrollArgs.sentinel.axis === 'X') {
            this.refreshMvTbalTransform();
        }
        var info = scrollArgs.sentinel;
        var viewInfo = this.currentInfo = this.getInfoFromView(scrollArgs.direction, info, scrollArgs.offset);
        if (isGroupAdaptive(this.parent)) {
            if ((info.axis === 'Y' && this.prevInfo.blockIndexes.toString() === viewInfo.blockIndexes.toString())
                && scrollArgs.direction === 'up' && viewInfo.blockIndexes[viewInfo.blockIndexes.length - 1] !== 2) {
                return;
            }
            else {
                viewInfo.event = 'refresh-virtual-block';
                if (!isNullOrUndefined(viewInfo.offsets)) {
                    viewInfo.offsets.top = this.content.scrollTop;
                }
                this.parent.notify(viewInfo.event, { requestType: 'virtualscroll', virtualInfo: viewInfo, focusElement: scrollArgs.focusElement });
                return;
            }
        }
        if (this.prevInfo && ((info.axis === 'Y' && this.prevInfo.blockIndexes.toString() === viewInfo.blockIndexes.toString())
            || (info.axis === 'X' && this.prevInfo.columnIndexes.toString() === viewInfo.columnIndexes.toString()))) {
            if (Browser.isIE) {
                this.parent.hideSpinner();
            }
            this.restoreEdit();
            return;
        }
        this.parent.setColumnIndexesInView(this.parent.enableColumnVirtualization ? viewInfo.columnIndexes : []);
        this.parent.pageSettings.currentPage = viewInfo.loadNext && !viewInfo.loadSelf ? viewInfo.nextInfo.page : viewInfo.page;
        if (this.parent.getFrozenColumns() && this.parent.enableColumnVirtualization) {
            var lastPage = Math.ceil(this.getTotalBlocks() / 2);
            if (this.parent.pageSettings.currentPage === lastPage && scrollArgs.sentinel.axis === 'Y') {
                this.rndrCount++;
            }
            if (scrollArgs.sentinel.axis === 'Y') {
                if (this.parent.pageSettings.currentPage === lastPage && this.rndrCount > 1) {
                    this.rndrCount = 0;
                    return;
                }
                else if (this.parent.pageSettings.currentPage !== lastPage && this.parent.pageSettings.currentPage !== lastPage - 1) {
                    this.rndrCount = 0;
                }
            }
        }
        this.parent.notify(viewInfo.event, { requestType: 'virtualscroll', virtualInfo: viewInfo,
            focusElement: scrollArgs.focusElement });
    };
    VirtualContentRenderer.prototype.block = function (blk) {
        return this.vgenerator.isBlockAvailable(blk);
    };
    VirtualContentRenderer.prototype.getInfoFromView = function (direction, info, e) {
        var isBlockAdded = false;
        var tempBlocks = [];
        var infoType = { direction: direction, sentinelInfo: info, offsets: e };
        var vHeight = this.parent.height.toString().indexOf('%') < 0 ? this.content.getBoundingClientRect().height :
            this.parent.element.getBoundingClientRect().height;
        infoType.page = this.getPageFromTop(e.top + vHeight, infoType);
        infoType.blockIndexes = tempBlocks = this.vgenerator.getBlockIndexes(infoType.page);
        infoType.loadSelf = !this.vgenerator.isBlockAvailable(tempBlocks[infoType.block]);
        var blocks = this.ensureBlocks(infoType);
        if (this.activeKey === 'upArrow' && infoType.blockIndexes.toString() !== blocks.toString()) {
            // To avoid dupilcate row index problem in key focus support
            var newBlock = blocks[blocks.length - 1];
            if (infoType.blockIndexes.indexOf(newBlock) === -1) {
                isBlockAdded = true;
            }
        }
        infoType.blockIndexes = blocks;
        infoType.loadNext = !blocks.filter(function (val) { return tempBlocks.indexOf(val) === -1; })
            .every(this.block.bind(this));
        infoType.event = (infoType.loadNext || infoType.loadSelf) ? modelChanged : refreshVirtualBlock;
        infoType.nextInfo = infoType.loadNext ? { page: Math.max(1, infoType.page + (direction === 'down' ? 1 : -1)) } : {};
        if (isBlockAdded) {
            infoType.blockIndexes = [infoType.blockIndexes[0] - 1, infoType.blockIndexes[0], infoType.blockIndexes[0] + 1];
        }
        if (this.activeKey === 'downArrow') {
            var firstBlock = Math.ceil(this.rowIndex / this.getBlockSize());
            if (firstBlock !== 1 && (infoType.blockIndexes[1] !== firstBlock || infoType.blockIndexes.length < 3)) {
                infoType.blockIndexes = [firstBlock - 1, firstBlock, firstBlock + 1];
            }
        }
        infoType.columnIndexes = info.axis === 'X' ? this.vgenerator.getColumnIndexes() : this.parent.getColumnIndexesInView();
        if (this.parent.enableColumnVirtualization && info.axis === 'X') {
            infoType.event = refreshVirtualBlock;
        }
        return infoType;
    };
    VirtualContentRenderer.prototype.ensureBlocks = function (info) {
        var _this = this;
        var index = info.blockIndexes[info.block];
        var mIdx;
        var old = index;
        var max = Math.max;
        var indexes = info.direction === 'down' ? [max(index, 1), ++index, ++index] : [max(index - 1, 1), index, index + 1];
        if (this.parent.enableColumnVirtualization && this.parent.getFrozenColumns()) {
            if (info.sentinelInfo.axis === 'X' || (info.sentinelInfo.axis === 'Y' && (info.page === this.prevInfo.page))) {
                indexes = this.prevInfo.blockIndexes;
            }
        }
        indexes = indexes.filter(function (val, ind) { return indexes.indexOf(val) === ind; });
        if (this.prevInfo.blockIndexes.toString() === indexes.toString()) {
            return indexes;
        }
        if (info.loadSelf || (info.direction === 'down' && this.isEndBlock(old))) {
            indexes = this.vgenerator.getBlockIndexes(info.page);
        }
        indexes.some(function (val, ind) {
            var result = val === (isGroupAdaptive(_this.parent) ? _this.getGroupedTotalBlocks() : _this.getTotalBlocks());
            if (result) {
                mIdx = ind;
            }
            return result;
        });
        if (mIdx !== undefined) {
            indexes = indexes.slice(0, mIdx + 1);
            if (info.block === 0 && indexes.length === 1 && this.vgenerator.isBlockAvailable(indexes[0] - 1)) {
                indexes = [indexes[0] - 1, indexes[0]];
            }
        }
        return indexes;
    };
    /**
     * @hidden
     */
    VirtualContentRenderer.prototype.vfTblTransform = function (info, left, top, e, cOffset, translate) {
        var lastPage = Math.ceil(this.getTotalBlocks() / 2);
        var isLastPage = lastPage === this.parent.pageSettings.currentPage && this.parent.enableColumnVirtualization;
        var wrappers = [].slice.call(this.parent.getContent().querySelectorAll('.e-virtualtable'));
        for (var i = 0; i < wrappers.length; i++) {
            if (i === 0 && e.requestType === 'virtualscroll' && info.sentinelInfo.axis === 'X') {
                continue;
            }
            if (lastPage !== this.parent.pageSettings.currentPage && this.parent.enableColumnVirtualization
                && (left > 0 || (top > 0 && left === 0))) {
                continue;
            }
            var cOff = isLastPage && i === 0 ? 0 : cOffset;
            this.virtualEle.wrapper = wrappers[i];
            this.virtualEle.adjustTable(cOff, translate);
        }
    };
    VirtualContentRenderer.prototype.appendContent = function (target, newChild, e) {
        var _this = this;
        // currentInfo value will be used if there are multiple dom updates happened due to mousewheel
        var info = e.virtualInfo.sentinelInfo && e.virtualInfo.sentinelInfo.axis === 'Y' && this.currentInfo.page &&
            this.currentInfo.page !== e.virtualInfo.page ? this.currentInfo : e.virtualInfo;
        this.prevInfo = this.prevInfo || e.virtualInfo;
        var cBlock = (info.columnIndexes[0]) - 1;
        var cOffset = this.getColumnOffset(cBlock);
        var width;
        var blocks = info.blockIndexes;
        if (this.parent.groupSettings.columns.length) {
            this.refreshOffsets();
        }
        if (this.parent.height === '100%') {
            this.parent.element.style.height = '100%';
        }
        var vHeight = this.parent.height.toString().indexOf('%') < 0 ? this.content.getBoundingClientRect().height :
            this.parent.element.getBoundingClientRect().height;
        var translate = 0;
        if (this.parent.getFrozenColumns()) {
            var mCont = this.parent.getMovableVirtualContent();
            var left = mCont.scrollLeft;
            var top_1 = mCont.scrollTop;
            translate = this.getTranslateY(mCont.scrollTop, vHeight, info);
            this.vfTblTransform(info, left, top_1, e, cOffset, translate);
        }
        else {
            if (!this.requestTypes.some(function (value) { return value === _this.requestType; })) {
                translate = this.getTranslateY(this.content.scrollTop, vHeight, info);
                this.virtualEle.adjustTable(cOffset, translate);
            }
        }
        if (this.parent.enableColumnVirtualization && !this.parent.getFrozenColumns()) {
            this.header.virtualEle.adjustTable(cOffset, 0);
        }
        if (this.parent.enableColumnVirtualization) {
            var cIndex = info.columnIndexes;
            width = this.getColumnOffset(cIndex[cIndex.length - 1]) - this.getColumnOffset(cIndex[0] - 1) + '';
            this.header.virtualEle.setWrapperWidth(width);
        }
        this.virtualEle.setWrapperWidth(width, Browser.isIE || Browser.info.name === 'edge');
        if (!isNullOrUndefined(target.parentNode)) {
            remove(target);
        }
        var tbody;
        if (this.parent.getFrozenColumns() && !e.renderMovableContent) {
            tbody = this.parent.getFrozenVirtualContent().querySelector('tbody');
        }
        else if (this.parent.getFrozenColumns() && e.renderMovableContent) {
            tbody = this.parent.getMovableVirtualContent().querySelector('tbody');
        }
        else {
            tbody = this.parent.element.querySelector('.e-content').querySelector('tbody');
        }
        if (tbody) {
            remove(tbody);
            target = null;
        }
        target = this.parent.createElement('tbody');
        target.appendChild(newChild);
        if (this.parent.frozenRows && e.requestType === 'virtualscroll' && this.parent.pageSettings.currentPage === 1) {
            for (var i = 0; i < this.parent.frozenRows; i++) {
                target.children[0].remove();
            }
        }
        if (this.parent.getFrozenColumns()) {
            if (!e.renderMovableContent) {
                this.parent.getFrozenVirtualContent().querySelector('.e-table').appendChild(target);
            }
            else {
                this.parent.getMovableVirtualContent().querySelector('.e-table').appendChild(target);
            }
        }
        else {
            this.getTable().appendChild(target);
        }
        if (this.parent.groupSettings.columns.length) {
            if (!isGroupAdaptive(this.parent) && info.direction === 'up') {
                var blk = this.offsets[this.getTotalBlocks()] - this.prevHeight;
                this.preventEvent = true;
                var sTop = this.content.scrollTop;
                this.content.scrollTop = sTop + blk;
            }
            this.setVirtualHeight();
            this.observer.setPageHeight(this.getOffset(blocks[blocks.length - 1]) - this.getOffset(blocks[0] - 1));
        }
        this.prevInfo = info;
        if (this.isFocused && this.activeKey !== 'downArrow' && this.activeKey !== 'upArrow') {
            this.content.focus();
        }
        var lastPage = Math.ceil(this.getTotalBlocks() / 2);
        if (this.isBottom) {
            this.isBottom = false;
            this.parent.getContent().firstElementChild.scrollTop = this.offsets[this.offsetKeys.length - 1];
        }
        if ((this.parent.pageSettings.currentPage === lastPage) && blocks.length === 1) {
            this.isBottom = true;
            this.parent.getContent().firstElementChild.scrollTop = this.offsets[this.offsetKeys.length - 2];
        }
        if (this.parent.enableColumnVirtualization && this.parent.getFrozenColumns()
            && e.requestType === 'virtualscroll' && e.virtualInfo.sentinelInfo.axis === 'X') {
            this.refreshMvTbalTransform();
        }
        this.focusCell(e);
        this.restoreEdit();
        this.restoreAdd();
    };
    VirtualContentRenderer.prototype.focusCell = function (e) {
        if (this.activeKey !== 'upArrow' && this.activeKey !== 'downArrow') {
            return;
        }
        var row = this.parent.getRowByIndex(this.rowIndex);
        // tslint:disable-next-line:no-any
        var cell = row.cells[this.cellIndex];
        cell.focus({ preventScroll: true });
        this.parent.selectRow(parseInt(row.getAttribute('aria-rowindex'), 10));
        this.activeKey = this.empty;
    };
    VirtualContentRenderer.prototype.restoreEdit = function () {
        if (this.isNormaledit) {
            if (this.parent.editSettings.allowEditing && this.parent.editModule && !isNullOrUndefined(this.editedRowIndex)) {
                var row = this.getRowByIndex(this.editedRowIndex);
                if (Object.keys(this.virtualData).length && row && !this.content.querySelector('.e-editedrow')) {
                    var top_2 = row.getBoundingClientRect().top;
                    if (top_2 < this.content.offsetHeight && top_2 > this.parent.getRowHeight()) {
                        this.parent.isEdit = false;
                        this.parent.editModule.startEdit(row);
                    }
                }
                if (row && this.content.querySelector('.e-editedrow') && !Object.keys(this.virtualData).length) {
                    var rowData = extend({}, this.getRowObjectByIndex(this.editedRowIndex));
                    this.virtualData = this.getVirtualEditedData(rowData);
                }
            }
            this.restoreAdd();
        }
    };
    VirtualContentRenderer.prototype.getVirtualEditedData = function (rowData) {
        var editForm = this.content.querySelector('.e-gridform');
        return this.parent.editModule.getCurrentEditedData(editForm, rowData);
    };
    VirtualContentRenderer.prototype.restoreAdd = function () {
        if (this.isNormaledit && this.isAdd && !this.content.querySelector('.e-addedrow')) {
            var isTop = this.parent.editSettings.newRowPosition === 'Top' && this.content.scrollTop < this.parent.getRowHeight();
            var isBottom = this.parent.editSettings.newRowPosition === 'Bottom'
                && this.parent.pageSettings.currentPage === this.maxPage;
            if (isTop || isBottom) {
                this.parent.isEdit = false;
                this.parent.addRecord();
            }
        }
    };
    VirtualContentRenderer.prototype.onDataReady = function (e) {
        if (!isNullOrUndefined(e.count)) {
            this.count = e.count;
            this.maxPage = Math.ceil(e.count / this.parent.pageSettings.pageSize);
        }
        this.vgenerator.checkAndResetCache(e.requestType);
        if (['refresh', 'filtering', 'searching', 'grouping', 'ungrouping', 'reorder', undefined]
            .some(function (value) { return e.requestType === value; })) {
            this.refreshOffsets();
        }
        if (this.parent.getFrozenColumns() && this.parent.enableColumnVirtualization) {
            var hdrTbls = [].slice.call(this.parent.getHeaderContent().querySelectorAll('.e-table'));
            this.header.virtualEle.table = hdrTbls[1];
        }
        this.setVirtualHeight();
        this.resetScrollPosition(e.requestType);
    };
    VirtualContentRenderer.prototype.setVirtualHeight = function () {
        var width = this.parent.enableColumnVirtualization ?
            this.getColumnOffset(this.parent.columns.length + this.parent.groupSettings.columns.length - 1) + 'px' : '100%';
        if (this.parent.getFrozenColumns()) {
            var fTblWidth = this.parent.enableColumnVirtualization ? 'auto' : width;
            this.virtualEle.placeholder = this.parent.getFrozenVirtualContent().querySelector('.e-virtualtrack');
            // To overcome the white space issue in last page (instead of position absolute)
            this.virtualEle.setVirtualHeight(this.offsets[this.getTotalBlocks() - 2], fTblWidth);
            this.virtualEle.placeholder = this.parent.getMovableVirtualContent().querySelector('.e-virtualtrack');
            // To overcome the white space issue in last page (instead of position absolute)
            this.virtualEle.setVirtualHeight(this.offsets[this.getTotalBlocks() - 2], width);
        }
        else {
            this.virtualEle.setVirtualHeight(this.offsets[isGroupAdaptive(this.parent) ? this.getGroupedTotalBlocks() : this.getTotalBlocks()], width);
        }
        if (this.parent.enableColumnVirtualization) {
            this.header.virtualEle.setVirtualHeight(1, width);
        }
    };
    VirtualContentRenderer.prototype.getPageFromTop = function (sTop, info) {
        var _this = this;
        var total = (isGroupAdaptive(this.parent)) ? this.getGroupedTotalBlocks() : this.getTotalBlocks();
        var page = 0;
        var extra = this.offsets[total] - this.prevHeight;
        this.offsetKeys.some(function (offset) {
            var iOffset = Number(offset);
            var border = sTop <= _this.offsets[offset] || (iOffset === total && sTop > _this.offsets[offset]);
            if (border) {
                info.block = iOffset % 2 === 0 ? 1 : 0;
                page = Math.max(1, Math.min(_this.vgenerator.getPage(iOffset), _this.maxPage));
            }
            return border;
        });
        return page;
    };
    VirtualContentRenderer.prototype.getTranslateY = function (sTop, cHeight, info, isOnenter) {
        if (info === undefined) {
            info = { page: this.getPageFromTop(sTop + cHeight, {}) };
            info.blockIndexes = this.vgenerator.getBlockIndexes(info.page);
        }
        var block = (info.blockIndexes[0] || 1) - 1;
        var translate = this.getOffset(block);
        var endTranslate = this.getOffset(info.blockIndexes[info.blockIndexes.length - 1]);
        if (isOnenter) {
            info = this.prevInfo;
        }
        var result = translate > sTop ?
            this.getOffset(block - 1) : endTranslate < (sTop + cHeight) ? this.getOffset(block + 1) : translate;
        var blockHeight = this.offsets[info.blockIndexes[info.blockIndexes.length - 1]] -
            this.tmpOffsets[info.blockIndexes[0]];
        if (result + blockHeight > this.offsets[isGroupAdaptive(this.parent) ? this.getGroupedTotalBlocks() : this.getTotalBlocks()]) {
            result -= (result + blockHeight) - this.offsets[this.getTotalBlocks()];
        }
        return result;
    };
    VirtualContentRenderer.prototype.getOffset = function (block) {
        return Math.min(this.offsets[block] | 0, this.offsets[this.maxBlock] | 0);
    };
    VirtualContentRenderer.prototype.onEntered = function () {
        var _this = this;
        return function (element, current, direction, e, isWheel, check) {
            if (Browser.isIE && !isWheel && check && !_this.preventEvent) {
                _this.parent.showSpinner();
            }
            var xAxis = current.axis === 'X';
            var top = _this.prevInfo.offsets ? _this.prevInfo.offsets.top : null;
            var height = _this.content.getBoundingClientRect().height;
            var x = _this.getColumnOffset(xAxis ? _this.vgenerator.getColumnIndexes()[0] - 1 : _this.prevInfo.columnIndexes[0] - 1);
            var y = _this.getTranslateY(e.top, height, xAxis && top === e.top ? _this.prevInfo : undefined, true);
            _this.virtualEle.adjustTable(x, Math.min(y, _this.offsets[_this.maxBlock]));
            if (_this.parent.getFrozenColumns() && !xAxis) {
                var left = _this.parent.getMovableVirtualContent().scrollLeft;
                if (_this.parent.enableColumnVirtualization && left > 0) {
                    var fvTable = _this.parent.getFrozenVirtualContent().querySelector('.e-virtualtable');
                    fvTable.style.transform = "translate(" + 0 + "px, " + Math.min(y, _this.offsets[_this.maxBlock]) + "px)";
                }
                else {
                    var fvTable = _this.parent.getFrozenVirtualContent().querySelector('.e-virtualtable');
                    fvTable.style.transform = "translate(" + x + "px, " + Math.min(y, _this.offsets[_this.maxBlock]) + "px)";
                }
            }
            if (_this.parent.enableColumnVirtualization) {
                _this.header.virtualEle.adjustTable(x, 0);
            }
        };
    };
    VirtualContentRenderer.prototype.dataBound = function () {
        if (this.isSelection && this.activeKey !== 'upArrow' && this.activeKey !== 'downArrow') {
            this.isSelection = false;
            this.parent.selectRow(this.selectedRowIndex);
        }
        else {
            this.activeKey = this.empty;
        }
    };
    VirtualContentRenderer.prototype.eventListener = function (action) {
        var _this = this;
        this.parent[action](dataReady, this.onDataReady, this);
        this.parent.addEventListener(events.dataBound, this.dataBound.bind(this));
        this.parent.addEventListener(events.actionBegin, this.actionBegin.bind(this));
        this.parent.addEventListener(events.actionComplete, this.actionComplete.bind(this));
        this.parent[action](refreshVirtualBlock, this.refreshContentRows, this);
        this.parent[action](events.selectVirtualRow, this.selectVirtualRow, this);
        this.parent[action](events.virtaulCellFocus, this.virtualCellFocus, this);
        this.parent[action](events.virtualScrollEditActionBegin, this.editActionBegin, this);
        this.parent[action](events.virtualScrollAddActionBegin, this.addActionBegin, this);
        this.parent[action](events.virtualScrollEdit, this.restoreEdit, this);
        this.parent[action](events.virtualScrollEditSuccess, this.editSuccess, this);
        this.parent[action](events.refreshVirtualCache, this.refreshCache, this);
        this.parent[action](events.editReset, this.resetIsedit, this);
        this.parent[action](events.getVirtualData, this.getVirtualData, this);
        this.parent[action](events.virtualScrollEditCancel, this.editCancel, this);
        var event = this.actions;
        for (var i = 0; i < event.length; i++) {
            this.parent[action](event[i] + "-begin", this.onActionBegin, this);
        }
        var fn = function () {
            _this.observer.observe(function (scrollArgs) { return _this.scrollListener(scrollArgs); }, _this.onEntered());
            var gObj = _this.parent;
            if (gObj.enablePersistence && gObj.scrollPosition) {
                _this.content.scrollTop = gObj.scrollPosition.top;
                var scrollValues = { direction: 'down', sentinel: _this.observer.sentinelInfo.down,
                    offset: gObj.scrollPosition, focusElement: gObj.element };
                _this.scrollListener(scrollValues);
                if (gObj.enableColumnVirtualization) {
                    _this.content.scrollLeft = gObj.scrollPosition.left;
                }
            }
            _this.parent.off(contentReady, fn);
        };
        this.parent.on(contentReady, fn, this);
    };
    VirtualContentRenderer.prototype.getVirtualData = function (data) {
        data.virtualData = this.virtualData;
        data.isAdd = this.isAdd;
        data.isCancel = this.isCancel;
    };
    VirtualContentRenderer.prototype.editCancel = function (args) {
        var dataIndex = this.getEditedDataIndex(args.data);
        if (!isNullOrUndefined(dataIndex)) {
            args.data = this.parent.getCurrentViewRecords()[dataIndex];
        }
    };
    VirtualContentRenderer.prototype.editSuccess = function (args) {
        if (this.isNormaledit) {
            if (!this.isAdd && args.data) {
                this.updateCurrentViewData(args.data);
            }
            this.isAdd = false;
        }
    };
    VirtualContentRenderer.prototype.updateCurrentViewData = function (data) {
        var dataIndex = this.getEditedDataIndex(data);
        if (!isNullOrUndefined(dataIndex)) {
            this.parent.getCurrentViewRecords()[dataIndex] = data;
        }
    };
    VirtualContentRenderer.prototype.getEditedDataIndex = function (data) {
        var keyField = this.parent.getPrimaryKeyFieldNames()[0];
        var dataIndex;
        this.parent.getCurrentViewRecords().filter(function (e, index) {
            if (e[keyField] === data[keyField]) {
                dataIndex = index;
            }
        });
        return dataIndex;
    };
    VirtualContentRenderer.prototype.actionBegin = function (args) {
        this.requestType = args.requestType;
    };
    VirtualContentRenderer.prototype.virtualCellFocus = function (e) {
        // To decide the action (select or scroll), when using arrow keys for cell focus
        var ele = document.activeElement;
        if (ele.classList.contains('e-rowcell')
            && e && (e.action === 'upArrow' || e.action === 'downArrow')) {
            var rowIndex = parseInt(ele.parentElement.getAttribute('aria-rowindex'), 10);
            if (e && (e.action === 'downArrow' || e.action === 'upArrow')) {
                var scrollEle = this.parent.getContent().firstElementChild;
                e.action === 'downArrow' ? rowIndex += 1 : rowIndex -= 1;
                this.rowIndex = rowIndex;
                this.cellIndex = parseInt(ele.getAttribute('aria-colindex'), 10);
                var row = this.parent.getRowByIndex(rowIndex);
                var page = this.parent.pageSettings.currentPage;
                var visibleRowCount = Math.floor(scrollEle.offsetHeight / this.parent.getRowHeight()) - 1;
                var emptyRow = false;
                if (isNullOrUndefined(row)) {
                    emptyRow = true;
                    if ((e.action === 'downArrow' && page === this.maxPage - 1) || (e.action === 'upArrow' && page === 1)) {
                        emptyRow = false;
                    }
                }
                if (emptyRow || this.ensureLastRow(row) || this.ensureFirstRow(row)) {
                    this.activeKey = e.action;
                    scrollEle.scrollTop = e.action === 'downArrow' ?
                        (rowIndex - visibleRowCount) * this.parent.getRowHeight() : rowIndex * this.parent.getRowHeight();
                }
                else {
                    this.activeKey = this.empty;
                }
                this.parent.selectRow(rowIndex);
            }
        }
    };
    VirtualContentRenderer.prototype.ensureLastRow = function (row) {
        var cntOffset = this.parent.getContent().firstElementChild.offsetHeight;
        return row && row.getBoundingClientRect().top > cntOffset;
    };
    VirtualContentRenderer.prototype.ensureFirstRow = function (row) {
        return row && row.getBoundingClientRect().top < this.parent.getRowHeight() * 2;
    };
    VirtualContentRenderer.prototype.editActionBegin = function (e) {
        this.editedRowIndex = e.index;
        var rowData = extend({}, this.getRowObjectByIndex(e.index));
        e.data = Object.keys(this.virtualData).length ? this.virtualData : rowData;
    };
    VirtualContentRenderer.prototype.refreshCache = function (data) {
        var block = Math.ceil((this.editedRowIndex + 1) / this.getBlockSize());
        var index = this.editedRowIndex - ((block - 1) * this.getBlockSize());
        this.vgenerator.cache[block][index].data = data;
    };
    VirtualContentRenderer.prototype.actionComplete = function (args) {
        if (args.requestType === 'delete' || args.requestType === 'save' || args.requestType === 'cancel') {
            this.refreshOffsets();
            this.refreshVirtualElement();
            if (this.isNormaledit) {
                if (args.requestType === 'cancel') {
                    this.isCancel = true;
                }
                this.isAdd = false;
                this.editedRowIndex = this.empty;
                this.virtualData = {};
                this.parent.editModule.previousVirtualData = {};
            }
        }
    };
    VirtualContentRenderer.prototype.resetIsedit = function () {
        if (this.parent.enableVirtualization && this.isNormaledit) {
            if ((this.parent.editSettings.allowEditing && Object.keys(this.virtualData).length)
                || (this.parent.editSettings.allowAdding && this.isAdd)) {
                this.parent.isEdit = true;
            }
        }
    };
    VirtualContentRenderer.prototype.scrollAfterEdit = function () {
        if (this.parent.editModule && this.parent.editSettings.allowEditing && this.isNormaledit) {
            if (this.content.querySelector('.e-gridform')) {
                var editForm = this.content.querySelector('.e-editedrow');
                var addForm = this.content.querySelector('.e-addedrow');
                if (editForm || addForm) {
                    var rowData = editForm ? extend({}, this.getRowObjectByIndex(this.editedRowIndex))
                        : extend({}, this.emptyRowData);
                    this.virtualData = this.getVirtualEditedData(rowData);
                }
            }
        }
    };
    VirtualContentRenderer.prototype.createEmptyRowdata = function () {
        var _this = this;
        this.parent.getColumns().filter(function (e) {
            _this.emptyRowData[e.field] = _this.empty;
        });
    };
    VirtualContentRenderer.prototype.addActionBegin = function (args) {
        if (this.isNormaledit) {
            if (!Object.keys(this.emptyRowData).length) {
                this.createEmptyRowdata();
            }
            this.isAdd = true;
            var page = this.parent.pageSettings.currentPage;
            if (page > 1 && this.parent.editSettings.newRowPosition === 'Top') {
                this.isAdd = true;
                this.onActionBegin();
                args.startEdit = false;
                this.content.scrollTop = 0;
            }
            if (page < this.maxPage - 1 && this.parent.editSettings.newRowPosition === 'Bottom') {
                this.isAdd = true;
                this.parent.setProperties({ pageSettings: { currentPage: this.maxPage - 1 } }, true);
                args.startEdit = false;
                this.content.scrollTop = this.offsets[this.offsetKeys.length];
            }
        }
    };
    VirtualContentRenderer.prototype.getRowObjectByIndex = function (index) {
        var data = this.getRowCollection(index, false, true);
        return data;
    };
    VirtualContentRenderer.prototype.getBlockSize = function () {
        return this.parent.pageSettings.pageSize >> 1;
    };
    VirtualContentRenderer.prototype.getBlockHeight = function () {
        return this.getBlockSize() * this.parent.getRowHeight();
    };
    VirtualContentRenderer.prototype.isEndBlock = function (index) {
        var totalBlocks = this.getTotalBlocks();
        return index >= totalBlocks || index === totalBlocks - 1;
    };
    VirtualContentRenderer.prototype.getGroupedTotalBlocks = function () {
        var rows = this.parent.vcRows;
        return Math.floor((rows.length / this.getBlockSize()) < 1 ? 1 : rows.length / this.getBlockSize());
    };
    VirtualContentRenderer.prototype.getTotalBlocks = function () {
        return Math.ceil(this.count / this.getBlockSize());
    };
    VirtualContentRenderer.prototype.getColumnOffset = function (block) {
        return this.vgenerator.cOffsets[block] | 0;
    };
    VirtualContentRenderer.prototype.getModelGenerator = function () {
        return new VirtualRowModelGenerator(this.parent);
    };
    VirtualContentRenderer.prototype.resetScrollPosition = function (action) {
        if (this.actions.some(function (value) { return value === action; })) {
            this.preventEvent = this.content.scrollTop !== 0;
            this.content.scrollTop = 0;
        }
        if (action !== 'virtualscroll') {
            this.isAdd = false;
        }
    };
    VirtualContentRenderer.prototype.onActionBegin = function (e) {
        //Update property silently..
        this.parent.setProperties({ pageSettings: { currentPage: 1 } }, true);
    };
    VirtualContentRenderer.prototype.getRows = function () {
        return this.vgenerator.getRows();
    };
    VirtualContentRenderer.prototype.getRowByIndex = function (index) {
        if (isGroupAdaptive(this.parent)) {
            return this.parent.getDataRows()[index];
        }
        return this.getRowCollection(index, false);
    };
    VirtualContentRenderer.prototype.getMovableVirtualRowByIndex = function (index) {
        return this.getRowCollection(index, true);
    };
    VirtualContentRenderer.prototype.getRowCollection = function (index, isMovable, isRowObject) {
        var prev = this.prevInfo.blockIndexes;
        var startIdx = (prev[0] - 1) * this.getBlockSize();
        var rowCollection = isMovable ? this.parent.getMovableDataRows() : this.parent.getDataRows();
        var collection = isRowObject ? this.parent.getCurrentViewRecords() : rowCollection;
        var selectedRow = collection[index - startIdx];
        if (this.parent.frozenRows && this.parent.pageSettings.currentPage > 1) {
            selectedRow = index <= this.parent.frozenRows ? rowCollection[index]
                : rowCollection[(index - startIdx) + this.parent.frozenRows];
        }
        return selectedRow;
    };
    VirtualContentRenderer.prototype.getVirtualRowIndex = function (index) {
        var prev = this.prevInfo.blockIndexes;
        var startIdx = (prev[0] - 1) * this.getBlockSize();
        return startIdx + index;
    };
    VirtualContentRenderer.prototype.refreshOffsets = function () {
        var gObj = this.parent;
        var row = 0;
        var bSize = this.getBlockSize();
        var total = isGroupAdaptive(this.parent) ? this.getGroupedTotalBlocks() : this.getTotalBlocks();
        this.prevHeight = this.offsets[total];
        this.maxBlock = total % 2 === 0 ? total - 2 : total - 1;
        this.offsets = {};
        //Row offset update
        var blocks = Array.apply(null, Array(total)).map(function () { return ++row; });
        for (var i = 0; i < blocks.length; i++) {
            var tmp = (this.vgenerator.cache[blocks[i]] || []).length;
            var rem = !isGroupAdaptive(this.parent) ? this.count % bSize : (gObj.vcRows.length % bSize);
            var size = !isGroupAdaptive(this.parent) && blocks[i] in this.vgenerator.cache ?
                tmp * this.parent.getRowHeight() : rem && blocks[i] === total ? rem * this.parent.getRowHeight() :
                this.getBlockHeight();
            // let size: number = this.parent.groupSettings.columns.length && block in this.vgenerator.cache ?
            // tmp * getRowHeight() : this.getBlockHeight();
            this.offsets[blocks[i]] = (this.offsets[blocks[i] - 1] | 0) + size;
            this.tmpOffsets[blocks[i]] = this.offsets[blocks[i] - 1] | 0;
        }
        this.offsetKeys = Object.keys(this.offsets);
        if (isGroupAdaptive(this.parent)) {
            this.parent.vGroupOffsets = this.offsets;
        }
        //Column offset update
        if (this.parent.enableColumnVirtualization) {
            this.vgenerator.refreshColOffsets();
        }
    };
    VirtualContentRenderer.prototype.refreshVirtualElement = function () {
        this.vgenerator.refreshColOffsets();
        this.setVirtualHeight();
    };
    VirtualContentRenderer.prototype.setVisible = function (columns) {
        var gObj = this.parent;
        var rows = [];
        rows = this.getRows();
        var testRow;
        rows.some(function (r) { if (r.isDataRow) {
            testRow = r;
        } return r.isDataRow; });
        var needFullRefresh = true;
        if (!gObj.groupSettings.columns.length && testRow) {
            needFullRefresh = false;
        }
        var tr = gObj.getDataRows();
        for (var c = 0, clen = columns.length; c < clen; c++) {
            var column = columns[c];
            var idx = gObj.getNormalizedColumnIndex(column.uid);
            var displayVal = column.visible === true ? '' : 'none';
            if (idx !== -1 && testRow && idx < testRow.cells.length) {
                setStyleAttribute(this.getColGroup().childNodes[idx], { 'display': displayVal });
            }
            if (!needFullRefresh) {
                var width = void 0;
                if (column.visible) {
                    width = this.virtualEle.wrapper.offsetWidth + parseInt(column.width.toString(), 10);
                }
                else {
                    width = this.virtualEle.wrapper.offsetWidth - parseInt(column.width.toString(), 10);
                }
                if (width > gObj.width) {
                    this.setDisplayNone(tr, idx, displayVal, rows);
                    this.virtualEle.setWrapperWidth(width + '');
                    this.vgenerator.refreshColOffsets();
                    this.refreshVirtualElement();
                }
                else {
                    this.refreshContentRows({ requestType: 'refresh' });
                }
            }
            if (!this.parent.invokedFromMedia && column.hideAtMedia) {
                this.parent.updateMediaColumns(column);
            }
            this.parent.invokedFromMedia = false;
        }
        if (needFullRefresh) {
            this.refreshContentRows({ requestType: 'refresh' });
        }
        else {
            this.parent.notify(events.partialRefresh, { rows: rows, args: { isFrozen: false, rows: rows } });
        }
    };
    VirtualContentRenderer.prototype.selectVirtualRow = function (args) {
        var _this = this;
        if (this.activeKey !== 'upArrow' && this.activeKey !== 'downArrow'
            && !this.requestTypes.some(function (value) { return value === _this.requestType; })) {
            this.isSelection = true;
            this.selectedRowIndex = args.selectedIndex;
            var page = Math.ceil((args.selectedIndex + 1) / this.parent.pageSettings.pageSize);
            var blockIndexes = this.vgenerator.getBlockIndexes(page);
            var scrollTop = this.offsets[blockIndexes[0] - 1];
            var ele = this.parent.getFrozenColumns() ? this.parent.getMovableVirtualContent()
                : this.parent.getContent().firstElementChild;
            if (!isNullOrUndefined(scrollTop)) {
                ele.scrollTop = scrollTop;
            }
        }
        this.requestType = this.empty;
    };
    return VirtualContentRenderer;
}(ContentRender));
export { VirtualContentRenderer };
/**
 * @hidden
 */
var VirtualHeaderRenderer = /** @class */ (function (_super) {
    __extends(VirtualHeaderRenderer, _super);
    function VirtualHeaderRenderer(parent, locator) {
        var _this = _super.call(this, parent, locator) || this;
        _this.virtualEle = new VirtualElementHandler();
        _this.gen = new VirtualRowModelGenerator(_this.parent);
        _this.parent.on(events.columnVisibilityChanged, _this.setVisible, _this);
        _this.parent.on(refreshVirtualBlock, function (e) { return e.virtualInfo.sentinelInfo.axis === 'X' ? _this.refreshUI() : null; }, _this);
        return _this;
    }
    VirtualHeaderRenderer.prototype.renderTable = function () {
        this.gen.refreshColOffsets();
        this.parent.setColumnIndexesInView(this.gen.getColumnIndexes(this.getPanel().querySelector('.e-headercontent')));
        _super.prototype.renderTable.call(this);
        this.virtualEle.table = this.getTable();
        this.virtualEle.content = this.getPanel().querySelector('.e-headercontent');
        this.virtualEle.content.style.position = 'relative';
        this.virtualEle.renderWrapper();
        this.virtualEle.renderPlaceHolder('absolute');
    };
    VirtualHeaderRenderer.prototype.appendContent = function (table) {
        this.virtualEle.wrapper.appendChild(table);
    };
    VirtualHeaderRenderer.prototype.refreshUI = function () {
        if (this.parent.getFrozenColumns() && this.parent.enableColumnVirtualization) {
            this.parent.contentModule
                .setTable(this.parent.getMovableVirtualContent().querySelector('.e-table'));
        }
        this.gen.refreshColOffsets();
        this.parent.setColumnIndexesInView(this.gen.getColumnIndexes(this.getPanel().querySelector('.e-headercontent')));
        _super.prototype.refreshUI.call(this);
        if (this.parent.getFrozenColumns() && this.parent.enableColumnVirtualization) {
            this.parent.contentModule.setTable(this.parent.getFrozenVirtualContent()
                .querySelector('.e-table'));
        }
    };
    VirtualHeaderRenderer.prototype.setVisible = function (columns) {
        var gObj = this.parent;
        var displayVal;
        var idx;
        for (var c = 0, clen = columns.length; c < clen; c++) {
            var column = columns[c];
            idx = gObj.getNormalizedColumnIndex(column.uid);
            displayVal = column.visible ? '' : 'none';
            setStyleAttribute(this.getColGroup().children[idx], { 'display': displayVal });
            if (gObj.enableColumnVirtualization && !gObj.groupSettings.columns.length) {
                var tablewidth = void 0;
                if (column.visible) {
                    tablewidth = this.virtualEle.wrapper.offsetWidth + parseInt(column.width.toString(), 10);
                }
                else {
                    tablewidth = this.virtualEle.wrapper.offsetWidth - parseInt(column.width.toString(), 10);
                }
                if (tablewidth > gObj.width) {
                    this.setDisplayNone(column, displayVal);
                    this.virtualEle.setWrapperWidth(tablewidth + '');
                    this.gen.refreshColOffsets();
                }
                else {
                    this.refreshUI();
                }
            }
            else {
                this.refreshUI();
            }
        }
    };
    VirtualHeaderRenderer.prototype.setDisplayNone = function (col, displayVal) {
        for (var _i = 0, _a = [].slice.apply(this.getTable().querySelectorAll('th.e-headercell')); _i < _a.length; _i++) {
            var ele = _a[_i];
            if (ele.querySelector('[e-mappinguid]') &&
                ele.querySelector('[e-mappinguid]').getAttribute('e-mappinguid') === col.uid) {
                setStyleAttribute(ele, { 'display': displayVal });
                break;
            }
        }
    };
    return VirtualHeaderRenderer;
}(HeaderRender));
export { VirtualHeaderRenderer };
/**
 * @hidden
 */
var VirtualElementHandler = /** @class */ (function () {
    function VirtualElementHandler() {
    }
    VirtualElementHandler.prototype.renderWrapper = function (height) {
        this.wrapper = createElement('div', { className: 'e-virtualtable', styles: "min-height:" + formatUnit(height) });
        this.wrapper.appendChild(this.table);
        this.content.appendChild(this.wrapper);
    };
    VirtualElementHandler.prototype.renderPlaceHolder = function (position) {
        if (position === void 0) { position = 'relative'; }
        this.placeholder = createElement('div', { className: 'e-virtualtrack', styles: "position:" + position });
        this.content.appendChild(this.placeholder);
    };
    VirtualElementHandler.prototype.adjustTable = function (xValue, yValue) {
        this.wrapper.style.transform = "translate(" + xValue + "px, " + yValue + "px)";
    };
    VirtualElementHandler.prototype.setWrapperWidth = function (width, full) {
        this.wrapper.style.width = width ? width + "px" : full ? '100%' : '';
    };
    VirtualElementHandler.prototype.setVirtualHeight = function (height, width) {
        this.placeholder.style.height = height + "px";
        this.placeholder.style.width = width;
    };
    return VirtualElementHandler;
}());
export { VirtualElementHandler };
