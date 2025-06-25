# Open Recording Code (ORC) – Technical Specification v1.0

## Overview

The Open Recording Code (ORC) is a global, decentralized standard for uniquely identifying music recordings. Unlike legacy systems such as ISRC, ORC is platform- and country-agnostic by design. It reflects a modern reality where music is created and consumed globally, often outside traditional structures, and where artists and platforms require flexible, scalable, and verifiable identifiers that transcend national boundaries.

ORC is human-readable, blockchain-compatible, and openly specifiable. Any approved platform, service, or independent entity can issue ORCs, enabling a truly inclusive and borderless system for global music identity.

---

## 1. ORC Format

### Standard Format:

```
<ISSUER>-<YYYY>-<NNNNNN>-<SUFFIX>
```

### Example:

```
FRC-2025-004129-K7V
```

### Components:

* `ISSUER` – 3-letter registered ORC Issuer Code (OIC), e.g., `FRC` for Freecords.
* `YYYY` – 4-digit year of issuance.
* `NNNNNN` – Zero-padded sequential number per issuer per year.
* `SUFFIX` – 3-character alphanumeric suffix (hash-based or random) for uniqueness and collision resistance.

---

## 2. ORC Issuer Code (OIC)

### Purpose

Identifies the organization or platform issuing the ORC.

### Format

* 3–4 uppercase alphanumeric characters (e.g., `FRC`, `SND`, `TUN1`)

### Registry

All OICs are maintained in a public ORC Issuer Registry (JSON file or on-chain).

```json
{
  "FRC": {
    "name": "Freecords",
    "website": "https://freecords.com",
    "contact": "support@freecords.com",
    "status": "active"
  }
}
```

### Requirements

* Verified via domain ownership (DNS TXT or signed message)
* Must be unique
* Optional expiration or revocation support

---

## 3. Suffix Specification

### Purpose

The `SUFFIX` ensures uniqueness and supports distributed generation across systems.

### Format

* 3 alphanumeric characters (uppercase only, `A–Z`, `0–9`)
* Generated from a hash of artist ID and timestamp, a random nonce, or issuing server identifier

### Examples

| Suffix | Notes                        |
| ------ | ---------------------------- |
| K7V    | Hash of artist and timestamp |
| A3X    | Upload server A3             |
| ZZ1    | Random fallback              |

---

## 4. Blockchain Anchoring (Optional)

### On-Chain Registration Contract (EVM)

```solidity
function registerORC(string orcId, bytes32 metadataHash, address artist) external;
```

* Stores `orcId`, `metadataHash`, `artistAddress`, and `timestamp`
* Emits an event for indexing and verification

### Metadata JSON Example (stored on IPFS)

```json
{
  "orc": "FRC-2025-004129-K7V",
  "title": "Midnight Sky",
  "artist": "Luma",
  "upload_date": "2025-06-25",
  "issuer": "Freecords",
  "fingerprint": "sha256:..."
}
```

### Verification Flow

* Fetch ORC from smart contract
* Compare off-chain metadata hash to on-chain commitment

---

## 5. Validation Rules

### Regular Expression

```
^[A-Z0-9]{3,4}-\d{4}-\d{6}-[A-Z0-9]{3}$
```

### Validity Requirements

* Matches the regular expression pattern
* ISSUER exists in the OIC registry
* Year is between 1970 and 2099
* Suffix consists of uppercase alphanumeric characters

---

## 6. Versioning and Extensions

* Future versioning: `FRC-2025-004129-K7V-v2`
* Derivative handling: `FRC-2025-004129-K7V.M1` (e.g., remix, stem, live)
* Audio-fingerprint derived ORC-X (planned)
* DID format: `did:orc:frc:2025:004129:k7v`
* URL form: `orc://frc/2025/004129/k7v`

---

## 7. Governance and Licensing

* Stewarded by Freecords (initially)
* Specification licensed under MIT or Creative Commons Zero (CC0)
* Intended for submission to DDEX, W3C, or other open standards governance bodies

---

## 8. Developer Resources (Planned)

* ORC Registry API: `https://api.orc-id.org/v1/lookup/:orc`
* GitHub repository: `https://github.com/openrecordingcode/spec`
* NPM SDK: `@orc-id/encoder`
* Metadata validator and command-line tools
* Solidity smart contract template for ORCRegistry

---

## 9. Use Cases

* Global cataloging and distribution for music platforms
* Metadata consistency across international DSPs
* Legal timestamping for authorship and global release
* Cross-border metadata and rights resolution
* Integration with NFT metadata and Web3 registries
* Open registry for public attribution and cultural documentation

---

ORC provides a foundation for global digital music identity—open, borderless, and built for the next era of decentralized creative infrastructure.
