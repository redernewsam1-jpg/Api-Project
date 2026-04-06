#!/usr/bin/env bash

echo "Installing FFmpeg..."
apt-get update && apt-get install -y ffmpeg

echo "Installing yt-dlp..."
pip install yt-dlp