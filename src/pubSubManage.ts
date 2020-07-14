import { Subject, Subscription } from 'rxjs';

interface Listener {
	fn: (...args: any[]) => void;
	listen: any;
}

export type ActionTypeValue = string;

export interface EmitArg {
	value?: any;
	type: ActionTypeValue;
	[key: string]: any;
}

export interface ItemType {
	subject: Subject<any>;
	listeners: Listener[];
}

export default class PubSubManage {
	itemMap: {
		[key: string]: ItemType;
	};
	constructor() {
		this.itemMap = {};
	}

	// 为 schedule 返回 subject，做延迟触发
	on(type: string, fn?: (...args: any[]) => void): Subject<any> {
		const map = this.itemMap;
		let item = map[type];
		let returnSubject = null;
		if (item) {
			if (!fn) {
				return item.subject;
			}
			const listen = item.subject.subscribe(fn);
			item.listeners.push({
				listen,
				fn,
			});
			returnSubject = item.subject;
		} else {
			const subject = new Subject();
			if (fn) {
				const listen = subject.subscribe(fn);
				item = {
					subject,
					listeners: [{ fn, listen }],
				};
			} else {
				item = {
					subject,
					listeners: [],
				};
			}
			map[type] = item;
			returnSubject = subject;
		}
		return returnSubject;
	}

	off(type: string, fn?: (...args: any[]) => void) {
		const item = this.itemMap[type];
		if (item) {
			if (!fn) {
				item.subject.unsubscribe();
				delete this.itemMap[type];
			} else {
				const element = item.listeners.find((ele) => ele.fn === fn);
				item.listeners = item.listeners.filter((ele) => ele.fn === fn);
				if (element !== undefined) {
					element.listen.unsubscribe();
				}
			}
		}
	}

	emit(type: string, args?: EmitArg) {
		const item = this.itemMap[type];
		if (item) {
			item.subject.next(args);
		}
	}
}
