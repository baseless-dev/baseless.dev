import { autoid } from "./autoid.js";
export class CollectionReference {
    segments;
    constructor(...segments) {
        if (segments.length % 2 == 0 ||
            segments.some((s) => s.length === 0)) {
            throw new InvalidCollectionReferenceError();
        }
        this.segments = segments;
    }
    toString() {
        return `/${this.segments.join("/")}`;
    }
}
export function collection(...segments) {
    if (segments.length === 1 && segments[0][0] === "/") {
        segments = segments[0].replace(/^\//, "").replace(/\/$/, "").split("/");
    }
    return new CollectionReference(...segments);
}
export class DocumentReference {
    collection;
    id;
    constructor(collection, id) {
        this.collection = collection;
        if (!id) {
            id = autoid();
        }
        if (!id?.trim() || id.match(/[/]/)) {
            throw new InvalidDocumentIdentifierError();
        }
        this.id = id;
    }
    toString() {
        return `${this.collection.toString()}/${this.id}`;
    }
}
export function doc(collection, ...segments) {
    if (collection instanceof CollectionReference) {
        return segments.length ? new DocumentReference(collection, segments[0]) : new DocumentReference(collection);
    }
    segments.unshift(collection);
    if (segments.length === 1 && segments[0][0] === "/") {
        segments = segments[0].replace(/^\//, "").replace(/\/$/, "").split("/");
    }
    const id = segments.pop();
    return new DocumentReference(new CollectionReference(...segments), id);
}
export class InvalidCollectionReferenceError extends Error {
    name = "InvalidCollectionReferenceError";
}
export class InvalidDocumentIdentifierError extends Error {
    name = "InvalidDocumentIdentifierError";
}
export class CollectionNotFoundError extends Error {
    name = "CollectionNotFoundError";
}
export class DocumentNotFoundError extends Error {
    name = "DocumentNotFoundError";
}
export class DocumentAlreadyExistsError extends Error {
    name = "DocumentAlreadyExistsError";
}
export class CreateDocumentError extends Error {
    name = "CreateDocumentError";
}
export class UpdateDocumentError extends Error {
    name = "UpdateDocumentError";
}
export class ReplaceDocumentError extends Error {
    name = "ReplaceDocumentError";
}
export class DeleteDocumentError extends Error {
    name = "DeleteDocumentError";
}
