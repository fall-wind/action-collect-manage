import { Subject, merge, VirtualTimeScheduler, Subscription } from 'rxjs';
import { observeOn } from 'rxjs/operators';

import PubSubManage, { EmitArg, ActionTypeValue } from './pubSubManage';

export class MapItem {
	cache: EmitArg[];
	cb: (...args: any[]) => void;
	scheduler: VirtualTimeScheduler;
	subject?: Subscription;
	constructor(cb: (...args: any[]) => void, scheduler: VirtualTimeScheduler) {
		this.cb = cb;
		this.scheduler = scheduler;
		this.cache = [];
	}
	receiveValue(value: EmitArg) {
		this.cache.push(value);
	}

	perform() {
		this.scheduler.flush();
		this.cb(this.cache);
		this.cache = [];
	}
}

interface InnerMap {
	[key: string]: MapItem;
}

export interface ActionType {
	type: ActionTypeValue;
}

export default class ActiveManage {
	pubSubManage: PubSubManage;
	map: InnerMap;
	constructor() {
		this.pubSubManage = new PubSubManage();
		this.map = {};
	}

	registerActive(
		key: string,
		actionList: ActionType[],
		cb: (...args: any[]) => void,
	) {
		if (!actionList.length) {
			return;
		}
		const subjectArr = actionList.reduce((pre, cur) => {
			const subject = this.pubSubManage.on(cur.type);
			return [...pre, subject];
		}, [] as Subject<any>[]);
		if (this.map[key]) {
			return;
		}
		const scheduler = new VirtualTimeScheduler();
		const mapItem: MapItem = new MapItem(cb, scheduler);
		this.map[key] = mapItem;
		const subject = merge(...subjectArr)
			.pipe(observeOn(scheduler))
			.subscribe(mapItem.receiveValue.bind(mapItem));
		mapItem.subject = subject;
	}

	emitEvent(params: EmitArg | EmitArg[]) {
		if (Array.isArray(params)) {
			params.forEach((param) => {
				const { type } = param;
				this.pubSubManage.emit(type, param);
			});
		} else {
			const { type } = params;
			this.pubSubManage.emit(type, params);
		}
	}

	trigger(key: string) {
		const itemMap = this.map[key];
		if (itemMap) {
			itemMap.perform();
		}
	}

	cancel(key: string) {
		const itemMap = this.map[key];
		if (itemMap) {
			if (itemMap.subject) {
				itemMap.subject.unsubscribe();
				delete this.map[key];
			}
		}
	}
}
