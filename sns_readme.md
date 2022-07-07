# SNS client

This library pushes key notification events to `sns` notification service so third party providers can hook onto them really easily.

Please note this notification service job is to purely push data to your server, it does not check for nasty data or bad content. The notification service just broadcasts what the chain says. It is down to your company to put whatever extra content checks you need to put in place to conform to your standards.

explicit its their responsibiltiy what they do with the indexed data

## How to authenticate with the `sns` notification service

You need to supply us a webhook URL to `sns` (one for mainnet and one for testnet) to authenticate with and do a handshake request. This code also listens to the incoming notifications. Example is shown below.

## How to listen to the events from `sns`

This example is given in node and express you can of course use different tech to do this.

```ts
import bodyParser from 'body-parser';
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = 8080;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/lens/notifications', async (req, res) => {
  const buffers = [];

  for await (const chunk of req) {
    buffers.push(chunk);
  }

  const data = Buffer.concat(buffers).toString();
  // example https://docs.aws.amazon.com/connect/latest/adminguide/sns-payload.html
  const payload = JSON.parse(data);

  // if you already done the handshake you will get a Notification type
  // example below: https://docs.aws.amazon.com/sns/latest/dg/sns-message-and-json-formats.html
  // {
  //   "Type" : "Notification",
  //   "MessageId" : "22b80b92-fdea-4c2c-8f9d-bdfb0c7bf324",
  //   "TopicArn" : "arn:aws:sns:us-west-2:123456789012:MyTopic",
  //   "Subject" : "My First Message",
  //   "Message" : "Hello world!",
  //   "Timestamp" : "2012-05-02T00:54:06.655Z",
  //   "SignatureVersion" : "1",
  //   "Signature" : "EXAMPLEw6JRN...",
  //   "SigningCertURL" : "https://sns.us-west-2.amazonaws.com/SimpleNotificationService-f3ecfb7224c7233fe7bb5f59f96de52f.pem",
  //   "UnsubscribeURL" : "https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe SubscriptionArn=arn:aws:sns:us-west-2:123456789012:MyTopic:c9135db0-26c4-47ec-8998-413945fb5a96"
  // }
  if (payload.Type === 'Notification') {
    console.log('sns message is a notification ', payload);
    console.log('------------------------------------------------------');
    console.log('------------------------------------------------------');
    console.log('------------------------------------------------------');
    res.sendStatus(200);
    return;
  }

  // only need to do this the first time this is doing an handshake with the sns client
  // example below: https://docs.aws.amazon.com/sns/latest/dg/sns-message-and-json-formats.html
  // {
  //   "Type" : "SubscriptionConfirmation",
  //   "MessageId" : "165545c9-2a5c-472c-8df2-7ff2be2b3b1b",
  //   "Token" : "2336412f37...",
  //   "TopicArn" : "arn:aws:sns:us-west-2:123456789012:MyTopic",
  //   "Message" : "You have chosen to subscribe to the topic arn:aws:sns:us-west-2:123456789012:MyTopic.\nTo confirm the subscription, visit the SubscribeURL included in this message.",
  //   "SubscribeURL" : "https://sns.us-west-2.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:us-west-2:123456789012:MyTopic&Token=2336412f37...",
  //   "Timestamp" : "2012-04-26T20:45:04.751Z",
  //   "SignatureVersion" : "1",
  //   "Signature" : "EXAMPLEpH+DcEwjAPg8O9mY8dReBSwksfg2S7WKQcikcNKWLQjwu6A4VbeS0QHVCkhRS7fUQvi2egU3N858fiTDN6bkkOxYDVrY0Ad8L10Hs3zH81mtnPk5uvvolIC1CXGu43obcgFxeL3khZl8IKvO61GWB6jI9b5+gLPoBc1Q=",
  //   "SigningCertURL" : "https://sns.us-west-2.amazonaws.com/SimpleNotificationService-f3ecfb7224c7233fe7bb5f59f96de52f.pem"
  // }
  if (payload.Type === 'SubscriptionConfirmation') {
    const url = payload.SubscribeURL;
    const response = await fetch(url);
    if (response.status === 200) {
      console.log('Subscription confirmed');
      console.log('------------------------------------------------------');
      console.log('------------------------------------------------------');
      console.log('------------------------------------------------------');
      res.sendStatus(200);
      return;
    } else {
      console.error('Subscription failed');
      res.sendStatus(500);
      return;
    }
  }

  console.log('Received message from sns', payload);

  // if it gets this far it is a unsubscribe request
  // {
  //   "Type" : "UnsubscribeConfirmation",
  //   "MessageId" : "47138184-6831-46b8-8f7c-afc488602d7d",
  //   "Token" : "2336412f37...",
  //   "TopicArn" : "arn:aws:sns:us-west-2:123456789012:MyTopic",
  //   "Message" : "You have chosen to deactivate subscription arn:aws:sns:us-west-2:123456789012:MyTopic:2bcfbf39-05c3-41de-beaa-fcfcc21c8f55.\nTo cancel this operation and restore the subscription, visit the SubscribeURL included in this message.",
  //   "SubscribeURL" : "https://sns.us-west-2.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:us-west-2:123456789012:MyTopic&Token=2336412f37fb6...",
  //   "Timestamp" : "2012-04-26T20:06:41.581Z",
  //   "SignatureVersion" : "1",
  //   "Signature" : "EXAMPLEHXgJm...",
  //   "SigningCertURL" : "https://sns.us-west-2.amazonaws.com/SimpleNotificationService-f3ecfb7224c7233fe7bb5f59f96de52f.pem"
  // }
});

app.listen(port, () => console.log('Sns notification listening on port ' + port + '!'));
```

