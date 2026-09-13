const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'you@gmail.com',
        pass: 'your_app_password'
    }
});

async function sendEmail() {
    const info = await transporter.sendMail({
        from: '"My App" <you@gmail.com>',
        to: 'recipient@example.com',
        subject: 'Hello from Node.js!',
        text: 'Plain text body',
        html: '<h1>HTML body</h1><p>Hello!</p>'  // optional
    });

    console.log('Message sent:', info.messageId);
}

sendEmail();
