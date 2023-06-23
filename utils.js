import * as sdk from "matrix-js-sdk";
import assert from "assert";

class DeferredPromise {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve
            this.reject = reject
        })
    }
}

class ChatClient {
    constructor(url, userId, accessToken) {
        this.client = sdk.createClient({
            baseUrl: url,
            userId,
            accessToken,
        })
        this.is_listening = false
        this.userId = userId
    }

    async start_listening() {
        await this.client.startClient({initialSyncLimit: 0})
        this.is_listening = true
    }

    on(event, callback) {
        assert(this.is_listening)
        this.client.on(event, callback)
    }

    async send(roomId, body) {
        const content = {
            "msgtype": "m.text",
            body
        }

        return this.client.sendEvent(roomId, "m.room.message", content, "")
    }
}

export {ChatClient, DeferredPromise}