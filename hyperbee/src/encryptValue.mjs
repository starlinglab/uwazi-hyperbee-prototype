import pkg from "tweetnacl";
const { secretbox, randomBytes } = pkg;
import { encode } from "@ipld/dag-cbor";

const newKey = () => {
  return randomBytes(secretbox.keyLength);
};

const encryptValue = (obj, encryptionKey) => {
  // Adapted from https://github.com/dchest/tweetnacl-js/wiki/Examples#secretbox
  const nonce = randomBytes(secretbox.nonceLength);
  const box = secretbox(encode(obj), nonce, encryptionKey);
  const fullMessage = new Uint8Array(nonce.length + box.length);
  fullMessage.set(nonce);
  fullMessage.set(box, nonce.length);
  return fullMessage;
};

export { encryptValue, newKey };
