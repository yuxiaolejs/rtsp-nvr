const child_process = require('child_process');
const events = require('events');
const path = require("path")

class MediaMTX {
    constructor(url, filename, segtime = 60) {
        this.process = null;
        this.url = url;
        this.filename = filename;
        this.segtime = segtime;
        this.recording = false;
        this.e = new events.EventEmitter();
        this.e.emit("create")
    }
    start() {
        if (this.process && !this.process.killed) {
            return false;
        }
        this.process = child_process.spawn("ffmpeg",
            // this.process = child_process.spawn(path.join(__dirname, "/bin/ffmpeg.exe"),
            ["-i", this.url, "-c:v", "copy", "-c:a", "aac", "-y", "-f", "segment", "-reset_timestamps", "1", "-segment_atclocktime", "1",
                "-segment_time", this.segtime, "-strftime", "1", path.join(__dirname, `/recording/${this.filename}_%Y%m%d%H%M%S.flv`)])
        this.recording = true;
        this.e.emit("start")
        this.process.on("error", (err) => {
            this.e.emit("stop", err)
        })
        this.process.on("exit", (code, signal) => {
            this.recording = false;
            this.e.emit("stop", code, signal)
        })
        this.process.stdout.pipe(process.stdout)
        this.process.stderr.pipe(process.stderr)
        return true;
    }
    stop() {
        this.process.kill("SIGINT")
        return this.process.killed;
    }
}

module.exports = Recorder;