const express = require("express");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== TOKENS =====
const BOT_TOKEN = process.env.BOT_TOKEN;

// ===== HOME =====
app.get("/", (req, res) => {
    res.send("🚀 API + Bot Running");
});

// ===== SIMPLE EXTRACT API =====
app.get("/extract", async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.json({ status: false, message: "URL missing" });
    }

    res.json({
        status: true,
        title: "Video",
        video: url
    });
});

// ===== TELEGRAM BOT =====
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// START COMMAND
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "📥 Send video link");
});

// MESSAGE HANDLER
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || !text.startsWith("http")) return;

    try {
        await bot.sendMessage(chatId, "🔍 Processing...");

        // ✅ Render API use ho rahi hai
        const apiUrl = `https://api-project-sx7e.onrender.com/extract?url=${text}`;
        const response = await axios.get(apiUrl);

        if (!response.data.video) {
            return bot.sendMessage(chatId, "❌ No video found");
        }

        const videoUrl = response.data.video;
        const filePath = `video_${Date.now()}.mp4`;

        await bot.sendMessage(chatId, "⬇️ Downloading...");

        // DOWNLOAD
        const videoResponse = await axios({
            url: videoUrl,
            method: "GET",
            responseType: "stream"
        });

        const writer = fs.createWriteStream(filePath);
        videoResponse.data.pipe(writer);

        writer.on("finish", async () => {
            try {
                await bot.sendMessage(chatId, "📤 Uploading...");
                await bot.sendVideo(chatId, filePath);

                fs.unlinkSync(filePath);
            } catch (err) {
                bot.sendMessage(chatId, "❌ Upload failed");
            }
        });

    } catch (err) {
        console.log(err);
        bot.sendMessage(chatId, "⚠️ Error");
    }
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
