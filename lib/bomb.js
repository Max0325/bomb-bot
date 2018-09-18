import Parse from 'parse/node';
import Situation from './situation';
import moment from 'moment';
import beautify from 'json-beautify';

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
		const situation = await Situation.get(this, user);

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

	async getPlayerSituations() {
		const situations = await Situation.get(this);
		console.log('situations:', beautify(situations, null, 2, 80));
		return situations;
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
		await this.getPlayerSituations();
	}
}
