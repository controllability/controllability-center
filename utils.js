import * as sdk from "matrix-js-sdk";

class DeferredPromise {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve
            this.reject = reject
        })
    }
}

class ChatClient {
    constructor(url, accessToken) {
        this.client = sdk.createClient({
            baseUrl: url,
            accessToken: accessToken
        });
    }
}