## Signatures

You should verify the authenticity of a notification, subscription confirmation, or unsubscribe confirmation message sent by Amazon SNS. Using information contained in the Amazon SNS message, your endpoint can recreate the string to sign and the signature so that you can verify the contents of the message by matching the signature you recreated from the message contents with the signature that Amazon SNS sent with the message.

To find out more info go https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html

```js
const bent = require('bent');
const getBuffer = bent('buffer');
const crypto = require('crypto');
const debug = require('debug')('verify-aws-sns-signature');
const parseUrl = require('parse-url');
const assert = require('assert');

async function validatePayload(payload) {
  const {
    SigningCertURL,
    Signature,
    Message,
    MessageId,
    SubscribeURL,
    Subject,
    Timestamp,
    Token,
    TopicArn,
    Type,
  } = payload;

  // validate SubscribeURL
  const url = parseUrl(SigningCertURL);
  assert.ok(
    /^sns\.[a-zA-Z0-9\-]{3,}\.amazonaws\.com(\.cn)?$/.test(url.resource),
    `SigningCertURL host is not a valid AWS SNS host: ${SigningCertURL}`
  );

  try {
    debug(`retrieving AWS certificate from ${SigningCertURL}`);

    const x509 = await getBuffer(SigningCertURL);
    const publicKey = crypto.createPublicKey(x509);
    const signature = Buffer.from(Signature, 'base64');
    const stringToSign = (
      'Notification' === Type
        ? [{ Message }, { MessageId }, { Subject }, { Timestamp }, { TopicArn }, { Type }]
        : [
            { Message },
            { MessageId },
            { SubscribeURL },
            { Timestamp },
            { Token },
            { TopicArn },
            { Type },
          ]
    ).reduce((acc, el) => {
      const key = el.keys()[0];
      acc += key + '\n' + el[key] + '\n';
    }, '');

    debug(`string to sign: ${stringToSign}`);
    const verified = crypto.verify(
      'sha1WithRSAEncryption',
      Buffer.from(stringToSign, 'utf8'),
      publicKey,
      signature
    );
    debug(`signature ${verified ? 'has been verified' : 'failed verification'}`);
    return verified;
  } catch (err) {
    return false;
  }
}

module.exports = { validatePayload };
```

## Messages

This main thing you will care about is the `Message` field. This will contain the information we will be pushing to `sns`. This is a `JSON.stringify` object and will always be an object.

