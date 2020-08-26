//Connect to the server..
//location of the server
//io is defined in the client side js code for socketio..
const socket = io('http://localhost:3000');

const messageForm =     document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const messageContainer = document.getElementById('message-container');
const roomContainer = document.getElementById('room-container')

/**
 * *
 * * var roomName Is available here from `room.ejs`
 *  */


//If the Current html file is room.ejs   (This script is shared by both index and room .ejs)
if(messageForm != null){

    //Get the name 
    var name = prompt("Enter Your Name..")
    console.log(name)
    if (name === null) {
        alert("Your name would be Default");
        name = "Default"
    }
    //Send Your name! to the Server..
    socket.emit("new-user",roomName,name);
    
    appendMessageString("You Joined the Chat");

    //When You send a message..
    messageForm.addEventListener('submit',(e)=>{                        //<<<<ALso  here..
    
        e.preventDefault();
        //get the message.
        const message  = messageInput.value;
        //and send the message and the room Name to the server..
        socket.emit('send-chat-message',roomName,message);              //<<<This is the only place where you pass the roomName..
        //Also append it to your screen..
        appendMessageString("You: "+message);
        //clear the input box..
        messageInput.value  = "";
    })
}    


//When a new Room is Created. (The Server Sends a message saying  a new room has been Created)
socket.on('room-created',room=>{
    //<div> roomName</div>
    const roomElement = document.createElement('div');
    roomElement.innerText = room;
    //<a href="/roomName">Join</a>
    const roomLink = document.createElement('a');
    roomLink.href=`/${room}`;
    roomLink.innerText = "Join";
    console.log("Yup New Room Was Created.")
    roomContainer.append(roomElement);
    roomContainer.append(roomLink)

})


///------------All THESE Messages Are Only For room.ejs---------------

//When a new User joins and the name is broadcasted..
socket.on('user-connected',name=>{
    //add the user name to the screen..
    
    appendMessageString(`${name} Joined the Chat`,true)
})


//when you recieve a chat message..
socket.on("chat-message",object=>{
    //display it..
    appendMessage(object,true);

})
// socket.on('recieve-chat-message',message=>{
    // console.log(message);
// })



//When a user disconnects...
socket.on('user-disconnected',name=>{
    appendMessageString(`${name} disconnected! `,true);
})

//Function to add new divs..
function appendMessage(object,other=false){

    const messageElement = document.createElement('div');
    if (other)
        messageElement.classList.add('other')
    messageElement.innerText=`${object.name} : ${object.message}`
    messageContainer.append(messageElement);
}

function appendMessageString(message,other=false){
    const messageElement = document.createElement('div');
    if (other)
        messageElement.classList.add('other')
    messageElement.innerText=message;
    messageContainer.append(messageElement);
}
///---------------------------------------------------------