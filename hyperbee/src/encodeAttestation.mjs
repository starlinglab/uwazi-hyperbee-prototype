import * as Block from "multiformats/block";
import { sha256 } from "multiformats/hashes/sha2";
import * as dagCBOR from "@ipld/dag-cbor";

const encodeAttestation = async (attestation) => {
  const block = await Block.encode({
    value: attestation,
    codec: dagCBOR,
    hasher: sha256,
  });
  return block.cid;
};

export { encodeAttestation };
