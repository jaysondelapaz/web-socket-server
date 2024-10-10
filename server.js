import express, { json } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const server = createServer(app);
const clients = {};
const clientMessages = {}; // Initialize to store messages by recipient ID

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(json());
app.use(cors());


// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.use(express.static(path.join(__dirname, 'public')));

app.post("/setId", (req, res) => {
    const { customId } = req.body;
    if (customId) {
        clients[customId] = {};
        return res.status(200).json({ status: 1, message: "Success! Your ID is: " + customId });
    } else {
        return res.status(400).json({ status: 0, message: "Failed to set custom ID" });
    }
});

app.get("/clients", (req, res) => {
    return res.json(Object.keys(clients));
});

app.get("/getMessages/:recipientId", (req, res) => {
    const { recipientId } = req.params;

    // Fetch messages for the recipient
    if (clientMessages[recipientId]) {
        return res.json({ status: 1, messages: clientMessages[recipientId] });
    } else {
        return res.status(404).json({ status: 0, message: "No messages found for this recipient" });
    }
});

app.post("/sendMessage", (req, res) => {
    const { message, recipientId, fromSender } = req.body;

    // Store the message in clientMessages for the recipient
    if (!clientMessages[recipientId]) {
        clientMessages[recipientId] = [];
    }
    clientMessages[recipientId].push({ message, from: fromSender });

    // Send the message to the recipient via WebSocket if connected
    if (clients[recipientId] && clients[recipientId].socket) {
        clients[recipientId].socket.emit("private_message", {
            message,
            from: fromSender,
        });
        return res.status(200).json({ status: "Message sent" });
    } else {
        return res.status(404).json({ status: "User not found" });
    }
});

io.on("connection", (socket) => {
    console.log("Client connected, waiting for ID...");

    socket.on("set_id", (customId) => {
        console.log("Client ID set:", customId);
        clients[customId] = { socket };
        socket.emit("id_confirmed", { customId });

         // Notify all clients about the new connection
         io.emit('connectedClients', Object.keys(clients));

    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
        for (let id in clients) {
            if (clients[id].socket.id === socket.id) {
                delete clients[id];
                console.log(`Client with ID ${id} removed`);
                break;
            }
        }

         // Notify all clients about the disconnection
         io.emit('connectedClients', Object.keys(clients));
         
    });

    socket.on("private_message", ({ message, fromSender, recipientId }) => {
        console.log(`Private message to ${recipientId}: ${message} from ${fromSender}`);
        if (clients[recipientId]) {
            clients[recipientId].socket.emit("private_message", {
                message,
                from: fromSender,
            });
        } else {
            socket.emit("error", { message: "User not found" });
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}...`);
});