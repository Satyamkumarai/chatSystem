//Importing the socketio and then binding it to port 3000
//This implicitly start a http server on the specified port....
const express = require("express");
//This is our request listener...
const app = express();
//We Create a http server and set the express as our requestListener..
const server  = require('http').createServer(app);
//Our socket is connected to the http server..
const io = require("socket.io")(server);


var rooms = {}

app.set('views',"./views");
app.use(express.static('public'));
app.set('view engine','ejs')
app.use(express.urlencoded({extended:true}));

//Serve our index,ejs for the root 
app.get("/",(req,res)=>{
    res.render('index',{rooms:rooms});
})


//For any Room
app.get("/:room",(req,res)=>{
    //if the room exists 
    if (rooms[req.params.room] != null){
        //render it passing in the name of the room..
        res.render('room',{roomName :req.params.room});
        console.log(req.params.room);
    }else{
        //else redirect to the home page..
        res.redirect("/")
    }
})

//Request to create a new room..
app.post('/room',(req,res)=>{
    //if the room already exists..
    if (rooms[req.body.room] != null){
        //redirect to the homepage..
        res.redirect("/");
    }else{
        //else Create a new Room Object with no users inside..
        rooms[req.body.room] = { users : {}}   // Eg. Say roomName is  "myRoom"  =>  rooms object(our DB) becomes  {myRoom:{users{}}}
        //And redirect the user to the room
        res.redirect(req.body.room)
        //send message that new room was created..
        io.emit("room-created",req.body.room);

    }
    
})

//We are listening on port 3000.
server.listen(3000);

//When a user connects..
io.on("connection" ,(socket)=>{
    //Send a message that He/she joined Successfully
    // socket.emit("chat-message","You Joined!");
    
    //Recieve the  name  of the user and the roomName
    socket.on('new-user',(room,name)=>{
        //Add the user to the room..
        socket.join(room);              //This "connects" the socket object to the  roomName which is a string

        //add the name  to the users obj..
        rooms[room].users[socket.id] = name;
        //broadcast the message that this user has joined..
        socket.to(room).broadcast.emit("user-connected",name);
    })


    //when the user sends a message..
    socket.on('send-chat-message',(room,message)=>{
        //broadcast it to every one else in the room.. with the name of the sender and the message..
        socket.to(room).broadcast.emit('chat-message',{
            message:message,
            name:rooms[room].users[socket.id]   //In the room  the User with socketId of socket.id
        }) ;
    })

    //When a user Leaves..
    socket.on('disconnect',()=>{
        //get all the rooms the user(which is a socket object) is in ..
        getUserRooms(socket).forEach(room => {
            //Broadcast to that room that the user has disconnected..
            console.log("DIsconnected!");
            console.log(rooms[room].users[socket.id]);
            socket.broadcast.emit('user-disconnected',rooms[room].users[socket.id]);
            //delete the name of the user..
            delete rooms[room].users[socket.id]
    
            //Note: We used socket.join(<roomName>) to associate a room with the user..
            //When the user disconnects, the room is automatically disassociated..
            
        });
    })
})



function getUserRooms(socket){
    return Object.entries(rooms).reduce((names,[name,room])=>{
        if (room.users[socket.id] != null)  names.push(name)
        return names

    },[])
}