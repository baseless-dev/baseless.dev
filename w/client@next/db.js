import { CollectionNotFoundError, doc, DocumentAlreadyExistsError, DocumentNotFoundError, InvalidCollectionReferenceError, InvalidDocumentIdentifierError, } from "https://baseless.dev/x/shared/database.js";
import { UnknownError } from "https://baseless.dev/w/shared/server.js";
export { collection, CollectionReference, doc, DocumentReference } from "https://baseless.dev/x/shared/database.js";
export class Database {
    app;
    constructor(app) {
        this.app = app;
    }
}
export class Document {
    ref;
    metadata;
    data;
    constructor(ref, metadata, data) {
        this.ref = ref;
        this.metadata = metadata;
        this.data = data;
    }
}
const errorMap = new Map([
    ["UnknownError", UnknownError],
    ["InvalidCollectionReferenceError", InvalidCollectionReferenceError],
    ["InvalidDocumentIdentifierError", InvalidDocumentIdentifierError],
    ["CollectionNotFoundError", CollectionNotFoundError],
    ["DocumentNotFoundError", DocumentNotFoundError],
    ["DocumentAlreadyExistsError", DocumentAlreadyExistsError],
]);
function dbErrorCodeToError(errorCode) {
    if (errorMap.has(errorCode)) {
        const error = errorMap.get(errorCode);
        return new error();
    }
}
export function getDatabase(app) {
    const db = new Database(app);
    return db;
}
export async function createDoc(db, ref, metadata, data) {
    const res = await db.app.send({
        cmd: "db.create",
        ref: ref.toString(),
        metadata: metadata,
        data: data,
    });
    if ("error" in res) {
        throw dbErrorCodeToError(res["error"]);
    }
    return new Document(ref, metadata, data);
}
export async function updateDoc(db, ref, metadata, data) {
    const res = await db.app.send({
        cmd: "db.update",
        ref: ref.toString(),
        metadata: metadata,
        data: data,
    });
    if ("error" in res) {
        throw dbErrorCodeToError(res["error"]);
    }
}
export async function replaceDoc(db, ref, metadata, data) {
    const res = await db.app.send({
        cmd: "db.update",
        ref: ref.toString(),
        metadata: metadata,
        data: data,
        replace: true,
    });
    if ("error" in res) {
        throw dbErrorCodeToError(res["error"]);
    }
}
export async function getDocs(db, ref, filter) {
    const res = await db.app.send({ cmd: "db.list", ref: ref.toString(), filter });
    if ("error" in res) {
        throw dbErrorCodeToError(res["error"]);
    }
    if ("docs" in res) {
        return res.docs.map((data) => new Document(doc(data.ref), data.metadata, data.data));
    }
    throw new UnknownError();
}
export async function getDoc(db, ref) {
    const res = await db.app.send({ cmd: "db.get", ref: ref.toString() });
    if ("error" in res) {
        throw dbErrorCodeToError(res["error"]);
    }
    if ("metadata" in res) {
        return new Document(ref, res.metadata, res.data);
    }
    throw new UnknownError();
}
export async function deleteDoc(db, ref) {
    const res = await db.app.send({
        cmd: "db.delete",
        ref: ref.toString(),
    });
    if ("error" in res) {
        throw dbErrorCodeToError(res["error"]);
    }
}
