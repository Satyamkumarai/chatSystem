const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//The user schema.. 
//Each user has a name and an active socket Id..

const userSchema = new  Schema({
    _id  : {type:String,required: true},                                                      //user Is Identifed by his  socketId
    name : String,
    roomId:{type:Schema.Types.ObjectId, ref: "Room"},                          //User has a reference to the room it is in..
})


//The rooom Schema...
//Each room has a name and a list of ref to users who are in that room..
const roomSchema = new Schema({
    roomName:String,
    users:[{type:String, ref:"User"}],                  //users just contains a list of object Id Of Model name "User"
    password:String
})

var User = mongoose.model('User',userSchema);
var Room = mongoose.model('Room',roomSchema);
// module.exports =  mongoose.model('room',roomSchema);
module.exports = {User:User,Room:Room};