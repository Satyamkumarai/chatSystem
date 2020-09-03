if (process.env.NODE_ENV != 'production'){
    require('dotenv').config();
    //Don't forget to create a .env file in the same dir as this file and in that set SESSION_SECRET=<some Random Value..>
}

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
//Importing bcrypt for password hashing
const bcrypt = require('bcrypt');
//importing passport to act as the  middleware authentication
const passport = require('passport');
//importing flash to be able to show flash messages in the views
const flash = require('express-flash');
//importing express-session to handle the user session This will provide persistance
const session = require('express-session');
//importing our passport initialiing module..
const passportInitiaize = require('./passport_config');
const serverLocation = process.env.DOMAIN || process.env.IP || "localhost"
const PORT = process.env.PORT || 3000




//importing the models..
const myModels = require('./models/roomModel');
const roomModel = myModels.Room;
const userModel = myModels.User;

//Setting up the config for our passport..
passportInitiaize(
    passport,
    async (roomName)=>await roomModel.findOne({roomName:roomName}),
    async (roomId)=>await roomModel.findById(roomId)
);


//setting the view folder..
app.set('views',"./views");
// setting the public folder which will be available publicly..
app.use(express.static('public'));
//setting the templating engine..
app.set('view engine','ejs')
//setting the app to use encodedurl to be able to get the roomName (see app.get("/room"))
app.use(express.urlencoded({extended:true}));
//setting our app to use flash
app.use(flash())
//Setting our app to use express-session passing in the object..
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized:false
}))
//setting the app to use the passport .session ()
//Ref:https://stackoverflow.com/questions/22052258/what-does-passport-session-middleware-do 
//Read the ans by user "indsaymacvean" and edited by "Matthcw"
app.use(passport.initialize())
app.use(passport.session());


function checkAuthenticated(req,res,next){
    console.log(`checkAuthenticated`);
    if (req.isAuthenticated()){
        console.log(`-----AUTH-Done-----`);
        return next();
    }
    console.log(`-----NOT DONE---------`);
    return  res.redirect('/join')       //join room page..
}
async function getSocketIdByName(RoomObj,userName){
    const usr = RoomObj.users;
    for (var i=0; i<usr.length; i++){
        const idMayBe = await userModel.findOne({_id:usr[i],name:userName})
        if (idMayBe != null){
            console.log(`foundId ${idMayBe._id}`);
            return idMayBe._id;
        }
    }
    return null
}
async function checkNotAuthenticated(req,res,next){
    console.log(`checkNotAuthenticated`);

    if (req.isAuthenticated()){
        console.log(`-----AUTH-Done-----`);
        const ROOM = req.user;
        const socketID = await getSocketIdByName(ROOM,req.session.name)
        console.log(`Disconnect -> ${socketID}`);
        if (socketID)
            io.sockets.sockets[socketID].disconnect();
        //Disconnect the socket 
      return   res.render('room',{roomName :req.user.roomName,IP:serverLocation,userName:req.session.name})                 
    }
    console.log(`-----NOT DONE---------`);
    return next();

}
//Serve our index,ejs for the root 
app.get("/",checkNotAuthenticated,async (req,res)=>{
    // passing in the already existing rooms..
    res.render('index'); 
})

//Join room page
app.get('/join',checkNotAuthenticated,async(req,res)=>{
    const rooms = await roomModel.find();
    if (req.query.room){
        console.log('here');
        res.render('joinRoom.ejs',{join:req.query.room,rooms:rooms,IP:serverLocation});
        console.log('end');
    }else{
        res.render('joinRoom.ejs',{join:"",rooms:rooms,IP:serverLocation});
    }
})


//create room Page..
app.get('/create',checkNotAuthenticated,(req,res)=>{
    res.render('createRoom.ejs',{IP:serverLocation});
})

app.get('/join/:room',checkAuthenticated,(req,res)=>{

    console.log(`rendering room : ${req.params.room}`);
    console.log(io)
    res.render('room.ejs',{roomName:req.params.room,IP:serverLocation,userName:req.session.name})
})

//For any Room queried..
//i.e Incoming request to join the Room
app.post("/join",checkNotAuthenticated,passport.authenticate('local',{
    failureFlash:true
}),(req,res)=>{
    console.log(`redirecing to the room`);
    req.session.name=req.body.usrname
    req.session.save();
    res.redirect(`/join/${req.body.room}?user=${req.body.usrname}`)
})
// async(req,res)=>{
        //if the room exists ..
    // const roomName = req.body.room;
    // const password = req.body.password;

    // const findRoom = await roomModel.findOne({roomName:roomName})
    // if (findRoom != null){
    //     try{
    //         // console.log(`found room`);

    //         if (await bcrypt.compare(password,findRoom.password)){
    //             res.render('room',{roomName :roomName});
    //         }else{
    //             //Incorrect password
    //             res.redirect('/join')               //need to set it to show message..\  #TODO
                
    //         }
    //     }catch (e){
    //         console.log(`Error occured! ${e}`);
    //         res.sendStatus(500).send();
    //     }    //If the room exists allow the connection..
            
    // }else{
    //     //If it does no exist redirect to join..
    //     res.redirect('/join')
    // }
    // console.log(`reirecting to /join/${roomName}`);
    // res.redirect(`/join/${roomName}`);
// })




//Request to create a new room..
app.post('/room',checkNotAuthenticated,async(req,res)=>{
    const roomName = req.body.room;
    const password = req.body.password
    const findRoom = await roomModel.findOne({roomName:roomName});
    //if the room already exists..
    if (findRoom != null){
        //redirect to the homepage..
        res.redirect('/join');
    }else{
    const hashedPassword = await bcrypt.hash(password,10);
        //else Create a new Room model with no users inside..
    await roomModel.create({roomName:roomName,users:[],password:hashedPassword});           //Create the room with the password
        //And redirect the user to the room
        res.redirect("/join");
        //send message that new room was created..
        io.emit('room-created',roomName);
    }



    
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
server.listen(PORT||3000);

//---------------------Socket connection Handling---------------------

//When a user connects..
io.on("connection" ,(socket)=>{
    console.log(`Incomming Message..`)
    console.log(socket.id)
    //Send a message that He/she joined Successfully
    // socket.emit("chat-message","You Joined!");//don't need To Do this..
    
    //Recieve the  name  of the user and the roomName
    socket.on('new-user',async (room,name)=>{
        //Add the user to the room..
        socket.join(room);              //This "connects" the socket object to the  roomName which is a string
        //Get the room from the DB..
        var getRoom = await roomModel.findOne({roomName:room});
        //add the name  to the users obj..
        // console.log(`Your Socket Id is  ${socket.id} And NAme : ${name}`);              //_DEBUG
        //An object to create the actual user..
        if (getRoom != null){
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
        }else{
            console.log(`no room ${room}`);   
        }


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
        console.log(`Disconnected  id : ${socket.id}`)

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


