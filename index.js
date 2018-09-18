import { Client, middleware } from '@line/bot-sdk';
import express from 'express';
import _ from 'lodash';
import moment from 'moment';
import beautify from 'json-beautify';
import schedule from 'node-schedule';
import core from './lib';

const lineConfig = {
	channelAccessToken: process.env.HEROKU_LINE_CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.HEROKU_LINE_CHANNEL_SECRET
};
const client = new Client(lineConfig);
const app = express();

const replyText = (token, texts) => {
	texts = Array.isArray(texts) ? texts : [ texts ];
	return client.replyMessage(token, texts.map((text) => ({ type: 'text', text })));
};

const pushText = (to, texts) => {
	texts = Array.isArray(texts) ? texts : [ texts ];
	return client.pushMessage(to, texts.map((text) => ({ type: 'text', text })));
};

async function handleEvent(event) {
	// console.log(beautify(event, null, 2, 80));

	const { type, source, replyToken, message } = event;
	const info = await catchProfile(source);

	switch (type) {
		case 'message':
			switch (message.type) {
				case 'text':
					return handleText(info, message, replyToken, source);
				// case 'image':
				//   return handleImage(message, replyToken);
				// case 'video':
				//   return handleVideo(message, replyToken);
				// case 'audio':
				//   return handleAudio(message, replyToken);
				case 'location':
					return handleLocation(message, replyToken);
				// case 'sticker':
				//   return handleSticker(message, replyToken);
				default:
					throw new Error(`Unknown message: ${JSON.stringify(message)}`);
			}

		case 'follow':
			return replyText(replyToken, 'Got followed event');

		case 'unfollow':
			return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

		case 'join':
			return replyText(replyToken, `Joined ${source.type}`);

		case 'leave':
			return console.log(`Left: ${JSON.stringify(event)}`);

		case 'postback':
			const data = event.postback.data;

			if (data === 'DATETIME') {
				const dt = moment(event.postback.params.datetime);
				const message = { text: `小雷裝炸彈:PostBack ${dt.format('YYYY-MM-DD HH:mm')}` };
				return handleText(info, message, replyToken, source);
			}

			const query = _(data).split('&').map(_.partial(_.split, _, '=', 2)).fromPairs().value();

			switch (query.action) {
				case 'join':
					break;
			}

			return replyText(replyToken, `query: ${beautify(query, null, 2, 25)}`);

		default:
			throw new Error(`Unknown event: ${JSON.stringify(event)}`);
	}
}

async function handleText(info, message, replyToken, source) {
	const { channel, user } = info;
	const type = typing(message.text);

	switch (type) {
		case 0:
			break;
		case 1: {
			//小雷
			const columns = [];
			const bomb = await core.findBomb(channel, [ 'INIT', 'STARTED' ]);
			if (bomb) {
				const { owner, state, timestamp } = bomb.toJSON();
				const ownerName = owner.displayName;
				const actions = [ { label: '下注', type: 'uri', uri: 'https://line.me' } ];
				state === 'INIT' && actions.push({ label: '啟動炸彈', type: 'message', text: '小雷啟動炸彈' });
				state === 'STARTED' && actions.push({ label: '我要參加', type: 'message', text: '小雷我要參加' });
				const text = `發起人：${ownerName}\n引爆時間：${moment(timestamp).format('YYYY-MM-DD HH:mm')}`;
				columns.push({ title: '炸彈狀態', text, actions });
			}
			columns.push({
				title: '工具包',
				text: '各種操作',
				actions: [
					{ label: '裝炸彈', type: 'datetimepicker', data: 'DATETIME', mode: 'datetime' },
					{ label: '拆炸彈', type: 'postback', data: 'action=removeBomb', text: '解除炸彈' }
				]
			});
			return client.replyMessage(replyToken, {
				type: 'template',
				altText: '小雷Menu',
				template: { type: 'carousel', columns }
			});
		}
		case 9: {
			//小雷+吃大便
			const profile = await client.getProfile(source.userId);
			return replyText(replyToken, [ `${beautify(profile, null, 2, 25)}`, `${beautify(source, null, 2, 25)}` ]);
		}
		case 3: {
			//小雷+裝炸彈
			const cmds = _.split(message.text, ' ');

			console.log(cmds);

			if (cmds.length < 3) {
				return client.replyMessage(event.replyToken, {
					type: 'text',
					text: '請輸入：小雷裝炸彈 日期 時間\n小雷裝炸彈 2018-10-04 10:30'
				});
			}
			const timestamp = +moment(_.drop(cmds).join('T'));
			await core.setupBomb(channel, user, timestamp);

			return client.replyMessage(replyToken, [
				{
					type: 'template',
					altText: '炸彈來囉(ง๑ •̀_•́)ง',
					template: {
						type: 'buttons',
						title: '炸彈來囉(ง๑ •̀_•́)ง',
						text: `${cmds[1]} ${cmds[2]} 隨機告⽩白`,
						actions: [
							{ type: 'uri', label: '修改炸彈規則', uri: 'http://example.com/page/123' },
							{ type: 'message', label: '啟動炸彈', text: '小雷啟動炸彈' }
						]
					}
				},
				{ type: 'text', text: `God bless you.` }
			]);
		}
		case 5: {
			//小雷+啟動炸彈
			const bomb = await core.findBomb(channel);
			const owner = bomb.get('owner');
			const ownerName = owner.get('displayName');
			const { state, timestamp } = bomb.toJSON();
			if (state === 'STARTED') {
				return replyText(replyToken, [ 'Rex：白癡喔！！', `炸彈已經啟動～ 趕快參加吧！！` ]);
			}
			if (!user.equals(owner)) {
				return replyText(replyToken, [ 'Rex：三小啦', `你又不是${ownerName} 啟動個屁啊！！` ]);
			}
			await bomb.start();

			const date = moment(timestamp).toDate();
			const handler = _.bind(handleBomb, null, bomb);
			const job = schedule.scheduleJob(date, handler);
			console.log('job:', beautify(job, null, 2, 80));

			return client.replyMessage(replyToken, [
				{
					type: 'template',
					altText: `炸彈定時囉ξ( ✿＞◡❛)`,
					template: {
						type: 'buttons',
						title: '炸彈定時囉ξ( ✿＞◡❛)',
						text: `有種就選最難的`,
						actions: [
							{ label: '參加炸彈挑戰', type: 'uri', uri: 'http://example.com/page/123' },
							{ label: '我要參加', type: 'message', text: '小雷我要參加' }
						]
					}
				}
			]);
		}
		case 17: {
			//小雷+我要參加
			let bomb = await core.findBomb(channel, [ 'STARTED' ]);
			if (!bomb) {
				return replyText(replyToken, [ 'Rex：三小啦', `沒有炸彈了！！` ]);
			}
			bomb = await bomb.join(user);
			const players = await bomb.getPlayers();
			return replyText(replyToken, `參加的人：\n${_.map(players, 'displayName').join('\n')}`);
		}
		case 33: {
			//小雷+抓到炸彈魔
			let bomb = await core.findBomb(channel, [ 'STARTED' ]);
			bomb = await bomb.inactivate(user);
			const texts = [ `${user.displayName}已解除炸彈` ];
			const activate = await bomb.getActivate();
			!_.isEmpty(activate) && texts.push(`尚未拆彈：\n${_.map(activate, 'displayName').join(', ')}`);
			return replyText(replyToken, texts);
		}
		case 192: {
			//系統指令+ID:小雷+爆炸
			const bomb = await core.findBomb(channel);
			await handleBomb(bomb);
		}
	}
}

