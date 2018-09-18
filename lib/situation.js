import Parse from 'parse/node';

export default class Situation extends Parse.Object {
	// player
	// bomb
	// explode
	// inactivate

	constructor() {
		super('Situation');
	}

	static async spawn(player, bomb) {
		const situation = new Situation();
		situation.set('strength', strength);
		return await this.save({
			player,
			bomb,
			explode: bomb.get('timestamp'),
			inactivate: undefined
		});
	}
}
