class Channel extends Parse.Object {
	constructor() {
		super('Channel');
	}

	async join(user) {
		const member = channel.relation('member');
		member.add(user);
		return await channel.save();
	}
}

module.exports = Channel;
