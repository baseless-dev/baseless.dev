import { NoopProviderError } from "./mod.js";
export class NoopAuthProvider {
    getUser() {
        return Promise.reject(new NoopProviderError());
    }
    getUserByEmail() {
        return Promise.reject(new NoopProviderError());
    }
    createUser() {
        return Promise.reject(new NoopProviderError());
    }
    updateUser() {
        return Promise.reject(new NoopProviderError());
    }
    deleteUser() {
        return Promise.reject(new NoopProviderError());
    }
    getSignInMethods() {
        return Promise.reject(new NoopProviderError());
    }
    addSignInMethodPassword() {
        return Promise.reject(new NoopProviderError());
    }
    updatePassword() {
        return Promise.reject(new NoopProviderError());
    }
    signInWithEmailPassword() {
        return Promise.reject(new NoopProviderError());
    }
    setEmailValidationCode() {
        return Promise.reject(new NoopProviderError());
    }
    validateEmailWithCode() {
        return Promise.reject(new NoopProviderError());
    }
    setPasswordResetCode() {
        return Promise.reject(new NoopProviderError());
    }
    resetPasswordWithCode() {
        return Promise.reject(new NoopProviderError());
    }
}
