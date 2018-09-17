const Parse = require('parse/node');
const Bomb = require('./bomb');
const SpeUser = require('./user');
const Channel = require('./channel');

Parse.initialize('AppId', '', 'MasterKey');
Parse.serverURL = 'https://spe3d.herokuapp.com/parse';

Parse.Object.registerSubclass('SpeUser', SpeUser);
Parse.Object.registerSubclass('Channel', Channel);
Parse.Object.registerSubclass('Bomb', Bomb);

class Core {
	constructor() {}

	async registerChannel(source, replyToken) {
		const { type, roomId, groupId } = source;

		if (type === 'user') return;

		const key = roomId || groupId;

		const queryChannel = new Parse.Query(Channel);
		{
			queryChannel.equalTo('key', key);
		}

		const channel = await findChannel(key);

		return channel ? channel : await new Channel().save({ type, key, replyToken });
	}

	async findUser(userId) {
		const queryUser = new Parse.Query(User);
		{
			queryUser.equalTo('userId', userId);
		}
		return await queryUser.first();
	}

	async findChannel(key) {
		const queryChannel = new Parse.Query(Channel);
		{
			queryChannel.equalTo('key', key);
		}
		return await queryChannel.first();
	}

	async findBomb(channel, state) {
		const queryBomb = new Parse.Query(Bomb);
		{
			state && queryBomb.containedIn('state', state);
			queryBomb.equalTo('channel', channel);
			queryBomb.descending('createdAt');
			queryBomb.includeAll();
		}
		return await queryBomb.first();
	}

	async setupBomb(channel) {
		const queryBomb = new Parse.Query(Bomb);
		{
			queryBomb.equalTo('channel', channel);
			queryBomb.containedIn('state', [ 'INIT', 'STARTED' ]);
			queryBomb.descending('createdAt');
		}

		const bomb = await queryBomb.first();
		bomb && (await bomb.save({ state: 'INVALID' }));

		return await new Bomb().save({
			timestamp: +moment(_.drop(cmds).join('T')),
			owner: user,
			channel,
			state: 'INIT'
		});
	}
}

console.log('new Core', new Core());

module.exports = Core;
