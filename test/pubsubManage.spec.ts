import PubSubManage from '../src/pubSubManage';

const listenKey = 'a';

it('注册订阅', () => {
  const pubSub = new PubSubManage();
  pubSub.on(listenKey);
  expect(Object.keys(pubSub.itemMap)).toBeDefined();
  expect(Object.keys(pubSub.itemMap).length).toEqual(1);
});

it('发布', () => {
  function cb(value) {
    return value;
  }
  const mockCallback = jest.fn(cb);
  const pubSub = new PubSubManage();
  const subscription = pubSub.on(listenKey).subscribe(mockCallback);
  pubSub.emit(listenKey, { type: listenKey, value: 'test' });
  pubSub.emit(listenKey);
  pubSub.emit(listenKey);
  expect(mockCallback.mock.calls[0][0]).toEqual({
    type: listenKey,
    value: 'test',
  });
  expect(mockCallback).toBeCalledTimes(3);
});

it('多个订阅者 发布', () => {
  function cb(value) {
    return value;
  }
  const mockCallback = jest.fn(cb);
  // const mockCallback2 = jest.fn(cb)
  const pubSub = new PubSubManage();
  const subscription = pubSub.on(listenKey).subscribe(mockCallback);
  const subscription1 = pubSub.on(listenKey).subscribe(mockCallback);
  pubSub.emit(listenKey, { type: listenKey, value: 'test' });
  pubSub.emit(listenKey);
  expect(mockCallback.mock.calls[0][0]).toEqual({
    type: listenKey,
    value: 'test',
  });
  expect(mockCallback).toBeCalledTimes(4);
  subscription1.unsubscribe();
  // subscription.unsubscribe()
  pubSub.emit(listenKey);
  expect(mockCallback).toBeCalledTimes(5);
});

it('取消订阅', () => {
  const pubSub = new PubSubManage();
  pubSub.on(listenKey);
  expect(pubSub.itemMap[listenKey]).toBeDefined();
  pubSub.off(listenKey);
  expect(pubSub.itemMap[listenKey]).toBeUndefined();
});
