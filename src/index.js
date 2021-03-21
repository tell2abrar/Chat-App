const { Socket } = require("dgram");
const Filter = require('bad-words');
const express = require("express");
const app = express();
const http = require("http");
const socketio = require("socket.io");
const {generateMessage,generateLocationMessage} = require('./utils/messages');
const {addUser,getUser,getUsersInRoom,removeUser} = require('./utils/users');


//Creating http server and mounting socket.io on that
const server = http.createServer(app);
const io = socketio(server);

//setting up the port and serving public dir to the client
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

let count = 0;


//Web-socket connection
io.on('connection',(socket)=>{
    console.log("New websocket connection");

    socket.on('join',({username,room},callback)=>{
        const {error,user} = addUser({id:socket.id,username,room});
        if(error){
            return callback(error);
        }
        socket.join(user.room);
        console.log("room is created");
        socket.broadcast.to(user.room).emit('receiveMesg',generateMessage(`${username}  joined the room!`));
        socket.emit('receiveMesg',generateMessage(user.username,'Welcome!'));
        io.to(user.room).emit('roomData',{room:user.room,users:getUsersInRoom(user.room)});

    })


    socket.on('sendMesg',(mesg,callback)=>{
        const user = getUser(socket.id);
        if(!user){
            return callback('user is not present in room',undefined);
        }
        const filter = new Filter();
        if(filter.isProfane(mesg)){
           return callback('profane words are not allowed to send!',undefined); 
        }
        io.to(user.room).emit('receiveMesg',generateMessage(user.username,mesg));
        callback(undefined,'message dilvered!');
    });

    socket.on('sendLocation',(geolocation,callback)=>{
        const user = getUser(socket.id);
        if(!user){
            return callback('user is not present in room',undefined);
        }
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${geolocation.latitude},${geolocation.longitude}`));
        callback(undefined,'location shared!');
    });

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('receiveMesg',generateMessage(`${user.username} left the room!`));
            io.to(user.room).emit('roomData',{room:user.room,users:getUsersInRoom(user.room)});
        }
       
    });
    
})

//Stating the server
server.listen(PORT,()=>{
    console.log("Server is listening on port: " + PORT);
})