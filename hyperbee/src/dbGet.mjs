import { decode } from "@ipld/dag-cbor";

import { verifyAttSignature } from "./verifySignature.mjs";
import { decryptValue } from "./decryptValue.mjs";
import { makeKey } from "./makeKey.mjs";

/**
 * Get verified output from the database.
 * Only properly signed entries will be returned.
 *
 * If the value is encrypted and encKey is not provided, an error will be raised,
 * as this means the signature cannot be validated either.
 *
 * The "encrypted" boolean will not be changed.
 *
 * If "reduced" is set to true only the value and timestamp are returned,
 * not the whole object.
 *
 * Timestamping is currently not validated.
 *
 * sigKey is an ed25519 public key.
 *
 * null is returned if the key doesn't exist in the database.
 *
 * Providing a batch instead of a db is allowed.
 */
const dbGet = async (db, id, attr, sigKey, encKey = false, reduced = false) => {
  const result = await db.get(makeKey(id, attr));
  if (result === null) {
    return null;
  }
  const resultObj = decode(result.value);
  if (resultObj.attestation.encrypted) {
    resultObj.attestation.value = decryptValue(
      resultObj.attestation.value,
      encKey
    );
  }
  await verifyAttSignature(resultObj, sigKey);
  if (reduced) {
    return {
      value: resultObj.attestation.value,
      timestamp: resultObj.timestamp.submitted,
    };
  }
  return resultObj;
};

/**
 * Returns if the attribute is listed as encrypted.
 *
 * No signatures are validated.
 */
const dbIsEncrypted = async (db, id, attr) => {
  const result = await db.get(makeKey(id, attr));
  const resultObj = decode(result.value);
  return resultObj.attestation.encrypted;
};

/**
 * Returns only the decoded value of the given attribute.
 * No signatures are validated!
 *
 * Specifically the attestation value is returned.
 */
const dbRawValue = async (db, id, attr) => {
  const result = await db.get(makeKey(id, attr));
  const resultObj = decode(result.value);
  return resultObj.attestation.value;
};

export { dbGet, dbIsEncrypted, dbRawValue };
