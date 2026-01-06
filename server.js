import express from "express";
import axios from "axios";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());

const TMP = "/tmp";  // works on Railway

app.post("/api/trim", async (req, res) => {
  try {

    const { url, start, end } = req.body;

    if (!url) return res.status(400).json({ error: "url required" });
    if (start == null || end == null) return res.status(400).json({ error: "start/end required" });

    console.log("▶ trim request:", url, start, end);

    const input = path.join(TMP, "input.mp4");
    const output = path.join(TMP, "output.mp4");

    // download
    const writer = fs.createWriteStream(input);
    const response = await axios({ url, method: "GET", responseType: "stream" });
    response.data.pipe(writer);

    await new Promise(resolve => writer.on("finish", resolve));

    // ffmpeg trim
    const cmd = `ffmpeg -y -i ${input} -ss ${start} -to ${end} -c copy ${output}`;
    await execPromise(cmd);

    return res.download(output);

  } catch (err) {
    console.error("❌ TRIM FAILED", err);
    return res.status(500).json({ error: err.message });
  }
});

function execPromise(cmd) {
  return new Promise((resolve, reject) =>
    exec(cmd, (err) => err ? reject(err) : resolve())
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log("Server running", PORT));
