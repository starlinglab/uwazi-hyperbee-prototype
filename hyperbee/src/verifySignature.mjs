import * as ed from "@noble/ed25519";

import { encodeAttestation } from "./encodeAttestation.mjs";

const verifyAttSignature = async (attestationObj, givenPubKey) => {
  // check that the signedMsg is the CID for the rawAttestation
  const rawAttestationCID = await encodeAttestation(attestationObj.attestation);
  if (!rawAttestationCID.equals(attestationObj.signature.signedMsg)) {
    throw new Error(
      "Could not verify signature due to the signed message not matching the raw attestation CID"
    );
  }

  // verify the signature object

  const { signature, signedMsg, pubKey } = attestationObj.signature;

  // Confirm public key matches expected one
  const areEqual =
    givenPubKey.length === pubKey.length &&
    givenPubKey.every((value, index) => value === pubKey[index]);
  if (!areEqual) {
    throw new Error(
      `given public key (${givenPubKey}) does not match stored one (${pubKey}`
    );
  }

  const isValid = await ed.verifyAsync(signature, signedMsg, givenPubKey);
  if (!isValid) {
    throw new Error("signature could not be validated");
  }
  return true;
};

export { verifyAttSignature };
