import nodemailer from "nodemailer";
import imapSimple from "imap-simple";

class Mailer {
    constructor() {
        this.sendArgs = {
            host: "mail.kjg-lautzkirchen.de",
            port: 587,
            secure: false,
        };
        this.receiveArgs = {
            host: "mail.kjg-lautzkirchen.de",
            port: 993,
            tls: true,
            authTimeout: 3001,
        };
        this.senders = {};
        this.receivers = {};
        this.at = "@kjg-lautzkirchen.de";
    }
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    async validate(user, password) {
        try {
            const connection = await imapSimple.connect({
                imap: {
                    ...this.receiveArgs,
                    user: user.toLowerCase() + this.at,
                    password: password,
                },
            });
            connection.end();
            return true;
        } catch (_) {
            return false;
        }
    }
    send(user, password, message) {
        if (!this.senders[user]) {
            this.senders[user] = nodemailer.createTransport({
                ...this.sendArgs,
                auth: { user: user.toLowerCase() + this.at, pass: password },
            });
        }
        return this.senders[user].sendMail({
            from: `"${this.capitalize(user)}" - KjG-Lautzkirchen`,
            to: message.to,
            subject: message.subject,
            text: message.text,
            html: `<p>${message.text}</p>`,
        });
    }
    async retrieve(user, password) {
        if (!this.receivers[user]) {
            this.receivers[user] = imapSimple.connect({
                imap: {
                    ...this.receiveArgs,
                    user: user.toLowerCase() + this.at,
                    password: password,
                },
            });
            await this.receivers[user].then((connection) =>
                connection.openBox("INBOX")
            );
        }
        const connection = await this.receivers[user];
        const messages = await connection.search(["ALL"], {
            bodies: ["HEADER", "TEXT"],
            markSeen: false,
        });

        return await messages.map((msg) => {
            const header = msg.parts.find((p) => p.which === "HEADER").body;
            const text = msg.parts.find((p) => p.which === "TEXT").body;
            return {
                from: header.from[0],
                subject: header.subject[0],
                body: text,
            };
        });
    }
}

export default Mailer;
