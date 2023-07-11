import Hypercore from "hypercore";
import Hyperbee from "hyperbee";

import { dbPut, setSigningKey } from "./src/dbPut.mjs";
import { keyFromPem } from "./src/signAttestation.mjs";

// Set up Hypercore and Hyperbee
const core = new Hypercore("./demo.hypercore");
await core.ready();

const db = new Hyperbee(core, {
  keyEncoding: "utf-8",
  valueEncoding: "binary",
});

// Set signing key
setSigningKey(await keyFromPem("./demokey.pem"));

// Attestation data
const waczCID = "bafybeifgkpgb7yqgjnovszaio7tzetmdfmigylr24hg6a76wnjxcnhkx54";
const attribute = "description";
const value =
  "Web archive [ https://t.me/place_kh, https://t.me/place_kh/7848, https://t.me/s/place_kh/7848 ] captured using Browsertrix on 2022-06-07";

console.log(`CID: ${waczCID}`);
console.log(`Attribute: ${attribute}`);
console.log(`Value: ${value}`);

// Add attestation, sign, timestamp, and encrypt as needed.
console.log("Storing...");
await dbPut(db, waczCID, attribute, value, false);
console.log("Done");

// Encrypted value
//
// 32 byte DEMO encryption key that is reused in demo-get.mjs
const key = Buffer.from(
  "QHle+CRiaq8iv1fP9xopZGbO6F7F8926TpSOrReQJ1Q=",
  "base64"
);

console.log("Storing encrypted attribute 'secret-stuff'");
await dbPut(db, waczCID, "secret-stuff", [123, "secret value"], key);
console.log("Done");
