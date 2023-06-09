# Authenticated Attributes

This repo contains the initial implementation of the Authenticated Attributes project from The Starling Lab. It is built on top of the [HyperBee](https://docs.holepunch.to/building-blocks/hyperbee) key-value store.

This repo also contains a specific frontend for Authenticated Attributes, designed to work within the asset management system [Uwazi](https://uwazi.io/).

## Repo Structure

```
authenticated-attributes
├── hyperbee               // Hyperbee code
│   ├── demo
│   │   ├── demo-get.mjs   // Some demo scripts
│   │   ├── demo.mjs
│   │   ├── test-cbor.mjs
│   │   └── src            // Code for using db
│   │       └── ...
│   └── server
│       └── index.js       // Read-only webserver for db
└── uwazi                  // Uwazi code
    ├── add_cids.py        // Add CIDs to Uwazi uploads
    └── entity-page        // Custom UI for Uwazi files to see metadata
        ├── sw.js          // Service worker for WACZ embedding on Uwazi
        └── ...            // Svelte files
```

## Keys

### Signing

Every attestation stored in the database is signed with an ed25519 keypair. The private key can be loaded from a PEM file such as those generated by `openssl`, or directly from a 32-byte `Buffer`.

An ed25519 private key can be generated with the command `openssl genpkey -algorithm ED25519`.

### Encryption

Attestations can optionally be encrypted on a per-attestation basis. Symmetric encryption is used, so a single secret key needs to be generated for encryption. This can just be a `Buffer` of 32 random bytes.

The NaCl API is used, so the specific encryption algorithm is xsalsa20-poly1305. The nonce is prepended before storing.

## Database

Hyperbee is a key-value database. For this codebase, the key is the CID of the asset, followed by a slash, followed by the name of the attestation. For example:

```
bafkreif7gtpfl7dwi5nflge2rsfp6vq6q5kkwfm7uvxyyezxhsnde5ly3y/description
```

The value is described below.

### Encoding

Database entries are stored as binary data, encoded with [DAG-CBOR](https://ipld.io/docs/codecs/known/dag-cbor/). This is like [CBOR](https://cbor.io/), but has canonical encoding and native support for CIDs. If you don't know CBOR, it's like JSON but binary. This allows for easy storage of binary data alongside any other types.

### Schema

```javascript
{
  signature: {
    pubKey: Uint8Array(32),
    signature: Uint8Array(64),
    // CID of "attestation" object
    signedMsg: CID(bafyreietqpflteqz6kj7lmdqz76kzkwdo65o4bhivxrmqvha7pdgixxos4)
  },
  timestamp: {
    proof: Uint8Array(503),
    upgraded: false,
    submitted: '2023-05-29T19:03:28.601Z',
    // CID of "signature" object inserted as a key of "attestation"
    timestampedValue: CID(bafyreialprnoiwl25t37feen7wbkwwr4l5bpnokjydkog3mhiuodi2av6m)
  },
  attestation: {
    // CID of asset file, same CID as in the database key
    CID: CID(bafkreif7gtpfl7dwi5nflge2rsfp6vq6q5kkwfm7uvxyyezxhsnde5ly3y),
    value: 'Web archive foo bar',
    attribute: 'description',
    encrypted: false
  }
}
```
The binary data of `timestamp.proof` does not have a specified size, the size mentioned above is just an example and may vary in some cases.

When `CID(...)` is shown that represents a CID stored natively, not as text. Thanks to the DAG-CBOR encoding we are able to do this. We are also able to get the CID of non-files such as particular DAG-CBOR objects. This is what allows the usage of CIDs for `signedMsg` and `timestampedValue`.

Some information already in the database key is repeated in the `attestation`, such as `CID` and `attribute`. This allows for export of the whole object for external verification and use elsewhere.

When the attestation is encrypted, the schema looks very similar to the above. The only change is `attestation.encrypted` is `true`, and `attestation.value` is always binary data. That binary data, once decrypted, is a DAG-CBOR encoding of whatever the original value was: object, binary data, string, integer, etc.

## Timestamping

Attestations are timestamped with [OpenTimestamps](https://opentimestamps.org/). This requires Internet access and takes about one second to finish. At first only the incomplete proof is stored (indicated by `timestamp.upgraded` being `false`), but the proof could be upgraded at a later date.

The timestamp serves to prove that the attestation was not made after `timestamp.submitted`, within the several hours long error bars afforded by the system. In practice, this means `timestamp.submitted` is provably accurate to about a day interval.

If you trust the signer you can ignore the proof and rely on `timestamp.submitted` alone, making it accurate to about a second.
