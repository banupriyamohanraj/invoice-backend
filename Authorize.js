const jwt = require('jsonwebtoken')
const {MongoClient,ObjectId} = require('mongodb')

const dbURL = process.env.DB_URL || 'mongodb://127.0.0.1:27017'

async function authenticate(req,res,next)
{
        if(req.headers.authorization){
            jwt.verify(req.headers.authorization,process.env.JWT_KEY, async (err,decoded)=>{
                if(decoded != undefined){
                    if(decoded.user_id == (await getById(decoded.user_id)))
                    {
                        console.log(decoded)
                    next()
                    }else{
                        res.status(401).json({message : 'unauthorized'})
                    }
                }else{
                    res.status(403).json({message : " Forbidden"})
                }
            })
           
           
        }else{
            res.status(401).json({message:"no token"})
        }

}


async function getById(id){
    try {
        let client = await MongoClient.connect(dbURL);
        let db = await client.db('organisation');
        let data = await db.collection("users").findOne({ _id : ObjectId(id) })
        let user_id = data._id;
        console.log(user_id)
        return user_id;
        
    } catch (error) {
        console.log(error) 
    }
}


module.exports = authenticate;