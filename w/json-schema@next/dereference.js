import { encodePointer } from "./pointer.js";
export const schemaKeyword = {
    additionalItems: true,
    unevaluatedItems: true,
    items: true,
    contains: true,
    additionalProperties: true,
    unevaluatedProperties: true,
    propertyNames: true,
    not: true,
    if: true,
    then: true,
    else: true,
};
export const schemaArrayKeyword = {
    prefixItems: true,
    items: true,
    allOf: true,
    anyOf: true,
    oneOf: true,
};
export const schemaMapKeyword = {
    $defs: true,
    definitions: true,
    properties: true,
    patternProperties: true,
    dependentSchemas: true,
};
export const ignoredKeyword = {
    id: true,
    $id: true,
    $ref: true,
    $schema: true,
    $anchor: true,
    $vocabulary: true,
    $comment: true,
    default: true,
    enum: true,
    const: true,
    required: true,
    type: true,
    maximum: true,
    minimum: true,
    exclusiveMaximum: true,
    exclusiveMinimum: true,
    multipleOf: true,
    maxLength: true,
    minLength: true,
    pattern: true,
    format: true,
    maxItems: true,
    minItems: true,
    uniqueItems: true,
    maxProperties: true,
    minProperties: true,
};
export let initialBaseURI = typeof self !== "undefined" && self.location
    ?
        new URL(self.location.origin + self.location.pathname + location.search)
    : new URL("https://github.com/cfworker");
