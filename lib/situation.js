import Parse from 'parse/node';

export default class Situation extends Parse.Object {
	// player
	// bomb
	// explode
	// inactivate

	constructor() {
		super('Situation');
	}

	static spawn(player, bomb) {
		return new Situation().save({
			player,
			bomb,
			explode: bomb.get('timestamp'),
			inactivate: undefined
		});
	}

	static async get(bomb, player) {
		const querySituation = new Parse.Query(Situation);
		{
			querySituation.equalTo('bomb', bomb);
			player && querySituation.equalTo('player', player);
			querySituation.descending('inactivate');
			querySituation.includeAll();
		}
		const results = await querySituation.find();
		return results.length == 1 ? results.pop : results;
	}
}
