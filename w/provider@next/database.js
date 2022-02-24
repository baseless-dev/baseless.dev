import { NoopProviderError } from "./mod.js";
export class NoopDatabaseProvider {
    get() {
        return Promise.reject(new NoopProviderError());
    }
    list() {
        return Promise.reject(new NoopProviderError());
    }
    create() {
        return Promise.reject(new NoopProviderError());
    }
    update() {
        return Promise.reject(new NoopProviderError());
    }
    replace() {
        return Promise.reject(new NoopProviderError());
    }
    delete() {
        return Promise.reject(new NoopProviderError());
    }
}
