import express from "express";
import axios from "axios";

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

    const file = await axios.get(direct, {
      responseType: "stream"
    });

    res.setHeader("Content-Type", "video/mp4");
    file.data.pipe(res);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "download failed" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});

