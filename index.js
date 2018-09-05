const line = require('@line/bot-sdk');
const express = require('express');
const lineConfig = {
	channelAccessToken: process.env.HEROKU_LINE_CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.HEROKU_LINE_CHANNEL_SECRET
};
const client = new line.Client(lineConfig);
const app = express();

app.listen(3000, function() {
	console.log('App now running on port', this.address().port);
});

app.post('/', line.middleware(lineConfig), function(req, res) {
	Promise.all(req.body.events.map(handleEvent)).then(function(result) {
		res.json(result);
	});
});

function handleEvent(event) {
	switch (event.type) {
		case 'join':
		case 'follow':
			return client.replyMessage(event.replyToken, {
				type: 'text',
				text: '你好請問我們認識嗎?'
			});
		case 'message':
			switch (event.message.type) {
				case 'text':
					var source = event.source;
					switch (source.type) {
						case 'user':
							return client
								.replyMessage(event.replyToken, {
									type: 'text',
									text: '你是user'
								})
								.then(function() {
									return client.pushMessage(source.userId, {
										type: 'text',
										text: '使用userId推送訊息'
									});
								});
						case 'room':
							return client
								.replyMessage(event.replyToken, {
									type: 'text',
									text: '你是room'
								})
								.then(function() {
									return client.pushMessage(source.roomId, {
										type: 'text',
										text: '使用roomId推送訊息'
									});
								});
						case 'group':
							return client
								.replyMessage(event.replyToken, {
									type: 'text',
									text: '你是group'
								})
								.then(function() {
									return client.pushMessage(source.groupId, {
										type: 'text',
										text: '使用groupId推送訊息'
									});
								});
					}
			}
	}
}
