const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

console.log('Testing SMTP connection...');
console.log('Host:', process.env.SMTP_HOST);
console.log('User:', process.env.SMTP_USER);
console.log('Pass (first 5 chars):', process.env.SMTP_PASS ? process.env.SMTP_PASS.substring(0, 5) + '...' : 'undefined');

transporter.verify(function (error, success) {
    if (error) {
        console.error('CONNECTION FAILED:');
        console.error(error);
    } else {
        console.log('CONNECTION SUCCESS! Server is ready to take our messages');
    }
});
