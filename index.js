const line = require('@line/bot-sdk');
const express = require('express');
const lineConfig = {
	channelAccessToken: process.env.HEROKU_LINE_CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.HEROKU_LINE_CHANNEL_SECRET
};
const client = new line.Client(lineConfig);
const app = express();

function handleEvent(event) {
	switch (event.message.type) {
		case 'text':
			var source = event.source;
			return client.getGroupMemberProfile(source.groupId, source.userId).then(function(profile) {
				return client.replyMessage(event.replyToken, {
					type: 'template',
					altText: 'this is a carousel template',
					template: {
						type: 'carousel',
						actions: [],
						columns: [
							{
								title: '觀音拿鐵 半糖少冰',
								text: '上次訂了5杯唷  啾咪～',
								actions: [
									{
										type: 'postback',
										label: '＋1',
										text: '+1 觀音拿鐵 半糖少冰',
										data: '資料 1'
									}
								]
							},
							{
								title: '觀音拿鐵 微糖微冰',
								text: '上次訂了2杯唷  啾咪～',
								actions: [
									{
										type: 'message',
										label: '＋1',
										text: '+1 觀音拿鐵 微糖微冰'
									}
								]
							},
							{
								title: 'Detail',
								actions: [
									{
										type: 'message',
										label: 'test',
										text:
											'groupId:' +
											source.groupId +
											' 你的名字是: ' +
											profile.displayName +
											'，你的狀態是: ' +
											profile.statusMessage +
											'，你的profile是: ' +
											JSON.stringify(profile)
									}
								]
							}
						]
					}
				});
			});
	}
}

app.post('/', line.middleware(lineConfig), function(req, res) {
	Promise.all(req.body.events.map(handleEvent)).then(function(result) {
		res.json(result);
	});
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`listening on ${port}`);
});
