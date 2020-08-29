const mongoose = require('mongoose');

//The user schema.. 
//Each user has a name and an active socket Id..

const userSchema = new  mongoose.Schema({
    socketId : String,
    name : String,
    // rooms:
})


//The rooom Schema...
//Each room has a name and a list of ref to users who are in that room..
const roomSchema = new mongoose.Schema({
    roomName:String,
    users:[{type:Schema.ObjectId, ref:"User"}]                  //users just contains a list of object Id Of Model name "User"
})

var User = mongooose.model('User',userSchema);
var Room = mongoose.model('Room',roomSchema);
// module.exports =  mongoose.model('room',roomSchema);
module.exports = {User:User,Room:Room};