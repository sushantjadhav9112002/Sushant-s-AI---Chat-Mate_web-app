import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import ImageKit from "imagekit";
import dotenv from 'dotenv';
import Chat from "./models/chat.js";  // Correct import and usage
import UserChats from "./models/userChat.js";  // Correct import and usage
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL, // Ensure this matches your frontend URL
    credentials: true,
}));

app.use(express.json());

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO);
        console.log("Connected to MongoDB");
    } catch (err) {
        console.log(err);
    }
};

var imagekit = new ImageKit({
    publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
    privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGE_KIT_ENDPOINT
});

app.get("/api/upload", (req, res) => {
    const result = imagekit.getAuthenticationParameters();
    res.send(result);
});

app.post("/api/chats", ClerkExpressRequireAuth(), async (req, res) => {
    const userId = req.auth.userId;
    const { text } = req.body;

    try {
        // Create a new chat
        const newChat = new Chat({
            userId: userId,
            history: [{ role: "user", parts: [{ text }] }]
        });

        const savedChat = await newChat.save();

        // Check if the user chats exist
        const userChats = await UserChats.findOne({ userId: userId });

        // If it doesn't exist, create a new one and add chat to the chats array
        if (!userChats) {
            const newUserChats = new UserChats({
                userId: userId,
                chats: [
                    {
                        _id: savedChat._id,
                        title: text.substring(0, 40),
                    }
                ]
            });
            await newUserChats.save();
        } else {
            // If it exists, then push the chat to the existing array
            await UserChats.updateOne({ userId: userId }, {
                $push: {
                    chats: {
                        _id: savedChat._id,
                        title: text.substring(0, 40),
                    }
                }
            });
        }

        res.status(201).send(savedChat._id);

    } catch (err) {
        console.log(err);
        res.status(500).send("Error creating Chat!");
    }
});

app.get("/api/userchats", ClerkExpressRequireAuth(), async (req, res) => {
    const userId = req.auth.userId;

    try {
        const userChats = await UserChats.findOne({ userId });

        res.status(200).send(userChats ? userChats.chats : []);

    } catch (err) {
        console.log(err);
        res.status(500).send("Error fetching user data.");
    }
});

app.get("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
    const userId = req.auth.userId;

    try {
        const chat = await Chat.findOne({ _id: req.params.id, userId });

        res.status(200).send(chat);

    } catch (err) {
        console.log(err);
        res.status(500).send("Error fetching chat.");
    }
});

app.put("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
    const userId = req.auth.userId;
    const { question, answer, img } = req.body;

    const newItems = [
        ...(question ? [{ role: "user", parts: [{ text: question }], ...(img && { img }) }] : []),
        { role: "model", parts: [{ text: answer }] }
    ];

    try {
        const updatedChat = await Chat.updateOne(
            { _id: req.params.id, userId },
            { $push: { history: { $each: newItems } } }
        );

        const chat = await Chat.findOne({ _id: req.params.id, userId });

        res.status(200).send(chat);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error adding conversation.");
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(401).send('Unauthenticated!');
});

app.listen(port, () => {
    connect();
    console.log(`Server running on port ${port}`);
});
