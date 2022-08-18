const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { CustomFile } = require("telegram/client/uploads");
const { Api } = require("telegram/tl");
const input = require("input");
const dotenv = require("dotenv").config();

const fs = require("fs");
const express = require("express");

const apiId = process.env.API_ID;
const apiHash = process.env.API_HASH;
const stringSession = process.env.STRING_SESSION
    ? new StringSession(process.env.STRING_SESSION)
    : new StringSession(); // fill this later with the value from session.save()
const staticAvatars = process.env.STATIC_AVATARS;

(async () => {
    console.log("Loading interactive example...");
    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5
    });
    await client.start({
        phoneNumber: async () => await input.text("Please enter your number: "),
        password: async () => await input.text("Please enter your password: "),
        phoneCode: async () =>
            await input.text("Please enter the code you received: "),
        onError: err => console.log(err)
    });
    console.log("You should now be connected.");

    await client.connect();

    setInterval(async () => {
        let date = new Date();
        let hour = date.getUTCHours() + 4;
        let minute = date.getUTCMinutes() + 30;

        if (minute > 59) {
            minute -= 60;
            hour++;
        }

        if (hour > 23) {
            hour -= 24;
        }

        if (hour > 11) {
            hour -= 12;
        }

        if (minute % 5 == 0) {
            const result = await client.invoke(
                new Api.photos.GetUserPhotos({
                    userId: "uryzen317",
                    offset: 0,
                    maxId: 0,
                    limit: 100
                })
            );

            if (result.photos.length > staticAvatars) {
                const { id, accessHash, fileReference } = result.photos[0];
                const deleteResult = await client.invoke(
                    new Api.photos.DeletePhotos({
                        id: [
                            new Api.InputPhoto({
                                id,
                                accessHash,
                                fileReference
                            })
                        ]
                    })
                );
            }

            const uploadResult = await client.invoke(
                new Api.photos.UploadProfilePhoto({
                    file: await client.uploadFile({
                        file: new CustomFile(
                            `./avatars/${hour}-${minute}.jpg`,
                            fs.statSync(`./avatars/${hour}-${minute}.jpg`).size,
                            `./avatars/${hour}-${minute}.jpg`
                        ),
                        workers: 1
                    })
                })
            );
        }
    }, 60000);

    const app = express();
    app.get("*", (req, res) => {
        res.send("service is up and runnig");
    });
    app.listen(process.env.PORT);
})();
