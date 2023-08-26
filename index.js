import assert from 'assert'
import fs from 'fs'
import https from 'https'

import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import Router from '@koa/router'

import {ChatClient, DeferredPromise} from './utils.js'

const CONTROLLABILITY_CHAT_SERVER_URI = process.env.CONTROLLABILITY_CHAT_SERVER_URI
assert(CONTROLLABILITY_CHAT_SERVER_URI)

const CONTROLLABILITY_CHAT_SERVER_ADMIN_ACCESS_TOKEN = process.env.CONTROLLABILITY_CHAT_SERVER_ADMIN_ACCESS_TOKEN
assert(CONTROLLABILITY_CHAT_SERVER_ADMIN_ACCESS_TOKEN)

const CONTROLLABILITY_CHAT_SERVER_OPENAI_ACCESS_TOKEN = process.env.CONTROLLABILITY_CHAT_SERVER_OPENAI_ACCESS_TOKEN
assert(CONTROLLABILITY_CHAT_SERVER_OPENAI_ACCESS_TOKEN)

async function main() {
    const channel_id_to_return_value_promise = new Map()

    const app = new Koa()
    app.use(bodyParser())
    const router = new Router()

    // Should have a configurable mapping of clients
    const adminChatClient = new ChatClient(
        CONTROLLABILITY_CHAT_SERVER_URI,
        "@bob:localhost",
        CONTROLLABILITY_CHAT_SERVER_ADMIN_ACCESS_TOKEN)

    const openaiChatClient = new ChatClient(
        CONTROLLABILITY_CHAT_SERVER_URI,
        "@openai:localhost",
        CONTROLLABILITY_CHAT_SERVER_OPENAI_ACCESS_TOKEN)

    router.post('/message', (ctx, next) => {
        console.log("got to message endpoint")
        console.log(ctx.request.body)
        if (ctx.request.body.author === "user") {
            // hard-code room ID for now, but should come from config?
            // In the configs we should have CONTROLLABILITY_CHAT_SERVER_URI
            // A mapping of IP addresses of agents to their username and access token and a list of rooms they should send their messages to
            // if dynamic creation is needed, we can expose endpoints here
            adminChatClient.send("!tQTVaUwQSaF6SzuF:localhost", JSON.stringify(ctx.request.body))
        } else {
            openaiChatClient.send("!tQTVaUwQSaF6SzuF:localhost", JSON.stringify(ctx.request.body))
        }
    })

    app.use(router.routes()).use(router.allowedMethods())

    const port = 3000
    const options = {
        key: fs.readFileSync('nginx-selfsigned.key', 'utf8'),
        cert: fs.readFileSync('nginx-selfsigned.crt', 'utf8')
    };
    const server = https.createServer(options, app.callback());
    server.listen(port, () => console.log(`Example app listening on port ${port}!`));
}

main()