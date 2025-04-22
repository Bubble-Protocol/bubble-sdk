# Bubble Protocol 

**Version: 1.0**

## Overview

This document defines the **Bubble Protocol** standards for client-server communication and outlines the **mandatory** and **optional** requirements for implementing a compliant **host server**.

The goal is to ensure interoperability and consistent behavior across implementations while allowing flexibility in deployment and features.

---

## 1. Terminology

- **Client**: Any software or device that initiates communication with a host server using the Bubble Protocol.
- **Host Server**: A server that implements the Bubble Protocol to serve data, services, or other resources to clients.
- **Data Server**: The component within a *Host Server* that physically stores the data and implements any host-specific features like redundancy, backup or decentralized storage.
- **Content**: An addressable entity (e.g., file, directory or object) managed by the host server and served to clients.
- **Endpoint**: A URI accessible via HTTPS or another transport mechanism defined by the protocol.
- **Bubble**: The abstract concept of storage within the protocol. A Bubble is an off-chain data container, hosted by a *Host Server* whose access is governed by a *Bubble Contract*.
- **Bubble Contract**: A custom smart contract that implements the protocol's [`Access Controlled Storage`](https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/AccessControlledStorage.sol) interface. Each *Bubble* has exactly one *Bubble Contract*. Governs the read/write/append/execute permissions for content stored within the bubble as well as whether the content is a file or directory and whether the bubble has been terminated and should be deleted.

---

## 2. Transport Protocol

### 2.1 Supported Transports
- **HTTPS** (Mandatory)
- **Secure WebSocket** (Only required if the host server wants to support realtime subscriptions)

### 2.2 Endpoints

A host server **may** provide different endpoints, e.g. for different chains or different purposes. The endpoint's URI is specified in the `provider` field of a Content ID.

#### Content IDs

Every piece of content served by the protocol has a globally unique *Content ID*. A content ID is structured as follows:

```
{
  chain: ...,
  contract: "0x...",
  provider: "...",
  file: "..."
}

```
where:

| Field | Type | Requirement | Description |
|-------|------|-------------|-------------|
| chain | Integer | Required | chain id that hosts the bubble's smart contract |
| `contract` | Address | Required | The bubble's contract address as a hex string. |
| `provider` | String | Required | The URI of the host's endpoint |
| `file` | HexString+[/+String] | Optional | The specific piece of content within the bubble |


---

## 3. RPC Protocol

The RPC protocol between client and off-chain host server. 

Request and response packets follow the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification).

### 3.1 Request Packet

```
{
  "jsonrpc": "2.0",
  "id": ...,
  "method": "create" | "write" | "append" | "read" | "delete" | "mkdir" | "list" | "subscribe" | "terminate",
  "params": {
    "version": 1,
    "timestamp": ...,
    "nonce": "...",
    "chainId": ...,
    "contract": "0x...",
    "file": "...",
    "data": "...",
    "options": { ... },
    "signature": {
      "type": "plain" | "eip191" | "eip712",
      "signature": "0x...",
      "delegate": { ... }
    }
  }
}
```

| Field | Type | Requirement | Description |
|-------|------|-------------|-------------|
| `id` | Any | Required | Unique packet id used to match response to request. Part of the JSON RPC 2.0 specification. |
| `method` | String | Required | The method of bubble access requested. |
| `params` | Object | Required | The parameters specific to the access method requested. |
| `version` | Integer | Required | Major version of this RPC Protocol. |
| `timestamp` | Integer | Required | Integer Unix timestamp of the request in milliseconds. |
| `nonce` | String | Required | String nonce for replay protection. |
| `chainId` | Integer | Required | Integer ID of the chain hosting the bubble's contract. |
| `contract` | Address | Required | The bubble's contract address as a hex string. |
| `file` | HexString+[/+String] | Optional | The content ID's file path (required for content requests: `read`, `write`, `append`, `delete`, `mkdir`, `list`, and `subscribe`). |
| `data` | String | Optional | The data to write or append (required for `write` and `append` requests). |
| `options` | Object | Optional | Options to pass transparently through to the data server. |
| `signature` | Object | Required | The request signature object. |
| `signature.type` | String | Required | Specifies the type of signature. |
| `signature.params`| Object | Optional | Any parameters used in the signing process. |
| `signature.sig` | HexString | Required | The signature itself. The recovered address is used for access control |
| `signature.delegate` | Object | Optional | Signed delegation giving permission for this signature to act on behalf of a different address |

#### Signature Types

| Type | Construction |
|--------|---|
| public | *host server uses random address* |
| plain | `sign(keccak256(packet))` |
| eip191 | `sign(keccak256("\x19Ethereum Signed Message:\n" ‖ packet length ‖ packet))` |
| eip712 | `sign(keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct(packet)))` |

