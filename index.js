import assert from 'assert'
import fs from 'fs'
import https from 'https'

import Koa from 'koa'
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
    const router = new Router()

    const adminChatClient = new ChatClient(
        CONTROLLABILITY_CHAT_SERVER_URI,
        "@alice:localhost",
        CONTROLLABILITY_CHAT_SERVER_ADMIN_ACCESS_TOKEN)
    await adminChatClient.start_listening()
    adminChatClient.on('Room.timeline', function (event, room, toStartOfTimeline) {
        if (event.getType() !== "m.room.message") {
            return
        }

        if (event.event.sender === adminChatClient.userId) {
            return
        }

        console.log(event.event.sender)
        console.log(adminChatClient.userId)

        const channel_id = room.roomId
        const contentBody = event.event.content.body

        const deferredPromise = channel_id_to_return_value_promise.get(channel_id)
        assert(deferredPromise)
        deferredPromise.resolve(contentBody)
    })

    const openaiChatClient = new ChatClient(
        CONTROLLABILITY_CHAT_SERVER_URI,
        "@openai:localhost",
        CONTROLLABILITY_CHAT_SERVER_OPENAI_ACCESS_TOKEN)
    await openaiChatClient.start_listening()
    openaiChatClient.on('Room.timeline', async function (event, room, toStartOfTimeline) {
        if (event.getType() !== "m.room.message") {
            return
        }

        if (event.event.sender === openaiChatClient.userId) {
            return
        }

        const channel_id = room.roomId
        const content_body = event.event.content.body

        // todo: make request to openai

        await openaiChatClient.send(channel_id, "openai resp")
    })


    router.all('/v1/bridge/:base64url_channel_id', async (ctx, next) => {
        // console.log(ctx.url)
        // console.log(ctx.hostname)
        // const channel_id = "!DXc3Xs6BNg3Ikb7B:localhost"
        // Buffer.from('!DXc3Xs6BNg3Ikb7B:localhost').toString('base64url')
        const base64url_channel_id = ctx.params.base64url_channel_id
        const channel_id = Buffer.from(base64url_channel_id, 'base64url').toString('utf8')
        // todo: check if channel_id is valid

        const deferredPromise = new DeferredPromise()
        channel_id_to_return_value_promise.set(channel_id, deferredPromise)

        const body = {
            method: ctx.method,
            url: "todo",
            headers: {},
            data: {},
        }

        await adminChatClient.send(channel_id, JSON.stringify(body))
        ctx.body = await deferredPromise.promise
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