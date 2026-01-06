import express from "express";
import ffmpeg from "fluent-ffmpeg";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// helper to download temp file
async function download(url, path) {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(path);
  await new Promise((resolve) => res.body.pipe(fileStream).on("finish", resolve));
}

// TEST
app.get("/", (req, res) => res.send("FFmpeg API Running"));


// 🎬 TRIM ENDPOINT
app.post("/api/trim", async (req, res) => {
  try {
    const { video_url, start_time, duration } = req.body;

    const input = "/tmp/input.mp4";
    const output = "/tmp/output.mp4";

    await download(video_url, input);

    ffmpeg(input)
      .setStartTime(start_time)
      .setDuration(duration)
      .output(output)
      .on("end", () => res.download(output))
      .run();

  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});


// 🖼 THUMBNAIL
app.post("/api/thumbnail", async (req, res) => {
  try {
    const { video_url, time } = req.body;

    const input = "/tmp/input.mp4";
    const output = "/tmp/thumb.jpg";

    await download(video_url, input);

    ffmpeg(input)
      .screenshots({
        timestamps: [time],
        filename: "thumb.jpg",
        folder: "/tmp"
      })
      .on("end", () => res.download(output))
      .run();

  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});


app.listen(PORT, () => console.log("Server running on", PORT));
