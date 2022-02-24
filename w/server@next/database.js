import { logger } from "https://baseless.dev/w/logger/mod.js";
import { CollectionNotFoundError, CreateDocumentError, DeleteDocumentError, DocumentNotFoundError, UpdateDocumentError, } from "https://baseless.dev/w/shared/database.js";
import { DatabasePermissions, } from "https://baseless.dev/w/worker/database.js";
import { UnknownError } from "https://baseless.dev/w/shared/server.js";
class Document {
    reference;
    metadata;
    _data;
    constructor(reference, metadata, _data) {
        this.reference = reference;
        this.metadata = metadata;
        this._data = _data;
    }
    async data() {
        return this._data;
    }
}
export class DatabaseController {
    databaseDescriptor;
    logger = logger("server/DatabaseController");
    constructor(databaseDescriptor) {
        this.databaseDescriptor = databaseDescriptor;
    }
    _findCollectionDescriptor(ref) {
        const collections = this.databaseDescriptor.collections;
        for (const desc of collections) {
            const match = ref.match(desc.matcher);
            if (match) {
                return [desc, match.groups ?? {}];
            }
        }
        return undefined;
    }
    _findDocumentDescriptor(ref) {
        const documents = this.databaseDescriptor.documents;
        for (const desc of documents) {
            const match = ref.match(desc.matcher);
            if (match) {
                return [desc, match.groups ?? {}];
            }
        }
        return undefined;
    }
    async _getPermission(context, params, handler) {
        if (typeof handler === "function") {
            return await handler(context, params);
        }
        else {
            return handler ?? DatabasePermissions.None;
        }
    }
    _testPermission(flag, permission) {
        return (flag & permission) > 0;
    }
    async get(context, reference) {
        const result = this._findDocumentDescriptor(reference.toString());
        if (result) {
            const [desc, params] = result;
            const permission = await this._getPermission(context, params ?? {}, desc.permission);
            if ((permission & DatabasePermissions.Get) > 0) {
                try {
                    const doc = await context.database.get(reference);
                    return { metadata: doc.metadata, data: await doc.data() };
                }
                catch (err) {
                    this.logger.error(`Could not get document "${reference}", got ${err}`);
                    throw new DocumentNotFoundError();
                }
            }
        }
        throw new DocumentNotFoundError();
    }
    async create(context, reference, metadata, data) {
        const result = this._findCollectionDescriptor(reference.collection.toString());
        if (result) {
            const [desc, params] = result;
            const flag = await this._getPermission(context, params ?? {}, desc.permission);
            if (this._testPermission(flag, DatabasePermissions.Create)) {
                try {
                    await context.database.create(reference, metadata, data);
                    if (desc.onCreate) {
                        const doc = new Document(reference, metadata, data ?? {});
                        await desc.onCreate(context, doc, params);
                    }
                    return {};
                }
                catch (err) {
                    this.logger.error(`Could not create document "${reference}", got ${err}`);
                    throw new CreateDocumentError();
                }
            }
        }
        throw new CollectionNotFoundError();
    }
    async update(context, reference, metadata, data, replace) {
        const result = this._findDocumentDescriptor(reference.toString());
        if (result) {
            const [desc, params] = result;
            const flag = await this._getPermission(context, params ?? {}, desc.permission);
            if (this._testPermission(flag, DatabasePermissions.Update)) {
                try {
                    if (desc.onUpdate) {
                        const before = await context.database.get(reference);
                        let after;
                        if (replace === true) {
                            await context.database.replace(reference, metadata, data);
                            after = new Document(reference, metadata, data ?? {});
                        }
                        else {
                            await context.database.update(reference, metadata, data);
                            after = new Document(reference, { ...before.metadata, ...metadata }, { ...before.data, ...data });
                        }
                        await desc.onUpdate(context, { before, after }, params);
                    }
                    else {
                        if (replace === true) {
                            await context.database.replace(reference, metadata, data);
                        }
                        else {
                            await context.database.update(reference, metadata, data);
                        }
                    }
                    return {};
                }
                catch (err) {
                    this.logger.error(`Could not update document "${reference}", got ${err}`);
                    throw new UpdateDocumentError();
                }
            }
        }
        throw new DocumentNotFoundError();
    }
    async list(context, reference, filter) {
        const result = this._findCollectionDescriptor(reference.toString());
        if (result) {
            const [desc, params] = result;
            const flag = await this._getPermission(context, params, desc.permission);
            if (this._testPermission(flag, DatabasePermissions.List)) {
                try {
                    const docs = await context.database.list(reference, filter);
                    const docsWithData = await Promise.all(docs.map(async (doc) => ({
                        ref: doc.reference.toString(),
                        metadata: doc.metadata,
                        data: await doc.data(),
                    })));
                    return { docs: docsWithData };
                }
                catch (err) {
                    this.logger.error(`Could not list collection "${reference}", got ${err}`);
                    throw new UnknownError();
                }
            }
        }
        throw new CollectionNotFoundError();
    }
    async delete(context, reference) {
        const result = this._findDocumentDescriptor(reference.toString());
        if (result) {
            const [desc, params] = result;
            const flag = await this._getPermission(context, params, desc.permission);
            if (this._testPermission(flag, DatabasePermissions.Delete)) {
                try {
                    if (desc.onDelete) {
                        const doc = await context.database.get(reference);
                        await context.database.delete(reference);
                        await desc.onDelete(context, doc, params);
                    }
                    else {
                        await context.database.delete(reference);
                    }
                    return {};
                }
                catch (err) {
                    this.logger.error(`Could not delete document "${reference}", got ${err}`);
                    throw new DeleteDocumentError();
                }
            }
        }
        throw new DocumentNotFoundError();
    }
}
