import { UpdatePasswordError } from "https://baseless.dev/w/shared/auth.js";
import { PasswordResetError, SetPasswordResetError, User, UserAlreadyExistsError, UserNotFoundError, ValidationCodeError, } from "https://baseless.dev/w/shared/auth.js";
import { KeyNotFoundError } from "https://baseless.dev/w/shared/kv.js";
import { autoid } from "https://baseless.dev/w/shared/autoid.js";
import { logger } from "https://baseless.dev/w/logger/mod.js";
function useridToKey(userid) {
    return `user::${userid}`;
}
export class AuthOnKvProvider {
    backend;
    logger = logger("provider-auth-on-kv");
    constructor(backend) {
        this.backend = backend;
    }
    async getUser(userid) {
        const key = useridToKey(userid);
        const value = await this.backend.get(key);
        const { email, emailConfirmed, refreshTokenId, metadata } = value.metadata;
        return new User(userid, email, emailConfirmed, refreshTokenId, metadata);
    }
    async getUserByEmail(email) {
        try {
            const { metadata: { userid } } = await this.backend.get(`email::${email}`);
            const user = await this.getUser(userid);
            return user;
        }
        catch (err) {
            if (err instanceof KeyNotFoundError) {
                throw new UserNotFoundError(email);
            }
            throw err;
        }
    }
    async createUser(email, metadata) {
        const userid = autoid();
        const existingUser = await this.getUser(userid).catch((_) => null);
        if (existingUser) {
            throw new UserAlreadyExistsError(userid);
        }
        if (email) {
            const existingUser = await this.getUserByEmail(email).catch((_) => null);
            if (existingUser) {
                throw new UserAlreadyExistsError(userid);
            }
        }
        const emailConfirmed = false;
        const refreshTokenId = autoid();
        await Promise.all([
            email ? this.backend.set(`email::${email}`, { userid }) : undefined,
            this.backend.set(useridToKey(userid), {
                email,
                emailConfirmed,
                refreshTokenId,
                metadata,
            }),
        ]);
        return new User(userid, email, emailConfirmed, refreshTokenId, metadata);
    }
    async updateUser(userid, metadata, email, emailConfirmed, refreshTokenId) {
        const key = useridToKey(userid);
        const user = await this.getUser(userid);
        await this.backend.set(key, {
            email: email ?? user.email,
            emailConfirmed: email ? false : emailConfirmed ?? user.emailConfirmed,
            refreshTokenId: refreshTokenId ?? user.refreshTokenId,
            metadata: metadata ?? user.metadata,
        });
        if (email) {
            const hadSignInPassword = await this.backend.get(`signin::password::${user.email}`).catch((_) => null);
            await Promise.all([
                email ? this.backend.set(`email::${email}`, { userid }) : undefined,
                email ? this.backend.delete(`signin::password::${user.email}`) : undefined,
                email ? this.backend.delete(`validationcode::${user.email}`) : undefined,
                email ? this.backend.delete(`passwordresetcode::${user.email}`) : undefined,
                hadSignInPassword ? this.backend.set(`signin::password::${email}`, hadSignInPassword.metadata) : undefined,
            ]);
        }
    }
    async deleteUser(userid) {
        const user = await this.getUser(userid);
        const key = useridToKey(userid);
        await Promise.all([
            user.email ? this.backend.delete(`email::${user.email}`) : undefined,
            user.email ? this.backend.delete(`signin::password::${user.email}`) : undefined,
            this.backend.delete(`validationcode::${user.email}`),
            this.backend.delete(`passwordresetcode::${user.email}`),
            this.backend.delete(`usermethod::${userid}::password`),
            this.backend.delete(key),
        ]);
    }
    async getSignInMethods(userid) {
        const prefix = `usermethod::${userid}::`;
        const values = await this.backend.list(prefix);
        return values.map((value) => value.key.substr(prefix.length));
    }
    async addSignInMethodPassword(userid, passwordHash) {
        const user = await this.getUser(userid);
        await Promise.all([
            this.backend.set(`usermethod::${userid}::password`, {}),
            this.backend.set(`signin::password::${user.email}`, {
                passwordHash,
                userid: userid,
            }),
        ]);
    }
    async updatePassword(userid, newPasswordHash) {
        try {
            const user = await this.getUser(userid);
            await this.backend.get(`usermethod::${userid}::password`);
            await this.backend.set(`signin::password::${user.email}`, {
                passwordHash: newPasswordHash,
                userid: userid,
            });
        }
        catch (_err) {
            throw new UpdatePasswordError();
        }
    }
    async signInWithEmailPassword(email, passwordHash) {
        try {
            const { metadata: { passwordHash: hash, userid }, } = await this.backend.get(`signin::password::${email}`);
            if (hash !== passwordHash) {
                throw new UserNotFoundError(email);
            }
            return await this.getUser(userid);
        }
        catch (_err) {
            throw new UserNotFoundError(email);
        }
    }
    async setEmailValidationCode(email, code) {
        const user = await this.getUserByEmail(email);
        await this.backend.set(`validationcode::${email}`, { code, userid: user.id }, undefined, { expireIn: 60 * 5 });
    }
    async validateEmailWithCode(email, code) {
        try {
            const value = await this.backend.get(`validationcode::${email}`);
            if (value.metadata.code !== code) {
                throw new ValidationCodeError();
            }
            await Promise.all([
                this.updateUser(value.metadata.userid, {}, undefined, true),
                this.backend.delete(`validationcode::${email}`),
            ]);
        }
        catch (_err) {
            throw new ValidationCodeError();
        }
    }
    async setPasswordResetCode(email, code) {
        const user = await this.getUserByEmail(email);
        try {
            await this.backend.get(`usermethod::${user.id}::password`);
            await this.backend.set(`passwordresetcode::${email}`, { code, userid: user.id }, undefined, { expireIn: 60 * 5 });
        }
        catch (_err) {
            throw new PasswordResetError();
        }
    }
    async resetPasswordWithCode(email, code, passwordHash) {
        try {
            const value = await this.backend.get(`passwordresetcode::${email}`);
            if (value.metadata.code !== code) {
                throw new ValidationCodeError();
            }
            await Promise.all([
                this.addSignInMethodPassword(value.metadata.userid, passwordHash),
                this.backend.delete(`passwordresetcode::${email}`),
            ]);
        }
        catch (_err) {
            throw new SetPasswordResetError();
        }
    }
}
