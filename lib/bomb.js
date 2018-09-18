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
		const situations = await Situation.get(this, user);
		await situations.pop().save({ inactivate: +moment() });
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

	getSituations() {
		return Situation.get(this);
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

	async start() {
		await this.save({ state: 'STARTED' });
	}

	async end() {
		await this.save({ state: 'ENDED' });
		return await this.getSituations();
	}
}
