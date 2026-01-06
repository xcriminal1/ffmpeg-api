import express from "express";
import axios from "axios";
import fs from "fs";
import { spawn } from "child_process";

const app = express();
app.use(express.json());

function extractFileId(url) {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

app.post("/api/drive", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) return res.status(400).json({ error: "url required" });

    const fileId = extractFileId(url);
    if (!fileId) return res.status(400).json({ error: "invalid drive url" });

    const direct = `https://drive.google.com/uc?export=download&id=${fileId}`;

    return res.json({ direct });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});


// 🟣 NEW — TRIM ENDPOINT
app.post("/api/trim", async (req, res) => {
  try {
    const { url, start, end } = req.body;

    if (!url) return res.status(400).json({ error: "url required" });
    if (start == null || end == null) return res.status(400).json({ error: "start and end required" });

    const duration = end - start;
    if (duration <= 0) return res.status(400).json({ error: "invalid duration" });

    // Temp input/output files
    const input = "/tmp/input.mp4";
    const output = "/tmp/output.mp4";

    // Download file
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(input);
    response.data.pipe(writer);

    await new Promise((resolve) => writer.on("finish", resolve));

    // Run ffmpeg trim
    const ff = spawn("ffmpeg", [
      "-ss", String(start),
      "-i", input,
      "-t", String(duration),
      "-c", "copy",
      output
    ]);

    ff.stderr.on("data", (d) => console.log(d.toString()));

    ff.on("close", () => {
      res.download(output, "trimmed.mp4", () => {
        fs.unlinkSync(input);
        fs.unlinkSync(output);
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.listen(3000, () => console.log("Server running on 3000"));
