const child_process = require('child_process');
const events = require('events');
const path = require("path")
const fs = require('fs')
const REC_FOLDER = "recording"
const SIZE_LIMIT = 1024 * 1024 * 1024 * 2
class Recorder {
    constructor(url, filename = ch1, segtime = 60) {
        this.process = null;
        this.url = url;
        this.filename = filename;
        this.segtime = segtime;
        this.recording = false;
        this.e = new events.EventEmitter();
        this.e.emit("create")
        this.cleanUpInterval = null
        this.monitorInterval = null
        this.previousFrames = 0
    }
    start() {
        if (this.process && !this.process.killed) {
            return false;
        }
        this.lastHeartBeat = Date.now()
        this.previousFrames = 0
        // this.process = child_process.spawn("ffmpeg",
        this.process = child_process.spawn(path.join(__dirname, "/bin/ffmpeg"),
            ["-i", this.url, "-c:v", "copy", "-c:a", "aac", "-y", "-f", "segment", "-reset_timestamps", "1", "-segment_atclocktime", "1",
                "-segment_time", this.segtime, "-strftime", "1", path.join(__dirname, REC_FOLDER, `/${this.filename}_%Y%m%d%H%M%S.flv`)])
        this.recording = true;
        this.e.emit("start")
        this.process.on("error", (err) => {
            this.e.emit("stop", err)
        })
        this.process.on("exit", (code, signal) => {
            this.recording = false;
            this.e.emit("stop", code, signal)
        })
        // this.process.stdout.pipe(process.stdout)
        this.process.stderr.on("data", (data) => {
            let obj = this.#parseStderr(data.toString())
            if (obj.frame && obj.frame != 0 && this.previousFrames <= obj.frame) {
                this.lastHeartBeat = Date.now()
                this.previousFrames = obj.frame
            }
        })
        // this.process.stderr.pipe(process.stderr)
        this.cleanUpInterval = setInterval(() => {
            if (!this.recording) {
                clearInterval(this.cleanUpInterval)
                return
            }
            this.#cleanUp()
        }, 1000 * 60)
        this.monitorInterval = setInterval(() => {
            if (!this.recording) {
                clearInterval(this.monitorInterval)
                return
            }
            this.#monitor()
        }, 1000 * 5)
        return true;
    }
    stop() {
        clearInterval(this.cleanUpInterval)
        clearInterval(this.monitorInterval)
        this.process.kill("SIGINT")
        return this.process.killed;
    }
    #cleanUp() {
        let fileInfo = []
        fs.promises.readdir(path.join(__dirname, REC_FOLDER)).then(files => {
            let promises = []
            files.forEach((file, index) => {
                promises.push(new Promise((resolve, reject) => {
                    fs.promises.stat(path.join(__dirname, REC_FOLDER, file)).then(stat => {
                        fileInfo.push({ file: file, size: stat.size })
                        resolve()
                    }).catch(e => {
                        console.log(e)
                        reject()
                    })
                }))
            })
            return Promise.all(promises)
        }).then(d => {
            fileInfo = fileInfo.sort((a, b) => {
                return a.file > b.file ? 1 : -1
            })
            let totalSize = 0
            fileInfo.map((file) => {
                totalSize += file.size
                return file
            })
            let filesToDelete = []
            if (totalSize > SIZE_LIMIT) {
                while (totalSize > SIZE_LIMIT) {
                    let file = fileInfo.shift()
                    totalSize -= file.size
                    filesToDelete.push(file.file)
                }
            }
            this.e.emit("clean", filesToDelete)
            let promises = []
            filesToDelete.forEach((file, index) => {
                promises.push(fs.promises.unlink(path.join(__dirname, REC_FOLDER, file)))
            })
            return Promise.all(promises)
        }).then(d => {
            this.e.emit("cleaned")
        }).catch(e => {
            console.log(e)
        })
    }
    #monitor() {
        if (this.lastHeartBeat < new Date().getTime() - 1000 * 5) {
            this.e.emit("stop", "No heartbeat")
            this.stop()
        }
    }
    #parseStderr(data) {
        if (data.indexOf("frame") === 0) {
            let dataArr = data.split("=")
            let arr = []
            dataArr.forEach((d, index) => {
                dataArr[index] = d
                arr = arr.concat(d.trim().split(" "))
            })
            let obj = {}
            for (let i = 0; i < arr.length; i++) {
                if (i % 2 === 0) {
                    obj[arr[i]] = arr[i + 1]
                }
            }
            if (obj.frame)
                obj.frame = parseInt(obj.frame)
            if (obj.fps)
                obj.fps = parseInt(obj.fps)
            if (obj.q)
                obj.q = parseFloat(obj.q)
            if (obj.speed)
                obj.speed = parseFloat(obj.speed.replace("x", ""))
            return obj
        } else {
            return {
                frame: 0,
                fps: 0,
                q: 0,
                size: 'N/A',
                time: '00:00:00.00',
                bitrate: 'N/A',
                speed: 0
            }
        }
    }
}

module.exports = Recorder;