const line = require('@line/bot-sdk');
const express = require('express');
const Parse = require('parse/node');
const _ = require('lodash');
const moment = require('moment');

Parse.initialize('AppId', '', 'MasterKey');
Parse.serverURL = 'https://spe3d.herokuapp.com/parse';

const Channel = Parse.Object.extend('Channel');
const User = Parse.Object.extend('SpeUser');
const Bomb = Parse.Object.extend('Bomb');

const lineConfig = {
	channelAccessToken: process.env.HEROKU_LINE_CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.HEROKU_LINE_CHANNEL_SECRET
};
const client = new line.Client(lineConfig);
const app = express();

const replyText = (token, texts) => {
	texts = Array.isArray(texts) ? texts : [ texts ];
	return client.replyMessage(token, texts.map((text) => ({ type: 'text', text })));
};

function handleEvent(event) {
	console.log(event);

	const { type, source, replyToken, message } = event;

	catchProfile(source, replyToken);

	switch (type) {
		case 'message':
			switch (message.type) {
				case 'text':
					return handleText(message, replyToken, source);
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
			registerChannel(source, replyToken);
			return replyText(replyToken, `Joined ${source.type}`);

		case 'leave':
			return console.log(`Left: ${JSON.stringify(event)}`);

		case 'postback':
			const data = event.postback.data;
			if (data === 'DATETIME') {
				// data += `(${JSON.stringify(event.postback.params)})`;
				const dt = moment(event.postback.params.datetime);
				const message = { text: `Postback:小雷裝炸彈 ${dt.format('YYYY/MM/DD HH:mm')}` };
				return handleText(message, replyToken, source);
			}
			return replyText(replyToken, `Got postback: ${data}`);

		default:
			throw new Error(`Unknown event: ${JSON.stringify(event)}`);
	}
}

async function handleText(message, replyToken, source) {
	const type = typing(message.text);
	switch (type) {
		case 0:
			break;
		case 1: //小雷
			return client.replyMessage(replyToken, {
				type: 'template',
				altText: 'Carousel alt text',
				template: {
					type: 'carousel',
					columns: [
						{
							title: '即時戰況',
							text: 'ooxx',
							actions: [
								{ label: '下注', type: 'uri', uri: 'https://line.me' },
								{ label: '排行榜', type: 'uri', uri: 'https://line.me' }
							]
						},
						{
							title: '工具包',
							text: '各種操作',
							actions: [
								{ label: '裝炸彈', type: 'datetimepicker', data: 'DATETIME', mode: 'datetime' },
								{ label: '拆炸彈', type: 'postback', data: 'action=removeBomb', text: '解除炸彈' }
							]
						}
					]
				}
			});
		case 9: //小雷+吃大便
			const profile = await client.getProfile(source.userId);
			return replyText(replyToken, [
				`Profile: ${JSON.stringify(profile)}`,
				`Source: ${JSON.stringify(source)}`
			]);
		case 3: //小雷+裝炸彈
			const cmds = _.split(message.text, ' ');
			console.log(cmds);
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
		case 5: //小雷+啟動炸彈
			return client.replyMessage(replyToken, [
				{
					type: 'template',
					altText: `炸彈定時囉ξ( ✿＞◡❛)`,
					template: {
						type: 'buttons',
						title: '炸彈定時囉ξ( ✿＞◡❛)',
						text: `有種就選最難的`,
						actions: [ { type: 'uri', label: '參加炸彈挑戰', uri: 'http://example.com/page/123' } ]
					}
				},
				{ type: 'text', text: `Rex：三小啦` }
			]);
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

async function catchProfile({ type, userId, roomId, groupId }, replyToken) {
	const queryUser = new Parse.Query(User);
	const queryChannel = new Parse.Query(Channel);
	const profile = await client.getProfile(userId);

	console.log('Profile:', profile);

	queryUser.equalTo('userId', profile.userId);

	let user = await queryUser.first();
	{
		!user && (user = new User());
		user.set('userId', profile.userId);
		user.set('username', profile.displayName);
		user.set('imgUrl', profile.pictureUrl);
		user = await user.save();
	}
	console.log('User:', user.toJSON());

	const channel = await queryChannel.equalTo('id', userId || roomId || groupId).first();

	if (channel) {
		const relation = channel.relation('member');

		relation.add(user);
		channel.set('replyToken', replyToken);
		channel = await channel.save();

		console.log('Register Channel:', channel.toJSON());
	}
}

async function registerChannel({ type, userId, roomId, groupId }, replyToken) {
	const queryChannel = new Parse.Query(Channel);
	const id = userId || roomId || groupId;
	console.log('1. id:', id);
	let channel = await queryChannel.equalTo('id', id).first();
	{
		!channel && (channel = new Channel());
		channel.set('type', type);
		channel.set('id', id);
		channel.set('replyToken', replyToken);
		channel = await channel.save();
	}

	console.log('Register Channel:', channel.toJSON());
}

// case 5: //小雷+啟動炸彈
// 	return replyText(replyToken, [ `炸彈已啟動  請在YYYY/MM/DD HH:mm 之前解除炸彈`, `God bless you.` ]);
// case 17: //小雷+我要參加
// 	return client.replyMessage(replyToken, {
// 		type: 'template',
// 		altText: 'This is a buttons template',
// 		template: {
// 			type: 'buttons',
// 			title: 'Menu',
// 			text: 'Please select',
// 			defaultAction: {
// 				type: 'uri',
// 				label: 'View detail',
// 				uri: 'http://example.com/page/123'
// 			},
// 			actions: [
// 				{
// 					type: 'uri',
// 					label: '設置信用卡',
// 					uri: 'http://example.com/page/123'
// 				},
// 				{
// 					type: 'postback',
// 					label: '設置信用卡',
// 					data: 'action=buy&itemid=123'
// 				}
// 			]
// 		}
// 	});
// {
// 	type: 'text',
// 	text: 'Select Datetime!',
// 	quickReply: {
// 		items: [
// 			{
// 				type: 'action',
// 				action: { type: 'datetimepicker', label: 'Datetime', data: 'DATETIME', mode: 'datetime' }
// 			}
// 		]
// 	}
// }
// {
// 	type: 'template',
// 	altText: 'Datetime pickers alt text',
// 	template: {
// 		type: 'buttons',
// 		text: 'Select date / time !',
// 		actions: [ { type: 'datetimepicker', label: 'Datetime', data: 'DATETIME', mode: 'datetime' } ]
// 	}
// }
// { type: 'location', label: 'Send location' }
// return client.replyMessage(event.replyToken, {
// 	type: 'text',
// 	text: '請輸入 日期 時間 地點(Optional)\n2018/10/04 10:30 西門捷運站'
// });
// 'source:' + JSON.stringify(source) + '，profile: ' + JSON.stringify(profile)

function typing(cmd) {
	var result = 0;
	cmd.includes('小雷') && (result += Math.pow(2, 0)); //1
	cmd.includes('裝炸彈') && (result += Math.pow(2, 1)); //2
	cmd.includes('啟動炸彈') && (result += Math.pow(2, 2)); //4
	cmd.includes('吃大便') && (result += Math.pow(2, 3)); //8
	cmd.includes('我要參加') && (result += Math.pow(2, 4)); //16
	return result;
}

app.post('/', line.middleware(lineConfig), (req, res) => {
	Promise.all(req.body.events.map(handleEvent)).then(function(result) {
		res.json(result);
	});
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`listening on ${port}`);
});
