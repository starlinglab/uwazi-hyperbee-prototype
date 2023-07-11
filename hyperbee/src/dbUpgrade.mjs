import { dbGet } from "./dbGet.mjs";
import { upgradeTimestampAttestation } from "./timestamp.mjs";
import { makeKey } from "./makeKey.mjs";
import { encode } from "@ipld/dag-cbor";

/**
 * Upgrade the OTS timestamp of an attestation, then save that new timestamp.
 *
 * sigKey is an ed25519 public key.
 */
const dbUpgrade = async (db, id, attr, sigKey, encryptionKey = false) => {
  const att = await dbGet(db, id, attr, sigKey, encryptionKey);
  await upgradeTimestampAttestation(att.timestamp);
  // Store attestation directly since it already has signature etc.
  const key = makeKey(id, attr);
  return db.put(key, encode(att));
};

export { dbUpgrade };
