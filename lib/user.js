import Parse from 'parse/node';

export default class SpeUser extends Parse.Object {
	// userId
	// displayName
	// pictureUrl
	// statusMessage

	get displayName() {
		return this.get('displayName');
	}

	constructor() {
		super('SpeUser');
	}
}
