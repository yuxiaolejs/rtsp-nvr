const ffmpegRecorder = require("./recorder.js")
const credentials = require("./credentials.json")
const path = require("path")
let rec = new ffmpegRecorder(credentials.channels[0].url, credentials.channels[0].name)
rec.e.on("start", () => {
    console.log("Starting FFMPEG")
})
rec.e.on("stop", (e) => {
    console.log("FFMPEG stopped", e)
    setTimeout(() => {
        console.log("Restarting FFMPEG")
        rec.start()
    }, 1000)
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
    setTimeout(() => {
        console.log("Restarting RTC")
        rtc.start()
    }, 1000)
})
rtc.start()

const express = require('express')
const app = express()
app.use(express.static(path.join(__dirname, 'static')))
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, 'static/webrtc.html'))
})
app.listen(3010)
// setTimeout(() => {
//     rec.stop()
// }, 5000)