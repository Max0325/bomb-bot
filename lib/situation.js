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

	static get(bomb, player) {
		const querySituation = new Parse.Query(Situation);
		{
			querySituation.equalTo('bomb', bomb);
			player && querySituation.equalTo('player', player);
			querySituation.descending('inactivate');
			querySituation.includeAll();
		}
		return querySituation.find();
	}
}