This section will purely talk about the `Message` field and all examples will show the response type for that and not the entire `sns` object above. Also the guide will of `JSON.parse` the string already to make it really easy to understand. The data in the properties is just mock data to show the examples.

This guide will assume you already have a understanding for what the `events` emit on the protocol and what each data property is.

All the messages will be shaped as:

```ts
export interface PublishMessage {
  type: SnsMessageTypes;
  data: any;
}
```

The `type` maps to the response type you get back which will defined in this guide.

### INDEXER_FOLLOWED

This emits when the followed event has been indexed.

```ts
interface Response {
  follower: string;
  profileIds: string[];
  followModuleDatas: string[];
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "blockHash": "0x295bf8c92266bc092b5ce5e21a2a7efaae59a0340de2c96e54a0dbee293ceda1",
  "blockNumber": 26887615,
  "followModuleDatas": ["0x"],
  "follower": "0xD8c789626CDb461ec9347f26DDbA98F9383aa457",
  "logIndex": 49,
  "profileIds": ["0x11"],
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_COLLECT_MODULE_WHITELISTED

This emits when a collect module is whitelisted or unwhitelisted.

```ts
interface Response {
  collectModule: string;
  collectModuleName: string;
  whitelisted: boolean;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "collectModule": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  "collectModuleName": "LimitedFeeCollectModule",
  "whitelisted": true,
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_COLLECT_NFT_DEPLOYED

This emits when the collect nft is deployed (remember it is lazy loaded meaning only on the first collect is it deployed).

```ts
interface Response {
  profileId: string;
  pubId: string;
  // pub id are counters of the publication so they clash with profiles
  // on the server we build up our own publication id to allow it to be searchable
  // this is {profileId}-{pubId} and is used in all our API calls and responses
  serverPubId: string;
  collectNFT: string;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "profileId": "0x01",
  "pubId": "0x02",
  "serverPubId": "0x01-0x02",
  "collectNFT": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_COLLECT_NFT_TRANSFERRED

This emits when the collect nft is transferred to a new owner, remember this is emitted when minted as well.

```ts
interface Response {
  profileId: string;
  pubId: string;
  // pub id are counters of the publication so they clash with profiles
  // on the server we build up our own publication id to allow it to be searchable
  // this is {profileId}-{pubId} and is used in all our API calls and responses
  serverPubId: string;
  // each collect NFT minted has a token id the first one is 1 then 2 just like a normal NFT project
  collectNFTId: string;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "profileId": "0x01",
  "pubId": "0x02",
  "serverPubId": "0x01-0x02",
  "collectNFTId": "0x08",
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_COLLECTED

This emits when a publication is collected.

```ts
interface Response {
  collector: string;
  profileId: string;
  pubId: string;
  // pub id are counters of the publication so they clash with profiles
  // on the server we build up our own publication id to allow it to be searchable
  // this is {profileId}-{pubId} and is used in all our API calls and responses
  serverPubId: string;
  rootProfileId: string;
  rootPubId: string;
  // pub id are counters of the publication so they clash with profiles
  // on the server we build up our own publication id to allow it to be searchable
  // this is {profileId}-{pubId} and is used in all our API calls and responses
  serverRootPubId: string;
  // you can work this out yourself by comparing serverPubId === serverRootPubId
  // but this mapping just lets you easily know if the collect happened on a `Mirror`
  // meaning that if the publication set a referral fee some of the fee would of been minted
  // to the owner of the profile.
  collectedFromMirror: boolean;
  timestamp: number;
  collectModuleData: string;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "collector": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  "profileId": "0x01",
  "pubId": "0x02",
  "serverPubId": "0x01-0x02",
  "rootProfileId": "0x01",
  "rootPubId": "0x02",
  "serverRootPubId": "0x01-0x02",
  "collectedFromMirror": false,
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_COMMENT_CREATED

This emits when a someone has commented on a publication. Please note this does not mean it follows metadata standards and we allow it in. We index it but if it does not follow our metadata standards it will not be searchable in our API. We will also broadcast this event to you so you can see what is happening in real time.

Look at `METADATA_PUBLICATION_COMPLETE` and `METADATA_PUBLICATION_FAILED` notifications to hook onto these states.

```ts
interface Response {
  profileId: string;
  pubId: string;
  contentURI: string;
  // pub id are counters of the publication so they clash with profiles
  // on the server we build up our own publication id to allow it to be searchable
  // this is {profileId}-{pubId} and is used in all our API calls and responses
  serverPubId: string;
  profileIdPointed: string;
  pubIdPointed: string;
  // pub id are counters of the publication so they clash with profiles
  // on the server we build up our own publication id to allow it to be searchable
  // this is {profileId}-{pubId} and is used in all our API calls and responses
  // this will be the publication the comment was commented on
  serverPubIdPointer: string;
  collectModule: string;
  collectModuleData: string;
  collectModuleReturnData: string;
  // will null if not set
  referenceModule: string | null;
  // will null if not set
  referenceModuleData: string | null;
  // will be null if not set
  referenceModuleReturnData: string | null;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "profileId": "0x01",
  "pubId": "0x02",
  "contentURI": "ipfs://Qmeu6u6Ta5qeCf6mw3zVoe9pMus96cX6eZT6dnRQKDStBT",
  "serverPubId": "0x01-0x02",
  "profileIdPointed": "0x07",
  "pubIdPointed": "0x02",
  "serverPubIdPointer": "0x07-0x02",
  "collectModule": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  "collectModuleData": "0x",
  "collectModuleReturnData": "0x023",
  "referenceModule": null,
  "referenceModuleData": null,
  "referenceModuleReturnData": null,
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_CURRENCY_MODULE_WHITELISTED

This emits when a currency module is whitelisted or removed from whitelist.

```ts
interface Response {
  currency: string;
  name: string;
  symbol: string;
  decimals: number;
  prevWhitelisted: boolean;
  whitelisted: boolean;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "currency": "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
  "name": "Wrapped Matic",
  "symbol": "WMATIC",
  "decimals": 18,
  "prevWhitelisted": false,
  "whitelisted": true,
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_FOLLOW_MODULE_SET

This emits when a profile changes their follow module.

```ts
interface Response {
  profileId: string;
  followModule: string;
  followModuleReturnData: string;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "profileId": "0x01",
  "followModule": "0xe7AB9BA11b97EAC820DbCc861869092b52B65C06",
  "followModuleReturnData": "0x00000000000000000000000000000000000000000000000000000000000027100000000000000000000000002058a9d7613eee744279e3856ef0eada5fcbaa7e0000000000000000000000001d441b02fa5a2b609a83ccb5df1bfeba91a0794e",
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_FOLLOW_MODULE_WHITELISTED

This emits when a follow module is whitelisted or removed from whitelist.

```ts
interface Response {
  followModule: string;
  whitelisted: boolean;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "followModule": "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
  "whitelisted": true,
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_FOLLOW_NFT_DEPLOYED

This emits when the follow nft is deployed (remember it is lazy loaded meaning only on the first follow is it deployed).

```ts
interface Response {
  profileId: string;
  followNFT: string;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "profileId": "0x01",
  "followNFT": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_FOLLOW_NFT_TRANSFERRED

This emits when the follow nft is transferred to a new owner, remember this is emitted when minted as well.

```ts
interface Response {
  profileId: string;
  pubId: string;
  from: string;
  to: string;
  // you can work this out yourself from the data but this pointer tells you if
  // it came from a follow action it would be true if it came from a manual transfer
  // it would be false.
  fromFollowAction: boolean;
  // you can work this out yourself from the data but this pointer tells you if
  // if it needs approval on the API level to be seen on the follower list
  // https://docs.lens.xyz/docs/pending-approval-follows
  needsApproval: boolean;
  // each follow NFT minted has a token id the first one is 1 then 2 just like a normal NFT project
  followNFTId: string;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "profileId": "0x01",
  "pubId": "0x02",
  "from": "0x0000000000000000000000000000000000000000",
  "to": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  "fromFollowAction": true,
  "needsApproval": false,
  "followNFTId": "0x01",
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_FOLLOWS_TOGGLED

This emits when the follow nft has been approved that they brought it or transfered it.

Full docs on this here https://docs.lens.xyz/docs/pending-approval-follows

```ts
interface Response {
  owner: string;
  profileIds: string[];
  // index === index for profile id aka
  // profileIds[0] the enabled status is enabled[0]
  enabled: boolean[];
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "owner": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  "profileIds": ["0x02"],
  "enabled": [true],
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_MIRROR_CREATED

This emits when a profile has mirrored a publication. This inherits the mirrored publication metadata. Please note this does not mean it follows metadata standards and we allow it in. We index it but if it does not follow our metadata standards it will not be searchable in our API. We will also broadcast this event to you so you can see what is happening in real time.

Look at `METADATA_PUBLICATION_COMPLETE` and `METADATA_PUBLICATION_FAILED` notifications to hook onto these states.
Please note `mirror` is different to `post` and `comment` in terms of it doesnt have any metadata linked to it. You must on your end link the publication it has mirrored to the mirror itself to know when its snapshotted and viewable.

```ts
interface Response {
  profileId: string;
  pubId: string;
  // pub id are counters of the publication so they clash with profiles
  // on the server we build up our own publication id to allow it to be searchable
  // this is {profileId}-{pubId} and is used in all our API calls and responses
  // this is the mirror publication id
  serverPubId: string;
  // profile id for the publication being mirrored
  profileIdPointed: string;
  // publication id for the publication being mirrored
  pubIdPointed: string;
  // pub id are counters of the publication so they clash with profiles
  // on the server we build up our own publication id to allow it to be searchable
  // this is {profileId}-{pubId} and is used in all our API calls and responses
  // this will be the publication the comment was commented on
  // this is the publication id for the publication being mirrored
  serverPubIdPointer: string;
  // will null if not set
  referenceModule: string | null;
  // will null if not set
  referenceModuleData: string | null;
  // will be null if not set
  referenceModuleReturnData: string | null;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "profileId": "0x01",
  "pubId": "0x02",
  "serverPubId": "0x01-0x02",
  "profileIdPointed": "0x07",
  "pubIdPointed": "0x02",
  "serverPubIdPointer": "0x07-0x02",
  "collectModule": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  "collectModuleData": "0x",
  "collectModuleReturnData": "0x023",
  "referenceModule": null,
  "referenceModuleData": null,
  "referenceModuleReturnData": null,
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_MODULE_GLOBALS_TREASURY_FEE_SET

This emits when the module global treasury fee is set

```ts
interface Response {
  prevTreasuryFee: string;
  newTreasuryFee: string;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "prevTreasuryFee": "0x0000000000000000001",
  "newTreasuryFee": "0x0000000000000000001",
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_POST_CREATED

This emits when a someone has posted a new publication. Please note this does not mean it follows metadata standards and we allow it in. We index it but if it does not follow our metadata standards it will not be searchable in our API. We will also broadcast this event to you so you can see what is happening in real time.

Look at `METADATA_PUBLICATION_COMPLETE` and `METADATA_PUBLICATION_FAILED` notifications to hook onto these states.

```ts
interface Response {
  profileId: string;
  pubId: string;
  contentURI: string;
  // pub id are counters of the publication so they clash with profiles
  // on the server we build up our own publication id to allow it to be searchable
  // this is {profileId}-{pubId} and is used in all our API calls and responses
  serverPubId: string;
  collectModule: string;
  collectModuleReturnData: string;
  // will null if not set
  referenceModule: string | null;
  // will be null if not set
  referenceModuleReturnData: string | null;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "profileId": "0x01",
  "pubId": "0x02",
  "contentURI": "ipfs://Qmeu6u6Ta5qeCf6mw3zVoe9pMus96cX6eZT6dnRQKDStBT",
  "serverPubId": "0x01-0x02",
  "collectModule": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  "collectModuleReturnData": "0x023",
  "referenceModule": null,
  "referenceModuleReturnData": null,
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_PROFILE_CREATED

This emits when a someone has created a new profile.

```ts
interface Response {
  profileId: string;
  creator: string;
  to: string;
  handle: string;
  imageURI: string;
  followModule: string;
  followModuleReturnData: string;
  followNFTURI: string;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "profileId": "0x01",
  "creator": "0xLGUA2801a31ba70dfe542793020a934F880D59aK",
  "to": "0xLGUA2801a31ba70dfe542793020a934F880D59aK",
  "handle": "joshwashere.lens",
  "imageURI": "ipfs://QmR5oAvqWXjrGbnHNbXyvWJV3EXXdJyn35USFPyiWughJv",
  "followModule": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  "followModuleReturnData": "0x023",
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_PROFILE_METADATA_SYNC

This emits when a someone has updated metadata for the profile. Please note this does not mean it follows metadata standards and we allow it in. We index it but if it does not follow our metadata standards it will not be updated on our API. We will also broadcast this event to you so you can see what is happening in real time.

Look at `METADATA_PROFILE_COMPLETE` and `METADATA_PROFILE_FAILED` notifications to hook onto these states.

```ts
interface Response {
  profileId: string;
  // the metadata contains normally an IPFS or weblink which resolves the metadata
  metadata: string;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "profileId": "0x01",
  "metadata": "ipfs://Qmeu6u6Ta5qeCf6mw3zVoe9pMus96cX6eZT6dnRQKDStBT",
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_PROFILE_NFT_TRANSFERRED

This emits when the profile has been transferred to another address.

```ts
interface Response {
  from: string;
  to: string;
  tokenId: string;
  profileId: string;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "from": "0xLGUA2801a31ba70dfe542793020a934F880D59aK",
  "to": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  // this is profile name from raw event but we map another this to
  // profile id so you can ignore this field.
  "tokenId": "0x01",
  "profileId": "0x01",
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_PROFILE_SET_IMAGE

This emits when someone changes their profile picture.

```ts
interface Response {
  profileId: string;
  imageURI: string;
  // if they have attached an NFT to their profile pic
  isNft: boolean;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "profileId": "0x01",
  "imageURI": "ipfs://Qmeu6u6Ta5qeCf6mw3zVoe9pMus96cX6eZT6dnRQKDStBT",
  "isNft": false,
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_REFERENCE_MODULE_WHITELISTED

This emits when a reference module is whitelisted or unwhitelisted.

```ts
interface Response {
  referenceModule: string;
  referenceModuleName: string;
  whitelisted: boolean;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "referenceModule": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  "referenceModuleName": "FollowerOnlyReferenceModule",
  "whitelisted": true,
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_DEFAULT_PROFILE_SET

This emits when a wallet sets a default profile.

```ts
interface Response {
  wallet: string;
  profileId: string;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "wallet": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  "profileId": "0x01",
  "whitelisted": true,
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_DISPATCHER_PROFILE_SET

This emits when a profile whitelists a dispatcher.

```ts
interface Response {
  profileId: string;
  dispatcher: string;
  timestamp: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "profileId": "0x01",
  "dispatcher": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  "whitelisted": true,
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### INDEXER_PROTOCOL_STATE_SET

This emits when the state of the protocol is changed.

0: Unpaused
1: PublishingPaused
2: Paused

```ts
interface Response {
  caller: string;
  prevState: number;
  newState: number;
  logIndex: number;
  transactionHash: string;
  transactionIndex: number;
}
```

#### Response example

```json
{
  "caller": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  "prevState": 2,
  "newState": 0,
  "whitelisted": true,
  "timestamp": 1656073676000,
  "transactionHash": "0x3adc83ab8289bf3389417ff25d27ba9ef843d3981554536b462d3cba3724f837",
  "transactionIndex": 8
}
```

### METADATA_PROFILE_COMPLETE

This emits a notification when the profile metadata has been snapshotted and indexed into the API.

```ts
interface ProfileMetadata {
  version: string;
  metadata_id: string;
  appId?: string | null;
  name?: string | null;
  bio?: string | null;
  cover_picture?: string | null;
  attributes: AttributeData[];
}

interface Response {
  profileId: string;
  // the metadata extracted for you
  metadata: ProfileMetadata;
  // the snapshot s3 url for fast fetching
  s3Url: string;
}
```

#### Response example

```json
{
  "profileId": "0x06",
  "metadata": {
    "version": "1.0.0",
    "metadata_id": "cf40ca2b-945d-4fd6-9a5c-dfdfe07a7008",
    "name": "josh wagmi",
    "attributes": []
  },
  "s3Url": "https://statics-polygon-lens.s3.eu-west-1.amazonaws.com/profile_metadata/0x06.json"
}
```

### METADATA_PROFILE_FAILED

This emits a notification when the profile metadata has failed to be snapshotted. This could be because the metadata is invalid or unreachable etc. The snapshot will retry for 20 minutes if it is unreachable before it marks it as failed. If the metadata is invalid it wont retry and mark as failed with a valid error reason.

```ts
interface Response {
  profileId: string;
  // the reason why it failed
  errorReason: string;
  // if it was unreachable for 20 minutes
  timeoutRequest: boolean;
}
```

#### Response example

```json
{
  "profileId": "0x06",
  "errorReason": "metadata is missing the metadata_id",
  "timeoutRequest": false
}
```

### METADATA_PUBLICATION_COMPLETE

This emits a notification when the publication metadata has been snapshotted and indexed into the API.

```ts
enum MetadataDisplayType {
  number = 'number',
  string = 'string',
  date = 'date',
}

interface MetadataAttribute {
  displayType?: MetadataDisplayType;
  traitType?: string;
  value: string;
}

interface ProfileMetadata {
  version: string;
  metadata_id: string;
  signatureContext?: string;
  appId?: string;
  description?: string;
  content?: string;
  external_url?: string;
  image?: string;
  imageMimeType?: string;
  name: string;
  attributes: MetadataAttribute[];
  animation_url?: string;
}

interface Response {
  profileId: string;
  pubId: string;
  // pub id are counters of the publication so they clash with profiles
  // on the server we build up our own publication id to allow it to be searchable
  // this is {profileId}-{pubId} and is used in all our API calls and responses
  // this is the mirror publication id
  serverPubId: string;
  // the metadata extracted for you
  metadata: Metadata;
  // the snapshot s3 url for fast fetching
  s3Url: string;
}
```

#### Response example

```json
{
  "profileId": "0x06",
  "pubId": "0x02",
  "serverPubId": "0x06-0x02",
  "metadata": {
    "version": "1.0.0",
    "metadata_id": "cf40ca2b-945d-4fd6-9a5c-dfdfe07a7008",
    "appId": "lost-world-dapp",
    "name": "wagmi publication 2",
    "content": "This is the content of the publication",
    "attributes": []
  },
  "s3Url": "https://statics-polygon-lens.s3.eu-west-1.amazonaws.com/public/0x06-0x02.json"
}
```

### METADATA_PUBLICATION_FAILED

This emits a notification when the publication metadata has failed to be snapshotted. This could be because the metadata is invalid or unreachable etc. The snapshot will retry for 20 minutes if it is unreachable before it marks it as failed. If the metadata is invalid it wont retry and mark as failed with a valid error reason.

```ts
interface Response {
  profileId: string;
  pubId: string;
  // pub id are counters of the publication so they clash with profiles
  // on the server we build up our own publication id to allow it to be searchable
  // this is {profileId}-{pubId} and is used in all our API calls and responses
  // this is the mirror publication id
  serverPubId: string;
  // the reason why it failed
  errorReason: string;
  // if it was unreachable for 20 minutes
  timeoutRequest: boolean;
}
```

#### Response example

```json
{
  "profileId": "0x06",
  "pubId": "0x02",
  "serverPubId": "0x06-0x02",
  "errorReason": "metadata is missing the metadata_id",
  "timeoutRequest": false
}
```

### METADATA_PROFILE_IMAGE_NFT_REVOKED

This emits a notification when the NFT image a profile has added as a verified NFT profile picture is not owned by the profile owner anymore.

```ts
interface Response {
  // all profiles which now have been revoked the NFT on chain image. The image still lives in our snapshot
  // but when the API brings it back now its not classed as an NFT image anymore.
  profileIds: string[];
}
```

#### Response example

```json
{
  "profileIds": ["0x06", "0x02"]
}
```

### PUBLICATION_REACTION

This emits a notification when a profile has added a reaction to a publication. This will also add as a toggle so what we mean by that is if someone called `UPVOTE` then pressed `DOWNVOTE` the last `UPVOTE` is now not valid. A reaction a profile does on a publication is only allowed to be 1.

```ts
enum ReactionTypes {
  UPVOTE = 'UPVOTE',
  DOWNVOTE = 'DOWNVOTE',
}

interface Response {
  profileId: string;
  // pub id are counters of the publication so they clash with profiles
  // on the server we build up our own publication id to allow it to be searchable
  // this is {profileId}-{pubId} and is used in all our API calls and responses
  // this is the mirror publication id
  serverPubId: string;
  reaction: ReactionTypes;
}
```

#### Response example

```json
{
  "profileId": "0x09",
  "serverPubId": "0x06-0x02",
  "reaction": "UPVOTE"
}
```

### PUBLICATION_REMOVE_REACTION

This emits a notification when a profile removes a reaction on a publication.

```ts
enum ReactionTypes {
  UPVOTE = 'UPVOTE',
  DOWNVOTE = 'DOWNVOTE',
}

interface Response {
  profileId: string;
  // pub id are counters of the publication so they clash with profiles
  // on the server we build up our own publication id to allow it to be searchable
  // this is {profileId}-{pubId} and is used in all our API calls and responses
  // this is the mirror publication id
  serverPubId: string;
  reaction: ReactionTypes;
}
```

#### Response example

```json
{
  "profileId": "0x09",
  "serverPubId": "0x06-0x02",
  "reaction": "UPVOTE"
}
```

### PUBLICATION_HIDDEN

This emits a notification when a profile has hidden a publication. Please note the API still returns these publication to not break threads but hides the `content` and `media` of it. These do not get returned in the timelines, search, profiles and explore queries though.

```ts
interface Response {
  profileId: string;
  // pub id are counters of the publication so they clash with profiles
  // on the server we build up our own publication id to allow it to be searchable
  // this is {profileId}-{pubId} and is used in all our API calls and responses
  // this is the mirror publication id
  serverPubId: string;
}
```

#### Response example

```json
{
  "profileId": "0x09",
  "serverPubId": "0x06-0x02"
}
```

### PUBLICATION_REPORTED

This emits a notification when a publication is reported.

```ts
enum PublicationReportingReason {
  SENSITIVE = 'SENSITIVE',
  ILLEGAL = 'ILLEGAL',
  FRAUD = 'FRAUD',
}

enum PublicationReportingSensitiveSubreason {
  NSFW = 'NSFW',
  OFFENSIVE = 'OFFENSIVE',
}

enum PublicationReportingIllegalSubreason {
  ANIMAL_ABUSE = 'ANIMAL_ABUSE',
  HUMAN_ABUSE = 'HUMAN_ABUSE',
}

enum PublicationReportingFraudSubreason {
  SCAM = 'SCAM',
  IMPERSONATION = 'IMPERSONATION',
}

interface Response {
  reporterAddress: string;
  // pub id are counters of the publication so they clash with profiles
  // on the server we build up our own publication id to allow it to be searchable
  // this is {profileId}-{pubId} and is used in all our API calls and responses
  // this is the mirror publication id
  serverPubId: string;
  reason: PublicationReportingReason;
  // depending on the `reason` will be linked to the subreason
  subreason:
    | PublicationReportingSensitiveSubreason
    | PublicationReportingIllegalSubreason
    | PublicationReportingFraudSubreason;
  additionalComments: string | null;
}
```

#### Response example

```json
{
  "reporterAddress": "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  "serverPubId": "0x06-0x02",
  "reason": "SENSITIVE",
  "subreason": "NSFW",
  "additionalComments": "This is a additional comment"
}
```
