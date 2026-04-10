import express from "express";
import Thread from "../models/Thread.js";
import getGeminiAPIResponse from "../utils/gemini.js";


const router = express.Router();

//test
router.post("/test", async(req, res) => {
    try {
        const thread = new Thread({
            threadId: "abc",
            title: "Testing New Thread2"
        });

        const response = await thread.save();
        return res.send(response);
    } catch(err) {
        console.log(err);
        return res.status(500).json({error: "Failed to save in DB"});
    }
});

//Get all threads
router.get("/thread", async(req, res) => {
    try {
        const threads = await Thread.find({}).sort({updatedAt: -1});
        //descending order of updatedAt...most recent data on top
        return res.json(threads);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to fetch threads"});
    }
});

router.get("/thread/:threadId", async(req, res) => {
    const {threadId} = req.params;

    try {
        let thread = await Thread.findOne({ threadId });

        if (!thread) {
            thread = new Thread({
                threadId,
                messages: []
            });
            await thread.save();
        }

        return res.json(thread.messages);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to fetch chat"});
    }
});

router.delete("/thread/:threadId", async (req, res) => {
    const {threadId} = req.params;

    try {
        const deletedThread = await Thread.findOneAndDelete({threadId});

        if (!deletedThread) {
           return res.status(404).json({ error: "Thread not found" });
        }

        return res.status(200).json({ success: "Thread deleted successfully" });

    } catch(err) {
        console.log(err);
        return res.status(500).json({error: "Failed to delete thread"});
    }
});

router.post("/chat", async(req, res) => {
    const {threadId, message} = req.body;

    if(!threadId || !message) {
        return res.status(400).json({error: "missing required fields"});
    }

    try {

        let thread = await Thread.findOne({threadId});

        if(!thread) {
            // create new thread
            thread = new Thread({
                threadId,
                title: message,
                messages: []
            });
        }

        // push user message
        thread.messages.push({role: "user", content: message});

        // build conversation history for Gemini
        const history = thread.messages.slice(-10).map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
        }));

        // get AI response with history
        const assistantReply = await getGeminiAPIResponse(message, history);

        // save assistant reply
        thread.messages.push({
            role: "assistant",
            content: assistantReply
        });

        thread.updatedAt = new Date();

        await thread.save();

        return res.json({reply: assistantReply});

    } catch(err) {
        console.log(err);
        return res.status(500).json({error: "something went wrong"});
    }
});

router.post("/image-save", async (req, res) => {
    const { threadId, prompt, imageUrl } = req.body;

    try {
        let thread = await Thread.findOne({ threadId });

        if (!thread) {
            thread = new Thread({
                threadId,
                title: prompt,
                messages: []
            });
        }

        // ✅ save user prompt
        thread.messages.push({
            role: "user",
            content: prompt
        });

        // ✅ save image (THIS IS YOUR LINE)
        thread.messages.push({
            role: "assistant",
            content: imageUrl,
            type: "image"
        });

        await thread.save();

        return res.json({ success: true });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Failed to save image" });
    }
});

export default router;