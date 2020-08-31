const messageForm =     document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const messageContainer = document.getElementById('message-container');


//-------------Start------------

//Get the name 
var name = prompt("Enter Your Name..")
console.log(name)
if (name === "" || name == null) {
    alert("Your name would be Default");
    name = "Default"
}
//Send Your name! to the Server..
socket.emit("new-user",roomName,name);

appendMessageString("<strong>You</strong> Joined the Chat");

//When You send a message..
messageForm.addEventListener('submit',(e)=>{                        //<<<<ALso  here..

    e.preventDefault();
    //get the message.
    const message  = messageInput.value;
    //and send the message and the room Name to the server..
    socket.emit('send-chat-message',roomName,message);              //<<<This is the only place where you pass the roomName..
    //Also append it to your screen..
    appendMessageString("<strong>You</strong>: "+message);
    //clear the input box..
    messageInput.value  = "";
})


//-----------------------------Handling the room socket events..---------------------

//When a new User joins and the name is broadcasted..
socket.on('user-connected',name=>{
    //add the user name to the screen..

    appendMessageString(`<strong>${name}</strong> Joined the Chat`,true)
})


//when you recieve a chat message..
socket.on("chat-message",object=>{

    //display it..
    appendMessageString(`<strong>${object.name}</strong>: ${object.message}`,true);

})



//When a user disconnects...
socket.on('user-disconnected',name=>{
   
    appendMessageString(`<strong>${name}</strong> disconnected! `,true);
})



//----------Util Functions----------


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
    messageElement.innerHTML=message;
    messageContainer.append(messageElement);
    messageElement.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
}