function handleLocation(message, replyToken) {
	return client.replyMessage(replyToken, {
		type: 'location',
		title: message.title,
		address: message.address,
		latitude: message.latitude,
		longitude: message.longitude
	});
}

async function handleBomb(bomb) {
	const { channel } = bomb.toJSON();
	const { key } = channel;

	pushText(key, [ `要爆了～`, `啊～～～` ]);
	const results = await bomb.end();
	const situations = results.forEach((result) => result.toJSON());
	console.log('situations:', situations);
	await client.pushMessage(key, {
		type: 'bubble',
		styles: {
			footer: { separator: true }
		},
		body: {
			type: 'box',
			layout: 'vertical',
			contents: [
				{
					type: 'text',
					text: 'RECEIPT',
					weight: 'bold',
					color: '#1DB446',
					size: 'sm'
				},
				{
					type: 'text',
					text: 'Brown Store',
					weight: 'bold',
					size: 'xxl',
					margin: 'md'
				},
				{
					type: 'text',
					text: 'Miraina Tower, 4-1-6 Shinjuku, Tokyo',
					size: 'xs',
					color: '#aaaaaa',
					wrap: true
				},
				{
					type: 'separator',
					margin: 'xxl'
				},
				{
					type: 'box',
					layout: 'vertical',
					margin: 'xxl',
					spacing: 'sm',
					contents: [
						..._(situations).filter('inactivate').orderBy('inactivate').map((situation) => ({
							type: 'box',
							layout: 'horizontal',
							contents: [
								{
									type: 'text',
									text: situation.player.displayName,
									size: 'sm',
									color: '#555555',
									flex: 0
								},
								{
									type: 'text',
									text: moment(situation.inactivate).format('HH:mm:ss'),
									size: 'sm',
									color: '#111111',
									align: 'end'
								}
							]
						})),
						{
							type: 'separator',
							margin: 'xxl'
						}
					]
				}
			]
		}
	});
}

async function catchProfile(source) {
	const profile = await getProfile(source);

	const user = await core.registerUser(profile);

	const channel = await core.registerChannel(source);

	await channel.join(user);

	return { channel, user };
}

async function getProfile(source) {
	const { type, userId, roomId, groupId } = source;
	const key = roomId || groupId;
	switch (type) {
		case 'user':
			return await client.getProfile(userId);
		case 'room':
			return await client.getRoomMemberProfile(key, userId);
		case 'group':
			return await client.getGroupMemberProfile(key, userId);
	}
}

function typing(cmd) {
	var result = 0;
	cmd.indexOf('小雷') == 0 && (result |= 1 << 0); //1
	cmd.includes('裝炸彈') && (result |= 1 << 1); //2
	cmd.includes('啟動炸彈') && (result |= 1 << 2); //4
	cmd.includes('吃大便') && (result |= 1 << 3); //8
	cmd.includes('我要參加') && (result |= 1 << 4); //16
	cmd.includes('抓到炸彈魔') && (result |= 1 << 5); //32
	cmd.indexOf('系統指令') == 0 && cmd.includes('ID:小雷') && (result |= 1 << 6); //64
	cmd.includes('爆炸') && (result |= 1 << 7); //128
	return result;
}

app.post('/', middleware(lineConfig), (req, res) => {
	Promise.all(req.body.events.map(handleEvent)).then(function(result) {
		res.json(result);
	});
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`listening on ${port}`);
});
