import { NoopAuthProvider, NoopDatabaseProvider, NoopKVProvider, NoopMailProvider, } from "https://baseless.dev/w/provider/mod.js";
import { logger } from "https://baseless.dev/w/logger/mod.js";
import { AuthController } from "./auth.js";
import { DatabaseController } from "./database.js";
import { validator } from "./schema.js";
import { UnknownError } from "https://baseless.dev/w/shared/server.js";
import { jwtVerify } from "https://cdnjs.cloudflare.com/ajax/libs/jose/4.3.7/jwt/verify.js";
import { collection, doc } from "https://baseless.dev/w/shared/database.js";
import { ClientNotFoundError } from "https://baseless.dev/w/shared/client.js";
export class Server {
    authDescriptor;
    databaseDescriptor;
    functionsDescriptor;
    mailDescriptor;
    clientProvider;
    authProvider;
    kvProvider;
    databaseProvider;
    mailProvider;
    logger = logger("server");
    functionsHttpMap = new Map();
    authController;
    databaseController;
    constructor(authDescriptor, databaseDescriptor, functionsDescriptor, mailDescriptor, clientProvider, authProvider = new NoopAuthProvider(), kvProvider = new NoopKVProvider(), databaseProvider = new NoopDatabaseProvider(), mailProvider = new NoopMailProvider()) {
        this.authDescriptor = authDescriptor;
        this.databaseDescriptor = databaseDescriptor;
        this.functionsDescriptor = functionsDescriptor;
        this.mailDescriptor = mailDescriptor;
        this.clientProvider = clientProvider;
        this.authProvider = authProvider;
        this.kvProvider = kvProvider;
        this.databaseProvider = databaseProvider;
        this.mailProvider = mailProvider;
        this.functionsHttpMap = new Map(functionsDescriptor.https.filter((http) => http.onCall).map((http) => [http.path, http.onCall]));
        this.authController = new AuthController(this.authDescriptor);
        this.databaseController = new DatabaseController(this.databaseDescriptor);
    }
    async handleRequest(request) {
        const responseInit = {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Origin, Authorization, Content-Type, X-BASELESS-CLIENT-ID",
            },
        };
        if (!request.headers.has("X-BASELESS-CLIENT-ID")) {
            return [
                new Response(null, {
                    ...responseInit,
                    status: 401,
                }),
                [],
            ];
        }
        const client_id = request.headers.get("X-BASELESS-CLIENT-ID") ?? "";
        const client = await this.clientProvider?.getClientById(client_id).catch((_) => undefined);
        if (!client) {
            this.logger.info(`Client ID "${client_id}" not found.`);
            return [
                new Response(null, {
                    ...responseInit,
                    status: 401,
                }),
                [],
            ];
        }
        const originUrl = request.headers.get("Origin");
        if (!originUrl || !client.url.some((url) => url.indexOf(originUrl) > -1)) {
            this.logger.info(`Request's Origin not allowed for client "${client_id}".`);
            return [
                new Response(null, {
                    ...responseInit,
                    status: 401,
                }),
                [],
            ];
        }
        responseInit.headers = {
            ...responseInit.headers,
            "Access-Control-Allow-Origin": originUrl,
        };
        let currentUserId;
        if (request.headers.get("Authorization")) {
            const authorization = request.headers.get("Authorization") ?? "";
            const match = authorization.match(/(?<scheme>[^ ]+) (?<params>.+)/);
            if (match) {
                const scheme = match.groups?.scheme.toLowerCase() ?? "";
                const params = match.groups?.params ?? "";
                if (scheme === "bearer") {
                    try {
                        const { payload } = await jwtVerify(params, client.publicKey, {
                            issuer: client.principal,
                            audience: client.principal,
                        });
                        currentUserId = payload.sub ?? "";
                    }
                    catch (err) {
                        this.logger.warn(`Could not parse Authorization header, got error : ${err}`);
                    }
                }
                else {
                    this.logger.warn(`Unknown authorization scheme "${scheme}".`);
                }
            }
        }
        const waitUntilCollection = [];
        const context = {
            client,
            currentUserId,
            auth: this.authProvider,
            kv: this.kvProvider,
            database: this.databaseProvider,
            mail: this.mailProvider,
            waitUntil(promise) {
                waitUntilCollection.push(promise);
            },
        };
        const url = new URL(request.url);
        this.logger.info(`${request.method} ${url.pathname}`);
        if (request.method === "OPTIONS") {
            return [
                new Response(null, {
                    ...responseInit,
                    status: 200,
                }),
                waitUntilCollection,
            ];
        }
        if (url.pathname.length > 1) {
            const fnName = url.pathname.substring(1);
            if (this.functionsHttpMap.has(fnName)) {
                try {
                    const onCall = this.functionsHttpMap.get(fnName);
                    const result = await onCall(request, context);
                    const response = new Response(result.body, {
                        ...responseInit,
                        status: result.status,
                        statusText: result.statusText,
                        headers: { ...responseInit.headers, ...result.headers },
                    });
                    return [response, waitUntilCollection];
                }
                catch (err) {
                    this.logger.error(`Function "${fnName}" encountered an error. Got ${err}`);
                    return [
                        new Response(null, { ...responseInit, status: 500 }),
                        waitUntilCollection,
                    ];
                }
            }
            else {
                this.logger.warn(`Function "${fnName}" is not registered as HTTP function.`);
            }
            return [
                new Response(null, { ...responseInit, status: 405 }),
                waitUntilCollection,
            ];
        }
        let commands;
        const contentType = request.headers.get("Content-Type")?.toLocaleLowerCase();
        switch (contentType) {
            case "application/json": {
                let body = "";
                if (request.body) {
                    const buffer = await new Response(request.body).arrayBuffer();
                    body = new TextDecoder().decode(buffer);
                }
                try {
                    commands = JSON.parse(body);
                }
                catch (err) {
                    this.logger.error(`Could not parse JSON body, got error : ${err}`);
                    return [
                        new Response(null, { ...responseInit, status: 400 }),
                        waitUntilCollection,
                    ];
                }
                const result = validator.validate(commands);
                if (!result.valid) {
                    this.logger.error(`JSON body did not validate againts schema, got error : ${result.errors}`);
                    return [
                        new Response(JSON.stringify(result.errors), {
                            ...responseInit,
                            status: 400,
                        }),
                        waitUntilCollection,
                    ];
                }
                break;
            }
            default:
                this.logger.error(`Expected JSON payload, got "${contentType}".`);
                return [
                    new Response(null, { ...responseInit, status: 400 }),
                    waitUntilCollection,
                ];
        }
        if (!commands) {
            return [
                new Response(null, { ...responseInit, status: 400 }),
                waitUntilCollection,
            ];
        }
        const promises = Object.entries(commands)
            .map(([key, cmd]) => {
            return this.processCommand(context, cmd)
                .then((result) => [key, result])
                .catch((err) => {
                if (err instanceof Error) {
                    return [key, { error: err.name }];
                }
                this.logger.warn(`Unknown error, got ${err}`);
                return [key, { error: "UnknownError" }];
            });
        });
        const responses = await Promise.all(promises);
        const results = responses.reduce((results, [key, result]) => {
            results[key] = result;
            return results;
        }, {});
        return [
            new Response(JSON.stringify(results), { ...responseInit, status: 200 }),
            waitUntilCollection,
        ];
    }
    async handleCommand(clientId, access_token, command) {
        const client = await this.clientProvider?.getClientById(clientId);
        if (!client) {
            throw new ClientNotFoundError();
        }
        let currentUserId;
        if (access_token) {
            try {
                const { payload } = await jwtVerify(access_token, client.publicKey, {
                    issuer: client.principal,
                    audience: client.principal,
                });
                currentUserId = payload.sub ?? "";
            }
            catch (err) {
                this.logger.warn(`Could not parse Authorization header, got error : ${err}`);
            }
        }
        const waitUntilCollection = [];
        const context = {
            client,
            currentUserId,
            auth: this.authProvider,
            kv: this.kvProvider,
            database: this.databaseProvider,
            mail: this.mailProvider,
            waitUntil(promise) {
                waitUntilCollection.push(promise);
            },
        };
        return this.processCommand(context, command);
    }
    processCommand(context, cmd) {
        let p;
        if (cmd.cmd === "auth.signin-anonymously") {
            p = this.authController.createAnonymousUser(context);
        }
        else if (cmd.cmd === "auth.add-sign-with-email-password") {
            p = this.authController.addSignWithEmailPassword(context, cmd.locale, cmd.email, cmd.password);
        }
        else if (cmd.cmd === "auth.create-user-with-email-password") {
            p = this.authController.createUserWithEmail(context, cmd.locale, cmd.email, cmd.password, cmd.claimAnonymousId);
        }
        else if (cmd.cmd === "auth.send-email-validation-code") {
            p = this.authController.sendValidationEmail(context, cmd.locale, cmd.email);
        }
        else if (cmd.cmd === "auth.validate-email") {
            p = this.authController.validateEmailWithCode(context, cmd.email, cmd.code);
        }
        else if (cmd.cmd === "auth.send-password-reset-code") {
            p = this.authController.sendPasswordResetEmail(context, cmd.locale, cmd.email);
        }
        else if (cmd.cmd === "auth.reset-password") {
            p = this.authController.resetPasswordWithCode(context, cmd.email, cmd.code, cmd.password);
        }
        else if (cmd.cmd === "auth.update-password") {
            p = this.authController.updatePassword(context, cmd.newPassword);
        }
        else if (cmd.cmd === "auth.signin-with-email-password") {
            p = this.authController.signWithEmailPassword(context, cmd.email, cmd.password);
        }
        else if (cmd.cmd === "auth.refresh-tokens") {
            p = this.authController.refreshTokens(context, cmd.refresh_token);
        }
        else if (cmd.cmd === "db.get") {
            p = this.databaseController.get(context, doc(cmd.ref));
        }
        else if (cmd.cmd === "db.list") {
            p = this.databaseController.list(context, collection(cmd.ref), cmd.filter);
        }
        else if (cmd.cmd === "db.create") {
            p = this.databaseController.create(context, doc(cmd.ref), cmd.metadata, cmd.data);
        }
        else if (cmd.cmd === "db.update") {
            p = this.databaseController.update(context, doc(cmd.ref), cmd.metadata, cmd.data, cmd.replace);
        }
        else if (cmd.cmd === "db.delete") {
            p = this.databaseController.delete(context, doc(cmd.ref));
        }
        else {
            p = Promise.reject(new UnknownError());
        }
        return p;
    }
}