where:

- `packet` — a stripped down request packet that contains the packet method and all parameter fields except for the signature object.
- `‖` — string concatenation
- `keccak256` — the hashing algorithm
- `sign` — the Ethereum signature algorithm (ECDSA over secp256k1)


### 3.2 Response Packet

```
{
  "jsonrpc": "2.0",
  "id": ...,
  "result": ...,
  "error": {
    "code": ..., 
    "message": "...",
    "cause": "..."
  }
}
```

| Field | Type | Requirement | Description |
|-------|------|-------------|-------------|
| `id` | Any | Required | Unique packet id used to match response to request. Part of the JSON RPC 2.0 specification. |
| `result` | Any | Optional | Present if the request was a success. Contains the response appropriate to the access request method, as returned by the host's data layer. |
| `error` | Object | Optional | Present if the request failed. | 
| `code` | Integer | Required | See [Error Codes](#34-error-codes). |
| `message` | String | Required | Error message (end-user readable where possible). |
| `cause` | String | Optional | More detailed error message, if appropriate. |

### 3.3 Signature Delegation

```
{
  "version": 1,
  "delegate": "...",
  "expires": ...,
  "permissions": [
    {
      "type": "bubble" | "contract",
      "chain": ...,
      "contract": "...",
      "provider": "..."
    },
  ...
  ],
  "signature": { ... }
}
```

| Field | Type | Requirement | Description |
|-------|------|-------------|-------------|
| `version` | Integer | Required | Major version of this RPC Protocol (may be different from the version in the request since the delegate may be old). |
| `delegate` | Address | Required | The delegatee (who the permissions are delegated to) |
| `expires` | Integer | Required | Unix time in seconds |
| `permissions` | Array | Required | The set of permissions delegated to the delegate address |
| `type` | String | Required | The type of permission |
| `chain` | Integer | Required | Integer ID of the chain hosting the subject data's contract. |
| `contract` | Address | Required | The subject data's contract address. |
| `provider` | String | Optional | Required only for a `bubble` permission |
| `signature` | Object | Required | The delegator address is recovered from this signature. Has the same structure as a Request Packet signature object. Delegates cannot be nested. |

### 3.4 Error Codes

Any error returned by a host server **must** be of the form:

```
{
  code: ...,
  message: "...",
  cause: "..."
}
```
Where `cause` is optional.

The code **must** be one of the following. Host server implementations may use the *Reserved* codes if none of the existing codes are appropriate.

 | Code | Name | Description |
 |------|------|-------------|
 | `-32000` | Blockchain not supported. | Request's chainId is not supported by this host. |
 | `-32001` | Bubble terminated. | The Bubble's smart contract access permissions return with the terminated bit set. |
 | `-32002` | Permission denied. | The Bubble's smart contract access permissions do not permit the requested action. |
 | `-32003` | Authentication failure. | Signature or delegate is invalid. |
 | `-32004` | Method failed. | Bubble's smart contract could not be queried (e.g. it rejected or is not an access control contract) |
 | `-32005` | Internal error. | Unexpected server-specific error. |
 | `-32006` | Invalid content ID. | Request's chainId, contract, provider and file do not form a valid content id |
 | `-32007` | Subscription terminated. | Bubble's smart contract indicates the user is no longer permitted to access the subscribed resource. |
 | `-32020` | Bubble already exists. | Cannot create an off-chain bubble that already exists on the host server. |
 | `-32021` | Bubble does not exist. | Request is trying to access an off-chain bubble that does not exist on the host server. |
 | `-32022` | File does not exist. | File does not exist in the bubble. |
 | `-32023` | Directory already exists. | Cannot create a directory that already exists in the bubble. |
 | `-32024` | Invalid option. | Value with the request's `options` is invalid. |
 | `-32025` | Internal server error. | Unexpected server-specific error. |
 | `-32040 .. -32099` | Reserved | Reserved for host specific data server errors. |


## 4. Host Server Requirements

The protocol's [`Guardian`](https://github.com/Bubble-Protocol/bubble-sdk/blob/main/packages/server/src/Guardian.js) class implements the core protocol. In summary it:

- **Validates** the incoming request structure.
- **Recovers** the signatory.
- **Authorizes** or rejects the request based on the permissions from the Bubble's smart contract.
- **Calls** the host's data layer to service the request.

A host server needs to integrate the Guardian into its architecture and implement the server's data layer. The data layer can be implemented in any way desired: file-based or database; redundant backup; distributed storage; decentralised storage. 

Whatever solution is chosen for the data layer, it **must** implement the requirements specified in the [`DataServer`](https://github.com/Bubble-Protocol/bubble-sdk/blob/main/packages/server/src/DataServer.js) interface.
