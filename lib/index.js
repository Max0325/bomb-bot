import Parse from 'parse/node';
import Bomb from './bomb';
import SpeUser from './user';
import Channel from './channel';

Parse.initialize('AppId', '', 'MasterKey');
Parse.serverURL = 'https://spe3d.herokuapp.com/parse';

Parse.Object.registerSubclass('SpeUser', SpeUser);
Parse.Object.registerSubclass('Channel', Channel);
Parse.Object.registerSubclass('Bomb', Bomb);

class Core {
	constructor() {}

	findUser(userId) {
		const queryUser = new Parse.Query(SpeUser);
		{
			queryUser.equalTo('userId', userId);
		}
		return queryUser.first();
	}

	findChannel(key) {
		const queryChannel = new Parse.Query(Channel);
		{
			queryChannel.equalTo('key', key);
		}
		return queryChannel.first();
	}

	findBomb(channel, state) {
		const queryBomb = new Parse.Query(Bomb);
		{
			state && queryBomb.containedIn('state', state);
			queryBomb.equalTo('channel', channel);
			queryBomb.descending('createdAt');
			queryBomb.includeAll();
		}
		return queryBomb.first();
	}

	async registerChannel(source, replyToken) {
		const { type, roomId, groupId } = source;

		if (type === 'user') return;

		const key = roomId || groupId;

		const queryChannel = new Parse.Query(Channel);
		{
			queryChannel.equalTo('key', key);
		}

		const channel = await this.findChannel(key);

		return channel ? channel : new Channel().save({ type, key, replyToken });
	}

	async setupBomb(channel, owner, timestamp) {
		const queryBomb = new Parse.Query(Bomb);
		{
			queryBomb.equalTo('channel', channel);
			queryBomb.containedIn('state', [ 'INIT', 'STARTED' ]);
			queryBomb.descending('createdAt');
		}

		const bomb = await queryBomb.first();

		bomb && (await bomb.save({ state: 'INVALID' }));

		return new Bomb().save({ channel, owner, timestamp, state: 'INIT' });
	}
}

export default new Core();
