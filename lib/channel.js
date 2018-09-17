export class Channel extends Parse.Object {
	constructor() {
		super('Channel');
	}

	join = async (user) => {
		const member = channel.relation('member');
		member.add(user);
		return await channel.save();
	};
}
