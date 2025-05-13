const acc_Id = process.env.ACCOUNT_ID;
const token = process.env.AUTH_TOKEN;

const client = require('twilio')(acc_Id, token);

client.verify.v2.services("VAd8e2829df7959ec56172a2199402288b")
    .verifications
    .create({ to: '+523112415972', channel: 'sms' })
    .then(verification => console.log(verification.sid));