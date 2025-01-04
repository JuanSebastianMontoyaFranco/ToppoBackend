const { SQSClient, SendMessageBatchCommand } = require('@aws-sdk/client-sqs');
require('dotenv').config({ path: '../.env' });

const sqsClient = new SQSClient({
    region: 'us-east-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

async function sendToSQS(messages, DelaySeconds) {
    const params = {
        Entries: messages.map(m => ({
            Id: createHash(),
            DelaySeconds,
            MessageAttributes: {},
            MessageBody: m,
        })),
        QueueUrl: process.env.SQS_QUEUE_URL,
    };

    try {
        const data = await sqsClient.send(new SendMessageBatchCommand(params));
        //console.log('Success', data);
        return true;
    } catch (error) {
        console.log('Error', error);
        return false;
    }
}

async function recursiveEnqueue(products, domain_shopify, token_shopify, DelaySeconds) {
    console.log(products);
    console.log(domain_shopify);
    console.log(token_shopify);
    
    
    
    console.log('Enqueuing...');
    const group = products.splice(0, 40);
    const message = {
        "operation": "create",
        "products": group,
        "domain_shopify": domain_shopify,
        "token_shopify": token_shopify
    };
    const succeed = await sendToSQS([JSON.stringify(message)], DelaySeconds);

    if (products.length > 0) {
        console.log('Creando');
        return recursiveEnqueue(products, domain_shopify, token_shopify, DelaySeconds + 32);
    } else {
        return succeed;
    }
}

async function recursiveEnqueueUpdate(products, domain_shopify, token_shopify, DelaySeconds) {
    console.log('Enqueuing...');
    const group = products.splice(0, 30);
    const message = {
        "operation": "update",
        "products": group,
        "domain_shopify": domain_shopify,
        "token_shopify": token_shopify
    };
    const succeed = await sendToSQS([JSON.stringify(message)], DelaySeconds);

    if (products.length > 0) {
        console.log('Actualizando');
        return recursiveEnqueueUpdate(products, domain_shopify, token_shopify, DelaySeconds + 30);
    } else {
        return succeed;
    }
}

function createHash() {
    let dt = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

module.exports = {
    recursiveEnqueue,
    recursiveEnqueueUpdate
};