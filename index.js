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
			return client.getGroupMemberProfile(source.groupId, source.userId).then((profile) => {
				var type = typing(event.message.text);
				console.log('type:', type);
				if (type == 0) return;
				if (type == 3) {
					return client.replyMessage(replyToken, {
						type: 'template',
						altText: 'Datetime pickers alt text',
						template: {
							type: 'buttons',
							text: 'Select date / time !',
							actions: [
								{ type: 'datetimepicker', label: 'date', data: 'DATE', mode: 'date' },
								{ type: 'datetimepicker', label: 'time', data: 'TIME', mode: 'time' },
								{ type: 'datetimepicker', label: 'datetime', data: 'DATETIME', mode: 'datetime' }
							]
						}
					});
					// return client.replyMessage(event.replyToken, {
					// 	type: 'text',
					// 	text: '請輸入 日期 時間 地點(Optional)\n2018/10/04 10:30 西門捷運站'
					// });
				}
			});
	}
}
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