export function dereference(schema, lookup = Object.create(null), baseURI = initialBaseURI, basePointer = "") {
    if (schema && typeof schema === "object" && !Array.isArray(schema)) {
        const id = schema.$id || schema.id;
        if (id) {
            const url = new URL(id, baseURI.href);
            if (url.hash.length > 1) {
                lookup[url.href] = schema;
            }
            else {
                url.hash = "";
                if (basePointer === "") {
                    baseURI = url;
                }
                else {
                    dereference(schema, lookup, baseURI);
                }
            }
        }
    }
    else if (schema !== true && schema !== false) {
        return lookup;
    }
    const schemaURI = baseURI.href + (basePointer ? "#" + basePointer : "");
    if (lookup[schemaURI] !== undefined) {
        throw new Error(`Duplicate schema URI "${schemaURI}".`);
    }
    lookup[schemaURI] = schema;
    if (schema === true || schema === false) {
        return lookup;
    }
    if (schema.__absolute_uri__ === undefined) {
        Object.defineProperty(schema, "__absolute_uri__", {
            enumerable: false,
            value: schemaURI,
        });
    }
    if (schema.$ref && schema.__absolute_ref__ === undefined) {
        const url = new URL(schema.$ref, baseURI.href);
        url.hash = url.hash;
        Object.defineProperty(schema, "__absolute_ref__", {
            enumerable: false,
            value: url.href,
        });
    }
    if (schema.$recursiveRef && schema.__absolute_recursive_ref__ === undefined) {
        const url = new URL(schema.$recursiveRef, baseURI.href);
        url.hash = url.hash;
        Object.defineProperty(schema, "__absolute_recursive_ref__", {
            enumerable: false,
            value: url.href,
        });
    }
    if (schema.$anchor) {
        const url = new URL("#" + schema.$anchor, baseURI.href);
        lookup[url.href] = schema;
    }
    for (let key in schema) {
        if (ignoredKeyword[key]) {
            continue;
        }
        const keyBase = `${basePointer}/${encodePointer(key)}`;
        const subSchema = schema[key];
        if (Array.isArray(subSchema)) {
            if (schemaArrayKeyword[key]) {
                const length = subSchema.length;
                for (let i = 0; i < length; i++) {
                    dereference(subSchema[i], lookup, baseURI, `${keyBase}/${i}`);
                }
            }
        }
        else if (schemaMapKeyword[key]) {
            for (let subKey in subSchema) {
                dereference(subSchema[subKey], lookup, baseURI, `${keyBase}/${encodePointer(subKey)}`);
            }
        }
        else {
            dereference(subSchema, lookup, baseURI, keyBase);
        }
    }
    return lookup;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVyZWZlcmVuY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkZXJlZmVyZW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBRzdDLE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBNEI7SUFDckQsZUFBZSxFQUFFLElBQUk7SUFDckIsZ0JBQWdCLEVBQUUsSUFBSTtJQUN0QixLQUFLLEVBQUUsSUFBSTtJQUNYLFFBQVEsRUFBRSxJQUFJO0lBQ2Qsb0JBQW9CLEVBQUUsSUFBSTtJQUMxQixxQkFBcUIsRUFBRSxJQUFJO0lBQzNCLGFBQWEsRUFBRSxJQUFJO0lBQ25CLEdBQUcsRUFBRSxJQUFJO0lBQ1QsRUFBRSxFQUFFLElBQUk7SUFDUixJQUFJLEVBQUUsSUFBSTtJQUNWLElBQUksRUFBRSxJQUFJO0NBQ1YsQ0FBQztBQUVGLE1BQU0sQ0FBQyxNQUFNLGtCQUFrQixHQUE0QjtJQUMxRCxXQUFXLEVBQUUsSUFBSTtJQUNqQixLQUFLLEVBQUUsSUFBSTtJQUNYLEtBQUssRUFBRSxJQUFJO0lBQ1gsS0FBSyxFQUFFLElBQUk7SUFDWCxLQUFLLEVBQUUsSUFBSTtDQUNYLENBQUM7QUFFRixNQUFNLENBQUMsTUFBTSxnQkFBZ0IsR0FBNEI7SUFDeEQsS0FBSyxFQUFFLElBQUk7SUFDWCxXQUFXLEVBQUUsSUFBSTtJQUNqQixVQUFVLEVBQUUsSUFBSTtJQUNoQixpQkFBaUIsRUFBRSxJQUFJO0lBQ3ZCLGdCQUFnQixFQUFFLElBQUk7Q0FDdEIsQ0FBQztBQUVGLE1BQU0sQ0FBQyxNQUFNLGNBQWMsR0FBNEI7SUFDdEQsRUFBRSxFQUFFLElBQUk7SUFDUixHQUFHLEVBQUUsSUFBSTtJQUNULElBQUksRUFBRSxJQUFJO0lBQ1YsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtJQUNiLFdBQVcsRUFBRSxJQUFJO0lBQ2pCLFFBQVEsRUFBRSxJQUFJO0lBQ2QsT0FBTyxF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QixTQUFTO1NBQ1Q7UUFDRCxNQUFNLE9BQU8sR0FBRyxHQUFHLFdBQVcsSUFBSSxhQUFhLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUN2RCxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQzdCLElBQUksa0JBQWtCLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQzVCLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7Z0JBQ2hDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ2hDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUM5RDthQUNEO1NBQ0Q7YUFBTSxJQUFJLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ2pDLEtBQUssSUFBSSxNQUFNLElBQUksU0FBUyxFQUFFO2dCQUM3QixXQUFXLENBQ1YsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUNqQixNQUFNLEVBQ04sT0FBTyxFQUNQLEdBQUcsT0FBTyxJQUFJLGFBQWEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUNyQyxDQUFDO2FBQ0Y7U0FDRDthQUFNO1lBQ04sV0FBVyxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ2pEO0tBQ0Q7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBlbmNvZGVQb2ludGVyIH0gZnJvbSBcIi4vcG9pbnRlci50c1wiO1xuaW1wb3J0IHsgU2NoZW1hIH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcblxuZXhwb3J0IGNvbnN0IHNjaGVtYUtleXdvcmQ6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+ID0ge1xuXHRhZGRpdGlvbmFsSXRlbXM6IHRydWUsXG5cdHVuZXZhbHVhdGVkSXRlbXM6IHRydWUsXG5cdGl0ZW1zOiB0cnVlLFxuXHRjb250YWluczogdHJ1ZSxcblx0YWRkaXRpb25hbFByb3BlcnRpZXM6IHRydWUsXG5cdHVuZXZhbHVhdGVkUHJvcGVydGllczogdHJ1ZSxcblx0cHJvcGVydHlOYW1lczogdHJ1ZSxcblx0bm90OiB0cnVlLFxuXHRpZjogdHJ1ZSxcblx0dGhlbjogdHJ1ZSxcblx0ZWxzZTogdHJ1ZSxcbn07XG5cbmV4cG9ydCBjb25zdCBzY2hlbWFBcnJheUtleXdvcmQ6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+ID0ge1xuXHRwcmVmaXhJdGVtczogdHJ1ZSxcblx0aXRlbXM6IHRydWUsXG5cdGFsbE9mOiB0cnVlLFxuXHRhbnlPZjogdHJ1ZSxcblx0b25lT2Y6IHRydWUsXG59O1xuXG5leHBvcnQgY29uc3Qgc2NoZW1hTWFwS2V5d29yZDogUmVjb3JkPHN0cmluZywgYm9vbGVhbj4gPSB7XG5cdCRkZWZzOiB0cnVlLFxuXHRkZWZpbml0aW9uczogdHJ1ZSxcblx0cHJvcGVydGllczogdHJ1ZSxcblx0cGF0dGVyblByb3BlcnRpZXM6IHRydWUsXG5cdGRlcGVuZGVudFNjaGVtYXM6IHRydWUsXG59O1xuXG5leHBvcnQgY29uc3QgaWdub3JlZEtleXdvcmQ6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+ID0ge1xuXHRpZDogdHJ1ZSxcblx0JGlkOiB0cnVlLFxuXHQkcmVmOiB0cnVlLFxuXHQkc2NoZW1hOiB0cnVlLFxuXHQkYW5jaG9yOiB0cnVlLFxuXHQkdm9jYWJ1bGFyeTogdHJ1ZSxcblx0JGNvbW1lbnQ6IHRydWUsXG5cdGRlZmF1bHQ6IHRydWUsXG5cdGVudW06IHRydWUsXG5cdGNvbnN0OiB0cnVlLFxuXHRyZXF1aXJlZDogdHJ1ZSxcblx0dHlwZTogdHJ1ZSxcblx0bWF4aW11bTogdHJ1ZSxcblx0bWluaW11bTogdHJ1ZSxcblx0ZXhjbHVzaXZlTWF4aW11bTogdHJ1ZSxcblx0ZXhjbHVzaXZlTWluaW11bTogdHJ1ZSxcblx0bXVsdGlwbGVPZjogdHJ1ZSxcblx0bWF4TGVuZ3RoOiB0cnVlLFxuXHRtaW5MZW5ndGg6IHRydWUsXG5cdHBhdHRlcm46IHRydWUsXG5cdGZvcm1hdDogdHJ1ZSxcblx0bWF4SXRlbXM6IHRydWUsXG5cdG1pbkl0ZW1zOiB0cnVlLFxuXHR1bmlxdWVJdGVtczogdHJ1ZSxcblx0bWF4UHJvcGVydGllczogdHJ1ZSxcblx0bWluUHJvcGVydGllczogdHJ1ZSxcbn07XG5cbi8qKlxuICogRGVmYXVsdCBiYXNlIFVSSSBmb3Igc2NoZW1hcyB3aXRob3V0IGFuICRpZC5cbiAqIGh0dHBzOi8vanNvbi1zY2hlbWEub3JnL2RyYWZ0LzIwMTktMDkvanNvbi1zY2hlbWEtY29yZS5odG1sI2luaXRpYWwtYmFzZVxuICogaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM5ODYjc2VjdGlvbi01LjFcbiAqL1xuZXhwb3J0IGxldCBpbml0aWFsQmFzZVVSSSA9XG5cdC8vIEB0cy1pZ25vcmVcblx0dHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgJiYgc2VsZi5sb2NhdGlvblxuXHRcdD8gLy9AdHMtaWdub3JlXG5cdFx0XHRuZXcgVVJMKHNlbGYubG9jYXRpb24ub3JpZ2luICsgc2VsZi5sb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLnNlYXJjaClcblx0XHQ6IG5ldyBVUkwoXCJodHRwczovL2dpdGh1Yi5jb20vY2Z3b3JrZXJcIik7XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXJlZmVyZW5jZShcblx0c2NoZW1hOiBTY2hlbWEgfCBib29sZWFuLFxuXHRsb29rdXA6IFJlY29yZDxzdHJpbmcsIFNjaGVtYSB8IGJvb2xlYW4+ID0gT2JqZWN0LmNyZWF0ZShudWxsKSxcblx0YmFzZVVSSSA9IGluaXRpYWxCYXNlVVJJLFxuXHRiYXNlUG9pbnRlciA9IFwiXCIsXG4pIHtcblx0aWYgKHNjaGVtYSAmJiB0eXBlb2Ygc2NoZW1hID09PSBcIm9iamVjdFwiICYmICFBcnJheS5pc0FycmF5KHNjaGVtYSkpIHtcblx0XHRjb25zdCBpZDogc3RyaW5nID0gc2NoZW1hLiRpZCB8fCBzY2hlbWEuaWQ7XG5cdFx0aWYgKGlkKSB7XG5cdFx0XHRjb25zdCB1cmwgPSBuZXcgVVJMKGlkLCBiYXNlVVJJLmhyZWYpO1xuXHRcdFx0aWYgKHVybC5oYXNoLmxlbmd0aCA+IDEpIHtcblx0XHRcdFx0bG9va3VwW3VybC5ocmVmXSA9IHNjaGVtYTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHVybC5oYXNoID0gXCJcIjsgLy8gbm9ybWFsaXplIGhhc2ggaHR0cHM6Ly91cmwuc3BlYy53aGF0d2cub3JnLyNkb20tdXJsLWhhc2hcblx0XHRcdFx0aWYgKGJhc2VQb2ludGVyID09PSBcIlwiKSB7XG5cdFx0XHRcdFx0YmFzZVVSSSA9IHVybDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRkZXJlZmVyZW5jZShzY2hlbWEsIGxvb2t1cCwgYmFzZVVSSSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSBpZiAoc2NoZW1hICE9PSB0cnVlICYmIHNjaGVtYSAhPT0gZmFsc2UpIHtcblx0XHRyZXR1cm4gbG9va3VwO1xuXHR9XG5cblx0Ly8gY29tcHV0ZSB0aGUgc2NoZW1hJ3MgVVJJIGFuZCBhZGQgaXQgdG8gdGhlIG1hcHBpbmcuXG5cdGNvbnN0IHNjaGVtYVVSSSA9IGJhc2VVUkkuaHJlZiArIChiYXNlUG9pbnRlciA/IFwiI1wiICsgYmFzZVBvaW50ZXIgOiBcIlwiKTtcblx0aWYgKGxvb2t1cFtzY2hlbWFVUkldICE9PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYER1cGxpY2F0ZSBzY2hlbWEgVVJJIFwiJHtzY2hlbWFVUkl9XCIuYCk7XG5cdH1cblx0bG9va3VwW3NjaGVtYVVSSV0gPSBzY2hlbWE7XG5cblx0Ly8gZXhpdCBlYXJseSBpZiB0aGlzIGlzIGEgYm9vbGVhbiBzY2hlbWEuXG5cdGlmIChzY2hlbWEgPT09IHRydWUgfHwgc2NoZW1hID09PSBmYWxzZSkge1xuXHRcdHJldHVybiBsb29rdXA7XG5cdH1cblxuXHQvLyBzZXQgdGhlIHNjaGVtYSdzIGFic29sdXRlIFVSSS5cblx0aWYgKHNjaGVtYS5fX2Fic29sdXRlX3VyaV9fID09PSB1bmRlZmluZWQpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoc2NoZW1hLCBcIl9fYWJzb2x1dGVfdXJpX19cIiwge1xuXHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0XHR2YWx1ZTogc2NoZW1hVVJJLFxuXHRcdH0pO1xuXHR9XG5cblx0Ly8gaWYgYSAkcmVmIGlzIGZvdW5kLCByZXNvbHZlIGl0J3MgYWJzb2x1dGUgVVJJLlxuXHRpZiAoc2NoZW1hLiRyZWYgJiYgc2NoZW1hLl9fYWJzb2x1dGVfcmVmX18gPT09IHVuZGVmaW5lZCkge1xuXHRcdGNvbnN0IHVybCA9IG5ldyBVUkwoc2NoZW1hLiRyZWYsIGJhc2VVUkkuaHJlZik7XG5cdFx0dXJsLmhhc2ggPSB1cmwuaGFzaDsgLy8gbm9ybWFsaXplIGhhc2ggaHR0cHM6Ly91cmwuc3BlYy53aGF0d2cub3JnLyNkb20tdXJsLWhhc2hcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoc2NoZW1hLCBcIl9fYWJzb2x1dGVfcmVmX19cIiwge1xuXHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0XHR2YWx1ZTogdXJsLmhyZWYsXG5cdFx0fSk7XG5cdH1cblxuXHQvLyBpZiBhICRyZWN1cnNpdmVSZWYgaXMgZm91bmQsIHJlc29sdmUgaXQncyBhYnNvbHV0ZSBVUkkuXG5cdGlmIChzY2hlbWEuJHJlY3Vyc2l2ZVJlZiAmJiBzY2hlbWEuX19hYnNvbHV0ZV9yZWN1cnNpdmVfcmVmX18gPT09IHVuZGVmaW5lZCkge1xuXHRcdGNvbnN0IHVybCA9IG5ldyBVUkwoc2NoZW1hLiRyZWN1cnNpdmVSZWYsIGJhc2VVUkkuaHJlZik7XG5cdFx0dXJsLmhhc2ggPSB1cmwuaGFzaDsgLy8gbm9ybWFsaXplIGhhc2ggaHR0cHM6Ly91cmwuc3BlYy53aGF0d2cub3JnLyNkb20tdXJsLWhhc2hcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoc2NoZW1hLCBcIl9fYWJzb2x1dGVfcmVjdXJzaXZlX3JlZl9fXCIsIHtcblx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxuXHRcdFx0dmFsdWU6IHVybC5ocmVmLFxuXHRcdH0pO1xuXHR9XG5cblx0Ly8gaWYgYW4gJGFuY2hvciBpcyBmb3VuZCwgY29tcHV0ZSBpdCdzIFVSSSBhbmQgYWRkIGl0IHRvIHRoZSBtYXBwaW5nLlxuXHRpZiAoc2NoZW1hLiRhbmNob3IpIHtcblx0XHRjb25zdCB1cmwgPSBuZXcgVVJMKFwiI1wiICsgc2NoZW1hLiRhbmNob3IsIGJhc2VVUkkuaHJlZik7XG5cdFx0bG9va3VwW3VybC5ocmVmXSA9IHNjaGVtYTtcblx0fVxuXG5cdC8vIHByb2Nlc3Mgc3Vic2NoZW1hcy5cblx0Zm9yIChsZXQga2V5IGluIHNjaGVtYSkge1xuXHRcdGlmIChpZ25vcmVkS2V5d29yZFtrZXldKSB7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cdFx0Y29uc3Qga2V5QmFzZSA9IGAke2Jhc2VQb2ludGVyfS8ke2VuY29kZVBvaW50ZXIoa2V5KX1gO1xuXHRcdGNvbnN0IHN1YlNjaGVtYSA9IHNjaGVtYVtrZXldO1xuXHRcdGlmIChBcnJheS5pc0FycmF5KHN1YlNjaGVtYSkpIHtcblx0XHRcdGlmIChzY2hlbWFBcnJheUtleXdvcmRba2V5XSkge1xuXHRcdFx0XHRjb25zdCBsZW5ndGggPSBzdWJTY2hlbWEubGVuZ3RoO1xuXHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0ZGVyZWZlcmVuY2Uoc3ViU2NoZW1hW2ldLCBsb29rdXAsIGJhc2VVUkksIGAke2tleUJhc2V9LyR7aX1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoc2NoZW1hTWFwS2V5d29yZFtrZXldKSB7XG5cdFx0XHRmb3IgKGxldCBzdWJLZXkgaW4gc3ViU2NoZW1hKSB7XG5cdFx0XHRcdGRlcmVmZXJlbmNlKFxuXHRcdFx0XHRcdHN1YlNjaGVtYVtzdWJLZXldLFxuXHRcdFx0XHRcdGxvb2t1cCxcblx0XHRcdFx0XHRiYXNlVVJJLFxuXHRcdFx0XHRcdGAke2tleUJhc2V9LyR7ZW5jb2RlUG9pbnRlcihzdWJLZXkpfWAsXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlcmVmZXJlbmNlKHN1YlNjaGVtYSwgbG9va3VwLCBiYXNlVVJJLCBrZXlCYXNlKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gbG9va3VwO1xufVxuXG4vLyBzY2hlbWEgaWRlbnRpZmljYXRpb24gZXhhbXBsZXNcbi8vIGh0dHBzOi8vanNvbi1zY2hlbWEub3JnL2RyYWZ0LzIwMTktMDkvanNvbi1zY2hlbWEtY29yZS5odG1sI3JmYy5hcHBlbmRpeC5BXG4vLyAkcmVmIGRlbGVnYXRpb25cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9qc29uLXNjaGVtYS1vcmcvanNvbi1zY2hlbWEtc3BlYy9pc3N1ZXMvNTE0XG4vLyBvdXRwdXQgZm9ybWF0XG4vLyBodHRwczovL2pzb24tc2NoZW1hLm9yZy9kcmFmdC8yMDE5LTA5L2pzb24tc2NoZW1hLWNvcmUuaHRtbCNvdXRwdXRcbi8vIEpTT04gcG9pbnRlclxuLy8gaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzY5MDFcbi8vIEpTT04gcmVsYXRpdmUgcG9pbnRlclxuLy8gaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL2RyYWZ0LWhhbmRyZXdzLXJlbGF0aXZlLWpzb24tcG9pbnRlci0wMVxuIl19
