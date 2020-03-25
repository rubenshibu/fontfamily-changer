import { Observer, isBlazor, isNullOrUndefined } from '@syncfusion/ej2-base';
import * as events from '../base/constant';
import { Row } from '../models/row';
import { AriaService } from '../services/aria-service';
import { Cell } from '../models/cell';
import { CellType } from '../base/enum';
import { DataUtil } from '@syncfusion/ej2-data';
export var gridObserver = new Observer();
/**
 * BlazorAction is used for performing Blazor related Grid Actions.
 * @hidden
 */
var BlazorAction = /** @class */ (function () {
    function BlazorAction(parent) {
        this.aria = new AriaService();
        this.actionArgs = {};
        this.parent = parent;
        this.addEventListener();
    }
    BlazorAction.prototype.addEventListener = function () {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on('detailclick', this.onDetailRowClick, this);
        this.parent.on('add-delete-success', this.addDeleteSuccess, this);
        this.parent.on('editsuccess', this.editSuccess, this);
        this.parent.on('setvisibility', this.setColumnVisibility, this);
        this.parent.on('offset', this.setServerOffSet, this);
        this.parent.on('updateaction', this.modelChanged, this);
        this.parent.on(events.modelChanged, this.modelChanged, this);
        this.parent.on('group-expand-collapse', this.onGroupClick, this);
    };
    BlazorAction.prototype.removeEventListener = function () {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off('detailclick', this.onDetailRowClick);
        this.parent.off('add-delete-success', this.addDeleteSuccess);
        this.parent.off('editsuccess', this.editSuccess);
        this.parent.off('setvisibility', this.setColumnVisibility);
        this.parent.off('offset', this.setServerOffSet);
        this.parent.off('updateaction', this.modelChanged);
        this.parent.off(events.modelChanged, this.modelChanged);
        this.parent.off('group-expand-collapse', this.onGroupClick);
    };
    BlazorAction.prototype.getModuleName = function () { return 'blazor'; };
    ;
    BlazorAction.prototype.modelChanged = function (args) {
        this.actionArgs = args;
        this.parent.currentAction = args;
    };
    BlazorAction.prototype.addDeleteSuccess = function (args) {
        var _this = this;
        var editArgs;
        var action = 'name';
        var data = 'data';
        editArgs = {
            requestType: args.requestType,
            data: args[data],
            action: args[action]
        };
        args.promise.then(function (e) { return _this.editSuccess(editArgs); }).catch(function (e) {
            if (isBlazor() && _this.parent.isServerRendered) {
                var error = 'error';
                var message = 'message';
                if (!isNullOrUndefined(e[error]) && !isNullOrUndefined(e[error][message])) {
                    e[error] = e[error][message];
                }
            }
            _this.parent.trigger(events.actionFailure, ((isBlazor() && e instanceof Array) ? e[0] : e));
            _this.parent.hideSpinner();
            _this.parent.log('actionfailure', { error: e });
        });
    };
    BlazorAction.prototype.editSuccess = function (args) {
        this.actionArgs = args;
        this.parent.currentAction = args;
        this.parent.allowServerDataBinding = true;
        this.parent.serverDataBind();
        this.parent.allowServerDataBinding = false;
    };
    BlazorAction.prototype.onDetailRowClick = function (target) {
        var gObj = this.parent;
        var adaptor = 'interopAdaptor';
        var rIndex = 'rowIndex';
        var invokeMethodAsync = 'invokeMethodAsync';
        var tr = target.parentElement;
        var uid = tr.getAttribute('data-uid');
        var rowObj = gObj.getRowObjectFromUID(uid);
        var args = {
            uid: uid, classList: target.classList[0], index: tr.getAttribute('aria-rowindex'),
            rowIndex: gObj.getRowsObject().indexOf(rowObj), colSpan: this.parent.getVisibleColumns().length
        };
        gObj[adaptor][invokeMethodAsync]('OnDetailClick', args);
        if (target.classList.contains('e-detailrowcollapse')) {
            var rows = gObj.getRowsObject();
            var rowData = rowObj.data;
            var gridRowId = this.parent.getRowUid('grid-row');
            var len = gObj.groupSettings.columns.length;
            var gridRow = new Row({
                isDataRow: true,
                isExpand: true,
                uid: gridRowId,
                isDetailRow: true,
                cells: [new Cell({ cellType: CellType.Indent }), new Cell({ isDataCell: true, visible: true })]
            });
            for (var i = 0; i < len; i++) {
                gridRow.cells.unshift(new Cell({ cellType: CellType.Indent }));
            }
            rows.splice(args[rIndex] + 1, 0, gridRow);
            gObj.trigger(events.detailDataBound, { data: rowData });
            gObj.notify(events.detailDataBound, { rows: gObj.getRowsObject() });
            rowObj.isExpand = true;
            this.aria.setExpand(target, true);
        }
        else {
            gObj.getRowsObject().splice(args[rIndex] + 1, 1);
            gObj.notify(events.detailDataBound, { rows: gObj.getRowsObject() });
            rowObj.isExpand = false;
            this.aria.setExpand(target, false);
        }
    };
    BlazorAction.prototype.setColumnVisibility = function (columns) {
        var visible = {};
        var adaptor = 'interopAdaptor';
        var invokeMethodAsync = 'invokeMethodAsync';
        for (var i = 0; i < columns.length; i++) {
            visible[columns[i].uid] = columns[i].visible;
        }
        this.parent[adaptor][invokeMethodAsync]('setColumnVisibility', { visible: visible });
    };
    BlazorAction.prototype.dataSuccess = function (args) {
        if (args.foreignColumnsData) {
            var columns = this.parent.getColumns();
            for (var i = 0; i < columns.length; i++) {
                if (args.foreignColumnsData[columns[i].field]) {
                    columns[i].columnData = args.foreignColumnsData[columns[i].field];
                }
            }
        }
        if (this.parent.allowGrouping && this.parent.groupSettings.columns) {
            var agg = [];
            var aggRows = this.parent.aggregates;
            for (var i = 0; i < aggRows.length; i++) {
                var aggRow = aggRows[i];
                for (var j = 0; j < aggRow.columns.length; j++) {
                    var aggr = {};
                    var type = aggRow.columns[j].type.toString();
                    aggr = { type: type.toLowerCase(), field: aggRow.columns[j].field };
                    agg.push(aggr);
                }
            }
            var data = void 0;
            var aggrds = void 0;
            var groupedCols = this.parent.groupSettings.columns;
            for (var k = 0; k < groupedCols.length; k++) {
                aggrds = data ? data : args.result;
                data = DataUtil.group(aggrds, groupedCols[k], agg, null, null);
            }
            args.result = data ? data : args.result;
        }
        var rowUid = 'rowUid';
        var offsetTime = 'offsetTime';
        var off = 'offset';
        this.parent[rowUid] = args[rowUid];
        args[off] = Math.sign(args[off]) === 1 ? -Math.abs(args[off]) : Math.abs(args[off]);
        this.parent[offsetTime] = args[off];
        if (this.parent[offsetTime] !== new Date().getTimezoneOffset() / 60) {
            if (this.parent.editSettings.mode !== 'Batch') {
                var action = 'action';
                var rowIndex = 'rowIndex';
                var index = 'index';
                if (this.actionArgs[action] === 'edit') {
                    this.setClientOffSet(args, this.actionArgs[rowIndex]);
                }
                else if (this.actionArgs[action] === 'add') {
                    this.setClientOffSet(args, this.actionArgs[index]);
                }
            }
            else if (this.parent.editSettings.mode === 'Batch') {
                var changes = 'changes';
                var changedRecords = 'changedRecords';
                var addedRecords = 'addedRecords';
                var keyField = this.parent.getPrimaryKeyFieldNames()[0];
                var batchChanges = this.actionArgs[changes] || { changedRecords: [], addedRecords: [] };
                for (var i = 0; i < batchChanges[changedRecords].length; i++) {
                    for (var j = 0; j < args.result.length; j++) {
                        if (batchChanges[changedRecords][i][keyField] === args.result[j][keyField]) {
                            this.setClientOffSet(args, j);
                        }
                    }
                }
                for (var i = 0; i < batchChanges[addedRecords].length; i++) {
                    for (var j = 0; j < args.result.length; j++) {
                        if (batchChanges[addedRecords][i][keyField] === args.result[j][keyField]) {
                            this.setClientOffSet(args, j);
                        }
                    }
                }
            }
        }
        this.parent.renderModule.dataManagerSuccess(args, this.actionArgs);
        this.parent.getMediaColumns();
        this.actionArgs = this.parent.currentAction = {};
    };
    BlazorAction.prototype.setClientOffSet = function (args, index) {
        var timeZone = DataUtil.serverTimezoneOffset;
        DataUtil.serverTimezoneOffset = 0;
        args.result[index] = DataUtil.parse.parseJson(JSON.stringify(args.result[index]));
        DataUtil.serverTimezoneOffset = timeZone;
    };
    BlazorAction.prototype.setServerOffSet = function (args) {
        var serverTimeZone = DataUtil.serverTimezoneOffset;
        var offsetTime = 'offsetTime';
        var data = 'data';
        var timeZone = new Date().getTimezoneOffset() / 60 * 2 + this.parent[offsetTime];
        DataUtil.serverTimezoneOffset = timeZone;
        args[data] = DataUtil.parse.parseJson(JSON.stringify(args[data]));
        DataUtil.serverTimezoneOffset = serverTimeZone;
    };
    BlazorAction.prototype.onGroupClick = function (args) {
        var _this = this;
        var adaptor = 'interopAdaptor';
        var content = 'contentModule';
        var invokeMethodAsync = 'invokeMethodAsync';
        this.parent[adaptor][invokeMethodAsync]('OnGroupExpandClick', args).then(function () {
            _this.parent[content].rowElements = [].slice.call(_this.parent.getContentTable().querySelectorAll('tr.e-row[data-uid]'));
        });
    };
    BlazorAction.prototype.setPersistData = function (args) {
        var gObj = this.parent;
        gObj.mergePersistGridData(args);
        var bulkChanges = 'bulkChanges';
        if (gObj[bulkChanges].columns) {
            delete gObj[bulkChanges].columns;
        }
        gObj.headerModule.refreshUI();
        gObj.notify('persist-data-changed', {});
        gObj.notify(events.columnVisibilityChanged, gObj.getColumns());
    };
    ;
    BlazorAction.prototype.resetPersistData = function (args) {
        var gObj = this.parent;
        var bulkChanges = 'bulkChanges';
        var parseArgs = JSON.parse(args);
        var persistArgs = { filterSettings: parseArgs.filterSettings, groupSettings: parseArgs.groupSettings,
            pageSettings: parseArgs.pageSettings, sortSettings: parseArgs.sortSettings,
            searchSettings: parseArgs.searchSettings, columns: parseArgs.columns };
        if (!persistArgs.sortSettings.columns) {
            persistArgs.sortSettings.columns = [];
        }
        if (!persistArgs.groupSettings.columns) {
            persistArgs.groupSettings.columns = [];
        }
        for (var i = 0; i < gObj.columns.length; i++) {
            if (gObj.groupSettings.columns.indexOf(gObj.columns[i].field) > -1) {
                gObj.columns[i].visible = true;
            }
        }
        gObj.mergePersistGridData(persistArgs);
        gObj.notify('persist-data-changed', {});
        if (gObj[bulkChanges].columns) {
            delete gObj[bulkChanges].columns;
        }
        gObj.headerModule.refreshUI();
        for (var i = 0; i < gObj.columns.length; i++) {
            gObj.columns[i].editType = gObj.columns[i].editType.toLowerCase();
        }
        gObj.setProperties({ filterSettings: { columns: [] } }, true);
    };
    BlazorAction.prototype.dataFailure = function (args) {
        this.parent.renderModule.dataManagerFailure(args, this.actionArgs);
        this.actionArgs = this.parent.currentAction = {};
    };
    BlazorAction.prototype.destroy = function () {
        this.removeEventListener();
    };
    return BlazorAction;
}());
export { BlazorAction };
