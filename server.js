const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

//Connect to mongodb
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
        console.log(err);
    }

    console.log('MongoDB connected!');
    //Connect to socket
    client.on('connection', function(socket){
        let chat = db.collection('chats');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get chats from collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }
            // Emit messages
            socket.emit('output', res);
        })

        // Handle input
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            // Check for validity
            if(name == '' || message == ''){
                sendStatus('Please enter a name and message');
            }
            else{
                chat.insert({name: name, message: message}, function(){
                    client.emit('output', [data]);
                    // Send status object

                    sendStatus({
                        message: 'message sent',
                        clear: true
                    })
                })
            }
        })

        // Handle Clear
        socket.on('clear', function(data){
            chat.remove({}, function(){
                socket.emit('cleared');
            })
        })
    });
});