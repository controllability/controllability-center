import assert from 'assert'
import fs from 'fs'
import https from 'https'

import Koa from 'koa'
import Router from '@koa/router'


const app = new Koa()
const router = new Router()


const CONTROLLABILITY_CHAT_SERVER_URI = process.env.CONTROLLABILITY_CHAT_SERVER_URI
assert(CONTROLLABILITY_CHAT_SERVER_URI)

class DeferredPromise {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve
            this.reject = reject
        })
    }
}

router.all('/v1/bridge', async (ctx, next) => {
    console.log(ctx.url)
    console.log(ctx.hostname)
    const channel_id = ctx.headers['x-controllability-channel_id']

    ctx.body = 'Hello World'
})

app.use(router.routes()).use(router.allowedMethods())

const options = {
    key: fs.readFileSync('nginx-selfsigned.key', 'utf8'),
    cert: fs.readFileSync('nginx-selfsigned.crt', 'utf8')
};

const port = 3000
const server = https.createServer(options, app.callback());
server.listen(port, () => console.log(`Example app listening on port ${port}!`));