const child_process = require('child_process');
const events = require('events');
const path = require("path")
const axios = require("axios")
const API_PREFIX = "http://127.0.0.1:8887"
class MediaMTX {
    constructor(url) {
        this.process = null;
        this.url = url;
        this.streaming = false;
        this.e = new events.EventEmitter();
        this.e.emit("create")
        this.axio = axios.create({
            baseURL: API_PREFIX,
            timeout: 2000,
            headers: { 'X-Custom-Header': 'foobar' }
        });
    }
    start() {
        if (this.process && !this.process.killed) {
            return false;
        }
        this.process = child_process.spawn(path.join(__dirname, "/bin/mediamtx"))
        this.recording = true;
        this.e.emit("start")
        this.process.on("error", (err) => {
            console.log("ERROR")
            this.e.emit("stop", err)
        })
        this.process.on("exit", (code, signal) => {
            console.log("EXIT")
            this.recording = false;
            this.e.emit("stop", code, signal)
        })
        // this.process.stdout.pipe(process.stdout)
        // this.process.stderr.pipe(process.stderr)

        setTimeout(() => {
            this.#updateInfo()
        }, 1000)
        return true;
    }
    #updateInfo() {
        this.axio.post("/v3/config/paths/add/proxied", { source: this.url }).then(d => {
        }).catch(e => {
            console.log(e)
            this.stop()
        })
    }
    stop() {
        this.process.kill("SIGINT")
        return this.process.killed;
    }
}

module.exports = MediaMTX;