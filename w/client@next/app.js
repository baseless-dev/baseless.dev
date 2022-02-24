import { importSPKI } from "https://cdnjs.cloudflare.com/ajax/libs/jose/4.3.7/key/import.js";
import { Lock } from "./utils.js";
import { BatchTransport } from "./transports/batch.js";
import { FetchTransport } from "./transports/fetch.js";
import { PrefixedStorage } from "./storages/prefixed.js";
import { MemoryStorage } from "./storages/memory.js";
export class App {
    _clientId;
    _clientPublicKey;
    _storage;
    _transport;
    constructor(_clientId, _clientPublicKey, _storage, _transport) {
        this._clientId = _clientId;
        this._clientPublicKey = _clientPublicKey;
        this._storage = _storage;
        this._transport = _transport;
    }
    _auth;
    _refreshTokensLock = new Lock();
    getAuth() {
        return this._auth;
    }
    setAuth(auth) {
        this._auth = auth;
    }
    getClientId() {
        return this._clientId;
    }
    getClientPublicKey() {
        return this._clientPublicKey;
    }
    getStorage() {
        return this._storage;
    }
    setStorage(storage, migrateData = true, clearPrevious = true) {
        const newStorage = new PrefixedStorage(`baseless_${this._clientId}`, storage);
        if (migrateData) {
            const l = this._storage.length;
            for (let i = 0; i < l; ++i) {
                const key = this._storage.key(i);
                const value = this._storage.getItem(key);
                newStorage.setItem(key, value);
            }
        }
        if (clearPrevious) {
            this._storage.clear();
        }
        this._storage = newStorage;
    }
    getTransport() {
        return this._transport;
    }
    setTransport(transport) {
        this._transport = transport;
    }
    async send(command) {
        const auth = this.getAuth();
        if (!this._refreshTokensLock.isLock) {
            const tokens = auth?.getTokens();
            if (tokens) {
                const now = new Date();
                const access_exp = new Date((tokens.access_result.exp ?? 0) * 1000);
                if (access_exp <= now) {
                    if ("refresh_token" in tokens) {
                        const refresh_exp = new Date((tokens.refresh_result.exp ?? 0) * 1000);
                        if (refresh_exp >= now) {
                            this._refreshTokensLock.lock();
                            const res = await this._transport.send(this, {
                                cmd: "auth.refresh-tokens",
                                refresh_token: tokens.refresh_token,
                            });
                            if ("id_token" in res && "access_token" in res) {
                                await auth.setTokens(res);
                            }
                            this._refreshTokensLock.unlock();
                        }
                    }
                }
            }
        }
        else {
            await this._refreshTokensLock.waiter;
        }
        return this._transport.send(this, command);
    }
}
export function initializeApp(options) {
    const { clientId, clientPublicKey, clientPublicKeyAlg, baselessUrl } = options;
    const transport = new BatchTransport(new FetchTransport(baselessUrl));
    return initializeAppWithTransport({
        clientId,
        clientPublicKey,
        clientPublicKeyAlg,
        transport,
    });
}
export async function initializeAppWithTransport(options) {
    const publicKey = await importSPKI(options.clientPublicKey, options.clientPublicKeyAlg);
    const storage = new MemoryStorage();
    return new App(options.clientId, publicKey, storage, options.transport);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSwrQ0FBK0MsQ0FBQztBQUkzRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRWxDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUN2RCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDdkQsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQ3pELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUtyRCxNQUFNLE9BQU8sR0FBRztJQU1LO0lBQ0E7SUFDVDtJQUNBO0lBSlgsWUFDb0IsU0FBaUIsRUFDakIsZ0JBQXlCLEVBQ2xDLFFBQWlCLEVBQ2pCLFVBQXNCO1FBSGIsY0FBUyxHQUFULFNBQVMsQ0FBUTtRQUNqQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVM7UUFDbEMsYUFBUSxHQUFSLFFBQVEsQ0FBUztRQUNqQixlQUFVLEdBQVYsVUFBVSxDQUFZO0lBQzlCLENBQUM7SUFFTSxLQUFLLENBQVE7SUFDYixrQkFBa0IsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO0lBRW5DLE9BQU87UUFDYixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDbkIsQ0FBQztJQUVNLE9BQU8sQ0FBQyxJQUFVO1FBQ3hCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ25CLENBQUM7SUFFTSxXQUFXO1FBQ2pCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUN2QixDQUFDO0lBRU0sa0JBQWtCO1FBQ3hCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDO0lBQzlCLENBQUM7SUFFTSxVQUFVO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztJQUN0QixDQUFDO0lBRU0sVUFBVSxD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QUFrQixFQUFFLFdBQVcsRUFBRSxHQUFHLE9BQU8sQ0FBQztJQUMvRSxNQUFNLFNBQVMsR0FBRyxJQUFJLGNBQWMsQ0FBQyxJQUFJLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLE9BQU8sMEJBQTBCLENBQUM7UUFDakMsUUFBUTtRQUNSLGVBQWU7UUFDZixrQkFBa0I7UUFDbEIsU0FBUztLQUNULENBQUMsQ0FBQztBQUNKLENBQUM7QUFLRCxNQUFNLENBQUMsS0FBSyxVQUFVLDBCQUEwQixDQUFDLE9BS2hEO0lBQ0EsTUFBTSxTQUFTLEdBQUcsTUFBTSxVQUFVLENBQ2pDLE9BQU8sQ0FBQyxlQUFlLEVBQ3ZCLE9BQU8sQ0FBQyxrQkFBa0IsQ0FDMUIsQ0FBQztJQUNGLE1BQU0sT0FBTyxHQUFHLElBQUksYUFBYSxFQUFFLENBQUM7SUFDcEMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3pFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBpbXBvcnRTUEtJIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvam9zZUB2NC4zLjcva2V5L2ltcG9ydC50c1wiO1xuaW1wb3J0IHsgS2V5TGlrZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC94L2pvc2VAdjQuMy43L3R5cGVzLmQudHNcIjtcbmltcG9ydCB7IENvbW1hbmQsIFJlc3VsdCB9IGZyb20gXCJodHRwczovL2Jhc2VsZXNzLmRldi94L3NoYXJlZC9zZXJ2ZXIudHNcIjtcbmltcG9ydCB7IEF1dGggfSBmcm9tIFwiLi9hdXRoLnRzXCI7XG5pbXBvcnQgeyBMb2NrIH0gZnJvbSBcIi4vdXRpbHMudHNcIjtcbmltcG9ydCB7IElUcmFuc3BvcnQgfSBmcm9tIFwiLi90cmFuc3BvcnRzL21vZC50c1wiO1xuaW1wb3J0IHsgQmF0Y2hUcmFuc3BvcnQgfSBmcm9tIFwiLi90cmFuc3BvcnRzL2JhdGNoLnRzXCI7XG5pbXBvcnQgeyBGZXRjaFRyYW5zcG9ydCB9IGZyb20gXCIuL3RyYW5zcG9ydHMvZmV0Y2gudHNcIjtcbmltcG9ydCB7IFByZWZpeGVkU3RvcmFnZSB9IGZyb20gXCIuL3N0b3JhZ2VzL3ByZWZpeGVkLnRzXCI7XG5pbXBvcnQgeyBNZW1vcnlTdG9yYWdlIH0gZnJvbSBcIi4vc3RvcmFnZXMvbWVtb3J5LnRzXCI7XG5cbi8qKlxuICogQSBCYXNlbGVzc0FwcCBob2xkcyB0aGUgaW5pdGlhbGl6YXRpb24gaW5mb3JtYXRpb24gZm9yIGEgY29sbGVjdGlvbiBvZiBzZXJ2aWNlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEFwcCB7XG5cdC8qKlxuXHQgKiBDb25zdHJ1Y3QgYW4gYEFwcGAgb2JqZWN0XG5cdCAqIEBpbnRlcm5hbFxuXHQgKi9cblx0cHVibGljIGNvbnN0cnVjdG9yKFxuXHRcdHByb3RlY3RlZCByZWFkb25seSBfY2xpZW50SWQ6IHN0cmluZyxcblx0XHRwcm90ZWN0ZWQgcmVhZG9ubHkgX2NsaWVudFB1YmxpY0tleTogS2V5TGlrZSxcblx0XHRwcm90ZWN0ZWQgX3N0b3JhZ2U6IFN0b3JhZ2UsXG5cdFx0cHJvdGVjdGVkIF90cmFuc3BvcnQ6IElUcmFuc3BvcnQsXG5cdCkge31cblxuXHRwcm90ZWN0ZWQgX2F1dGg/OiBBdXRoO1xuXHRwcm90ZWN0ZWQgX3JlZnJlc2hUb2tlbnNMb2NrID0gbmV3IExvY2soKTtcblxuXHRwdWJsaWMgZ2V0QXV0aCgpOiBBdXRoIHwgdW5kZWZpbmVkIHtcblx0XHRyZXR1cm4gdGhpcy5fYXV0aDtcblx0fVxuXG5cdHB1YmxpYyBzZXRBdXRoKGF1dGg6IEF1dGgpIHtcblx0XHR0aGlzLl9hdXRoID0gYXV0aDtcblx0fVxuXG5cdHB1YmxpYyBnZXRDbGllbnRJZCgpIHtcblx0XHRyZXR1cm4gdGhpcy5fY2xpZW50SWQ7XG5cdH1cblxuXHRwdWJsaWMgZ2V0Q2xpZW50UHVibGljS2V5KCkge1xuXHRcdHJldHVybiB0aGlzLl9jbGllbnRQdWJsaWNLZXk7XG5cdH1cblxuXHRwdWJsaWMgZ2V0U3RvcmFnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fc3RvcmFnZTtcblx0fVxuXG5cdHB1YmxpYyBzZXRTdG9yYWdlKHN0b3JhZ2U6IFN0b3JhZ2UsIG1pZ3JhdGVEYXRhID0gdHJ1ZSwgY2xlYXJQcmV2aW91cyA9IHRydWUpIHtcblx0XHRjb25zdCBuZXdTdG9yYWdlID0gbmV3IFByZWZpeGVkU3RvcmFnZShgYmFzZWxlc3NfJHt0aGlzLl9jbGllbnRJZH1gLCBzdG9yYWdlKTtcblx0XHRpZiAobWlncmF0ZURhdGEpIHtcblx0XHRcdGNvbnN0IGwgPSB0aGlzLl9zdG9yYWdlLmxlbmd0aDtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbDsgKytpKSB7XG5cdFx0XHRcdGNvbnN0IGtleSA9IHRoaXMuX3N0b3JhZ2Uua2V5KGkpITtcblx0XHRcdFx0Y29uc3QgdmFsdWUgPSB0aGlzLl9zdG9yYWdlLmdldEl0ZW0oa2V5KSE7XG5cdFx0XHRcdG5ld1N0b3JhZ2Uuc2V0SXRlbShrZXksIHZhbHVlKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKGNsZWFyUHJldmlvdXMpIHtcblx0XHRcdHRoaXMuX3N0b3JhZ2UuY2xlYXIoKTtcblx0XHR9XG5cdFx0dGhpcy5fc3RvcmFnZSA9IG5ld1N0b3JhZ2U7XG5cdH1cblxuXHRwdWJsaWMgZ2V0VHJhbnNwb3J0KCkge1xuXHRcdHJldHVybiB0aGlzLl90cmFuc3BvcnQ7XG5cdH1cblxuXHRwdWJsaWMgc2V0VHJhbnNwb3J0KHRyYW5zcG9ydDogSVRyYW5zcG9ydCkge1xuXHRcdHRoaXMuX3RyYW5zcG9ydCA9IHRyYW5zcG9ydDtcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBzZW5kKGNvbW1hbmQ6IENvbW1hbmQpOiBQcm9taXNlPFJlc3VsdD4ge1xuXHRcdGNvbnN0IGF1dGggPSB0aGlzLmdldEF1dGgoKTtcblx0XHRpZiAoIXRoaXMuX3JlZnJlc2hUb2tlbnNMb2NrLmlzTG9jaykge1xuXHRcdFx0Ly8gQ2hlY2sgdG9rZW5zIGV4cGlyYXRpb24gYW5kIHRyeSB0byBmZXRjaCBuZXcgb25lIGlmIG5lZWRlZFxuXHRcdFx0Y29uc3QgdG9rZW5zID0gYXV0aD8uZ2V0VG9rZW5zKCk7XG5cdFx0XHRpZiAodG9rZW5zKSB7XG5cdFx0XHRcdGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG5cdFx0XHRcdGNvbnN0IGFjY2Vzc19leHAgPSBuZXcgRGF0ZSgodG9rZW5zLmFjY2Vzc19yZXN1bHQuZXhwID8/IDApICogMTAwMCk7XG5cdFx0XHRcdC8vIEFjY2VzcyB0b2tlbiBpcyBleHBpcmVkXG5cdFx0XHRcdGlmIChhY2Nlc3NfZXhwIDw9IG5vdykge1xuXHRcdFx0XHRcdC8vIElmIHZhbGlkIHJlZnJlc2ggdG9rZW4sIHRyeSByZWZyZXNoaW5nIHRva2Vuc1xuXHRcdFx0XHRcdGlmIChcInJlZnJlc2hfdG9rZW5cIiBpbiB0b2tlbnMpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHJlZnJlc2hfZXhwID0gbmV3IERhdGUoKHRva2Vucy5yZWZyZXNoX3Jlc3VsdC5leHAgPz8gMCkgKiAxMDAwKTtcblx0XHRcdFx0XHRcdGlmIChyZWZyZXNoX2V4cCA+PSBub3cpIHtcblx0XHRcdFx0XHRcdFx0Ly8gUHJldmVudCBvdGhlciBjb21tYW5kIGZyb20gcmVmcmVzaGluZyB0aGUgdG9rZW5cblx0XHRcdFx0XHRcdFx0dGhpcy5fcmVmcmVzaFRva2Vuc0xvY2subG9jaygpO1xuXHRcdFx0XHRcdFx0XHRjb25zdCByZXMgPSBhd2FpdCB0aGlzLl90cmFuc3BvcnQuc2VuZCh0aGlzLCB7XG5cdFx0XHRcdFx0XHRcdFx0Y21kOiBcImF1dGgucmVmcmVzaC10b2tlbnNcIixcblx0XHRcdFx0XHRcdFx0XHRyZWZyZXNoX3Rva2VuOiB0b2tlbnMucmVmcmVzaF90b2tlbixcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdGlmIChcImlkX3Rva2VuXCIgaW4gcmVzICYmIFwiYWNjZXNzX3Rva2VuXCIgaW4gcmVzKSB7XG5cdFx0XHRcdFx0XHRcdFx0YXdhaXQgYXV0aCEuc2V0VG9rZW5zKHJlcyk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0Ly8gVW5sb2NrIG90aGVyIGNvbW1hbmRzXG5cdFx0XHRcdFx0XHRcdHRoaXMuX3JlZnJlc2hUb2tlbnNMb2NrLnVubG9jaygpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBXYWl0IGZvciBwcmV2aW91cyByZWZyZXNoIHRva2VuIHRvIGZpbmlzaFxuXHRcdFx0YXdhaXQgdGhpcy5fcmVmcmVzaFRva2Vuc0xvY2sud2FpdGVyO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5fdHJhbnNwb3J0LnNlbmQodGhpcywgY29tbWFuZCk7XG5cdH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuZCBpbml0aWFsaXplcyBhIGBCYXNlbGVzc0FwcGAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0aWFsaXplQXBwKG9wdGlvbnM6IHtcblx0YmFzZWxlc3NVcmw6IHN0cmluZztcblx0Y2xpZW50SWQ6IHN0cmluZztcblx0Y2xpZW50UHVibGljS2V5OiBzdHJpbmc7XG5cdGNsaWVudFB1YmxpY0tleUFsZzogc3RyaW5nO1xufSkge1xuXHRjb25zdCB7IGNsaWVudElkLCBjbGllbnRQdWJsaWNLZXksIGNsaWVudFB1YmxpY0tleUFsZywgYmFzZWxlc3NVcmwgfSA9IG9wdGlvbnM7XG5cdGNvbnN0IHRyYW5zcG9ydCA9IG5ldyBCYXRjaFRyYW5zcG9ydChuZXcgRmV0Y2hUcmFuc3BvcnQoYmFzZWxlc3NVcmwpKTtcblx0cmV0dXJuIGluaXRpYWxpemVBcHBXaXRoVHJhbnNwb3J0KHtcblx0XHRjbGllbnRJZCxcblx0XHRjbGllbnRQdWJsaWNLZXksXG5cdFx0Y2xpZW50UHVibGljS2V5QWxnLFxuXHRcdHRyYW5zcG9ydCxcblx0fSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgaW5pdGlhbGl6ZXMgYSBgQmFzZWxlc3NBcHBgIHdpdGggSVRyYW5zcG9ydFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZUFwcFdpdGhUcmFuc3BvcnQob3B0aW9uczoge1xuXHRjbGllbnRJZDogc3RyaW5nO1xuXHRjbGllbnRQdWJsaWNLZXk6IHN0cmluZztcblx0Y2xpZW50UHVibGljS2V5QWxnOiBzdHJpbmc7XG5cdHRyYW5zcG9ydDogSVRyYW5zcG9ydDtcbn0pIHtcblx0Y29uc3QgcHVibGljS2V5ID0gYXdhaXQgaW1wb3J0U1BLSShcblx0XHRvcHRpb25zLmNsaWVudFB1YmxpY0tleSxcblx0XHRvcHRpb25zLmNsaWVudFB1YmxpY0tleUFsZyxcblx0KTtcblx0Y29uc3Qgc3RvcmFnZSA9IG5ldyBNZW1vcnlTdG9yYWdlKCk7XG5cdHJldHVybiBuZXcgQXBwKG9wdGlvbnMuY2xpZW50SWQsIHB1YmxpY0tleSwgc3RvcmFnZSwgb3B0aW9ucy50cmFuc3BvcnQpO1xufVxuIl19
