import Parse from 'parse/node';

export default class SpeUser extends Parse.Object {
	// userId
	// displayName
	// pictureUrl
	// statusMessage

	constructor() {
		super('SpeUser');
	}
}
