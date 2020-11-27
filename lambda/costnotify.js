const https = require('https');

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const costexplorer = new AWS.CostExplorer();


exports.handler = async function(event, context) {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const timeperiod = {
        Start: `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, 0)}-${start.getDate().toString().padStart(2, 0)}`,
        End: `${end.getFullYear()}-${(end.getMonth() + 1).toString().padStart(2, 0)}-${end.getDate().toString().padStart(2, 0)}`,
    };

    const params = {
        Granularity: 'DAILY',
        Metrics: [ 'UnblendedCost'],
        GroupBy: [{
            Type: 'DIMENSION',
            Key: 'SERVICE',
        }],
        TimePeriod: timeperiod
    };

    try {
        const data = await costexplorer.getCostAndUsage(params).promise();
        let cost = data.ResultsByTime.map((item) => {
            item.Groups.map((group) => {
                return {
                    serviceName: group.Keys,
                    value: group.Metrics.UnblendedCost.Amount
                };
            });
        });

        // falsyなデータを除く
        cost = cost.filter(v => v);

        // push Total cost
        cost.push({
            serviceName: 'Total',
            value: data.ResultsByTime[0].Total.UnblendedCost.Amount
        });

        let message = '';
        try {
            message = {
            username: 'AWS COST suido-aws',
            text: `${timeperiod.Start} cost is :money_with_wings:`,
            attachments: [
                {
                    fields: cost.map(item => {
                        return {
                            title: item.serviceName,
                            value: item.value,
                            short: true,
                        };
                    })
                }
            ]
            };
        } catch(err) {
            console.log("only total");
        }

        const opts = {
            hostname: process.env.HOST,
            port: 443,
            path: process.env.SERVICE,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(message))
            }
        };

        try {
            const slackresponsedata = await sendRequest(opts, JSON.stringify(message));
            //console.log(`slack post ${slackresponsedata}`);
        } catch (err) {
            console.log("sendReq error");
            console.log(err);
        }
    } catch(err) {
        // error
        console.log("try block error");
        return {
            statusCode: err.statusCode,
            body: err
        };
    }

    // result
    return {
        statusCode: 200,
        body: 'done'
    };
};

// https requestを非同期で
async function sendRequest(opts, replyData) {
    return new Promise(((resolve, reject) => {
        let req = https.request(opts, (response) => {
            //console.log('---response---');
            response.setEncoding('utf8');
            let body = '';
            response.on('data', (chunk)=>{
                //console.log('chunk:', chunk);
                body += chunk;
            });
            response.on('end', ()=>{
                //console.log('end:', body);
                resolve(body);
            });
        }).on('error', (err)=>{
            //console.log('error:', err.stack);
            reject(err);
        });
        req.write(replyData);
        req.end();
    }));
}
