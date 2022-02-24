import { CollectionReference, DocumentAlreadyExistsError, DocumentReference, } from "https://baseless.dev/w/shared/database.js";
import { logger } from "https://baseless.dev/w/logger/mod.js";
const EOC = "/";
function DocumentReferenceToKey(path) {
    return `${path.collection.toString()}/${EOC}${path.id}`;
}
function keyToDocumentReference(key) {
    const segments = key.split("/");
    const collection = segments.slice(1, -2);
    const id = segments.pop();
    return new DocumentReference(new CollectionReference(...collection), id);
}
export class Document {
    reference;
    value;
    constructor(reference, value) {
        this.reference = reference;
        this.value = value;
    }
    get metadata() {
        return this.value.metadata;
    }
    data() {
        return this.value.data().then((data) => {
            if (typeof data === "string") {
                return JSON.parse(data);
            }
            else if (typeof ReadableStream !== "undefined" && data instanceof ReadableStream) {
                return new Response(data).text().then((text) => JSON.parse(text));
            }
            else if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) {
                return JSON.parse(new TextDecoder().decode(data));
            }
            else {
                return {};
            }
        });
    }
}
export class DatabaseOnKvProvider {
    backend;
    logger = logger("provider-db-on-kv");
    constructor(backend) {
        this.backend = backend;
    }
    get(reference) {
        const key = DocumentReferenceToKey(reference);
        return this.backend.get(key).then((value) => new Document(reference, value));
    }
    async list(reference, filter) {
        const prefix = `${reference}/${EOC}`;
        const values = await this.backend.list(prefix, filter);
        return values.map((value) => new Document(keyToDocumentReference(value.key), value));
    }
    async create(reference, metadata, data, options) {
        const key = DocumentReferenceToKey(reference);
        const value = await this.backend.get(key).catch((_) => undefined);
        if (value) {
            throw new DocumentAlreadyExistsError();
        }
        return this.backend.set(key, metadata, JSON.stringify(data), options);
    }
    async update(reference, metadata, data, options) {
        const key = DocumentReferenceToKey(reference);
        const doc = await this.get(reference);
        await this.backend.set(key, { ...doc.metadata, ...metadata }, JSON.stringify({ ...await doc.data(), ...data }), options);
    }
    async replace(reference, metadata, data, options) {
        const key = DocumentReferenceToKey(reference);
        await this.get(reference);
        await this.backend.set(key, metadata, JSON.stringify(data), options);
    }
    delete(reference) {
        const key = DocumentReferenceToKey(reference);
        return this.backend.delete(key);
    }
}
