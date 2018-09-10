const line = require('@line/bot-sdk');
const express = require('express');
const Parse = require('parse/node');
const _ = require('lodash');
const moment = require('moment');

Parse.initialize('AppId', '', 'MasterKey');
Parse.serverURL = 'https://spe3d.herokuapp.com/parse';

const Group = Parse.Object.extend('SpeGroup');
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

async function handleEvent(event) {
	const { type, source, replyToken, message } = event;
	switch (type) {
		case 'message':
			if (source.type === 'group') {
				const queryGroup = new Parse.Query(Group);
				queryGroup.equalTo('groupId', source.groupId);
				let group = await queryGroup.first();
				!group && (group = new Group());
				group.set('groupId', source.groupId);
				group = await group.save();
				console.log('1. group:', group);

				const profile = await client.getGroupMemberProfile(source.groupId, source.userId);
				console.log('2. profile:', profile);

				const queryUser = new Parse.Query(User);
				queryUser.equalTo('userId', profile.userId);
				let user = await queryUser.first();
				!user && (user = new User());
				user.set('userId', profile.userId);
				user.set('username', profile.displayName);
				user.set('imgUrl', profile.pictureUrl);
				user = await user.save();
				console.log('3. user:', user);

				const relation = group.relation('member');
				relation.add(user);
				group.save();

				console.log('4. group:', group);
			}

			console.log(message);
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

		// case 'follow':
		//   return replyText(replyToken, 'Got followed event');

		// case 'unfollow':
		//   return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

		// case 'join':
		//   return replyText(replyToken, `Joined ${source.type}`);

		// case 'leave':
		//   return console.log(`Left: ${JSON.stringify(event)}`);

		case 'postback':
			const data = event.postback.data;
			if (data === 'DATETIME') {
				// data += `(${JSON.stringify(event.postback.params)})`;
				const dt = moment(event.postback.params.datetime);
				const message = { text: `小雷裝炸彈 ${dt.format('YYYY/MM/DD HH:mm')}` };
				return handleText(message, replyToken, source);
			}
			return replyText(replyToken, `Got postback: ${data}`);

		// case 'beacon':
		//   return replyText(replyToken, `Got beacon: ${event.beacon.hwid}`);

		default:
			throw new Error(`Unknown event: ${JSON.stringify(event)}`);
	}
}

function handleText(message, replyToken, source) {
	console.log('message:', message.text);
	var type = typing(message.text);
	console.log('type:', type);
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
			return client
				.getGroupMemberProfile(source.groupId, source.userId)
				.then((profile) =>
					replyText(replyToken, [
						`Profile: ${JSON.stringify(profile)}`,
						`Source: ${JSON.stringify(source)}`
					])
				);
		case 3: //小雷+裝炸彈
			const cmds = _.split(message.text, ' ');
			console.log(cmds);
			return client.replyMessage(replyToken, [
				{
					type: 'template',
					altText: `炸彈已啟動~`,
					template: {
						type: 'buttons',
						title: '炸彈已啟動',
						text: `請在${cmds[1]} ${cmds[2]} 之前解除炸彈`,
						actions: [
							{
								type: 'uri',
								label: '我要參加',
								uri: 'http://example.com/page/123'
							}
						]
					}
				},
				{ type: 'text', text: `God bless you.` }
			]);
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
