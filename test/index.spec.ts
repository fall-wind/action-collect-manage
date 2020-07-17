import ActionCollectManage from '../src/index';

const registerKey = 'myPage';
const actionKey1 = 'myAction';

it('创建、注册、收集action、发布收集action', () => {
	function cb(value) {
		console.log(value);
	}
	const mockCallback = jest.fn(cb);
	const actionCollectManage = new ActionCollectManage();
	actionCollectManage.registerActive(
		registerKey,
		[
			{
				type: actionKey1,
			},
		],
		mockCallback,
	);

	actionCollectManage.emitEvent({
		type: actionKey1,
	})
	actionCollectManage.emitEvent({
		type: actionKey1,
	})
	expect(mockCallback).toBeCalledTimes(0)
	actionCollectManage.trigger(registerKey)
	expect(mockCallback).toBeCalledTimes(1)
});
