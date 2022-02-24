import { logger } from "https://baseless.dev/w/logger/mod.js";
export class SendgridMailProvider {
    options;
    logger = logger("provider-mail-sendgrid");
    constructor(options) {
        this.options = options;
    }
    async send(message) {
        const content = [
            {
                type: "text/plain",
                value: message.text,
            },
        ];
        if (message.html) {
            content.push({ type: "text/html", value: message.html });
        }
        const body = {
            personalizations: [{
                    to: [{ email: message.to }],
                    dynamicTemplateData: this.options.dynamicTemplateData,
                }],
            subject: message.subject,
            from: this.options.from,
            replyTo: this.options.replyTo,
            content,
            templateId: this.options.templateId,
        };
        await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.options.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }
}
