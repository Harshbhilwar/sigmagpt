import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());

app.use("/api", chatRoutes);

app.post("/api/image", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const cleanPrompt = prompt
    .toLowerCase()
    .replace(/generate image of/g, "")
    .replace(/generate image/g, "")
    .replace(/draw/g, "")
    .replace(/\/image/g, "")
    .trim()
    .replace(/\s+/g, " ");

    console.log("Clean Prompt:", cleanPrompt);

    // ✅ POLLINATIONS (FREE + NO ERROR)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=512&height=512&seed=${Date.now()}&nologo=true&safe=true`;

    console.log("Generated Image URL:", imageUrl); // 👈 IMPORTANT

    return res.json({
      image: `http://localhost:8080/api/proxy-image?url=${encodeURIComponent(imageUrl)}`, // for display
      realImage: imageUrl, // for saving
      source: "pollinations"
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Image generation failed" });
  }
});

app.get("/api/proxy-image", async (req, res) => {
  try {
    const imageUrl = req.query.url;

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "image/*"
      }
    });

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type");

    res.set("Content-Type", contentType);
    res.send(Buffer.from(buffer));

  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to load image");
  }
});

app.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
    connectDB();
});

const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected with Database!");
    } catch(err) {
        console.log("Failed to connect with Db", err);
    }
}


// app.post("/test", async (req, res) => {
//     const options = {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
//         },
//         body: JSON.stringify({
//             model: "gpt-4o-mini",
//             messages: [{
//                 role: "user",
//                 content: req.body.message
//             }]
//         })
//     };

//     try {
//         const response = await fetch("https://api.openai.com/v1/chat/completions", options);
//         const data = await response.json();
//         //console.log(data.choices[0].message.content); //reply
//         res.send(data.choices[0].message.content);
//     } catch(err) {
//         console.log(err);
//     }
// });

