'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var rxjs = require('rxjs');
var operators = require('rxjs/operators');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

var PubSubManage = /** @class */ (function () {
    function PubSubManage() {
        this.itemMap = {};
    }
    // 为 schedule 返回 subject，做延迟触发
    PubSubManage.prototype.on = function (type, fn) {
        var map = this.itemMap;
        var item = map[type];
        var returnSubject = null;
        if (item) {
            if (!fn) {
                return item.subject;
            }
            var listen = item.subject.subscribe(fn);
            item.listeners.push({
                listen: listen,
                fn: fn,
            });
            returnSubject = item.subject;
        }
        else {
            var subject = new rxjs.Subject();
            if (fn) {
                var listen = subject.subscribe(fn);
                item = {
                    subject: subject,
                    listeners: [{ fn: fn, listen: listen }],
                };
            }
            else {
                item = {
                    subject: subject,
                    listeners: [],
                };
            }
            map[type] = item;
            returnSubject = subject;
        }
        return returnSubject;
    };
    PubSubManage.prototype.off = function (type, fn) {
        var item = this.itemMap[type];
        if (item) {
            if (!fn) {
                item.subject.unsubscribe();
                delete this.itemMap[type];
            }
            else {
                var element = item.listeners.find(function (ele) { return ele.fn === fn; });
                item.listeners = item.listeners.filter(function (ele) { return ele.fn === fn; });
                if (element !== undefined) {
                    element.listen.unsubscribe();
                }
            }
        }
    };
    PubSubManage.prototype.emit = function (type, args) {
        var item = this.itemMap[type];
        if (item) {
            item.subject.next(args);
        }
    };
    return PubSubManage;
}());

var MapItem = /** @class */ (function () {
    function MapItem(cb, scheduler) {
        this.cb = cb;
        this.scheduler = scheduler;
        this.cache = [];
    }
    MapItem.prototype.receiveValue = function (value) {
        this.cache.push(value);
    };
    MapItem.prototype.perform = function () {
        this.scheduler.flush();
        this.cb(this.cache);
        this.cache = [];
    };
    return MapItem;
}());
var ActionCollectManage = /** @class */ (function () {
    function ActionCollectManage() {
        this.pubSubManage = new PubSubManage();
        this.map = {};
    }
    ActionCollectManage.prototype.registerActive = function (key, actionList, cb) {
        var _this = this;
        if (!actionList.length) {
            return;
        }
        var subjectArr = actionList.reduce(function (pre, cur) {
            var subject = _this.pubSubManage.on(cur.type);
            return __spreadArrays(pre, [subject]);
        }, []);
        if (this.map[key]) {
            return;
        }
        var scheduler = new rxjs.VirtualTimeScheduler();
        var mapItem = new MapItem(cb, scheduler);
        this.map[key] = mapItem;
        var subject = rxjs.merge.apply(void 0, subjectArr).pipe(operators.observeOn(scheduler))
            .subscribe(mapItem.receiveValue.bind(mapItem));
        mapItem.subject = subject;
    };
    ActionCollectManage.prototype.emitEvent = function (params) {
        var _this = this;
        if (Array.isArray(params)) {
            params.forEach(function (param) {
                var type = param.type;
                _this.pubSubManage.emit(type, param);
            });
        }
        else {
            var type = params.type;
            this.pubSubManage.emit(type, params);
        }
    };
    ActionCollectManage.prototype.trigger = function (key) {
        var itemMap = this.map[key];
        if (itemMap) {
            itemMap.perform();
        }
    };
    ActionCollectManage.prototype.cancel = function (key) {
        var itemMap = this.map[key];
        if (itemMap) {
            if (itemMap.subject) {
                itemMap.subject.unsubscribe();
                delete this.map[key];
            }
        }
    };
    return ActionCollectManage;
}());

exports.MapItem = MapItem;
exports.default = ActionCollectManage;
//# sourceMappingURL=bundle.cjs.js.map
