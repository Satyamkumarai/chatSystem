//Socket Var is available in the main.js

const roomContainer = document.getElementById('room-container');


//When a new Room is Created. (The Server Sends a message saying  a new room has been Created)
socket.on('room-created',room=>{
    //<div> roomName</div>
    const roomElement = document.createElement('div');
    roomElement.innerText = room;
    //<a href="/roomName">Join</a>
    const roomLink = document.createElement('a');
    roomLink.href=`/${room}`;
    roomLink.innerText = "Join";
    // console.log("Yup New Room Was Created.")
    roomContainer.append(roomElement);
    roomContainer.append(roomLink)

})