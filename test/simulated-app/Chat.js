import { Bubble, assert, toFileId } from "../../packages/client/src";
import { WebsocketBubbleProvider } from "../../packages/client/src/bubble-providers/WebsocketBubbleProvider";

export const CONTENT = {
  metadataFile: toFileId(101),
  textChat: toFileId(1),
}

export const DEFAULT_METADATA = {
  title: 'Group Chat'
}

export class Chat extends Bubble {

  metadata;
  messages = [];
  
  constructor(bubbleId, deviceKey, encryptionPolicy, userManager) {
    const provider = new WebsocketBubbleProvider(bubbleId.provider);
    super(bubbleId, provider, deviceKey.signFunction, encryptionPolicy, userManager);
    provider.on('reconnect', () => {this._subscribeToContent(true, true)});
  }

  create(metadata, options) {
    return this.provider.open()
      .then(() => super.create(options))
      .then(() => {
        return Promise.all([
          this.setMetadata(metadata, options),
          this.mkdir(CONTENT.textChat, options),
        ])
      })
      .then(() => {
        return this._subscribeToContent(false, false, options);
      })
      .then(() => this.contentId)
    }

  initialise(options) {
    return this.provider.open()
      .then(() => super.initialise(options))
      .then(() => {
        return Promise.all([
          this.read(CONTENT.metadataFile).then(metadata => {this.metadata = JSON.parse(metadata)}),
          this._subscribeToContent(false, true, options)
        ])
      })
      .then(() => this.metadata)
  }

  setMetadata(metadata, options) {
    this.metadata = metadata;
    return this.write(CONTENT.metadataFile, JSON.stringify(metadata), options);
  }

  postMessage(message) {
    return this.write(CONTENT.textChat+'/'+message.id, JSON.stringify(message));
  }

  close() {
    return this.provider.close();
  }

  isPrivate() {
    return this.contentManager !== undefined;
  }

  _handleMessageNotification(notification) {
    if (assert.isArray(notification.data)) {
      notification.data.forEach(msg => this._readMessage(msg));
    }
  }

  _handleMetadataChange(notification) { 
    const metadata = JSON.parse(notification.data);
    this.metadata = {...DEFAULT_METADATA, ...metadata, bubbleId: this.contentId};
  }

  _readMessage(messageDetails) {
    return this.read(messageDetails.name)
      .then(messageJson => {
        const message = JSON.parse(messageJson);
        message.created = messageDetails.created;
        message.modified = messageDetails.modified;
        this.messages.push(message);
      })
      .catch(error => {
        console.warn(error);
      })
  }

  _subscribeToContent(metadataRead, textChatList, options={}) {
    return Promise.all([
      this.subscribe(CONTENT.metadataFile, this._handleMetadataChange.bind(this), {...options, read: metadataRead}),
      this.subscribe(CONTENT.textChat, this._handleMessageNotification.bind(this), {...options, since: textChatList ? this.lastRead : undefined}),
    ])
  }

}

