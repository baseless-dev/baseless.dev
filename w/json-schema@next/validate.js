import { deepCompareStrict } from "./deep-compare-strict.js";
import { dereference } from "./dereference.js";
import { fastFormat } from "./format.js";
import { encodePointer } from "./pointer.js";
import { ucs2length } from "./ucs2-length.js";
export function validate(instance, schema, draft = "2019-09", lookup = dereference(schema), shortCircuit = true, recursiveAnchor = null, instanceLocation = "#", schemaLocation = "#", evaluated = Object.create(null)) {
    if (schema === true) {
        return { valid: true, errors: [] };
    }
    if (schema === false) {
        return {
            valid: false,
            errors: [
                {
                    instanceLocation,
                    keyword: "false",
                    keywordLocation: instanceLocation,
                    error: "False boolean schema.",
                },
            ],
        };
    }
    const rawInstanceType = typeof instance;
    let instanceType;
    switch (rawInstanceType) {
        case "boolean":
        case "number":
        case "string":
            instanceType = rawInstanceType;
            break;
        case "object":
            if (instance === null) {
                instanceType = "null";
            }
            else if (Array.isArray(instance)) {
                instanceType = "array";
            }
            else {
                instanceType = "object";
            }
            break;
        default:
            throw new Error(`Instances of "${rawInstanceType}" type are not supported.`);
    }
    const { $ref, $recursiveRef, $recursiveAnchor, type: $type, const: $const, enum: $enum, required: $required, not: $not, anyOf: $anyOf, allOf: $allOf, oneOf: $oneOf, if: $if, then: $then, else: $else, format: $format, properties: $properties, patternProperties: $patternProperties, additionalProperties: $additionalProperties, unevaluatedProperties: $unevaluatedProperties, minProperties: $minProperties, maxProperties: $maxProperties, propertyNames: $propertyNames, dependentRequired: $dependentRequired, dependentSchemas: $dependentSchemas, dependencies: $dependencies, prefixItems: $prefixItems, items: $items, additionalItems: $additionalItems, unevaluatedItems: $unevaluatedItems, contains: $contains, minContains: $minContains, maxContains: $maxContains, minItems: $minItems, maxItems: $maxItems, uniqueItems: $uniqueItems, minimum: $minimum, maximum: $maximum, exclusiveMinimum: $exclusiveMinimum, exclusiveMaximum: $exclusiveMaximum, multipleOf: $multipleOf, minLength: $minLength, maxLength: $maxLength, pattern: $pattern, __absolute_ref__, __absolute_recursive_ref__, } = schema;
    const errors = [];
    if ($recursiveAnchor === true && recursiveAnchor === null) {
        recursiveAnchor = schema;
    }
    if ($recursiveRef === "#") {
        const refSchema = recursiveAnchor === null ? lookup[__absolute_recursive_ref__] : recursiveAnchor;
        const keywordLocation = `${schemaLocation}/$recursiveRef`;
        const result = validate(instance, recursiveAnchor === null ? schema : recursiveAnchor, draft, lookup, shortCircuit, refSchema, instanceLocation, keywordLocation, evaluated);
        if (!result.valid) {
            errors.push({
                instanceLocation,
                keyword: "$recursiveRef",
                keywordLocation,
                error: "A subschema had errors.",
            }, ...result.errors);
        }
    }
    if ($ref !== undefined) {
        const uri = __absolute_ref__ || $ref;
        const refSchema = lookup[uri];
        if (refSchema === undefined) {
            let message = `Unresolved $ref "${$ref}".`;
            if (__absolute_ref__ && __absolute_ref__ !== $ref) {
                message += `  Absolute URI "${__absolute_ref__}".`;
            }
            message += `\nKnown schemas:\n- ${Object.keys(lookup).join("\n- ")}`;
            throw new Error(message);
        }
        const keywordLocation = `${schemaLocation}/$ref`;
        const result = validate(instance, refSchema, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, keywordLocation, evaluated);
        if (!result.valid) {
            errors.push({
                instanceLocation,
                keyword: "$ref",
                keywordLocation,
                error: "A subschema had errors.",
            }, ...result.errors);
        }
        if (draft === "4" || draft === "7") {
            return { valid: errors.length === 0, errors };
        }
    }
    if (Array.isArray($type)) {
        let length = $type.length;
        let valid = false;
        for (let i = 0; i < length; i++) {
            if (instanceType === $type[i] ||
                ($type[i] === "integer" &&
                    instanceType === "number" &&
                    instance % 1 === 0 &&
                    instance === instance)) {
                valid = true;
                break;
            }
        }
        if (!valid) {
            errors.push({
                instanceLocation,
                keyword: "type",
                keywordLocation: `${schemaLocation}/type`,
                error: `Instance type "${instanceType}" is invalid. Expected "${$type.join("\", \"")}".`,
            });
        }
    }
    else if ($type === "integer") {
        if (instanceType !== "number" || instance % 1 || instance !== instance) {
            errors.push({
                instanceLocation,
                keyword: "type",
                keywordLocation: `${schemaLocation}/type`,
                error: `Instance type "${instanceType}" is invalid. Expected "${$type}".`,
            });
        }
    }
    else if ($type !== undefined && instanceType !== $type) {
        errors.push({
            instanceLocation,
            keyword: "type",
            keywordLocation: `${schemaLocation}/type`,
            error: `Instance type "${instanceType}" is invalid. Expected "${$type}".`,
        });
    }
    if ($const !== undefined) {
        if (instanceType === "object" || instanceType === "array") {
            if (!deepCompareStrict(instance, $const)) {
                errors.push({
                    instanceLocation,
                    keyword: "const",
                    keywordLocation: `${schemaLocation}/const`,
                    error: `Instance does not match ${JSON.stringify($const)}.`,
                });
            }
        }
        else if (instance !== $const) {
            errors.push({
                instanceLocation,
                keyword: "const",
                keywordLocation: `${schemaLocation}/const`,
                error: `Instance does not match ${JSON.stringify($const)}.`,
            });
        }
    }
    if ($enum !== undefined) {
        if (instanceType === "object" || instanceType === "array") {
            if (!$enum.some((value) => deepCompareStrict(instance, value))) {
                errors.push({
                    instanceLocation,
                    keyword: "enum",
                    keywordLocation: `${schemaLocation}/enum`,
                    error: `Instance does not match any of ${JSON.stringify($enum)}.`,
                });
            }
        }
        else if (!$enum.some((value) => instance === value)) {
            errors.push({
                instanceLocation,
                keyword: "enum",
                keywordLocation: `${schemaLocation}/enum`,
                error: `Instance does not match any of ${JSON.stringify($enum)}.`,
            });
        }
    }
    if ($not !== undefined) {
        const keywordLocation = `${schemaLocation}/not`;
        const result = validate(instance, $not, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, keywordLocation);
        if (result.valid) {
            errors.push({
                instanceLocation,
                keyword: "not",
                keywordLocation,
                error: "Instance matched \"not\" schema.",
            });
        }
    }
    let subEvaluateds = [];
    if ($anyOf !== undefined) {
        const keywordLocation = `${schemaLocation}/anyOf`;
        const errorsLength = errors.length;
        let anyValid = false;
        for (let i = 0; i < $anyOf.length; i++) {
            const subSchema = $anyOf[i];
            const subEvaluated = Object.create(evaluated);
            const result = validate(instance, subSchema, draft, lookup, shortCircuit, $recursiveAnchor === true ? recursiveAnchor : null, instanceLocation, `${keywordLocation}/${i}`, subEvaluated);
            errors.push(...result.errors);
            anyValid = anyValid || result.valid;
            if (result.valid) {
                subEvaluateds.push(subEvaluated);
            }
        }
        if (anyValid) {
            errors.length = errorsLength;
        }
        else {
            errors.splice(errorsLength, 0, {
                instanceLocation,
                keyword: "anyOf",
                keywordLocation,
                error: "Instance does not match any subschemas.",
            });
        }
    }
    if ($allOf !== undefined) {
        const keywordLocation = `${schemaLocation}/allOf`;
        const errorsLength = errors.length;
        let allValid = true;
        for (let i = 0; i < $allOf.length; i++) {
            const subSchema = $allOf[i];
            const subEvaluated = Object.create(evaluated);
            const result = validate(instance, subSchema, draft, lookup, shortCircuit, $recursiveAnchor === true ? recursiveAnchor : null, instanceLocation, `${keywordLocation}/${i}`, subEvaluated);
            errors.push(...result.errors);
            allValid = allValid && result.valid;
            if (result.valid) {
                subEvaluateds.push(subEvaluated);
            }
        }
        if (allValid) {
            errors.length = errorsLength;
        }
        else {
            errors.splice(errorsLength, 0, {
                instanceLocation,
                keyword: "allOf",
                keywordLocation,
                error: `Instance does not match every subschema.`,
            });
        }
    }
    if ($oneOf !== undefined) {
        const keywordLocation = `${schemaLocation}/oneOf`;
        const errorsLength = errors.length;
        const matches = $oneOf.filter((subSchema, i) => {
            const subEvaluated = Object.create(evaluated);
            const result = validate(instance, subSchema, draft, lookup, shortCircuit, $recursiveAnchor === true ? recursiveAnchor : null, instanceLocation, `${keywordLocation}/${i}`, subEvaluated);
            errors.push(...result.errors);
            if (result.valid) {
                subEvaluateds.push(subEvaluated);
            }
            return result.valid;
        }).length;
        if (matches === 1) {
            errors.length = errorsLength;
        }
        else {
            errors.splice(errorsLength, 0, {
                instanceLocation,
                keyword: "oneOf",
                keywordLocation,
                error: `Instance does not match exactly one subschema (${matches} matches).`,
            });
        }
    }
    if (instanceType === "object" || instanceType === "array") {
        Object.assign(evaluated, ...subEvaluateds);
    }
    if ($if !== undefined) {
        const keywordLocation = `${schemaLocation}/if`;
        const conditionResult = validate(instance, $if, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, keywordLocation, evaluated).valid;
        if (conditionResult) {
            if ($then !== undefined) {
                const thenResult = validate(instance, $then, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${schemaLocation}/then`, evaluated);
                if (!thenResult.valid) {
                    errors.push({
                        instanceLocation,
                        keyword: "if",
                        keywordLocation,
                        error: `Instance does not match "then" schema.`,
                    }, ...thenResult.errors);
                }
            }
        }
        else if ($else !== undefined) {
            const elseResult = validate(instance, $else, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${schemaLocation}/else`, evaluated);
            if (!elseResult.valid) {
                errors.push({
                    instanceLocation,
                    keyword: "if",
                    keywordLocation,
                    error: `Instance does not match "else" schema.`,
                }, ...elseResult.errors);
            }
        }
    }
    if (instanceType === "object") {
        if ($required !== undefined) {
            for (const key of $required) {
                if (!(key in instance)) {
                    errors.push({
                        instanceLocation,
                        keyword: "required",
                        keywordLocation: `${schemaLocation}/required`,
                        error: `Instance does not have required property "${key}".`,
                    });
                }
            }
        }
        const keys = Object.keys(instance);
        if ($minProperties !== undefined && keys.length < $minProperties) {
            errors.push({
                instanceLocation,
                keyword: "minProperties",
                keywordLocation: `${schemaLocation}/minProperties`,
                error: `Instance does not have at least ${$minProperties} properties.`,
            });
        }
        if ($maxProperties !== undefined && keys.length > $maxProperties) {
            errors.push({
                instanceLocation,
                keyword: "maxProperties",
                keywordLocation: `${schemaLocation}/maxProperties`,
                error: `Instance does not have at least ${$maxProperties} properties.`,
            });
        }
        if ($propertyNames !== undefined) {
            const keywordLocation = `${schemaLocation}/propertyNames`;
            for (const key in instance) {
                const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
                const result = validate(key, $propertyNames, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, keywordLocation);
                if (!result.valid) {
                    errors.push({
                        instanceLocation,
                        keyword: "propertyNames",
                        keywordLocation,
                        error: `Property name "${key}" does not match schema.`,
                    }, ...result.errors);
                }
            }
        }
        if ($dependentRequired !== undefined) {
            const keywordLocation = `${schemaLocation}/dependantRequired`;
            for (const key in $dependentRequired) {
                if (key in instance) {
                    const required = $dependentRequired[key];
                    for (const dependantKey of required) {
                        if (!(dependantKey in instance)) {
                            errors.push({
                                instanceLocation,
                                keyword: "dependentRequired",
                                keywordLocation,
                                error: `Instance has "${key}" but does not have "${dependantKey}".`,
                            });
                        }
                    }
                }
            }
        }
        if ($dependentSchemas !== undefined) {
            for (const key in $dependentSchemas) {
                const keywordLocation = `${schemaLocation}/dependentSchemas`;
                if (key in instance) {
                    const result = validate(instance, $dependentSchemas[key], draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${keywordLocation}/${encodePointer(key)}`, evaluated);
                    if (!result.valid) {
                        errors.push({
                            instanceLocation,
                            keyword: "dependentSchemas",
                            keywordLocation,
                            error: `Instance has "${key}" but does not match dependant schema.`,
                        }, ...result.errors);
                    }
                }
            }
        }
        if ($dependencies !== undefined) {
            const keywordLocation = `${schemaLocation}/dependencies`;
            for (const key in $dependencies) {
                if (key in instance) {
                    const propsOrSchema = $dependencies[key];
                    if (Array.isArray(propsOrSchema)) {
                        for (const dependantKey of propsOrSchema) {
                            if (!(dependantKey in instance)) {
                                errors.push({
                                    instanceLocation,
                                    keyword: "dependencies",
                                    keywordLocation,
                                    error: `Instance has "${key}" but does not have "${dependantKey}".`,
                                });
                            }
                        }
                    }
                    else {
                        const result = validate(instance, propsOrSchema, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${keywordLocation}/${encodePointer(key)}`);
                        if (!result.valid) {
                            errors.push({
                                instanceLocation,
                                keyword: "dependencies",
                                keywordLocation,
                                error: `Instance has "${key}" but does not match dependant schema.`,
                            }, ...result.errors);
                        }
                    }
                }
            }
        }
        const thisEvaluated = Object.create(null);
        let stop = false;
        if ($properties !== undefined) {
            const keywordLocation = `${schemaLocation}/properties`;
            for (const key in $properties) {
                if (!(key in instance)) {
                    continue;
                }
                const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
                const result = validate(instance[key], $properties[key], draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, `${keywordLocation}/${encodePointer(key)}`);
                if (result.valid) {
                    evaluated[key] = thisEvaluated[key] = true;
                }
                else {
                    stop = shortCircuit;
                    errors.push({
                        instanceLocation,
                        keyword: "properties",
                        keywordLocation,
                        error: `Property "${key}" does not match schema.`,
                    }, ...result.errors);
                    if (stop)
                        break;
                }
            }
        }
        if (!stop && $patternProperties !== undefined) {
            const keywordLocation = `${schemaLocation}/patternProperties`;
            for (const pattern in $patternProperties) {
                const regex = new RegExp(pattern);
                const subSchema = $patternProperties[pattern];
                for (const key in instance) {
                    if (!regex.test(key)) {
                        continue;
                    }
                    const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
                    const result = validate(instance[key], subSchema, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, `${keywordLocation}/${encodePointer(pattern)}`);
                    if (result.valid) {
                        evaluated[key] = thisEvaluated[key] = true;
                    }
                    else {
                        stop = shortCircuit;
                        errors.push({
                            instanceLocation,
                            keyword: "patternProperties",
                            keywordLocation,
                            error: `Property "${key}" matches pattern "${pattern}" but does not match associated schema.`,
                        }, ...result.errors);
                    }
                }
            }
        }
        if (!stop && $additionalProperties !== undefined) {
            const keywordLocation = `${schemaLocation}/additionalProperties`;
            for (const key in instance) {
                if (thisEvaluated[key]) {
                    continue;
                }
                const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
                const result = validate(instance[key], $additionalProperties, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, keywordLocation);
                if (result.valid) {
                    evaluated[key] = true;
                }
                else {
                    stop = shortCircuit;
                    errors.push({
                        instanceLocation,
                        keyword: "additionalProperties",
                        keywordLocation,
                        error: `Property "${key}" does not match additional properties schema.`,
                    }, ...result.errors);
                }
            }
        }
        else if (!stop && $unevaluatedProperties !== undefined) {
            const keywordLocation = `${schemaLocation}/unevaluatedProperties`;
            for (const key in instance) {
                if (!evaluated[key]) {
                    const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
                    const result = validate(instance[key], $unevaluatedProperties, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, keywordLocation);
                    if (result.valid) {
                        evaluated[key] = true;
                    }
                    else {
                        errors.push({
                            instanceLocation,
                            keyword: "unevaluatedProperties",
                            keywordLocation,
                            error: `Property "${key}" does not match unevaluated properties schema.`,
                        }, ...result.errors);
                    }
                }
            }
        }
    }
    else if (instanceType === "array") {
        if ($maxItems !== undefined && instance.length > $maxItems) {
            errors.push({
                instanceLocation,
                keyword: "maxItems",
                keywordLocation: `${schemaLocation}/maxItems`,
                error: `Array has too many items (${instance.length} > ${$maxItems}).`,
            });
        }
        if ($minItems !== undefined && instance.length < $minItems) {
            errors.push({
                instanceLocation,
                keyword: "minItems",
                keywordLocation: `${schemaLocation}/minItems`,
                error: `Array has too few items (${instance.length} < ${$minItems}).`,
            });
        }
        const length = instance.length;
        let i = 0;
        let stop = false;
        if ($prefixItems !== undefined) {
            const keywordLocation = `${schemaLocation}/prefixItems`;
            const length2 = Math.min($prefixItems.length, length);
            for (; i < length2; i++) {
                const result = validate(instance[i], $prefixItems[i], draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, `${keywordLocation}/${i}`);
                evaluated[i] = true;
                if (!result.valid) {
                    stop = shortCircuit;
                    errors.push({
                        instanceLocation,
                        keyword: "prefixItems",
                        keywordLocation,
                        error: `Items did not match schema.`,
                    }, ...result.errors);
                    if (stop)
                        break;
                }
            }
        }
        if ($items !== undefined) {
            const keywordLocation = `${schemaLocation}/items`;
            if (Array.isArray($items)) {
                const length2 = Math.min($items.length, length);
                for (; i < length2; i++) {
                    const result = validate(instance[i], $items[i], draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, `${keywordLocation}/${i}`);
                    evaluated[i] = true;
                    if (!result.valid) {
                        stop = shortCircuit;
                        errors.push({
                            instanceLocation,
                            keyword: "items",
                            keywordLocation,
                            error: `Items did not match schema.`,
                        }, ...result.errors);
                        if (stop)
                            break;
                    }
                }
            }
            else {
                for (; i < length; i++) {
                    const result = validate(instance[i], $items, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, keywordLocation);
                    evaluated[i] = true;
                    if (!result.valid) {
                        stop = shortCircuit;
                        errors.push({
                            instanceLocation,
                            keyword: "items",
                            keywordLocation,
                            error: `Items did not match schema.`,
                        }, ...result.errors);
                        if (stop)
                            break;
                    }
                }
            }
            if (!stop && $additionalItems !== undefined) {
                const keywordLocation = `${schemaLocation}/additionalItems`;
                for (; i < length; i++) {
                    const result = validate(instance[i], $additionalItems, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, keywordLocation);
                    evaluated[i] = true;
                    if (!result.valid) {
                        stop = shortCircuit;
                        errors.push({
                            instanceLocation,
                            keyword: "additionalItems",
                            keywordLocation,
                            error: `Items did not match additional items schema.`,
                        }, ...result.errors);
                    }
                }
            }
        }
        if ($contains !== undefined) {
            if (length === 0 && $minContains === undefined) {
                errors.push({
                    instanceLocation,
                    keyword: "contains",
                    keywordLocation: `${schemaLocation}/contains`,
                    error: `Array is empty. It must contain at least one item matching the schema.`,
                });
            }
            else if ($minContains !== undefined && length < $minContains) {
                errors.push({
                    instanceLocation,
                    keyword: "minContains",
                    keywordLocation: `${schemaLocation}/minContains`,
                    error: `Array has less items (${length}) than minContains (${$minContains}).`,
                });
            }
            else {
                const keywordLocation = `${schemaLocation}/contains`;
                const errorsLength = errors.length;
                let contained = 0;
                for (let j = 0; j < length; j++) {
                    const result = validate(instance[j], $contains, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${j}`, keywordLocation);
                    if (result.valid) {
                        evaluated[j] = true;
                        contained++;
                    }
                    else {
                        errors.push(...result.errors);
                    }
                }
                if (contained >= ($minContains || 0)) {
                    errors.length = errorsLength;
                }
                if ($minContains === undefined &&
                    $maxContains === undefined &&
                    contained === 0) {
                    errors.splice(errorsLength, 0, {
                        instanceLocation,
                        keyword: "contains",
                        keywordLocation,
                        error: `Array does not contain item matching schema.`,
                    });
                }
                else if ($minContains !== undefined && contained < $minContains) {
                    errors.push({
                        instanceLocation,
                        keyword: "minContains",
                        keywordLocation: `${schemaLocation}/minContains`,
                        error: `Array must contain at least ${$minContains} items matching schema. Only ${contained} items were found.`,
                    });
                }
                else if ($maxContains !== undefined && contained > $maxContains) {
                    errors.push({
                        instanceLocation,
                        keyword: "maxContains",
                        keywordLocation: `${schemaLocation}/maxContains`,
                        error: `Array may contain at most ${$maxContains} items matching schema. ${contained} items were found.`,
                    });
                }
            }
        }
        if (!stop && $unevaluatedItems !== undefined) {
            const keywordLocation = `${schemaLocation}/unevaluatedItems`;
            for (i; i < length; i++) {
                if (evaluated[i]) {
                    continue;
                }
                const result = validate(instance[i], $unevaluatedItems, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, keywordLocation);
                evaluated[i] = true;
                if (!result.valid) {
                    errors.push({
                        instanceLocation,
                        keyword: "unevaluatedItems",
                        keywordLocation,
                        error: `Items did not match unevaluated items schema.`,
                    }, ...result.errors);
                }
            }
        }
        if ($uniqueItems) {
            for (let j = 0; j < length; j++) {
                const a = instance[j];
                const ao = typeof a === "object" && a !== null;
                for (let k = 0; k < length; k++) {
                    if (j === k) {
                        continue;
                    }
                    const b = instance[k];
                    const bo = typeof b === "object" && b !== null;
                    if (a === b || (ao && bo && deepCompareStrict(a, b))) {
                        errors.push({
                            instanceLocation,
                            keyword: "uniqueItems",
                            keywordLocation: `${schemaLocation}/uniqueItems`,
                            error: `Duplicate items at indexes ${j} and ${k}.`,
                        });
                        j = Number.MAX_SAFE_INTEGER;
                        k = Number.MAX_SAFE_INTEGER;
                    }
                }
            }
        }
    }
    else if (instanceType === "number") {
        if (draft === "4") {
            if ($minimum !== undefined &&
                (($exclusiveMinimum === true && instance <= $minimum) ||
                    instance < $minimum)) {
                errors.push({
                    instanceLocation,
                    keyword: "minimum",
                    keywordLocation: `${schemaLocation}/minimum`,
                    error: `${instance} is less than ${$exclusiveMinimum ? "or equal to " : ""} ${$minimum}.`,
                });
            }
            if ($maximum !== undefined &&
                (($exclusiveMaximum === true && instance >= $maximum) ||
                    instance > $maximum)) {
                errors.push({
                    instanceLocation,
                    keyword: "maximum",
                    keywordLocation: `${schemaLocation}/maximum`,
                    error: `${instance} is greater than ${$exclusiveMaximum ? "or equal to " : ""} ${$maximum}.`,
                });
            }
        }
        else {
            if ($minimum !== undefined && instance < $minimum) {
                errors.push({
                    instanceLocation,
                    keyword: "minimum",
                    keywordLocation: `${schemaLocation}/minimum`,
                    error: `${instance} is less than ${$minimum}.`,
                });
            }
            if ($maximum !== undefined && instance > $maximum) {
                errors.push({
                    instanceLocation,
                    keyword: "maximum",
                    keywordLocation: `${schemaLocation}/maximum`,
                    error: `${instance} is greater than ${$maximum}.`,
                });
            }
            if ($exclusiveMinimum !== undefined && instance <= $exclusiveMinimum) {
                errors.push({
                    instanceLocation,
                    keyword: "exclusiveMinimum",
                    keywordLocation: `${schemaLocation}/exclusiveMinimum`,
                    error: `${instance} is less than ${$exclusiveMinimum}.`,
                });
            }
            if ($exclusiveMaximum !== undefined && instance >= $exclusiveMaximum) {
                errors.push({
                    instanceLocation,
                    keyword: "exclusiveMaximum",
                    keywordLocation: `${schemaLocation}/exclusiveMaximum`,
                    error: `${instance} is greater than or equal to ${$exclusiveMaximum}.`,
                });
            }
        }
        if ($multipleOf !== undefined) {
            const remainder = instance % $multipleOf;
            if (Math.abs(0 - remainder) >= 1.1920929e-7 &&
                Math.abs($multipleOf - remainder) >= 1.1920929e-7) {
                errors.push({
                    instanceLocation,
                    keyword: "multipleOf",
                    keywordLocation: `${schemaLocation}/multipleOf`,
                    error: `${instance} is not a multiple of ${$multipleOf}.`,
                });
            }
        }
    }
    else if (instanceType === "string") {
        const length = $minLength === undefined && $maxLength === undefined ? 0 : ucs2length(instance);
        if ($minLength !== undefined && length < $minLength) {
            errors.push({
                instanceLocation,
                keyword: "minLength",
                keywordLocation: `${schemaLocation}/minLength`,
                error: `String is too short (${length} < ${$minLength}).`,
            });
        }
        if ($maxLength !== undefined && length > $maxLength) {
            errors.push({
                instanceLocation,
                keyword: "maxLength",
                keywordLocation: `${schemaLocation}/maxLength`,
                error: `String is too long (${length} > ${$maxLength}).`,
            });
        }
        if ($pattern !== undefined && !new RegExp($pattern).test(instance)) {
            errors.push({
                instanceLocation,
                keyword: "pattern",
                keywordLocation: `${schemaLocation}/pattern`,
                error: `String does not match pattern.`,
            });
        }
        if ($format !== undefined &&
            fastFormat[$format] &&
            !fastFormat[$format](instance)) {
            errors.push({
                instanceLocation,
                keyword: "format",
                keywordLocation: `${schemaLocation}/format`,
                error: `String does not match format "${$format}".`,
            });
        }
    }
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ2YWxpZGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUM3RCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDL0MsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUN6QyxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBRTdDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUk5QyxNQUFNLFVBQVUsUUFBUSxDQUN2QixRQUFhLEVBQ2IsTUFBd0IsRUFDeEIsUUFBcUIsU0FBUyxFQUM5QixNQUFNLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUM1QixZQUFZLEdBQUcsSUFBSSxFQUNuQixrQkFBaUMsSUFBSSxFQUNyQyxnQkFBZ0IsR0FBRyxHQUFHLEVBQ3RCLGNBQWMsR0FBRyxHQUFHLEVBQ3BCLFlBQXVCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBRTFDLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtRQUNwQixPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUM7S0FDbkM7SUFFRCxJQUFJLE1BQU0sS0FBSyxLQUFLLEVBQUU7UUFDckIsT0FBTztZQUNOLEtBQUssRUFBRSxLQUFLO1lBQ1osTUFBTSxFQUFFO2dCQUNQO29CQUNDLGdCQUFnQjtvQkFDaEIsT0FBTyxFQUFFLE9BQU87b0JBQ2hCLGVBQWUsRUFBRSxnQkFBZ0I7b0JBQ2pDLEtBQUssRUFBRSx1QkFBdUI7aUJBQzlCO2FBQ0Q7U0FDRCxDQUFDO0tBQ0Y7SUFFRCxNQUFNLGVBQWUsR0FBRyxPQUFPLFFBQVEsQ0FBQztJQUN4QyxJQUFJLFlBQThDLENBQUM7SUFDbkQsUUFBUSxlQUFlLEVBQUU7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QUssRUFBRSxnQ0FBZ0M7YUFDdkMsQ0FBQyxDQUFDO1NBQ0g7UUFDRCxJQUNDLE9BQU8sS0FBSyxTQUFTO1lBQ3JCLFVBQVUsQ0FBQyxPQUFPLENBQUM7WUFDbkIsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQzdCO1lBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDWCxnQkFBZ0I7Z0JBQ2hCLE9BQU8sRUFBRSxRQUFRO2dCQUNqQixlQUFlLEVBQUUsR0FBRyxjQUFjLFNBQVM7Z0JBQzNDLEtBQUssRUFBRSxpQ0FBaUMsT0FBTyxJQUFJO2FBQ25ELENBQUMsQ0FBQztTQUNIO0tBQ0Q7SUFFRCxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDO0FBQy9DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZWVwQ29tcGFyZVN0cmljdCB9IGZyb20gXCIuL2RlZXAtY29tcGFyZS1zdHJpY3QudHNcIjtcbmltcG9ydCB7IGRlcmVmZXJlbmNlIH0gZnJvbSBcIi4vZGVyZWZlcmVuY2UudHNcIjtcbmltcG9ydCB7IGZhc3RGb3JtYXQgfSBmcm9tIFwiLi9mb3JtYXQudHNcIjtcbmltcG9ydCB7IGVuY29kZVBvaW50ZXIgfSBmcm9tIFwiLi9wb2ludGVyLnRzXCI7XG5pbXBvcnQgeyBJbnN0YW5jZVR5cGUsIE91dHB1dFVuaXQsIFNjaGVtYSwgU2NoZW1hRHJhZnQsIFZhbGlkYXRpb25SZXN1bHQgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuaW1wb3J0IHsgdWNzMmxlbmd0aCB9IGZyb20gXCIuL3VjczItbGVuZ3RoLnRzXCI7XG5cbmV4cG9ydCB0eXBlIEV2YWx1YXRlZCA9IFJlY29yZDxzdHJpbmcgfCBudW1iZXIsIGJvb2xlYW4+O1xuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGUoXG5cdGluc3RhbmNlOiBhbnksXG5cdHNjaGVtYTogU2NoZW1hIHwgYm9vbGVhbixcblx0ZHJhZnQ6IFNjaGVtYURyYWZ0ID0gXCIyMDE5LTA5XCIsXG5cdGxvb2t1cCA9IGRlcmVmZXJlbmNlKHNjaGVtYSksXG5cdHNob3J0Q2lyY3VpdCA9IHRydWUsXG5cdHJlY3Vyc2l2ZUFuY2hvcjogU2NoZW1hIHwgbnVsbCA9IG51bGwsXG5cdGluc3RhbmNlTG9jYXRpb24gPSBcIiNcIixcblx0c2NoZW1hTG9jYXRpb24gPSBcIiNcIixcblx0ZXZhbHVhdGVkOiBFdmFsdWF0ZWQgPSBPYmplY3QuY3JlYXRlKG51bGwpLFxuKTogVmFsaWRhdGlvblJlc3VsdCB7XG5cdGlmIChzY2hlbWEgPT09IHRydWUpIHtcblx0XHRyZXR1cm4geyB2YWxpZDogdHJ1ZSwgZXJyb3JzOiBbXSB9O1xuXHR9XG5cblx0aWYgKHNjaGVtYSA9PT0gZmFsc2UpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dmFsaWQ6IGZhbHNlLFxuXHRcdFx0ZXJyb3JzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdGtleXdvcmQ6IFwiZmFsc2VcIixcblx0XHRcdFx0XHRrZXl3b3JkTG9jYXRpb246IGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdFx0ZXJyb3I6IFwiRmFsc2UgYm9vbGVhbiBzY2hlbWEuXCIsXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH07XG5cdH1cblxuXHRjb25zdCByYXdJbnN0YW5jZVR5cGUgPSB0eXBlb2YgaW5zdGFuY2U7XG5cdGxldCBpbnN0YW5jZVR5cGU6IEV4Y2x1ZGU8SW5zdGFuY2VUeXBlLCBcImludGVnZXJcIj47XG5cdHN3aXRjaCAocmF3SW5zdGFuY2VUeXBlKSB7XG5cdFx0Y2FzZSBcImJvb2xlYW5cIjpcblx0XHRjYXNlIFwibnVtYmVyXCI6XG5cdFx0Y2FzZSBcInN0cmluZ1wiOlxuXHRcdFx0aW5zdGFuY2VUeXBlID0gcmF3SW5zdGFuY2VUeXBlO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSBcIm9iamVjdFwiOlxuXHRcdFx0aWYgKGluc3RhbmNlID09PSBudWxsKSB7XG5cdFx0XHRcdGluc3RhbmNlVHlwZSA9IFwibnVsbFwiO1xuXHRcdFx0fSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGluc3RhbmNlKSkge1xuXHRcdFx0XHRpbnN0YW5jZVR5cGUgPSBcImFycmF5XCI7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpbnN0YW5jZVR5cGUgPSBcIm9iamVjdFwiO1xuXHRcdFx0fVxuXHRcdFx0YnJlYWs7XG5cdFx0ZGVmYXVsdDpcblx0XHRcdC8vIHVuZGVmaW5lZCwgYmlnaW50LCBmdW5jdGlvbiwgc3ltYm9sXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdGBJbnN0YW5jZXMgb2YgXCIke3Jhd0luc3RhbmNlVHlwZX1cIiB0eXBlIGFyZSBub3Qgc3VwcG9ydGVkLmAsXG5cdFx0XHQpO1xuXHR9XG5cblx0Y29uc3Qge1xuXHRcdCRyZWYsXG5cdFx0JHJlY3Vyc2l2ZVJlZixcblx0XHQkcmVjdXJzaXZlQW5jaG9yLFxuXHRcdHR5cGU6ICR0eXBlLFxuXHRcdGNvbnN0OiAkY29uc3QsXG5cdFx0ZW51bTogJGVudW0sXG5cdFx0cmVxdWlyZWQ6ICRyZXF1aXJlZCxcblx0XHRub3Q6ICRub3QsXG5cdFx0YW55T2Y6ICRhbnlPZixcblx0XHRhbGxPZjogJGFsbE9mLFxuXHRcdG9uZU9mOiAkb25lT2YsXG5cdFx0aWY6ICRpZixcblx0XHR0aGVuOiAkdGhlbixcblx0XHRlbHNlOiAkZWxzZSxcblxuXHRcdGZvcm1hdDogJGZvcm1hdCxcblxuXHRcdHByb3BlcnRpZXM6ICRwcm9wZXJ0aWVzLFxuXHRcdHBhdHRlcm5Qcm9wZXJ0aWVzOiAkcGF0dGVyblByb3BlcnRpZXMsXG5cdFx0YWRkaXRpb25hbFByb3BlcnRpZXM6ICRhZGRpdGlvbmFsUHJvcGVydGllcyxcblx0XHR1bmV2YWx1YXRlZFByb3BlcnRpZXM6ICR1bmV2YWx1YXRlZFByb3BlcnRpZXMsXG5cdFx0bWluUHJvcGVydGllczogJG1pblByb3BlcnRpZXMsXG5cdFx0bWF4UHJvcGVydGllczogJG1heFByb3BlcnRpZXMsXG5cdFx0cHJvcGVydHlOYW1lczogJHByb3BlcnR5TmFtZXMsXG5cdFx0ZGVwZW5kZW50UmVxdWlyZWQ6ICRkZXBlbmRlbnRSZXF1aXJlZCxcblx0XHRkZXBlbmRlbnRTY2hlbWFzOiAkZGVwZW5kZW50U2NoZW1hcyxcblx0XHRkZXBlbmRlbmNpZXM6ICRkZXBlbmRlbmNpZXMsXG5cblx0XHRwcmVmaXhJdGVtczogJHByZWZpeEl0ZW1zLFxuXHRcdGl0ZW1zOiAkaXRlbXMsXG5cdFx0YWRkaXRpb25hbEl0ZW1zOiAkYWRkaXRpb25hbEl0ZW1zLFxuXHRcdHVuZXZhbHVhdGVkSXRlbXM6ICR1bmV2YWx1YXRlZEl0ZW1zLFxuXHRcdGNvbnRhaW5zOiAkY29udGFpbnMsXG5cdFx0bWluQ29udGFpbnM6ICRtaW5Db250YWlucyxcblx0XHRtYXhDb250YWluczogJG1heENvbnRhaW5zLFxuXHRcdG1pbkl0ZW1zOiAkbWluSXRlbXMsXG5cdFx0bWF4SXRlbXM6ICRtYXhJdGVtcyxcblx0XHR1bmlxdWVJdGVtczogJHVuaXF1ZUl0ZW1zLFxuXG5cdFx0bWluaW11bTogJG1pbmltdW0sXG5cdFx0bWF4aW11bTogJG1heGltdW0sXG5cdFx0ZXhjbHVzaXZlTWluaW11bTogJGV4Y2x1c2l2ZU1pbmltdW0sXG5cdFx0ZXhjbHVzaXZlTWF4aW11bTogJGV4Y2x1c2l2ZU1heGltdW0sXG5cdFx0bXVsdGlwbGVPZjogJG11bHRpcGxlT2YsXG5cblx0XHRtaW5MZW5ndGg6ICRtaW5MZW5ndGgsXG5cdFx0bWF4TGVuZ3RoOiAkbWF4TGVuZ3RoLFxuXHRcdHBhdHRlcm46ICRwYXR0ZXJuLFxuXG5cdFx0X19hYnNvbHV0ZV9yZWZfXyxcblx0XHRfX2Fic29sdXRlX3JlY3Vyc2l2ZV9yZWZfXyxcblx0fSA9IHNjaGVtYTtcblxuXHRjb25zdCBlcnJvcnM6IE91dHB1dFVuaXRbXSA9IFtdO1xuXG5cdGlmICgkcmVjdXJzaXZlQW5jaG9yID09PSB0cnVlICYmIHJlY3Vyc2l2ZUFuY2hvciA9PT0gbnVsbCkge1xuXHRcdHJlY3Vyc2l2ZUFuY2hvciA9IHNjaGVtYTtcblx0fVxuXG5cdGlmICgkcmVjdXJzaXZlUmVmID09PSBcIiNcIikge1xuXHRcdGNvbnN0IHJlZlNjaGVtYSA9IHJlY3Vyc2l2ZUFuY2hvciA9PT0gbnVsbCA/IChsb29rdXBbX19hYnNvbHV0ZV9yZWN1cnNpdmVfcmVmX18hXSBhcyBTY2hlbWEpIDogcmVjdXJzaXZlQW5jaG9yO1xuXHRcdGNvbnN0IGtleXdvcmRMb2NhdGlvbiA9IGAke3NjaGVtYUxvY2F0aW9ufS8kcmVjdXJzaXZlUmVmYDtcblx0XHRjb25zdCByZXN1bHQgPSB2YWxpZGF0ZShcblx0XHRcdGluc3RhbmNlLFxuXHRcdFx0cmVjdXJzaXZlQW5jaG9yID09PSBudWxsID8gc2NoZW1hIDogcmVjdXJzaXZlQW5jaG9yLFxuXHRcdFx0ZHJhZnQsXG5cdFx0XHRsb29rdXAsXG5cdFx0XHRzaG9ydENpcmN1aXQsXG5cdFx0XHRyZWZTY2hlbWEsXG5cdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0a2V5d29yZExvY2F0aW9uLFxuXHRcdFx0ZXZhbHVhdGVkLFxuXHRcdCk7XG5cdFx0aWYgKCFyZXN1bHQudmFsaWQpIHtcblx0XHRcdGVycm9ycy5wdXNoKFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdFx0XHRrZXl3b3JkOiBcIiRyZWN1cnNpdmVSZWZcIixcblx0XHRcdFx0XHRrZXl3b3JkTG9jYXRpb24sXG5cdFx0XHRcdFx0ZXJyb3I6IFwiQSBzdWJzY2hlbWEgaGFkIGVycm9ycy5cIixcblx0XHRcdFx0fSxcblx0XHRcdFx0Li4ucmVzdWx0LmVycm9ycyxcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKCRyZWYgIT09IHVuZGVmaW5lZCkge1xuXHRcdGNvbnN0IHVyaSA9IF9fYWJzb2x1dGVfcmVmX18gfHwgJHJlZjtcblx0XHRjb25zdCByZWZTY2hlbWEgPSBsb29rdXBbdXJpXTtcblx0XHRpZiAocmVmU2NoZW1hID09PSB1bmRlZmluZWQpIHtcblx0XHRcdGxldCBtZXNzYWdlID0gYFVucmVzb2x2ZWQgJHJlZiBcIiR7JHJlZn1cIi5gO1xuXHRcdFx0aWYgKF9fYWJzb2x1dGVfcmVmX18gJiYgX19hYnNvbHV0ZV9yZWZfXyAhPT0gJHJlZikge1xuXHRcdFx0XHRtZXNzYWdlICs9IGAgIEFic29sdXRlIFVSSSBcIiR7X19hYnNvbHV0ZV9yZWZfX31cIi5gO1xuXHRcdFx0fVxuXHRcdFx0bWVzc2FnZSArPSBgXFxuS25vd24gc2NoZW1hczpcXG4tICR7T2JqZWN0LmtleXMobG9va3VwKS5qb2luKFwiXFxuLSBcIil9YDtcblx0XHRcdHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcblx0XHR9XG5cdFx0Y29uc3Qga2V5d29yZExvY2F0aW9uID0gYCR7c2NoZW1hTG9jYXRpb259LyRyZWZgO1xuXHRcdGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlKFxuXHRcdFx0aW5zdGFuY2UsXG5cdFx0XHRyZWZTY2hlbWEsXG5cdFx0XHRkcmFmdCxcblx0XHRcdGxvb2t1cCxcblx0XHRcdHNob3J0Q2lyY3VpdCxcblx0XHRcdHJlY3Vyc2l2ZUFuY2hvcixcblx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRrZXl3b3JkTG9jYXRpb24sXG5cdFx0XHRldmFsdWF0ZWQsXG5cdFx0KTtcblx0XHRpZiAoIXJlc3VsdC52YWxpZCkge1xuXHRcdFx0ZXJyb3JzLnB1c2goXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdGtleXdvcmQ6IFwiJHJlZlwiLFxuXHRcdFx0XHRcdGtleXdvcmRMb2NhdGlvbixcblx0XHRcdFx0XHRlcnJvcjogXCJBIHN1YnNjaGVtYSBoYWQgZXJyb3JzLlwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHQuLi5yZXN1bHQuZXJyb3JzLFxuXHRcdFx0KTtcblx0XHR9XG5cdFx0aWYgKGRyYWZ0ID09PSBcIjRcIiB8fCBkcmFmdCA9PT0gXCI3XCIpIHtcblx0XHRcdHJldHVybiB7IHZhbGlkOiBlcnJvcnMubGVuZ3RoID09PSAwLCBlcnJvcnMgfTtcblx0XHR9XG5cdH1cblxuXHRpZiAoQXJyYXkuaXNBcnJheSgkdHlwZSkpIHtcblx0XHRsZXQgbGVuZ3RoID0gJHR5cGUubGVuZ3RoO1xuXHRcdGxldCB2YWxpZCA9IGZhbHNlO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChcblx0XHRcdFx0aW5zdGFuY2VUeXBlID09PSAkdHlwZVtpXSB8fFxuXHRcdFx0XHQoJHR5cGVbaV0gPT09IFwiaW50ZWdlclwiICYmXG5cdFx0XHRcdFx0aW5zdGFuY2VUeXBlID09PSBcIm51bWJlclwiICYmXG5cdFx0XHRcdFx0aW5zdGFuY2UgJSAxID09PSAwICYmXG5cdFx0XHRcdFx0aW5zdGFuY2UgPT09IGluc3RhbmNlKVxuXHRcdFx0KSB7XG5cdFx0XHRcdHZhbGlkID0gdHJ1ZTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICghdmFsaWQpIHtcblx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdFx0a2V5d29yZDogXCJ0eXBlXCIsXG5cdFx0XHRcdGtleXdvcmRMb2NhdGlvbjogYCR7c2NoZW1hTG9jYXRpb259L3R5cGVgLFxuXHRcdFx0XHRlcnJvcjogYEluc3RhbmNlIHR5cGUgXCIke2luc3RhbmNlVHlwZX1cIiBpcyBpbnZhbGlkLiBFeHBlY3RlZCBcIiR7XG5cdFx0XHRcdFx0JHR5cGUuam9pbihcblx0XHRcdFx0XHRcdCdcIiwgXCInLFxuXHRcdFx0XHRcdClcblx0XHRcdFx0fVwiLmAsXG5cdFx0XHR9KTtcblx0XHR9XG5cdH0gZWxzZSBpZiAoJHR5cGUgPT09IFwiaW50ZWdlclwiKSB7XG5cdFx0aWYgKGluc3RhbmNlVHlwZSAhPT0gXCJudW1iZXJcIiB8fCBpbnN0YW5jZSAlIDEgfHwgaW5zdGFuY2UgIT09IGluc3RhbmNlKSB7XG5cdFx0XHRlcnJvcnMucHVzaCh7XG5cdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdGtleXdvcmQ6IFwidHlwZVwiLFxuXHRcdFx0XHRrZXl3b3JkTG9jYXRpb246IGAke3NjaGVtYUxvY2F0aW9ufS90eXBlYCxcblx0XHRcdFx0ZXJyb3I6IGBJbnN0YW5jZSB0eXBlIFwiJHtpbnN0YW5jZVR5cGV9XCIgaXMgaW52YWxpZC4gRXhwZWN0ZWQgXCIkeyR0eXBlfVwiLmAsXG5cdFx0XHR9KTtcblx0XHR9XG5cdH0gZWxzZSBpZiAoJHR5cGUgIT09IHVuZGVmaW5lZCAmJiBpbnN0YW5jZVR5cGUgIT09ICR0eXBlKSB7XG5cdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdGtleXdvcmQ6IFwidHlwZVwiLFxuXHRcdFx0a2V5d29yZExvY2F0aW9uOiBgJHtzY2hlbWFMb2NhdGlvbn0vdHlwZWAsXG5cdFx0XHRlcnJvcjogYEluc3RhbmNlIHR5cGUgXCIke2luc3RhbmNlVHlwZX1cIiBpcyBpbnZhbGlkLiBFeHBlY3RlZCBcIiR7JHR5cGV9XCIuYCxcblx0XHR9KTtcblx0fVxuXG5cdGlmICgkY29uc3QgIT09IHVuZGVmaW5lZCkge1xuXHRcdGlmIChpbnN0YW5jZVR5cGUgPT09IFwib2JqZWN0XCIgfHwgaW5zdGFuY2VUeXBlID09PSBcImFycmF5XCIpIHtcblx0XHRcdGlmICghZGVlcENvbXBhcmVTdHJpY3QoaW5zdGFuY2UsICRjb25zdCkpIHtcblx0XHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdFx0a2V5d29yZDogXCJjb25zdFwiLFxuXHRcdFx0XHRcdGtleXdvcmRMb2NhdGlvbjogYCR7c2NoZW1hTG9jYXRpb259L2NvbnN0YCxcblx0XHRcdFx0XHRlcnJvcjogYEluc3RhbmNlIGRvZXMgbm90IG1hdGNoICR7SlNPTi5zdHJpbmdpZnkoJGNvbnN0KX0uYCxcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChpbnN0YW5jZSAhPT0gJGNvbnN0KSB7XG5cdFx0XHRlcnJvcnMucHVzaCh7XG5cdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdGtleXdvcmQ6IFwiY29uc3RcIixcblx0XHRcdFx0a2V5d29yZExvY2F0aW9uOiBgJHtzY2hlbWFMb2NhdGlvbn0vY29uc3RgLFxuXHRcdFx0XHRlcnJvcjogYEluc3RhbmNlIGRvZXMgbm90IG1hdGNoICR7SlNPTi5zdHJpbmdpZnkoJGNvbnN0KX0uYCxcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdGlmICgkZW51bSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0aWYgKGluc3RhbmNlVHlwZSA9PT0gXCJvYmplY3RcIiB8fCBpbnN0YW5jZVR5cGUgPT09IFwiYXJyYXlcIikge1xuXHRcdFx0aWYgKCEkZW51bS5zb21lKCh2YWx1ZSkgPT4gZGVlcENvbXBhcmVTdHJpY3QoaW5zdGFuY2UsIHZhbHVlKSkpIHtcblx0XHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdFx0a2V5d29yZDogXCJlbnVtXCIsXG5cdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uOiBgJHtzY2hlbWFMb2NhdGlvbn0vZW51bWAsXG5cdFx0XHRcdFx0ZXJyb3I6IGBJbnN0YW5jZSBkb2VzIG5vdCBtYXRjaCBhbnkgb2YgJHtKU09OLnN0cmluZ2lmeSgkZW51bSl9LmAsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoISRlbnVtLnNvbWUoKHZhbHVlKSA9PiBpbnN0YW5jZSA9PT0gdmFsdWUpKSB7XG5cdFx0XHRlcnJvcnMucHVzaCh7XG5cdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdGtleXdvcmQ6IFwiZW51bVwiLFxuXHRcdFx0XHRrZXl3b3JkTG9jYXRpb246IGAke3NjaGVtYUxvY2F0aW9ufS9lbnVtYCxcblx0XHRcdFx0ZXJyb3I6IGBJbnN0YW5jZSBkb2VzIG5vdCBtYXRjaCBhbnkgb2YgJHtKU09OLnN0cmluZ2lmeSgkZW51bSl9LmAsXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHRpZiAoJG5vdCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0Y29uc3Qga2V5d29yZExvY2F0aW9uID0gYCR7c2NoZW1hTG9jYXRpb259L25vdGA7XG5cdFx0Y29uc3QgcmVzdWx0ID0gdmFsaWRhdGUoXG5cdFx0XHRpbnN0YW5jZSxcblx0XHRcdCRub3QsXG5cdFx0XHRkcmFmdCxcblx0XHRcdGxvb2t1cCxcblx0XHRcdHNob3J0Q2lyY3VpdCxcblx0XHRcdHJlY3Vyc2l2ZUFuY2hvcixcblx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRrZXl3b3JkTG9jYXRpb24sIC8qLFxuICAgICAgZXZhbHVhdGVkKi9cblx0XHQpO1xuXHRcdGlmIChyZXN1bHQudmFsaWQpIHtcblx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdFx0a2V5d29yZDogXCJub3RcIixcblx0XHRcdFx0a2V5d29yZExvY2F0aW9uLFxuXHRcdFx0XHRlcnJvcjogJ0luc3RhbmNlIG1hdGNoZWQgXCJub3RcIiBzY2hlbWEuJyxcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdGxldCBzdWJFdmFsdWF0ZWRzOiBBcnJheTxFdmFsdWF0ZWQ+ID0gW107XG5cblx0aWYgKCRhbnlPZiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0Y29uc3Qga2V5d29yZExvY2F0aW9uID0gYCR7c2NoZW1hTG9jYXRpb259L2FueU9mYDtcblx0XHRjb25zdCBlcnJvcnNMZW5ndGggPSBlcnJvcnMubGVuZ3RoO1xuXHRcdGxldCBhbnlWYWxpZCA9IGZhbHNlO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgJGFueU9mLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjb25zdCBzdWJTY2hlbWEgPSAkYW55T2ZbaV07XG5cdFx0XHRjb25zdCBzdWJFdmFsdWF0ZWQ6IEV2YWx1YXRlZCA9IE9iamVjdC5jcmVhdGUoZXZhbHVhdGVkKTtcblx0XHRcdGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlKFxuXHRcdFx0XHRpbnN0YW5jZSxcblx0XHRcdFx0c3ViU2NoZW1hLFxuXHRcdFx0XHRkcmFmdCxcblx0XHRcdFx0bG9va3VwLFxuXHRcdFx0XHRzaG9ydENpcmN1aXQsXG5cdFx0XHRcdCRyZWN1cnNpdmVBbmNob3IgPT09IHRydWUgPyByZWN1cnNpdmVBbmNob3IgOiBudWxsLFxuXHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRgJHtrZXl3b3JkTG9jYXRpb259LyR7aX1gLFxuXHRcdFx0XHRzdWJFdmFsdWF0ZWQsXG5cdFx0XHQpO1xuXHRcdFx0ZXJyb3JzLnB1c2goLi4ucmVzdWx0LmVycm9ycyk7XG5cdFx0XHRhbnlWYWxpZCA9IGFueVZhbGlkIHx8IHJlc3VsdC52YWxpZDtcblx0XHRcdGlmIChyZXN1bHQudmFsaWQpIHtcblx0XHRcdFx0c3ViRXZhbHVhdGVkcy5wdXNoKHN1YkV2YWx1YXRlZCk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmIChhbnlWYWxpZCkge1xuXHRcdFx0ZXJyb3JzLmxlbmd0aCA9IGVycm9yc0xlbmd0aDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZXJyb3JzLnNwbGljZShlcnJvcnNMZW5ndGgsIDAsIHtcblx0XHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdFx0a2V5d29yZDogXCJhbnlPZlwiLFxuXHRcdFx0XHRrZXl3b3JkTG9jYXRpb24sXG5cdFx0XHRcdGVycm9yOiBcIkluc3RhbmNlIGRvZXMgbm90IG1hdGNoIGFueSBzdWJzY2hlbWFzLlwiLFxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKCRhbGxPZiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0Y29uc3Qga2V5d29yZExvY2F0aW9uID0gYCR7c2NoZW1hTG9jYXRpb259L2FsbE9mYDtcblx0XHRjb25zdCBlcnJvcnNMZW5ndGggPSBlcnJvcnMubGVuZ3RoO1xuXHRcdGxldCBhbGxWYWxpZCA9IHRydWU7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCAkYWxsT2YubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNvbnN0IHN1YlNjaGVtYSA9ICRhbGxPZltpXTtcblx0XHRcdGNvbnN0IHN1YkV2YWx1YXRlZDogRXZhbHVhdGVkID0gT2JqZWN0LmNyZWF0ZShldmFsdWF0ZWQpO1xuXHRcdFx0Y29uc3QgcmVzdWx0ID0gdmFsaWRhdGUoXG5cdFx0XHRcdGluc3RhbmNlLFxuXHRcdFx0XHRzdWJTY2hlbWEsXG5cdFx0XHRcdGRyYWZ0LFxuXHRcdFx0XHRsb29rdXAsXG5cdFx0XHRcdHNob3J0Q2lyY3VpdCxcblx0XHRcdFx0JHJlY3Vyc2l2ZUFuY2hvciA9PT0gdHJ1ZSA/IHJlY3Vyc2l2ZUFuY2hvciA6IG51bGwsXG5cdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdGAke2tleXdvcmRMb2NhdGlvbn0vJHtpfWAsXG5cdFx0XHRcdHN1YkV2YWx1YXRlZCxcblx0XHRcdCk7XG5cdFx0XHRlcnJvcnMucHVzaCguLi5yZXN1bHQuZXJyb3JzKTtcblx0XHRcdGFsbFZhbGlkID0gYWxsVmFsaWQgJiYgcmVzdWx0LnZhbGlkO1xuXHRcdFx0aWYgKHJlc3VsdC52YWxpZCkge1xuXHRcdFx0XHRzdWJFdmFsdWF0ZWRzLnB1c2goc3ViRXZhbHVhdGVkKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKGFsbFZhbGlkKSB7XG5cdFx0XHRlcnJvcnMubGVuZ3RoID0gZXJyb3JzTGVuZ3RoO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRlcnJvcnMuc3BsaWNlKGVycm9yc0xlbmd0aCwgMCwge1xuXHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRrZXl3b3JkOiBcImFsbE9mXCIsXG5cdFx0XHRcdGtleXdvcmRMb2NhdGlvbixcblx0XHRcdFx0ZXJyb3I6IGBJbnN0YW5jZSBkb2VzIG5vdCBtYXRjaCBldmVyeSBzdWJzY2hlbWEuYCxcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdGlmICgkb25lT2YgIT09IHVuZGVmaW5lZCkge1xuXHRcdGNvbnN0IGtleXdvcmRMb2NhdGlvbiA9IGAke3NjaGVtYUxvY2F0aW9ufS9vbmVPZmA7XG5cdFx0Y29uc3QgZXJyb3JzTGVuZ3RoID0gZXJyb3JzLmxlbmd0aDtcblx0XHRjb25zdCBtYXRjaGVzID0gJG9uZU9mLmZpbHRlcigoc3ViU2NoZW1hLCBpKSA9PiB7XG5cdFx0XHRjb25zdCBzdWJFdmFsdWF0ZWQ6IEV2YWx1YXRlZCA9IE9iamVjdC5jcmVhdGUoZXZhbHVhdGVkKTtcblx0XHRcdGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlKFxuXHRcdFx0XHRpbnN0YW5jZSxcblx0XHRcdFx0c3ViU2NoZW1hLFxuXHRcdFx0XHRkcmFmdCxcblx0XHRcdFx0bG9va3VwLFxuXHRcdFx0XHRzaG9ydENpcmN1aXQsXG5cdFx0XHRcdCRyZWN1cnNpdmVBbmNob3IgPT09IHRydWUgPyByZWN1cnNpdmVBbmNob3IgOiBudWxsLFxuXHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRgJHtrZXl3b3JkTG9jYXRpb259LyR7aX1gLFxuXHRcdFx0XHRzdWJFdmFsdWF0ZWQsXG5cdFx0XHQpO1xuXHRcdFx0ZXJyb3JzLnB1c2goLi4ucmVzdWx0LmVycm9ycyk7XG5cdFx0XHRpZiAocmVzdWx0LnZhbGlkKSB7XG5cdFx0XHRcdHN1YkV2YWx1YXRlZHMucHVzaChzdWJFdmFsdWF0ZWQpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHJlc3VsdC52YWxpZDtcblx0XHR9KS5sZW5ndGg7XG5cdFx0aWYgKG1hdGNoZXMgPT09IDEpIHtcblx0XHRcdGVycm9ycy5sZW5ndGggPSBlcnJvcnNMZW5ndGg7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGVycm9ycy5zcGxpY2UoZXJyb3JzTGVuZ3RoLCAwLCB7XG5cdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdGtleXdvcmQ6IFwib25lT2ZcIixcblx0XHRcdFx0a2V5d29yZExvY2F0aW9uLFxuXHRcdFx0XHRlcnJvcjogYEluc3RhbmNlIGRvZXMgbm90IG1hdGNoIGV4YWN0bHkgb25lIHN1YnNjaGVtYSAoJHttYXRjaGVzfSBtYXRjaGVzKS5gLFxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKGluc3RhbmNlVHlwZSA9PT0gXCJvYmplY3RcIiB8fCBpbnN0YW5jZVR5cGUgPT09IFwiYXJyYXlcIikge1xuXHRcdE9iamVjdC5hc3NpZ24oZXZhbHVhdGVkLCAuLi5zdWJFdmFsdWF0ZWRzKTtcblx0fVxuXG5cdGlmICgkaWYgIT09IHVuZGVmaW5lZCkge1xuXHRcdGNvbnN0IGtleXdvcmRMb2NhdGlvbiA9IGAke3NjaGVtYUxvY2F0aW9ufS9pZmA7XG5cdFx0Y29uc3QgY29uZGl0aW9uUmVzdWx0ID0gdmFsaWRhdGUoXG5cdFx0XHRpbnN0YW5jZSxcblx0XHRcdCRpZixcblx0XHRcdGRyYWZ0LFxuXHRcdFx0bG9va3VwLFxuXHRcdFx0c2hvcnRDaXJjdWl0LFxuXHRcdFx0cmVjdXJzaXZlQW5jaG9yLFxuXHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdGtleXdvcmRMb2NhdGlvbixcblx0XHRcdGV2YWx1YXRlZCxcblx0XHQpLnZhbGlkO1xuXHRcdGlmIChjb25kaXRpb25SZXN1bHQpIHtcblx0XHRcdGlmICgkdGhlbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGNvbnN0IHRoZW5SZXN1bHQgPSB2YWxpZGF0ZShcblx0XHRcdFx0XHRpbnN0YW5jZSxcblx0XHRcdFx0XHQkdGhlbixcblx0XHRcdFx0XHRkcmFmdCxcblx0XHRcdFx0XHRsb29rdXAsXG5cdFx0XHRcdFx0c2hvcnRDaXJjdWl0LFxuXHRcdFx0XHRcdHJlY3Vyc2l2ZUFuY2hvcixcblx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdGAke3NjaGVtYUxvY2F0aW9ufS90aGVuYCxcblx0XHRcdFx0XHRldmFsdWF0ZWQsXG5cdFx0XHRcdCk7XG5cdFx0XHRcdGlmICghdGhlblJlc3VsdC52YWxpZCkge1xuXHRcdFx0XHRcdGVycm9ycy5wdXNoKFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRrZXl3b3JkOiBcImlmXCIsXG5cdFx0XHRcdFx0XHRcdGtleXdvcmRMb2NhdGlvbixcblx0XHRcdFx0XHRcdFx0ZXJyb3I6IGBJbnN0YW5jZSBkb2VzIG5vdCBtYXRjaCBcInRoZW5cIiBzY2hlbWEuYCxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHQuLi50aGVuUmVzdWx0LmVycm9ycyxcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICgkZWxzZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRjb25zdCBlbHNlUmVzdWx0ID0gdmFsaWRhdGUoXG5cdFx0XHRcdGluc3RhbmNlLFxuXHRcdFx0XHQkZWxzZSxcblx0XHRcdFx0ZHJhZnQsXG5cdFx0XHRcdGxvb2t1cCxcblx0XHRcdFx0c2hvcnRDaXJjdWl0LFxuXHRcdFx0XHRyZWN1cnNpdmVBbmNob3IsXG5cdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdGAke3NjaGVtYUxvY2F0aW9ufS9lbHNlYCxcblx0XHRcdFx0ZXZhbHVhdGVkLFxuXHRcdFx0KTtcblx0XHRcdGlmICghZWxzZVJlc3VsdC52YWxpZCkge1xuXHRcdFx0XHRlcnJvcnMucHVzaChcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdFx0a2V5d29yZDogXCJpZlwiLFxuXHRcdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uLFxuXHRcdFx0XHRcdFx0ZXJyb3I6IGBJbnN0YW5jZSBkb2VzIG5vdCBtYXRjaCBcImVsc2VcIiBzY2hlbWEuYCxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdC4uLmVsc2VSZXN1bHQuZXJyb3JzLFxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGlmIChpbnN0YW5jZVR5cGUgPT09IFwib2JqZWN0XCIpIHtcblx0XHRpZiAoJHJlcXVpcmVkICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGZvciAoY29uc3Qga2V5IG9mICRyZXF1aXJlZCkge1xuXHRcdFx0XHRpZiAoIShrZXkgaW4gaW5zdGFuY2UpKSB7XG5cdFx0XHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdFx0XHRcdGtleXdvcmQ6IFwicmVxdWlyZWRcIixcblx0XHRcdFx0XHRcdGtleXdvcmRMb2NhdGlvbjogYCR7c2NoZW1hTG9jYXRpb259L3JlcXVpcmVkYCxcblx0XHRcdFx0XHRcdGVycm9yOiBgSW5zdGFuY2UgZG9lcyBub3QgaGF2ZSByZXF1aXJlZCBwcm9wZXJ0eSBcIiR7a2V5fVwiLmAsXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoaW5zdGFuY2UpO1xuXG5cdFx0aWYgKCRtaW5Qcm9wZXJ0aWVzICE9PSB1bmRlZmluZWQgJiYga2V5cy5sZW5ndGggPCAkbWluUHJvcGVydGllcykge1xuXHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRrZXl3b3JkOiBcIm1pblByb3BlcnRpZXNcIixcblx0XHRcdFx0a2V5d29yZExvY2F0aW9uOiBgJHtzY2hlbWFMb2NhdGlvbn0vbWluUHJvcGVydGllc2AsXG5cdFx0XHRcdGVycm9yOiBgSW5zdGFuY2UgZG9lcyBub3QgaGF2ZSBhdCBsZWFzdCAkeyRtaW5Qcm9wZXJ0aWVzfSBwcm9wZXJ0aWVzLmAsXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZiAoJG1heFByb3BlcnRpZXMgIT09IHVuZGVmaW5lZCAmJiBrZXlzLmxlbmd0aCA+ICRtYXhQcm9wZXJ0aWVzKSB7XG5cdFx0XHRlcnJvcnMucHVzaCh7XG5cdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdGtleXdvcmQ6IFwibWF4UHJvcGVydGllc1wiLFxuXHRcdFx0XHRrZXl3b3JkTG9jYXRpb246IGAke3NjaGVtYUxvY2F0aW9ufS9tYXhQcm9wZXJ0aWVzYCxcblx0XHRcdFx0ZXJyb3I6IGBJbnN0YW5jZSBkb2VzIG5vdCBoYXZlIGF0IGxlYXN0ICR7JG1heFByb3BlcnRpZXN9IHByb3BlcnRpZXMuYCxcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmICgkcHJvcGVydHlOYW1lcyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRjb25zdCBrZXl3b3JkTG9jYXRpb24gPSBgJHtzY2hlbWFMb2NhdGlvbn0vcHJvcGVydHlOYW1lc2A7XG5cdFx0XHRmb3IgKGNvbnN0IGtleSBpbiBpbnN0YW5jZSkge1xuXHRcdFx0XHRjb25zdCBzdWJJbnN0YW5jZVBvaW50ZXIgPSBgJHtpbnN0YW5jZUxvY2F0aW9ufS8ke2VuY29kZVBvaW50ZXIoa2V5KX1gO1xuXHRcdFx0XHRjb25zdCByZXN1bHQgPSB2YWxpZGF0ZShcblx0XHRcdFx0XHRrZXksXG5cdFx0XHRcdFx0JHByb3BlcnR5TmFtZXMsXG5cdFx0XHRcdFx0ZHJhZnQsXG5cdFx0XHRcdFx0bG9va3VwLFxuXHRcdFx0XHRcdHNob3J0Q2lyY3VpdCxcblx0XHRcdFx0XHRyZWN1cnNpdmVBbmNob3IsXG5cdFx0XHRcdFx0c3ViSW5zdGFuY2VQb2ludGVyLFxuXHRcdFx0XHRcdGtleXdvcmRMb2NhdGlvbixcblx0XHRcdFx0KTtcblx0XHRcdFx0aWYgKCFyZXN1bHQudmFsaWQpIHtcblx0XHRcdFx0XHRlcnJvcnMucHVzaChcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdFx0XHRcdFx0a2V5d29yZDogXCJwcm9wZXJ0eU5hbWVzXCIsXG5cdFx0XHRcdFx0XHRcdGtleXdvcmRMb2NhdGlvbixcblx0XHRcdFx0XHRcdFx0ZXJyb3I6IGBQcm9wZXJ0eSBuYW1lIFwiJHtrZXl9XCIgZG9lcyBub3QgbWF0Y2ggc2NoZW1hLmAsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0Li4ucmVzdWx0LmVycm9ycyxcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKCRkZXBlbmRlbnRSZXF1aXJlZCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRjb25zdCBrZXl3b3JkTG9jYXRpb24gPSBgJHtzY2hlbWFMb2NhdGlvbn0vZGVwZW5kYW50UmVxdWlyZWRgO1xuXHRcdFx0Zm9yIChjb25zdCBrZXkgaW4gJGRlcGVuZGVudFJlcXVpcmVkKSB7XG5cdFx0XHRcdGlmIChrZXkgaW4gaW5zdGFuY2UpIHtcblx0XHRcdFx0XHRjb25zdCByZXF1aXJlZCA9ICRkZXBlbmRlbnRSZXF1aXJlZFtrZXldIGFzIHN0cmluZ1tdO1xuXHRcdFx0XHRcdGZvciAoY29uc3QgZGVwZW5kYW50S2V5IG9mIHJlcXVpcmVkKSB7XG5cdFx0XHRcdFx0XHRpZiAoIShkZXBlbmRhbnRLZXkgaW4gaW5zdGFuY2UpKSB7XG5cdFx0XHRcdFx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdGtleXdvcmQ6IFwiZGVwZW5kZW50UmVxdWlyZWRcIixcblx0XHRcdFx0XHRcdFx0XHRrZXl3b3JkTG9jYXRpb24sXG5cdFx0XHRcdFx0XHRcdFx0ZXJyb3I6IGBJbnN0YW5jZSBoYXMgXCIke2tleX1cIiBidXQgZG9lcyBub3QgaGF2ZSBcIiR7ZGVwZW5kYW50S2V5fVwiLmAsXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICgkZGVwZW5kZW50U2NoZW1hcyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRmb3IgKGNvbnN0IGtleSBpbiAkZGVwZW5kZW50U2NoZW1hcykge1xuXHRcdFx0XHRjb25zdCBrZXl3b3JkTG9jYXRpb24gPSBgJHtzY2hlbWFMb2NhdGlvbn0vZGVwZW5kZW50U2NoZW1hc2A7XG5cdFx0XHRcdGlmIChrZXkgaW4gaW5zdGFuY2UpIHtcblx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSB2YWxpZGF0ZShcblx0XHRcdFx0XHRcdGluc3RhbmNlLFxuXHRcdFx0XHRcdFx0JGRlcGVuZGVudFNjaGVtYXNba2V5XSxcblx0XHRcdFx0XHRcdGRyYWZ0LFxuXHRcdFx0XHRcdFx0bG9va3VwLFxuXHRcdFx0XHRcdFx0c2hvcnRDaXJjdWl0LFxuXHRcdFx0XHRcdFx0cmVjdXJzaXZlQW5jaG9yLFxuXHRcdFx0XHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdFx0XHRcdGAke2tleXdvcmRMb2NhdGlvbn0vJHtlbmNvZGVQb2ludGVyKGtleSl9YCxcblx0XHRcdFx0XHRcdGV2YWx1YXRlZCxcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGlmICghcmVzdWx0LnZhbGlkKSB7XG5cdFx0XHRcdFx0XHRlcnJvcnMucHVzaChcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdFx0XHRcdFx0a2V5d29yZDogXCJkZXBlbmRlbnRTY2hlbWFzXCIsXG5cdFx0XHRcdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdGVycm9yOiBgSW5zdGFuY2UgaGFzIFwiJHtrZXl9XCIgYnV0IGRvZXMgbm90IG1hdGNoIGRlcGVuZGFudCBzY2hlbWEuYCxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0Li4ucmVzdWx0LmVycm9ycyxcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKCRkZXBlbmRlbmNpZXMgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y29uc3Qga2V5d29yZExvY2F0aW9uID0gYCR7c2NoZW1hTG9jYXRpb259L2RlcGVuZGVuY2llc2A7XG5cdFx0XHRmb3IgKGNvbnN0IGtleSBpbiAkZGVwZW5kZW5jaWVzKSB7XG5cdFx0XHRcdGlmIChrZXkgaW4gaW5zdGFuY2UpIHtcblx0XHRcdFx0XHRjb25zdCBwcm9wc09yU2NoZW1hID0gJGRlcGVuZGVuY2llc1trZXldIGFzIFNjaGVtYSB8IHN0cmluZ1tdO1xuXHRcdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KHByb3BzT3JTY2hlbWEpKSB7XG5cdFx0XHRcdFx0XHRmb3IgKGNvbnN0IGRlcGVuZGFudEtleSBvZiBwcm9wc09yU2NoZW1hKSB7XG5cdFx0XHRcdFx0XHRcdGlmICghKGRlcGVuZGFudEtleSBpbiBpbnN0YW5jZSkpIHtcblx0XHRcdFx0XHRcdFx0XHRlcnJvcnMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdFx0a2V5d29yZDogXCJkZXBlbmRlbmNpZXNcIixcblx0XHRcdFx0XHRcdFx0XHRcdGtleXdvcmRMb2NhdGlvbixcblx0XHRcdFx0XHRcdFx0XHRcdGVycm9yOiBgSW5zdGFuY2UgaGFzIFwiJHtrZXl9XCIgYnV0IGRvZXMgbm90IGhhdmUgXCIke2RlcGVuZGFudEtleX1cIi5gLFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlKFxuXHRcdFx0XHRcdFx0XHRpbnN0YW5jZSxcblx0XHRcdFx0XHRcdFx0cHJvcHNPclNjaGVtYSxcblx0XHRcdFx0XHRcdFx0ZHJhZnQsXG5cdFx0XHRcdFx0XHRcdGxvb2t1cCxcblx0XHRcdFx0XHRcdFx0c2hvcnRDaXJjdWl0LFxuXHRcdFx0XHRcdFx0XHRyZWN1cnNpdmVBbmNob3IsXG5cdFx0XHRcdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdFx0XHRcdGAke2tleXdvcmRMb2NhdGlvbn0vJHtlbmNvZGVQb2ludGVyKGtleSl9YCxcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRpZiAoIXJlc3VsdC52YWxpZCkge1xuXHRcdFx0XHRcdFx0XHRlcnJvcnMucHVzaChcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdFx0a2V5d29yZDogXCJkZXBlbmRlbmNpZXNcIixcblx0XHRcdFx0XHRcdFx0XHRcdGtleXdvcmRMb2NhdGlvbixcblx0XHRcdFx0XHRcdFx0XHRcdGVycm9yOiBgSW5zdGFuY2UgaGFzIFwiJHtrZXl9XCIgYnV0IGRvZXMgbm90IG1hdGNoIGRlcGVuZGFudCBzY2hlbWEuYCxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdC4uLnJlc3VsdC5lcnJvcnMsXG5cdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgdGhpc0V2YWx1YXRlZCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cblx0XHRsZXQgc3RvcCA9IGZhbHNlO1xuXG5cdFx0aWYgKCRwcm9wZXJ0aWVzICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGNvbnN0IGtleXdvcmRMb2NhdGlvbiA9IGAke3NjaGVtYUxvY2F0aW9ufS9wcm9wZXJ0aWVzYDtcblx0XHRcdGZvciAoY29uc3Qga2V5IGluICRwcm9wZXJ0aWVzKSB7XG5cdFx0XHRcdGlmICghKGtleSBpbiBpbnN0YW5jZSkpIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zdCBzdWJJbnN0YW5jZVBvaW50ZXIgPSBgJHtpbnN0YW5jZUxvY2F0aW9ufS8ke2VuY29kZVBvaW50ZXIoa2V5KX1gO1xuXHRcdFx0XHRjb25zdCByZXN1bHQgPSB2YWxpZGF0ZShcblx0XHRcdFx0XHRpbnN0YW5jZVtrZXldLFxuXHRcdFx0XHRcdCRwcm9wZXJ0aWVzW2tleV0sXG5cdFx0XHRcdFx0ZHJhZnQsXG5cdFx0XHRcdFx0bG9va3VwLFxuXHRcdFx0XHRcdHNob3J0Q2lyY3VpdCxcblx0XHRcdFx0XHRyZWN1cnNpdmVBbmNob3IsXG5cdFx0XHRcdFx0c3ViSW5zdGFuY2VQb2ludGVyLFxuXHRcdFx0XHRcdGAke2tleXdvcmRMb2NhdGlvbn0vJHtlbmNvZGVQb2ludGVyKGtleSl9YCxcblx0XHRcdFx0KTtcblx0XHRcdFx0aWYgKHJlc3VsdC52YWxpZCkge1xuXHRcdFx0XHRcdGV2YWx1YXRlZFtrZXldID0gdGhpc0V2YWx1YXRlZFtrZXldID0gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzdG9wID0gc2hvcnRDaXJjdWl0O1xuXHRcdFx0XHRcdGVycm9ycy5wdXNoKFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRrZXl3b3JkOiBcInByb3BlcnRpZXNcIixcblx0XHRcdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRlcnJvcjogYFByb3BlcnR5IFwiJHtrZXl9XCIgZG9lcyBub3QgbWF0Y2ggc2NoZW1hLmAsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0Li4ucmVzdWx0LmVycm9ycyxcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGlmIChzdG9wKSBicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICghc3RvcCAmJiAkcGF0dGVyblByb3BlcnRpZXMgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y29uc3Qga2V5d29yZExvY2F0aW9uID0gYCR7c2NoZW1hTG9jYXRpb259L3BhdHRlcm5Qcm9wZXJ0aWVzYDtcblx0XHRcdGZvciAoY29uc3QgcGF0dGVybiBpbiAkcGF0dGVyblByb3BlcnRpZXMpIHtcblx0XHRcdFx0Y29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKHBhdHRlcm4pO1xuXHRcdFx0XHRjb25zdCBzdWJTY2hlbWEgPSAkcGF0dGVyblByb3BlcnRpZXNbcGF0dGVybl07XG5cdFx0XHRcdGZvciAoY29uc3Qga2V5IGluIGluc3RhbmNlKSB7XG5cdFx0XHRcdFx0aWYgKCFyZWdleC50ZXN0KGtleSkpIHtcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjb25zdCBzdWJJbnN0YW5jZVBvaW50ZXIgPSBgJHtpbnN0YW5jZUxvY2F0aW9ufS8ke1xuXHRcdFx0XHRcdFx0ZW5jb2RlUG9pbnRlcihcblx0XHRcdFx0XHRcdFx0a2V5LFxuXHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdH1gO1xuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlKFxuXHRcdFx0XHRcdFx0aW5zdGFuY2Vba2V5XSxcblx0XHRcdFx0XHRcdHN1YlNjaGVtYSxcblx0XHRcdFx0XHRcdGRyYWZ0LFxuXHRcdFx0XHRcdFx0bG9va3VwLFxuXHRcdFx0XHRcdFx0c2hvcnRDaXJjdWl0LFxuXHRcdFx0XHRcdFx0cmVjdXJzaXZlQW5jaG9yLFxuXHRcdFx0XHRcdFx0c3ViSW5zdGFuY2VQb2ludGVyLFxuXHRcdFx0XHRcdFx0YCR7a2V5d29yZExvY2F0aW9ufS8ke2VuY29kZVBvaW50ZXIocGF0dGVybil9YCxcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGlmIChyZXN1bHQudmFsaWQpIHtcblx0XHRcdFx0XHRcdGV2YWx1YXRlZFtrZXldID0gdGhpc0V2YWx1YXRlZFtrZXldID0gdHJ1ZTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0c3RvcCA9IHNob3J0Q2lyY3VpdDtcblx0XHRcdFx0XHRcdGVycm9ycy5wdXNoKFxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdFx0XHRcdFx0XHRrZXl3b3JkOiBcInBhdHRlcm5Qcm9wZXJ0aWVzXCIsXG5cdFx0XHRcdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdGVycm9yOiBgUHJvcGVydHkgXCIke2tleX1cIiBtYXRjaGVzIHBhdHRlcm4gXCIke3BhdHRlcm59XCIgYnV0IGRvZXMgbm90IG1hdGNoIGFzc29jaWF0ZWQgc2NoZW1hLmAsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdC4uLnJlc3VsdC5lcnJvcnMsXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICghc3RvcCAmJiAkYWRkaXRpb25hbFByb3BlcnRpZXMgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y29uc3Qga2V5d29yZExvY2F0aW9uID0gYCR7c2NoZW1hTG9jYXRpb259L2FkZGl0aW9uYWxQcm9wZXJ0aWVzYDtcblx0XHRcdGZvciAoY29uc3Qga2V5IGluIGluc3RhbmNlKSB7XG5cdFx0XHRcdGlmICh0aGlzRXZhbHVhdGVkW2tleV0pIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zdCBzdWJJbnN0YW5jZVBvaW50ZXIgPSBgJHtpbnN0YW5jZUxvY2F0aW9ufS8ke2VuY29kZVBvaW50ZXIoa2V5KX1gO1xuXHRcdFx0XHRjb25zdCByZXN1bHQgPSB2YWxpZGF0ZShcblx0XHRcdFx0XHRpbnN0YW5jZVtrZXldLFxuXHRcdFx0XHRcdCRhZGRpdGlvbmFsUHJvcGVydGllcyxcblx0XHRcdFx0XHRkcmFmdCxcblx0XHRcdFx0XHRsb29rdXAsXG5cdFx0XHRcdFx0c2hvcnRDaXJjdWl0LFxuXHRcdFx0XHRcdHJlY3Vyc2l2ZUFuY2hvcixcblx0XHRcdFx0XHRzdWJJbnN0YW5jZVBvaW50ZXIsXG5cdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uLFxuXHRcdFx0XHQpO1xuXHRcdFx0XHRpZiAocmVzdWx0LnZhbGlkKSB7XG5cdFx0XHRcdFx0ZXZhbHVhdGVkW2tleV0gPSB0cnVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHN0b3AgPSBzaG9ydENpcmN1aXQ7XG5cdFx0XHRcdFx0ZXJyb3JzLnB1c2goXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdFx0XHRcdGtleXdvcmQ6IFwiYWRkaXRpb25hbFByb3BlcnRpZXNcIixcblx0XHRcdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRlcnJvcjogYFByb3BlcnR5IFwiJHtrZXl9XCIgZG9lcyBub3QgbWF0Y2ggYWRkaXRpb25hbCBwcm9wZXJ0aWVzIHNjaGVtYS5gLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdC4uLnJlc3VsdC5lcnJvcnMsXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoIXN0b3AgJiYgJHVuZXZhbHVhdGVkUHJvcGVydGllcyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRjb25zdCBrZXl3b3JkTG9jYXRpb24gPSBgJHtzY2hlbWFMb2NhdGlvbn0vdW5ldmFsdWF0ZWRQcm9wZXJ0aWVzYDtcblx0XHRcdGZvciAoY29uc3Qga2V5IGluIGluc3RhbmNlKSB7XG5cdFx0XHRcdGlmICghZXZhbHVhdGVkW2tleV0pIHtcblx0XHRcdFx0XHRjb25zdCBzdWJJbnN0YW5jZVBvaW50ZXIgPSBgJHtpbnN0YW5jZUxvY2F0aW9ufS8ke1xuXHRcdFx0XHRcdFx0ZW5jb2RlUG9pbnRlcihcblx0XHRcdFx0XHRcdFx0a2V5LFxuXHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdH1gO1xuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlKFxuXHRcdFx0XHRcdFx0aW5zdGFuY2Vba2V5XSxcblx0XHRcdFx0XHRcdCR1bmV2YWx1YXRlZFByb3BlcnRpZXMsXG5cdFx0XHRcdFx0XHRkcmFmdCxcblx0XHRcdFx0XHRcdGxvb2t1cCxcblx0XHRcdFx0XHRcdHNob3J0Q2lyY3VpdCxcblx0XHRcdFx0XHRcdHJlY3Vyc2l2ZUFuY2hvcixcblx0XHRcdFx0XHRcdHN1Ykluc3RhbmNlUG9pbnRlcixcblx0XHRcdFx0XHRcdGtleXdvcmRMb2NhdGlvbixcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGlmIChyZXN1bHQudmFsaWQpIHtcblx0XHRcdFx0XHRcdGV2YWx1YXRlZFtrZXldID0gdHJ1ZTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZXJyb3JzLnB1c2goXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdGtleXdvcmQ6IFwidW5ldmFsdWF0ZWRQcm9wZXJ0aWVzXCIsXG5cdFx0XHRcdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdGVycm9yOiBgUHJvcGVydHkgXCIke2tleX1cIiBkb2VzIG5vdCBtYXRjaCB1bmV2YWx1YXRlZCBwcm9wZXJ0aWVzIHNjaGVtYS5gLFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHQuLi5yZXN1bHQuZXJyb3JzLFxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSBpZiAoaW5zdGFuY2VUeXBlID09PSBcImFycmF5XCIpIHtcblx0XHRpZiAoJG1heEl0ZW1zICE9PSB1bmRlZmluZWQgJiYgaW5zdGFuY2UubGVuZ3RoID4gJG1heEl0ZW1zKSB7XG5cdFx0XHRlcnJvcnMucHVzaCh7XG5cdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdGtleXdvcmQ6IFwibWF4SXRlbXNcIixcblx0XHRcdFx0a2V5d29yZExvY2F0aW9uOiBgJHtzY2hlbWFMb2NhdGlvbn0vbWF4SXRlbXNgLFxuXHRcdFx0XHRlcnJvcjogYEFycmF5IGhhcyB0b28gbWFueSBpdGVtcyAoJHtpbnN0YW5jZS5sZW5ndGh9ID4gJHskbWF4SXRlbXN9KS5gLFxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKCRtaW5JdGVtcyAhPT0gdW5kZWZpbmVkICYmIGluc3RhbmNlLmxlbmd0aCA8ICRtaW5JdGVtcykge1xuXHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRrZXl3b3JkOiBcIm1pbkl0ZW1zXCIsXG5cdFx0XHRcdGtleXdvcmRMb2NhdGlvbjogYCR7c2NoZW1hTG9jYXRpb259L21pbkl0ZW1zYCxcblx0XHRcdFx0ZXJyb3I6IGBBcnJheSBoYXMgdG9vIGZldyBpdGVtcyAoJHtpbnN0YW5jZS5sZW5ndGh9IDwgJHskbWluSXRlbXN9KS5gLFxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbGVuZ3RoOiBudW1iZXIgPSBpbnN0YW5jZS5sZW5ndGg7XG5cdFx0bGV0IGkgPSAwO1xuXHRcdGxldCBzdG9wID0gZmFsc2U7XG5cblx0XHRpZiAoJHByZWZpeEl0ZW1zICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGNvbnN0IGtleXdvcmRMb2NhdGlvbiA9IGAke3NjaGVtYUxvY2F0aW9ufS9wcmVmaXhJdGVtc2A7XG5cdFx0XHRjb25zdCBsZW5ndGgyID0gTWF0aC5taW4oJHByZWZpeEl0ZW1zLmxlbmd0aCwgbGVuZ3RoKTtcblx0XHRcdGZvciAoOyBpIDwgbGVuZ3RoMjsgaSsrKSB7XG5cdFx0XHRcdGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlKFxuXHRcdFx0XHRcdGluc3RhbmNlW2ldLFxuXHRcdFx0XHRcdCRwcmVmaXhJdGVtc1tpXSxcblx0XHRcdFx0XHRkcmFmdCxcblx0XHRcdFx0XHRsb29rdXAsXG5cdFx0XHRcdFx0c2hvcnRDaXJjdWl0LFxuXHRcdFx0XHRcdHJlY3Vyc2l2ZUFuY2hvcixcblx0XHRcdFx0XHRgJHtpbnN0YW5jZUxvY2F0aW9ufS8ke2l9YCxcblx0XHRcdFx0XHRgJHtrZXl3b3JkTG9jYXRpb259LyR7aX1gLFxuXHRcdFx0XHQpO1xuXHRcdFx0XHRldmFsdWF0ZWRbaV0gPSB0cnVlO1xuXHRcdFx0XHRpZiAoIXJlc3VsdC52YWxpZCkge1xuXHRcdFx0XHRcdHN0b3AgPSBzaG9ydENpcmN1aXQ7XG5cdFx0XHRcdFx0ZXJyb3JzLnB1c2goXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdFx0XHRcdGtleXdvcmQ6IFwicHJlZml4SXRlbXNcIixcblx0XHRcdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRlcnJvcjogYEl0ZW1zIGRpZCBub3QgbWF0Y2ggc2NoZW1hLmAsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0Li4ucmVzdWx0LmVycm9ycyxcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGlmIChzdG9wKSBicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICgkaXRlbXMgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y29uc3Qga2V5d29yZExvY2F0aW9uID0gYCR7c2NoZW1hTG9jYXRpb259L2l0ZW1zYDtcblx0XHRcdGlmIChBcnJheS5pc0FycmF5KCRpdGVtcykpIHtcblx0XHRcdFx0Y29uc3QgbGVuZ3RoMiA9IE1hdGgubWluKCRpdGVtcy5sZW5ndGgsIGxlbmd0aCk7XG5cdFx0XHRcdGZvciAoOyBpIDwgbGVuZ3RoMjsgaSsrKSB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gdmFsaWRhdGUoXG5cdFx0XHRcdFx0XHRpbnN0YW5jZVtpXSxcblx0XHRcdFx0XHRcdCRpdGVtc1tpXSxcblx0XHRcdFx0XHRcdGRyYWZ0LFxuXHRcdFx0XHRcdFx0bG9va3VwLFxuXHRcdFx0XHRcdFx0c2hvcnRDaXJjdWl0LFxuXHRcdFx0XHRcdFx0cmVjdXJzaXZlQW5jaG9yLFxuXHRcdFx0XHRcdFx0YCR7aW5zdGFuY2VMb2NhdGlvbn0vJHtpfWAsXG5cdFx0XHRcdFx0XHRgJHtrZXl3b3JkTG9jYXRpb259LyR7aX1gLFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0ZXZhbHVhdGVkW2ldID0gdHJ1ZTtcblx0XHRcdFx0XHRpZiAoIXJlc3VsdC52YWxpZCkge1xuXHRcdFx0XHRcdFx0c3RvcCA9IHNob3J0Q2lyY3VpdDtcblx0XHRcdFx0XHRcdGVycm9ycy5wdXNoKFxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdFx0XHRcdFx0XHRrZXl3b3JkOiBcIml0ZW1zXCIsXG5cdFx0XHRcdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdGVycm9yOiBgSXRlbXMgZGlkIG5vdCBtYXRjaCBzY2hlbWEuYCxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0Li4ucmVzdWx0LmVycm9ycyxcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRpZiAoc3RvcCkgYnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gdmFsaWRhdGUoXG5cdFx0XHRcdFx0XHRpbnN0YW5jZVtpXSxcblx0XHRcdFx0XHRcdCRpdGVtcyxcblx0XHRcdFx0XHRcdGRyYWZ0LFxuXHRcdFx0XHRcdFx0bG9va3VwLFxuXHRcdFx0XHRcdFx0c2hvcnRDaXJjdWl0LFxuXHRcdFx0XHRcdFx0cmVjdXJzaXZlQW5jaG9yLFxuXHRcdFx0XHRcdFx0YCR7aW5zdGFuY2VMb2NhdGlvbn0vJHtpfWAsXG5cdFx0XHRcdFx0XHRrZXl3b3JkTG9jYXRpb24sXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRldmFsdWF0ZWRbaV0gPSB0cnVlO1xuXHRcdFx0XHRcdGlmICghcmVzdWx0LnZhbGlkKSB7XG5cdFx0XHRcdFx0XHRzdG9wID0gc2hvcnRDaXJjdWl0O1xuXHRcdFx0XHRcdFx0ZXJyb3JzLnB1c2goXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdGtleXdvcmQ6IFwiaXRlbXNcIixcblx0XHRcdFx0XHRcdFx0XHRrZXl3b3JkTG9jYXRpb24sXG5cdFx0XHRcdFx0XHRcdFx0ZXJyb3I6IGBJdGVtcyBkaWQgbm90IG1hdGNoIHNjaGVtYS5gLFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHQuLi5yZXN1bHQuZXJyb3JzLFxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdGlmIChzdG9wKSBicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKCFzdG9wICYmICRhZGRpdGlvbmFsSXRlbXMgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRjb25zdCBrZXl3b3JkTG9jYXRpb24gPSBgJHtzY2hlbWFMb2NhdGlvbn0vYWRkaXRpb25hbEl0ZW1zYDtcblx0XHRcdFx0Zm9yICg7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlKFxuXHRcdFx0XHRcdFx0aW5zdGFuY2VbaV0sXG5cdFx0XHRcdFx0XHQkYWRkaXRpb25hbEl0ZW1zLFxuXHRcdFx0XHRcdFx0ZHJhZnQsXG5cdFx0XHRcdFx0XHRsb29rdXAsXG5cdFx0XHRcdFx0XHRzaG9ydENpcmN1aXQsXG5cdFx0XHRcdFx0XHRyZWN1cnNpdmVBbmNob3IsXG5cdFx0XHRcdFx0XHRgJHtpbnN0YW5jZUxvY2F0aW9ufS8ke2l9YCxcblx0XHRcdFx0XHRcdGtleXdvcmRMb2NhdGlvbixcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGV2YWx1YXRlZFtpXSA9IHRydWU7XG5cdFx0XHRcdFx0aWYgKCFyZXN1bHQudmFsaWQpIHtcblx0XHRcdFx0XHRcdHN0b3AgPSBzaG9ydENpcmN1aXQ7XG5cdFx0XHRcdFx0XHRlcnJvcnMucHVzaChcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdFx0XHRcdFx0a2V5d29yZDogXCJhZGRpdGlvbmFsSXRlbXNcIixcblx0XHRcdFx0XHRcdFx0XHRrZXl3b3JkTG9jYXRpb24sXG5cdFx0XHRcdFx0XHRcdFx0ZXJyb3I6IGBJdGVtcyBkaWQgbm90IG1hdGNoIGFkZGl0aW9uYWwgaXRlbXMgc2NoZW1hLmAsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdC4uLnJlc3VsdC5lcnJvcnMsXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICgkY29udGFpbnMgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0aWYgKGxlbmd0aCA9PT0gMCAmJiAkbWluQ29udGFpbnMgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRlcnJvcnMucHVzaCh7XG5cdFx0XHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdFx0XHRrZXl3b3JkOiBcImNvbnRhaW5zXCIsXG5cdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uOiBgJHtzY2hlbWFMb2NhdGlvbn0vY29udGFpbnNgLFxuXHRcdFx0XHRcdGVycm9yOiBgQXJyYXkgaXMgZW1wdHkuIEl0IG11c3QgY29udGFpbiBhdCBsZWFzdCBvbmUgaXRlbSBtYXRjaGluZyB0aGUgc2NoZW1hLmAsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIGlmICgkbWluQ29udGFpbnMgIT09IHVuZGVmaW5lZCAmJiBsZW5ndGggPCAkbWluQ29udGFpbnMpIHtcblx0XHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdFx0a2V5d29yZDogXCJtaW5Db250YWluc1wiLFxuXHRcdFx0XHRcdGtleXdvcmRMb2NhdGlvbjogYCR7c2NoZW1hTG9jYXRpb259L21pbkNvbnRhaW5zYCxcblx0XHRcdFx0XHRlcnJvcjogYEFycmF5IGhhcyBsZXNzIGl0ZW1zICgke2xlbmd0aH0pIHRoYW4gbWluQ29udGFpbnMgKCR7JG1pbkNvbnRhaW5zfSkuYCxcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCBrZXl3b3JkTG9jYXRpb24gPSBgJHtzY2hlbWFMb2NhdGlvbn0vY29udGFpbnNgO1xuXHRcdFx0XHRjb25zdCBlcnJvcnNMZW5ndGggPSBlcnJvcnMubGVuZ3RoO1xuXHRcdFx0XHRsZXQgY29udGFpbmVkID0gMDtcblx0XHRcdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBsZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlKFxuXHRcdFx0XHRcdFx0aW5zdGFuY2Vbal0sXG5cdFx0XHRcdFx0XHQkY29udGFpbnMsXG5cdFx0XHRcdFx0XHRkcmFmdCxcblx0XHRcdFx0XHRcdGxvb2t1cCxcblx0XHRcdFx0XHRcdHNob3J0Q2lyY3VpdCxcblx0XHRcdFx0XHRcdHJlY3Vyc2l2ZUFuY2hvcixcblx0XHRcdFx0XHRcdGAke2luc3RhbmNlTG9jYXRpb259LyR7an1gLFxuXHRcdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uLFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0aWYgKHJlc3VsdC52YWxpZCkge1xuXHRcdFx0XHRcdFx0ZXZhbHVhdGVkW2pdID0gdHJ1ZTtcblx0XHRcdFx0XHRcdGNvbnRhaW5lZCsrO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRlcnJvcnMucHVzaCguLi5yZXN1bHQuZXJyb3JzKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoY29udGFpbmVkID49ICgkbWluQ29udGFpbnMgfHwgMCkpIHtcblx0XHRcdFx0XHRlcnJvcnMubGVuZ3RoID0gZXJyb3JzTGVuZ3RoO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdCRtaW5Db250YWlucyA9PT0gdW5kZWZpbmVkICYmXG5cdFx0XHRcdFx0JG1heENvbnRhaW5zID09PSB1bmRlZmluZWQgJiZcblx0XHRcdFx0XHRjb250YWluZWQgPT09IDBcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0ZXJyb3JzLnNwbGljZShlcnJvcnNMZW5ndGgsIDAsIHtcblx0XHRcdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdFx0XHRrZXl3b3JkOiBcImNvbnRhaW5zXCIsXG5cdFx0XHRcdFx0XHRrZXl3b3JkTG9jYXRpb24sXG5cdFx0XHRcdFx0XHRlcnJvcjogYEFycmF5IGRvZXMgbm90IGNvbnRhaW4gaXRlbSBtYXRjaGluZyBzY2hlbWEuYCxcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIGlmICgkbWluQ29udGFpbnMgIT09IHVuZGVmaW5lZCAmJiBjb250YWluZWQgPCAkbWluQ29udGFpbnMpIHtcblx0XHRcdFx0XHRlcnJvcnMucHVzaCh7XG5cdFx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdFx0a2V5d29yZDogXCJtaW5Db250YWluc1wiLFxuXHRcdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uOiBgJHtzY2hlbWFMb2NhdGlvbn0vbWluQ29udGFpbnNgLFxuXHRcdFx0XHRcdFx0ZXJyb3I6XG5cdFx0XHRcdFx0XHRcdGBBcnJheSBtdXN0IGNvbnRhaW4gYXQgbGVhc3QgJHskbWluQ29udGFpbnN9IGl0ZW1zIG1hdGNoaW5nIHNjaGVtYS4gT25seSAke2NvbnRhaW5lZH0gaXRlbXMgd2VyZSBmb3VuZC5gLFxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCRtYXhDb250YWlucyAhPT0gdW5kZWZpbmVkICYmIGNvbnRhaW5lZCA+ICRtYXhDb250YWlucykge1xuXHRcdFx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdFx0XHRrZXl3b3JkOiBcIm1heENvbnRhaW5zXCIsXG5cdFx0XHRcdFx0XHRrZXl3b3JkTG9jYXRpb246IGAke3NjaGVtYUxvY2F0aW9ufS9tYXhDb250YWluc2AsXG5cdFx0XHRcdFx0XHRlcnJvcjogYEFycmF5IG1heSBjb250YWluIGF0IG1vc3QgJHskbWF4Q29udGFpbnN9IGl0ZW1zIG1hdGNoaW5nIHNjaGVtYS4gJHtjb250YWluZWR9IGl0ZW1zIHdlcmUgZm91bmQuYCxcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICghc3RvcCAmJiAkdW5ldmFsdWF0ZWRJdGVtcyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRjb25zdCBrZXl3b3JkTG9jYXRpb24gPSBgJHtzY2hlbWFMb2NhdGlvbn0vdW5ldmFsdWF0ZWRJdGVtc2A7XG5cdFx0XHRmb3IgKGk7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoZXZhbHVhdGVkW2ldKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gdmFsaWRhdGUoXG5cdFx0XHRcdFx0aW5zdGFuY2VbaV0sXG5cdFx0XHRcdFx0JHVuZXZhbHVhdGVkSXRlbXMsXG5cdFx0XHRcdFx0ZHJhZnQsXG5cdFx0XHRcdFx0bG9va3VwLFxuXHRcdFx0XHRcdHNob3J0Q2lyY3VpdCxcblx0XHRcdFx0XHRyZWN1cnNpdmVBbmNob3IsXG5cdFx0XHRcdFx0YCR7aW5zdGFuY2VMb2NhdGlvbn0vJHtpfWAsXG5cdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uLFxuXHRcdFx0XHQpO1xuXHRcdFx0XHRldmFsdWF0ZWRbaV0gPSB0cnVlO1xuXHRcdFx0XHRpZiAoIXJlc3VsdC52YWxpZCkge1xuXHRcdFx0XHRcdGVycm9ycy5wdXNoKFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRrZXl3b3JkOiBcInVuZXZhbHVhdGVkSXRlbXNcIixcblx0XHRcdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uLFxuXHRcdFx0XHRcdFx0XHRlcnJvcjogYEl0ZW1zIGRpZCBub3QgbWF0Y2ggdW5ldmFsdWF0ZWQgaXRlbXMgc2NoZW1hLmAsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0Li4ucmVzdWx0LmVycm9ycyxcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKCR1bmlxdWVJdGVtcykge1xuXHRcdFx0Zm9yIChsZXQgaiA9IDA7IGogPCBsZW5ndGg7IGorKykge1xuXHRcdFx0XHRjb25zdCBhID0gaW5zdGFuY2Vbal07XG5cdFx0XHRcdGNvbnN0IGFvID0gdHlwZW9mIGEgPT09IFwib2JqZWN0XCIgJiYgYSAhPT0gbnVsbDtcblx0XHRcdFx0Zm9yIChsZXQgayA9IDA7IGsgPCBsZW5ndGg7IGsrKykge1xuXHRcdFx0XHRcdGlmIChqID09PSBrKSB7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Y29uc3QgYiA9IGluc3RhbmNlW2tdO1xuXHRcdFx0XHRcdGNvbnN0IGJvID0gdHlwZW9mIGIgPT09IFwib2JqZWN0XCIgJiYgYiAhPT0gbnVsbDtcblx0XHRcdFx0XHRpZiAoYSA9PT0gYiB8fCAoYW8gJiYgYm8gJiYgZGVlcENvbXBhcmVTdHJpY3QoYSwgYikpKSB7XG5cdFx0XHRcdFx0XHRlcnJvcnMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdFx0XHRcdGtleXdvcmQ6IFwidW5pcXVlSXRlbXNcIixcblx0XHRcdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uOiBgJHtzY2hlbWFMb2NhdGlvbn0vdW5pcXVlSXRlbXNgLFxuXHRcdFx0XHRcdFx0XHRlcnJvcjogYER1cGxpY2F0ZSBpdGVtcyBhdCBpbmRleGVzICR7an0gYW5kICR7a30uYCxcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0aiA9IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xuXHRcdFx0XHRcdFx0ayA9IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIGlmIChpbnN0YW5jZVR5cGUgPT09IFwibnVtYmVyXCIpIHtcblx0XHRpZiAoZHJhZnQgPT09IFwiNFwiKSB7XG5cdFx0XHRpZiAoXG5cdFx0XHRcdCRtaW5pbXVtICE9PSB1bmRlZmluZWQgJiZcblx0XHRcdFx0KCgkZXhjbHVzaXZlTWluaW11bSA9PT0gdHJ1ZSAmJiBpbnN0YW5jZSA8PSAkbWluaW11bSkgfHxcblx0XHRcdFx0XHRpbnN0YW5jZSA8ICRtaW5pbXVtKVxuXHRcdFx0KSB7XG5cdFx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdGtleXdvcmQ6IFwibWluaW11bVwiLFxuXHRcdFx0XHRcdGtleXdvcmRMb2NhdGlvbjogYCR7c2NoZW1hTG9jYXRpb259L21pbmltdW1gLFxuXHRcdFx0XHRcdGVycm9yOiBgJHtpbnN0YW5jZX0gaXMgbGVzcyB0aGFuICR7JGV4Y2x1c2l2ZU1pbmltdW0gPyBcIm9yIGVxdWFsIHRvIFwiIDogXCJcIn0gJHskbWluaW11bX0uYCxcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoXG5cdFx0XHRcdCRtYXhpbXVtICE9PSB1bmRlZmluZWQgJiZcblx0XHRcdFx0KCgkZXhjbHVzaXZlTWF4aW11bSA9PT0gdHJ1ZSAmJiBpbnN0YW5jZSA+PSAkbWF4aW11bSkgfHxcblx0XHRcdFx0XHRpbnN0YW5jZSA+ICRtYXhpbXVtKVxuXHRcdFx0KSB7XG5cdFx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdGtleXdvcmQ6IFwibWF4aW11bVwiLFxuXHRcdFx0XHRcdGtleXdvcmRMb2NhdGlvbjogYCR7c2NoZW1hTG9jYXRpb259L21heGltdW1gLFxuXHRcdFx0XHRcdGVycm9yOiBgJHtpbnN0YW5jZX0gaXMgZ3JlYXRlciB0aGFuICR7JGV4Y2x1c2l2ZU1heGltdW0gPyBcIm9yIGVxdWFsIHRvIFwiIDogXCJcIn0gJHskbWF4aW11bX0uYCxcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICgkbWluaW11bSAhPT0gdW5kZWZpbmVkICYmIGluc3RhbmNlIDwgJG1pbmltdW0pIHtcblx0XHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdFx0a2V5d29yZDogXCJtaW5pbXVtXCIsXG5cdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uOiBgJHtzY2hlbWFMb2NhdGlvbn0vbWluaW11bWAsXG5cdFx0XHRcdFx0ZXJyb3I6IGAke2luc3RhbmNlfSBpcyBsZXNzIHRoYW4gJHskbWluaW11bX0uYCxcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoJG1heGltdW0gIT09IHVuZGVmaW5lZCAmJiBpbnN0YW5jZSA+ICRtYXhpbXVtKSB7XG5cdFx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRcdGtleXdvcmQ6IFwibWF4aW11bVwiLFxuXHRcdFx0XHRcdGtleXdvcmRMb2NhdGlvbjogYCR7c2NoZW1hTG9jYXRpb259L21heGltdW1gLFxuXHRcdFx0XHRcdGVycm9yOiBgJHtpbnN0YW5jZX0gaXMgZ3JlYXRlciB0aGFuICR7JG1heGltdW19LmAsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCRleGNsdXNpdmVNaW5pbXVtICE9PSB1bmRlZmluZWQgJiYgaW5zdGFuY2UgPD0gJGV4Y2x1c2l2ZU1pbmltdW0pIHtcblx0XHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdFx0a2V5d29yZDogXCJleGNsdXNpdmVNaW5pbXVtXCIsXG5cdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uOiBgJHtzY2hlbWFMb2NhdGlvbn0vZXhjbHVzaXZlTWluaW11bWAsXG5cdFx0XHRcdFx0ZXJyb3I6IGAke2luc3RhbmNlfSBpcyBsZXNzIHRoYW4gJHskZXhjbHVzaXZlTWluaW11bX0uYCxcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoJGV4Y2x1c2l2ZU1heGltdW0gIT09IHVuZGVmaW5lZCAmJiBpbnN0YW5jZSA+PSAkZXhjbHVzaXZlTWF4aW11bSkge1xuXHRcdFx0XHRlcnJvcnMucHVzaCh7XG5cdFx0XHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdFx0XHRrZXl3b3JkOiBcImV4Y2x1c2l2ZU1heGltdW1cIixcblx0XHRcdFx0XHRrZXl3b3JkTG9jYXRpb246IGAke3NjaGVtYUxvY2F0aW9ufS9leGNsdXNpdmVNYXhpbXVtYCxcblx0XHRcdFx0XHRlcnJvcjogYCR7aW5zdGFuY2V9IGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byAkeyRleGNsdXNpdmVNYXhpbXVtfS5gLFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKCRtdWx0aXBsZU9mICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGNvbnN0IHJlbWFpbmRlciA9IGluc3RhbmNlICUgJG11bHRpcGxlT2Y7XG5cdFx0XHRpZiAoXG5cdFx0XHRcdE1hdGguYWJzKDAgLSByZW1haW5kZXIpID49IDEuMTkyMDkyOWUtNyAmJlxuXHRcdFx0XHRNYXRoLmFicygkbXVsdGlwbGVPZiAtIHJlbWFpbmRlcikgPj0gMS4xOTIwOTI5ZS03XG5cdFx0XHQpIHtcblx0XHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRcdGluc3RhbmNlTG9jYXRpb24sXG5cdFx0XHRcdFx0a2V5d29yZDogXCJtdWx0aXBsZU9mXCIsXG5cdFx0XHRcdFx0a2V5d29yZExvY2F0aW9uOiBgJHtzY2hlbWFMb2NhdGlvbn0vbXVsdGlwbGVPZmAsXG5cdFx0XHRcdFx0ZXJyb3I6IGAke2luc3RhbmNlfSBpcyBub3QgYSBtdWx0aXBsZSBvZiAkeyRtdWx0aXBsZU9mfS5gLFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSBpZiAoaW5zdGFuY2VUeXBlID09PSBcInN0cmluZ1wiKSB7XG5cdFx0Y29uc3QgbGVuZ3RoID0gJG1pbkxlbmd0aCA9PT0gdW5kZWZpbmVkICYmICRtYXhMZW5ndGggPT09IHVuZGVmaW5lZCA/IDAgOiB1Y3MybGVuZ3RoKGluc3RhbmNlKTtcblx0XHRpZiAoJG1pbkxlbmd0aCAhPT0gdW5kZWZpbmVkICYmIGxlbmd0aCA8ICRtaW5MZW5ndGgpIHtcblx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdFx0a2V5d29yZDogXCJtaW5MZW5ndGhcIixcblx0XHRcdFx0a2V5d29yZExvY2F0aW9uOiBgJHtzY2hlbWFMb2NhdGlvbn0vbWluTGVuZ3RoYCxcblx0XHRcdFx0ZXJyb3I6IGBTdHJpbmcgaXMgdG9vIHNob3J0ICgke2xlbmd0aH0gPCAkeyRtaW5MZW5ndGh9KS5gLFxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGlmICgkbWF4TGVuZ3RoICE9PSB1bmRlZmluZWQgJiYgbGVuZ3RoID4gJG1heExlbmd0aCkge1xuXHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRpbnN0YW5jZUxvY2F0aW9uLFxuXHRcdFx0XHRrZXl3b3JkOiBcIm1heExlbmd0aFwiLFxuXHRcdFx0XHRrZXl3b3JkTG9jYXRpb246IGAke3NjaGVtYUxvY2F0aW9ufS9tYXhMZW5ndGhgLFxuXHRcdFx0XHRlcnJvcjogYFN0cmluZyBpcyB0b28gbG9uZyAoJHtsZW5ndGh9ID4gJHskbWF4TGVuZ3RofSkuYCxcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRpZiAoJHBhdHRlcm4gIT09IHVuZGVmaW5lZCAmJiAhbmV3IFJlZ0V4cCgkcGF0dGVybikudGVzdChpbnN0YW5jZSkpIHtcblx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdFx0a2V5d29yZDogXCJwYXR0ZXJuXCIsXG5cdFx0XHRcdGtleXdvcmRMb2NhdGlvbjogYCR7c2NoZW1hTG9jYXRpb259L3BhdHRlcm5gLFxuXHRcdFx0XHRlcnJvcjogYFN0cmluZyBkb2VzIG5vdCBtYXRjaCBwYXR0ZXJuLmAsXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0aWYgKFxuXHRcdFx0JGZvcm1hdCAhPT0gdW5kZWZpbmVkICYmXG5cdFx0XHRmYXN0Rm9ybWF0WyRmb3JtYXRdICYmXG5cdFx0XHQhZmFzdEZvcm1hdFskZm9ybWF0XShpbnN0YW5jZSlcblx0XHQpIHtcblx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0aW5zdGFuY2VMb2NhdGlvbixcblx0XHRcdFx0a2V5d29yZDogXCJmb3JtYXRcIixcblx0XHRcdFx0a2V5d29yZExvY2F0aW9uOiBgJHtzY2hlbWFMb2NhdGlvbn0vZm9ybWF0YCxcblx0XHRcdFx0ZXJyb3I6IGBTdHJpbmcgZG9lcyBub3QgbWF0Y2ggZm9ybWF0IFwiJHskZm9ybWF0fVwiLmAsXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4geyB2YWxpZDogZXJyb3JzLmxlbmd0aCA9PT0gMCwgZXJyb3JzIH07XG59XG4iXX0=
