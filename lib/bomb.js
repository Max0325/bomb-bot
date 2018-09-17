export class Bomb extends Parse.Object {
	constructor() {
		super('Bomb');
	}

	async join(user) {
		const players = this.relation('players');
		const activate = this.relation('activate');
		players.add(user);
		activate.add(user);
		return await this.save();
	}

	async getPlayers() {
		const queryPlayers = this.get('players').query();
		{
			queryPlayers.select('displayName');
		}
		return await queryPlayers.find();
	}
}
