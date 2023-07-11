import { encode } from "@ipld/dag-cbor";
import { CID } from "multiformats";

import * as ed from "@noble/ed25519";
import { signAttestation } from "./signAttestation.mjs";
import { encryptValue } from "./encryptValue.mjs";
import { timestampAttestation } from "./timestamp.mjs";
import { makeKey } from "./makeKey.mjs";
import { dbGet } from "./dbGet.mjs";

var sigKey = null;

const setSigningKey = (privKey) => {
  sigKey = privKey;
};

/**
 * Providing a batch instead of a db is allowed.
 */
const dbPut = async (db, id, attr, value, encryptionKey = false) => {
  const rawAttestation = {
    CID: CID.parse(id),
    attribute: attr,
    value,
    encrypted: Boolean(encryptionKey),
  };
  const signature = await signAttestation(sigKey, rawAttestation);
  const signedAttestation = {
    ...rawAttestation,
    signature,
  };

  let attestation;

  if (encryptionKey) {
    attestation = {
      CID: CID.parse(id),
      attribute: attr,
      value: encryptValue(value, encryptionKey),
      encrypted: true,
    };
  } else {
    attestation = rawAttestation;
  }

  const timestamp = await timestampAttestation(signedAttestation);

  const key = makeKey(id, attr);
  return db.put(
    key,
    encode({
      attestation,
      signature,
      timestamp: timestamp,
    })
  );
};

/**
 * Appends to an array in the database.
 *
 * If the given attribute doesn't exist an array will be created.
 *
 * If a non-array object is already stored under the given attribute an error
 * will be thrown.
 *
 * The new value of the array is returned.
 *
 * A batch is used so that the append is treated as one locked atomic operation,
 * not a separate read and write.
 */
const dbAppend = async (db, id, attr, value, encryptionKey = false) => {
  const batch = db.batch();
  await batch.lock();

  const result = await dbGet(
    batch,
    id,
    attr,
    await ed.getPublicKeyAsync(sigKey),
    encryptionKey,
    true
  );
  if (result === null) {
    // Nothing is stored under this attribute yet
    await dbPut(batch, id, attr, [value], encryptionKey);
    await batch.flush();
    return [value];
  }
  if (!(result.value instanceof Array)) {
    throw new Error(`A non-array object is stored at ${attr}`);
  }

  // Append to existing array
  result.value.push(value);
  await dbPut(batch, id, attr, result.value, encryptionKey);
  await batch.flush();
  return result.value;
};

/**
 * If the given key and/or verb doesn't exist it will be created.
 *
 * Duplicate CIDs in the array are allowed.
 *
 * A batch is used so that the change is treated as one locked atomic operation,
 * not a separate read and write.
 *
 * @param {string} childOrParent is either "children" or "parents" as the db key
 * @param {string} verb is a verb for the relation like "derived" or "transcoded"
 * @param {CID} relationCid is the CID object to be added as a relation
 */
const dbAddRelation = async (db, id, childOrParent, verb, relationCid) => {
  if (childOrParent !== "children" && childOrParent !== "parents") {
    throw new Error("childOrParent must be children or parents");
  }

  const batch = db.batch();
  await batch.lock();

  const result = await dbGet(
    batch,
    id,
    childOrParent,
    await ed.getPublicKeyAsync(sigKey),
    false,
    true
  );
  if (result === null) {
    // Nothing is stored under this attribute yet
    await dbPut(batch, id, childOrParent, { [verb]: [relationCid] });
    await batch.flush();
    return;
  }
  if (verb in result.value) {
    result.value[verb].push(relationCid);
  } else {
    result.value[verb] = [relationCid];
  }
  await dbPut(batch, id, childOrParent, result.value);
  await batch.flush();
};

/**
 * Same as dbAddRelation. The first CID that matches the given one is removed.
 */
const dbRemoveRelation = async (db, id, childOrParent, verb, relationCid) => {
  if (childOrParent !== "children" && childOrParent !== "parents") {
    throw new Error("childOrParent must be children or parents");
  }

  const batch = db.batch();
  await batch.lock();

  const result = await dbGet(
    batch,
    id,
    childOrParent,
    await ed.getPublicKeyAsync(sigKey),
    false,
    true
  );
  if (result === null) {
    // Nothing is stored under this attribute yet, so do nothing
    await batch.flush();
    return;
  }
  if (!(verb in result.value)) {
    // Array for this verb doesn't exist, so do nothing
    await batch.flush();
    return;
  }
  // Array exists for verb
  for (let i = 0; i < result.value[verb].length; i++) {
    const cid = result.value[verb][i];
    if (cid.equals(relationCid)) {
      result.value[verb].splice(i, 1);
      break;
    }
  }
  await dbPut(batch, id, childOrParent, result.value);
  await batch.flush();
};

export { dbPut, setSigningKey, dbAppend, dbAddRelation, dbRemoveRelation };
