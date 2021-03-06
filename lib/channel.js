import Parse from 'parse/node';

export default class Channel extends Parse.Object {
	// type
	// key
	// member

	constructor() {
		super('Channel');
	}

	join(user) {
		const member = this.relation('member');
		member.add(user);
		return this.save();
	}
}
