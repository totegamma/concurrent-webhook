import express from "express"
import ejs from "ejs"
import cors from "cors"

import { Client, Schemas } from "@concrnt/worldlib";

const privateKey = process.env.CONCURRENT_PRIVATE_KEY;
const host = process.env.CONCURRENT_HOST;

const client = await Client.create(privateKey, host);

const app = express()
app.use(cors())
app.use(express.json())
app.listen(process.env.PORT, () => console.log("Server started"))

const config = JSON.parse(process.env.CONFIG)
const webhooks = config.webhooks

webhooks.forEach(webhook => {
    app.post(webhook.path, async (req, res) => {
        try {
            const result = ejs.render(webhook.template, { body: req.body, headers: req.headers })
            if (result.length == 0 || result.length > 4096) {
                console.error("Invalid length")
                res.status(200).send("OK")
                return
            }
            client.api.createMessage(
                webhook.schema || Schemas.markdownMessage,
                {
                    body: result,
                    profileOverride: webhook.profileOverride,
                },
                webhook.postStreams
            )
            res.status(200).send("OK")
        } catch (error) {
            console.error(error)
            res.status(500).send("Error")
        }
    })

    console.log(`Registerd Webhook ${webhook.path}`)
})
