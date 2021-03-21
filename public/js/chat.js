const socket = io();

//Elements
const $chatForm = document.querySelector('#chat-form');
const $mesgInput = document.querySelector('#mesg');
const $formButton = $chatForm.querySelector('button');
const $locationButton = document.querySelector('#location-btn'); 
const $messageTemplate = document.querySelector('#message-template').innerHTML;
const $message = document.querySelector('#message');
const $locationTemplate = document.querySelector('#location-template').innerHTML;
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Geting the query string i.e username and room
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
const room = urlParams.get('room');


socket.emit('join',{username,room},(error)=>{
    alert(error);
    location.href = '/';
});

$chatForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    $formButton.setAttribute('disabled','disabled');
    socket.emit('sendMesg',$mesgInput.value,(err,res)=>{
        if(err){
            alert(err);
        }
        $mesgInput.value = '';
        $mesgInput.focus();
        $formButton.removeAttribute('disabled');
    });
});

$locationButton.addEventListener('click',(e)=>{
    
    if (!navigator.geolocation) {
        return alert('Your browser doesnot support this feature');
    }
    $locationButton.setAttribute('disabled','disabled');
    navigator.geolocation.getCurrentPosition((position)=>{
        const {latitude,longitude} = position.coords;
        socket.emit('sendLocation',{latitude,longitude},(err,res)=>{
            if(err){
                return console.log(err);
            }
            $locationButton.removeAttribute('disabled');
            console.log(res);
        });
    });
});


socket.on('receiveMesg',(mesg)=>{
    console.log(mesg);
    const html = Mustache.render($messageTemplate,{username:mesg.username,mesg:mesg.text,createdAt:moment(mesg.createdAt).format('h:m a')});
    $message.insertAdjacentHTML("beforebegin",html);

});

socket.on('locationMessage',(locationMessage)=>{
    console.log(locationMessage);
    const html = Mustache.render($locationTemplate,{username:locationMessage.username,url:locationMessage.url,createdAt:moment(locationMessage.createdAt).format('h:m a')});
    $message.insertAdjacentHTML("beforebegin",html);
})

socket.on('roomData',({room,users})=>{
    const html = Mustache.render($sidebarTemplate,{room,users});
    document.querySelector('#sidebar').innerHTML=html;
})



