"use strict";
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const express = require('express');
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const rateLimit = require("express-rate-limit");
const app = express();
const cors = require('cors');
const exec = require('child_process').exec;
const server = require('http').Server(app);
const basicAuth = require("./middlewares/basicAuth");

app.set('view engine', 'ejs')
app.use(express.static('public'))

const { PORT, RTSP_USER, RTSP_PASSWORD, RTSP_PORT, FILE_TIME_TO_RECORD, RTSP_IP } = process.env;

const mainLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 120,
    message:
        "Too many requests from this IP"
});

const rateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 200,
    message:
        "Too many requests from this IP"
});

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use("/", express.static(path.join(__dirname, "frontend")));

app.get('/api/files', mainLimiter, basicAuth, (req, res) => {
    try {
        const folder = path.join(__dirname, 'output');
        fs.readdir(folder, (err, files) => {
            if (err) {
                console.log("Error reading folder files " + err);
                return res.status(409).end();
            }
            return res.status(200).json({ files });
        })
    } catch (error) {
        console.log("index error ", error);
        return res.status(500).end();
    }
})

app.post("/api/start", mainLimiter, basicAuth, (req, res) => {
    try {
        const isNumeric = (value) => {
            return /^\d+$/.test(value);
        }
        const channel = req.body.channel;
        if (!channel || !isNumeric(channel)) return res.status(409).end();
        const folder = path.join(__dirname, 'output');
        const fileName = "VID_" + moment().format('YYYYMMDD_HH-mm-ss') + ".mp4";
        const filePath = folder + "/" + fileName;
        const command = `ffmpeg -rtsp_transport tcp -i rtsp://${RTSP_USER}:${RTSP_PASSWORD}@${RTSP_IP}:${RTSP_PORT}/channel=${channel} -acodec copy -vcodec libx264 -t ${FILE_TIME_TO_RECORD} "${filePath}"`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.log("Error executing command " + error);
                return res.status(409).end();
            }
            return res.status(200).end();
        });
    } catch (error) {
        console.log("start error ", error);
        return res.status(500).end();
    }
})

app.get('/api/:videoId', mainLimiter, (req, res) => {
    try {
        const token = req.query.token;
        if (!token || token !== process.env.VIDEO_TOKEN) return res.status(401).json({ message: "You are not authenticated!" });
        const videoId = decodeURI(req.params.videoId);
        const folder = path.join(__dirname, 'output');
        fs.readdir(folder, (err, files) => {
            if (err) {
                console.log("Error reading folder files " + err);
                return res.status(409).end();
            }
            const video = files.find(vid => vid === videoId);
            if (!video) return res.status(409).end();
            // Ensure there is a range given for the video
            const range = req.headers.range;
            if (!range) {
                return res.status(400).send("Requires Range header");
            }
            const videoPath = folder + "/" + video;
            const videoSize = fs.statSync(videoPath).size;
            // Parse Range
            // Example: "bytes=32324-"
            const CHUNK_SIZE = 10 ** 6; // 1MB
            const start = Number(range.replace(/\D/g, ""));
            const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

            // Create headers
            const contentLength = end - start + 1;
            const headers = {
                "Content-Range": `bytes ${start}-${end}/${videoSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": contentLength,
                "Content-Type": "video/mp4",
            };

            // HTTP Status 206 for Partial Content
            res.writeHead(206, headers);
            const videoStream = fs.createReadStream(videoPath, { start, end });
            videoStream.pipe(res);
        })
    } catch (error) {
        console.log("get video id error ", error);
        return res.status(500).end();
    }
})

app.delete('/api/:videoId', mainLimiter, basicAuth, (req, res) => {
    try {
        const videoId = decodeURI(req.params.videoId);
        const folder = path.join(__dirname, 'output');
        fs.readdir(folder, (err, files) => {
            if (err) {
                console.log("Error reading folder files " + err);
                return res.status(409).end();
            }
            const video = files.find(vid => vid === videoId);
            if (!video) return res.status(409).end();
            fs.unlink(folder + "/" + video, (err) => {
                if (err) {
                    console.log("Error removing video " + err);
                    return res.status(409).end();
                }
                return res.status(200).end();
            });
        })
    } catch (error) {
        console.log("delete video error ", error);
        return res.status(500).end();
    }
})

app.get('/home', (req, res) => {
    res.redirect("/");
})

app.get('/status', rateLimiter, (req, res) => {
    res.status(200).end();
})

app.use("/", rateLimiter, (req, res) => {
    res.set('Content-Type', 'text/html');
    res.status(404).send(Buffer.from("<h1>Not found </h1>"));
})

app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

const port = PORT || 3000;
server.listen(port, () => {
    console.log("Server running on port: ", port);
});
