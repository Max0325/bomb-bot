import Parse from 'parse/node';

export default class Bomb extends Parse.Object {
	constructor() {
		super('Bomb');
	}

	join(user) {
		const players = this.relation('players');
		const activate = this.relation('activate');
		players.add(user);
		activate.add(user);
		return this.save();
	}

	getPlayers() {
		const queryPlayers = this.get('players').query();
		{
			queryPlayers.select('displayName');
		}
		return queryPlayers.find();
	}

	start() {
		return this.save({ state: 'STARTED' });
	}
	end() {
		return this.save({ state: 'ENDED' });
	}
}
