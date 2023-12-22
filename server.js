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
const CamsCache = require("./cache");

app.set('trust proxy', 1);
app.set('view engine', 'ejs')
app.use(express.static('public'))

const { PORT, START_SECRET, RTSP_USER, RTSP_PASSWORD, RTSP_PORT, FILE_TIME_TO_RECORD, RTSP_IP } = process.env;

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

app.get('/api/files', mainLimiter, (req, res) => {
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

app.post("/api/start", mainLimiter, (req, res) => {
    try {
        const isNumeric = (value) => {
            return /^\d+$/.test(value);
        }
        const channel = req.body.channel;
        if (!channel || !isNumeric(channel)) return res.status(409).end();
        if (CamsCache.isInCache(channel)) return res.status(425).json({ message: "Server busy" });
        CamsCache.add(channel);
        const secret = req.body.secretsauce;
        if (!secret || typeof secret !== "string" || (secret !== START_SECRET)) {
            return res.status(401).end();
        }
        const folder = path.join(__dirname, 'output');
        const fileName = "VID_" + moment().format('YYYYMMDD_HH-mm-ss') + ".mp4";
        const filePath = folder + "/" + fileName;
        const command = `ffmpeg -rtsp_transport tcp -i rtsp://${RTSP_USER}:${RTSP_PASSWORD}@${RTSP_IP}:${RTSP_PORT}/channel=${channel} -acodec copy -vcodec libx264 -t ${FILE_TIME_TO_RECORD} "${filePath}"`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.log("Error executing command " + error);
                CamsCache.remove(channel);
                return res.status(409).end();
            }
            CamsCache.remove(channel);
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
            res.sendFile(folder + "/" + video);
        })
    } catch (error) {
        console.log("get video id error ", error);
        return res.status(404).end();
    }
})

app.delete('/api/:videoId', mainLimiter, (req, res) => {
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
