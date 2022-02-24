import { logger } from "https://baseless.dev/w/logger/mod.js";
export class LoggerMailProvider {
    logger = logger("provider-mail-logger");
    async send(message) {
        this.logger.info(JSON.stringify(message));
    }
}
