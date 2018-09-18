import Parse from 'parse/node';
import Situation from './situation';
import moment from 'moment';

export default class Bomb extends Parse.Object {
	// owner
	// channel
	// timestamp
	// state
	// players
	// activate

	constructor() {
		super('Bomb');
	}

	async inactivate(user) {
		const activate = this.relation('activate');
		activate.remove(user);
		const situation = await Situation.get(user, this);
		await situation.save({ inactivate: +moment() });
		return this.save();
	}

	async join(user) {
		const players = this.relation('players');
		const activate = this.relation('activate');
		players.add(user);
		activate.add(user);
		await Situation.spawn(user, this);
		return this.save();
	}

	getPlayers() {
		const queryPlayers = this.get('players').query();
		{
			queryPlayers.select('displayName');
		}
		return queryPlayers.find();
	}

	getActivate() {
		const queryActivate = this.get('activate').query();
		{
			queryActivate.select('displayName');
		}
		return queryActivate.find();
	}

	start() {
		return this.save({ state: 'STARTED' });
	}
	end() {
		return this.save({ state: 'ENDED' });
	}
}
