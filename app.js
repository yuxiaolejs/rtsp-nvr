const ffmpegRecorder = require("./recorder.js")
const credentials = require("./credentials.json")
let rec = new ffmpegRecorder(credentials.channels[0].url, credentials.channels[0].name)
rec.e.on("start", () => {
    console.log("Starting FFMPEG")
})
rec.e.on("stop", (e) => {
    console.log("FFMPEG stopped", e)
})
rec.e.on("clean", (file) => {
    console.log("FILES TO DELETE", file)
})
rec.start()

const webrtc = require("./webrtc.js")
let rtc = new webrtc(credentials.channels[0].url)
rtc.e.on("start", () => {
    console.log("Starting RTC")
})
rtc.e.on("stop", (e) => {
    console.log("RTC stopped", e)
})
rtc.start()

const express = require('express')
const app = express()
app.use(express.static('static'))
app.listen(3010)
// setTimeout(() => {
//     rec.stop()
// }, 5000)