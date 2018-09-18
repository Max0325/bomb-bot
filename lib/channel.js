import Parse from 'parse/node';

export default class Channel extends Parse.Object {
	constructor() {
		super('Channel');
	}

	async join(user) {
		const member = this.relation('member');
		member.add(user);
		return await this.save();
	}
}
