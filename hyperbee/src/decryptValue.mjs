import pkg from "tweetnacl";
const { secretbox } = pkg;
import { decode } from "@ipld/dag-cbor";

const decryptValue = (msgWithNonce, encryptionKey) => {
  // Adapted from https://github.com/dchest/tweetnacl-js/wiki/Examples#secretbox
  const nonce = msgWithNonce.slice(0, secretbox.nonceLength);
  const msg = msgWithNonce.slice(secretbox.nonceLength, msgWithNonce.length);
  const decrypted = secretbox.open(msg, nonce, encryptionKey);
  if (!decrypted) {
    throw new Error("Could not decrypt message");
  }
  return decode(decrypted);
};

export { decryptValue };
