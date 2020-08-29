//Importing the socketio and then binding it to port 3000
//This implicitly start a http server on the specified port....
const express = require("express");
//This is our request listener...
const app = express();
//We Create a http server and set the express as our requestListener..
const server  = require('http').createServer(app);
//Our socket is connected to the http server..
const io = require("socket.io")(server);
//Importing mongoose .. A wrapper for mongo db..
const mongoose = require('mongoose');



//importing the models..
const myModels = require('./models/roomModel');
const roomModel = myModels.Room;
const userModel = myModels.User;


//Yet To Delete..
var rooms = {}

//setting the view folder..
app.set('views',"./views");
// setting the public folder which will be available publicly..
app.use(express.static('public'));
//setting the templating engine..
app.set('view engine','ejs')
//setting the app to use encodedurl to be able to get the roomName (see app.get("/room"))
app.use(express.urlencoded({extended:true}));



//Serve our index,ejs for the root 
app.get("/",async (req,res)=>{
    // passing in the already existing rooms..
    const rooms = await roomModel.find();
    res.render('index',{rooms:rooms}); 
})



//For any Room queried..
app.get("/:room",async (req,res)=>{
    //if the room exists ..
    const findRoom = await roomModel.findOne({roomName:req.params.room})
    if (findRoom != null){
        //If the room exists allow the connection..
        res.render('room',{roomName :req.params.room});

    }else{
        //If it does no exist redirect to index..
        res.redirect('/')
    }

    // if (rooms[req.params.room] != null){
    //     //render it passing in the name of the room..
    //     res.render('room',{roomName :req.params.room});
    //     console.log(req.params.room);
    // }else{
    //     //else redirect to the home page..
    //     res.redirect("/")
    // }
})




//Request to create a new room..
app.post('/room',async(req,res)=>{
    const roomName = req.body.room;
    const findRoom = await roomModel.findOne({roomName:roomName});
    //if the room already exists..
    if (findRoom != null){
        //redirect to the homepage..
        res.redirect('/');
    }else{
        //else Create a new Room model with no users inside..
    await roomModel.create({roomName:roomName,users:[]});
        //And redirect the user to the room
        res.redirect(roomName);
        //send message that new room was created..
        io.emit('room-created',roomName);
    }



    //if the room already exists..
    // if (rooms[req.body.room] != null){
    //     //redirect to the homepage..
    //     res.redirect("/");
    // }else{
    //     //else Create a new Room Object with no users inside..
    //     rooms[req.body.room] = { users : {}}   // Eg. Say roomName is  "myRoom"  =>  rooms object(our DB) becomes  {myRoom:{users{}}}
    //     //And redirect the user to the room
    //     res.redirect(req.body.room)
    //     //send message that new room was created..
    //     io.emit("room-created",req.body.room);
    // }
    
})

// var log = console.log;
// console.log = function() {
//     log.apply(console, arguments);
//     // Print the stack trace
//     console.trace();
// };





//connecting to the dB
mongoose.connect('mongodb://localhost/chatSystem',{useNewUrlParser:true,useUnifiedTopology:true});
//We are listening on port 3000.
server.listen(3000);

//When a user connects..
io.on("connection" ,(socket)=>{
    //Send a message that He/she joined Successfully
    // socket.emit("chat-message","You Joined!");
    
    //Recieve the  name  of the user and the roomName
    socket.on('new-user',async (room,name)=>{
        //Add the user to the room..
        socket.join(room);              //This "connects" the socket object to the  roomName which is a string
        //Get the room from the DB..
        var getRoom = await roomModel.findOne({roomName:room});
        //add the name  to the users obj..
        // console.log(`Your Socket Id is  ${socket.id} And NAme : ${name}`);              //_DEBUG
        //An object to create the actual user..
        const user = {
            _id:socket.id,                                  //The id of the user is the socket id..
            name:name,
            roomId: getRoom._id                             //Link to the room in which this user is (will be)  in ..
        };                                     
        //Creating the actual user in the Db..           
        var createdUser = new userModel(user);
        createdUser.save((err)=>{
            if (err){
                console.log(`Error Creating new User ${user}`);
            }else{

                //No errors..
                // console.log(`User ${name} Created `);    //_DEBUG
                ///Since the user Was created (without errors)
                //add the user to the room..
                getRoom.users.push(createdUser._id);        
                // console.log(`${createdUser.name} was added to the room : ${getRoom.roomName}`);   //_DEBUG
                getRoom.save();
            }
        });


        //broadcast the message that this user has joined..
        socket.to(room).broadcast.emit("user-connected",name);

    })//done..


    //when the user sends a message..
    socket.on('send-chat-message',async (room,message)=>{
        //broadcast it to every one else in the room.. with the name of the sender and the message..
        const USER = await userModel.findOne({_id: socket.id});
        // console.log(`User : ${USER} `)
        // console.log(USER);
        if (USER != null){

            socket.to(room).broadcast.emit('chat-message',{
                message:message,
                name :  USER.name                                     //<<<<<<<<<<<<<<<<An error can occur here!!
                // name:rooms[room].users[socket.id]   //In the room  the User with socketId of socket.id
            }) ;
        }
    })

    //When a user Leaves..
    socket.on('disconnect',async ()=>{

        const USER = await userModel.findOne({_id:socket.id});
        // console.log("USER DISCONNECTED -------------------------------");
        // console.log(USER);
        if (USER != null){
            const USERNAME = USER.name;

            const userRoom = await roomModel.findOne({_id:USER.roomId})                         //<<<<<<THis needs refactoring I'm Too tired!
            
            const roomName = userRoom.roomName;
            await roomModel.updateOne(
                { _id:USER.roomId },
                {$pull : {users:socket.id}},(err,no)=>{
                    USER.remove();
                    socket.to(roomName).broadcast.emit('user-disconnected',USERNAME);
                }
            )
            await roomModel.deleteMany({ users: { $exists: true, $size: 0 } })
        }
        
    })
})


