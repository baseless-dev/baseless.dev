import { jwtVerify } from "https://cdnjs.cloudflare.com/ajax/libs/jose/4.3.7/jwt/verify.js";
import { AddSignInEmailPasswordError, AnonymousUserError, CreateUserError, DeleteUserError, EmailNeedsConfirmationError, EmailNotFoundError, PasswordResetError, SetPasswordResetError, SetValidationCodeError, SignInEmailPasswordError, UpdateUserError, UserAlreadyExistsError, UserNeedsAnEmailError, UserNotFoundError, ValidationCodeError, } from "https://baseless.dev/w/shared/auth.js";
import { UnknownError } from "https://baseless.dev/w/shared/server.js";
import { EventEmitter } from "./utils.js";
import { MemoryStorage } from "./storages/memory.js";
export class User {
    id;
    email;
    emailConfirmed;
    metadata;
    constructor(id, email, emailConfirmed, metadata) {
        this.id = id;
        this.email = email;
        this.emailConfirmed = emailConfirmed;
        this.metadata = metadata;
    }
}
export class Session {
    issueAt;
    expireAt;
    scope;
    constructor(issueAt, expireAt, scope) {
        this.issueAt = issueAt;
        this.expireAt = expireAt;
        this.scope = scope;
    }
}
export class Auth {
    app;
    languageCode;
    constructor(app, languageCode = "en") {
        this.app = app;
        this.languageCode = languageCode;
        app.setAuth(this);
    }
    _tokens;
    _eventOnAuthStateChange = new EventEmitter();
    _currentUser;
    _currentSession;
    _timerTokenExpired = 0;
    getCurrentUser() {
        return this._currentUser;
    }
    getCurrentSession() {
        return this._currentSession;
    }
    loadTokensFromStorage() {
        try {
            const tokens = JSON.parse(this.app.getStorage().getItem("tokens") ?? "");
            if ("id_token" in tokens && "access_token" in tokens) {
                this.setTokens(tokens);
            }
        }
        catch (_err) { }
    }
    getTokens() {
        return this._tokens;
    }
    async setTokens(tokens) {
        if (tokens) {
            const id_result = await getJWTResult(this, tokens.id_token) ?? {};
            const access_result = await getJWTResult(this, tokens.access_token) ?? {};
            const refresh_result = tokens.refresh_token ? await getJWTResult(this, tokens.refresh_token) : null;
            const expireAt = Math.max(access_result.exp ?? 0, refresh_result?.exp ?? 0) * 1000;
            const expiredIn = expireAt - Date.now();
            if (expiredIn <= 0 ||
                !("sub" in id_result && "email" in id_result && "emailConfirmed" in id_result && "metadata" in id_result)) {
                this.app.getStorage().removeItem("tokens");
                this._tokens = undefined;
                this._currentUser = undefined;
                this._currentSession = undefined;
                if (this._timerTokenExpired) {
                    clearTimeout(this._timerTokenExpired);
                    this._timerTokenExpired = 0;
                }
            }
            else {
                const user = new User(id_result.sub, id_result.email, id_result.emailConfirmed, id_result.metadata);
                const session = new Session(new Date(id_result.iat * 1000), new Date(expireAt), `${access_result.scope ?? ""}`);
                this.app.getStorage().setItem("tokens", JSON.stringify(tokens));
                this._tokens = {
                    id_token: tokens.id_token,
                    id_result,
                    access_token: tokens.access_token,
                    access_result,
                    refresh_token: tokens.refresh_token,
                    refresh_result: refresh_result ?? undefined,
                };
                this._currentUser = user;
                this._currentSession = session;
                if (this._timerTokenExpired) {
                    clearTimeout(this._timerTokenExpired);
                    this._timerTokenExpired = 0;
                }
                if (expiredIn > 0) {
                    this._timerTokenExpired = setTimeout(() => {
                        this.setTokens(undefined);
                    }, expiredIn);
                }
            }
        }
        else {
            this.app.getStorage().removeItem("tokens");
            this._tokens = undefined;
            this._currentUser = undefined;
            this._currentSession = undefined;
        }
        this._eventOnAuthStateChange.emit(this._currentUser, this._currentSession);
    }
    onAuthStateChange(handler) {
        return this._eventOnAuthStateChange.listen(handler);
    }
}
export var Persistence;
(function (Persistence) {
    Persistence["Local"] = "local";
    Persistence["Session"] = "session";
    Persistence["None"] = "none";
})(Persistence || (Persistence = {}));
const errorMap = new Map([
    ["UnknownError", UnknownError],
    ["CreateUserError", CreateUserError],
    ["DeleteUserError", DeleteUserError],
    ["UpdateUserError", UpdateUserError],
    ["UserNotFoundError", UserNotFoundError],
    ["AnonymousUserError", AnonymousUserError],
    ["EmailNotFoundError", EmailNotFoundError],
    ["PasswordResetError", PasswordResetError],
    ["ValidationCodeError", ValidationCodeError],
    ["SetPasswordResetError", SetPasswordResetError],
    ["UserNeedsAnEmailError", UserNeedsAnEmailError],
    ["UserAlreadyExistsError", UserAlreadyExistsError],
    ["SetValidationCodeError", SetValidationCodeError],
    ["SignInEmailPasswordError", SignInEmailPasswordError],
    ["EmailNeedsConfirmationError", EmailNeedsConfirmationError],
    ["AddSignInEmailPasswordError", AddSignInEmailPasswordError],
]);
function authErrorCodeToError(errorCode) {
    if (errorMap.has(errorCode)) {
        const error = errorMap.get(errorCode);
        return new error();
    }
}
export function getAuth(app) {
    let auth = app.getAuth();
    if (auth) {
        return auth;
    }
    auth = new Auth(app);
    const savedPersistence = localStorage.getItem(`baseless_persistence_${app.getClientId()}`);
    setPersistence(auth, savedPersistence ?? Persistence.None);
    auth.loadTokensFromStorage();
    return auth;
}
async function getJWTResult(auth, jwt) {
    try {
        const { payload } = await jwtVerify(jwt, auth.app.getClientPublicKey());
        return payload;
    }
    catch (_err) {
        return null;
    }
}
export function onAuthStateChanged(auth, handler) {
    return auth.onAuthStateChange(handler);
}
export async function createUserWithEmailAndPassword(auth, email, password) {
    const currentUser = auth.getCurrentUser();
    const res = await auth.app.send({
        cmd: "auth.create-user-with-email-password",
        email,
        password,
        locale: auth.languageCode,
        claimAnonymousId: currentUser && !currentUser.email ? currentUser.id : undefined,
    });
    if ("error" in res) {
        throw authErrorCodeToError(res["error"]);
    }
}
export async function sendEmailValidation(auth, email) {
    const res = await auth.app.send({ cmd: "auth.send-email-validation-code", locale: auth.languageCode, email });
    if ("error" in res) {
        throw authErrorCodeToError(res["error"]);
    }
}
export async function validateEmail(auth, code, email) {
    const res = await auth.app.send({ cmd: "auth.validate-email", email, code });
    if ("error" in res) {
        throw authErrorCodeToError(res["error"]);
    }
}
export async function sendPasswordResetEmail(auth, email) {
    const res = await auth.app.send({ cmd: "auth.send-password-reset-code", locale: auth.languageCode, email });
    if ("error" in res) {
        throw authErrorCodeToError(res["error"]);
    }
}
export async function resetPassword(auth, code, email, newPassword) {
    const res = await auth.app.send({ cmd: "auth.reset-password", email, code, password: newPassword });
    if ("error" in res) {
        throw authErrorCodeToError(res["error"]);
    }
}
export function setPersistence(auth, persistence) {
    localStorage.setItem(`baseless_persistence_${auth.app.getClientId()}`, persistence);
    switch (persistence) {
        case Persistence.Local:
            return auth.app.setStorage(localStorage);
        case Persistence.Session:
            return auth.app.setStorage(sessionStorage);
        case Persistence.None:
        default:
            return auth.app.setStorage(new MemoryStorage());
    }
}
export async function signInAnonymously(auth) {
    const res = await auth.app.send({ cmd: "auth.signin-anonymously" });
    if ("id_token" in res && "access_token" in res) {
        const { id_token, access_token, refresh_token } = res;
        await auth.setTokens({ id_token, access_token, refresh_token });
        return auth.getCurrentUser();
    }
    else if ("error" in res) {
        throw authErrorCodeToError(res["error"]);
    }
    else {
        throw new UnknownError();
    }
}
export async function signInWithEmailAndPassword(auth, email, password) {
    const res = await auth.app.send({ cmd: "auth.signin-with-email-password", email, password });
    if ("id_token" in res && "access_token" in res) {
        const { id_token, access_token, refresh_token } = res;
        await auth.setTokens({ id_token, access_token, refresh_token });
        return auth.getCurrentUser();
    }
    else if ("error" in res) {
        throw authErrorCodeToError(res["error"]);
    }
    else {
        throw new UnknownError();
    }
}
export async function signOut(auth) {
    await auth.setTokens(undefined);
}
export async function updatePassword(auth, newPassword) {
    const res = await auth.app.send({ cmd: "auth.update-password", newPassword });
    if ("error" in res) {
        throw authErrorCodeToError(res["error"]);
    }
}
