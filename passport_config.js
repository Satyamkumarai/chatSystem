const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
function initialize(passport,getRoomByName,getRoomById){

    //THis is the function that authenticates the user then calls done function....
    const authenticateRoom  = async (room,password,done)=>{
        //Get the user.
        var roomObj  = await getRoomByName(room);
        //if thr roo doesn't exists..
        if (roomObj == null){
            //no Error , The room is not authenticated , Reason
            return done(null,false,{messages:"Room Does not Exist!"})                   ///maybe change the message..?
        }else{
            try{

                if (await bcrypt.compare(password,roomObj.password)){
                    //noError,authenticated,noMessage..
                    return done(null,roomObj);
                }else{

                    return done(null,false,{messages:"Incorrect Password!"})                    //here too..
                }
            }catch (err) {
                return done(err,false);
            }
        }

    }
    //setting a Localstrategy passing in config Objand verify-function
    passport.use(new LocalStrategy({usernameField : 'room',passwordField:'password'},authenticateRoom));
    // serializeUser determines which data of the room object should be stored in the session cookie
    passport.serializeUser((room,done)=>{done(null,room._id)});
    //deserializeUser determines the room Obj using the id from the session cookie
    passport.deserializeUser(async(id,done)=>{
        done(null,await getRoomById(id));
    });
}



module.exports=initialize;