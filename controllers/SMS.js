const acc_Id = process.env.ACCOUNT_ID;
const token = process.env.AUTH_TOKEN;

const client = require('twilio')(acc_Id, token);

client.messages
    .create({
        to: '[HandsetNumber]'
    })
    .then(message => console.log(message.sid));