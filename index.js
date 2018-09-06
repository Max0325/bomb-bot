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
					altText: 'This is a buttons template',
					template: {
						type: 'buttons',
						thumbnailImageUrl: 'https://example.com/bot/images/image.jpg',
						imageAspectRatio: 'rectangle',
						imageSize: 'cover',
						imageBackgroundColor: '#FFFFFF',
						title: 'Menu',
						text: 'Please select',
						defaultAction: {
							type: 'uri',
							label: 'View detail',
							uri: 'http://example.com/page/123'
						},
						actions: [
							{
								type: 'postback',
								label: 'Buy',
								data: 'action=buy&itemid=123'
							},
							{
								type: 'postback',
								label: 'Add to cart',
								data: 'action=add&itemid=123'
							},
							{
								type: 'uri',
								label: 'View detail',
								uri: 'http://example.com/page/123',
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
