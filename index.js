const line = require('@line/bot-sdk');
const express = require('express');
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
	switch (event.type) {
		case 'message':
			const message = event.message;
			switch (message.type) {
				case 'text':
					return handleText(message, event.replyToken, event.source);
				// case 'image':
				//   return handleImage(message, event.replyToken);
				// case 'video':
				//   return handleVideo(message, event.replyToken);
				// case 'audio':
				//   return handleAudio(message, event.replyToken);
				case 'location':
					return handleLocation(message, event.replyToken);
				// case 'sticker':
				//   return handleSticker(message, event.replyToken);
				default:
					throw new Error(`Unknown message: ${JSON.stringify(message)}`);
			}

		// case 'follow':
		//   return replyText(event.replyToken, 'Got followed event');

		// case 'unfollow':
		//   return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

		// case 'join':
		//   return replyText(event.replyToken, `Joined ${event.source.type}`);

		// case 'leave':
		//   return console.log(`Left: ${JSON.stringify(event)}`);

		case 'postback':
			let data = event.postback.data;
			if (data === 'DATE' || data === 'TIME' || data === 'DATETIME') {
				data += `(${JSON.stringify(event.postback.params)})`;
			}
			return replyText(event.replyToken, `Got postback: ${data}`);

		// case 'beacon':
		//   return replyText(event.replyToken, `Got beacon: ${event.beacon.hwid}`);

		default:
			throw new Error(`Unknown event: ${JSON.stringify(event)}`);
	}
}

function handleText(message, replyToken, source) {
	var type = typing(message.text);
	console.log('type:', type);
	switch (type) {
		case 0:
			break;
		case 1: //小雷
			return client
				.getGroupMemberProfile(source.groupId, source.userId)
				.then((profile) =>
					replyText(replyToken, [
						`Profile: ${JSON.stringify(profile)}`,
						`Source: ${JSON.stringify(source)}`
					])
				);
		case 3: //小雷+裝炸彈
			return client.replyMessage(replyToken, {
				type: 'template',
				altText: 'Datetime pickers alt text',
				template: {
					type: 'buttons',
					text: 'Select date / time !',
					actions: [
						{ type: 'datetimepicker', label: 'datetime', data: 'DATETIME', mode: 'datetime' },
						{ type: 'location', label: 'Location' }
					]
				}
			});
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

// return client.replyMessage(event.replyToken, {
// 	type: 'text',
// 	text: '請輸入 日期 時間 地點(Optional)\n2018/10/04 10:30 西門捷運站'
// });
// 'source:' + JSON.stringify(source) + '，profile: ' + JSON.stringify(profile)

function typing(cmd) {
	var result = 0;
	cmd.includes('小雷') && (result += Math.pow(2, 0));
	cmd.includes('裝炸彈') && (result += Math.pow(2, 1));
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
