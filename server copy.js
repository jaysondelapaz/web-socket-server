import express, { json } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors : {
        origin : "*",
        methods :["GET","POST"]
    }
});

app.use(json());
app.use(cors());

const messages =[];


app.get('/api/chat/messages', (req, res) => {
    res.json(messages);
});

// app.post('/api/chat/messages', (req, res) => {
//     const { message, user } = req.body;

//     // Ensure both message and user are present
//     if (message && user) {
//         const chatMessage = { user, message }; // Create a message object
//         messages.push(chatMessage); // Push to messages array

//         io.emit('chat message', chatMessage); // Emit to all connected clients
//         return res.status(200).json({ status: 'Message sent', chatMessage });
//     } else {
//         return res.status(400).json({ status: 'Invalid message format' });
//     }
// });
app.post('/api/chat/messages', (req, res) => {
    const { message, user, room } = req.body; // Include room in the destructured body

    // Ensure message, user, and room are present
    if (message && user && room) {
        const chatMessage = { user, message }; // Create a message object
        messages.push(chatMessage); // Push to messages array

        // Emit to the specific room instead of all clients
        io.to(room).emit('chat message', chatMessage); // Send only to the specified room
        return res.status(200).json({ status: 'Message sent', chatMessage });
    } else {
        return res.status(400).json({ status: 'Invalid message format' });
    }
});

// io.on('connection', (socket) => {
//     // console.log(`User Connected: ${socket.id}`);

//     // socket.on('chat message', (msg) => {
//     //     console.log(`Message received: ${msg}`);
//     //     messages.push(msg);
//     //     io.emit('chat message', msg); // Broadcast message
//     // });

//     socket.on('join room', (roomName) => {
//         socket.join(roomName);
//         console.log(`${socket.id} joined room: ${roomName}`);
//         socket.emit('joined room', roomName); // Notify the user that they've joined
//     });

//     socket.on('chat message', ({ room, message, user }) => {
//         console.log(`Received message from ${user} in room ${room}: ${message}`);
        
//         // Ensure the socket is in the room before emitting the message
//         if (socket.rooms.has(room)) {
//             const chatMessage = { user, message };
//             io.to(room).emit('chat message', chatMessage); // Send to specific room
//         } else {
//             console.log(`Socket ${socket.id} is not in room: ${room}`);
//         }
//     });

//     socket.on('disconnect', () => {
//         console.log("User Disconnected");
//     });
// });

// io.on('connection', (socket) => {
//     socket.on('join room', (roomName) => {
//         socket.join(roomName);
//         console.log(`${socket.id} joined room: ${roomName}`);
//         socket.emit('joined room', roomName); // Notify the user that they've joined
//     });

//     socket.on('chat message', ({ room, message, user }) => {
//         console.log(`Received message from ${user} in room ${room}: ${message}`);

//         // Emit to the specific room
//         io.to(room).emit('chat message', { user, message });
//     });

//     socket.on('disconnect', () => {
//         console.log("User Disconnected");
//     });
// });

io.on('connection', (socket) => {
    // Handle room joining
    socket.on('join room', (roomName) => {
        socket.join(roomName);
        console.log(`${socket.id} joined room: ${roomName}`);
    });

    // Handle incoming messages
    socket.on('chat message', ({ room, message, user }) => {
        console.log(`Received message from ${user} in room ${room}: ${message}`);

        // Emit the message only to the specified room
        io.to(room).emit('chat message', { user, message });
    });

    socket.on('disconnect', () => {
        console.log("User Disconnected");
    });
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is RUNNING on port ${PORT}..`);
});