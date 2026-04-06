const express = require("express");
const axios = require("axios");
const fs = require("fs");
const { exec } = require("child_process");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;

const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// HOME
app.get("/", (req, res) => {
    res.send("🚀 Advanced Bot Running");
});

// START
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "📥 Send any link (MP4 / M3U8 / Instagram / YouTube)");
});

// MESSAGE HANDLER
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || !text.startsWith("http")) return;

    const filePath = `video_${Date.now()}.mp4`;

    try {
        await bot.sendMessage(chatId, "🔍 Processing...");

        // ===== M3U8 =====
        if (text.includes(".m3u8")) {
            await bot.sendMessage(chatId, "🎥 Converting M3U8...");

            exec(`ffmpeg -y -i "${text}" -preset ultrafast -c copy "${filePath}"`, async (err) => {
                if (err) return bot.sendMessage(chatId, "❌ M3U8 failed");

                await bot.sendVideo(chatId, filePath);
                fs.unlinkSync(filePath);
            });
        }

        // ===== INSTAGRAM / YOUTUBE =====
        else if (
            text.includes("instagram.com") ||
            text.includes("youtube.com") ||
            text.includes("youtu.be")
        ) {
            await bot.sendMessage(chatId, "📥 Downloading...");

            exec(`yt-dlp -f "best[height<=720]" -o "${filePath}" "${text}"`, async (err) => {
                if (err) return bot.sendMessage(chatId, "❌ Download failed");

                await bot.sendVideo(chatId, filePath);
                fs.unlinkSync(filePath);
            });
        }

        // ===== DIRECT MP4 =====
        else {
            await bot.sendMessage(chatId, "⬇️ Downloading MP4...");

            const response = await axios({
                url: text,
                method: "GET",
                responseType: "stream"
            });

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            writer.on("finish", async () => {
                await bot.sendVideo(chatId, filePath);
                fs.unlinkSync(filePath);
            });
        }

    } catch (err) {
        console.log(err);
        bot.sendMessage(chatId, "⚠️ Error");
    }
});

// START SERVER
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
