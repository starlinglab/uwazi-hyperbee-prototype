import * as Block from "multiformats/block";
import { sha256 } from "multiformats/hashes/sha2";
import * as dagCBOR from "@ipld/dag-cbor";

const obj = {
  first: 1,
  second: 2,
};

const objDiffOrder = {
  second: 2,
  first: 1,
};

const blocka = await Block.encode({
  value: obj,
  codec: dagCBOR,
  hasher: sha256,
});

const blockb = await Block.encode({
  value: objDiffOrder,
  codec: dagCBOR,
  hasher: sha256,
});

console.log("cid is the same", blocka.cid.equals(blockb.cid));
