require ("dotenv").config();
const router = require('express').Router();
const { MongoClient, ObjectId } = require('mongodb')
const cors = require('cors')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
var jwt = require('jsonwebtoken')
const crypto = require('crypto');



const dbURL = process.env.DB_URL || 'mongodb://127.0.0.1:27017'

var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "nodemailera91@gmail.com",
        pass: process.env.NODEMAILER_PASS
    }
});

router.put("/passwordreset", async (req, res) => {
    try {
        let client = await MongoClient.connect(dbURL);
        let db = await client.db('organisation');
        let data = await db.collection("users").findOne({ email: req.body.email })
        if (data) {
           let id = data._id;
           console.log(id)
            console.log(data)
         
            crypto.randomBytes(32,(err,buffer)=>{
                if(err){
                    console.log(err)
                }else{
                    const token = buffer.toString("hex")
                    console.log(token)
                    req.body.resetToken = token
                 db.collection('users').findOneAndUpdate({ _id:ObjectId(id)},{$set:{token :token}}) 
            //  db.collection('logininfo').update({ _id:ObjectID(id),resetToken : req.body.resetToken}) 
            var mailOptions = {
                from: "nodemailera91@gmail.com",
                to:  req.body.email,
                subject: "Password Reset Link",
                html: `<h4>To reset your password please click on this <a href="https://invoice-fe.netlify.app/resetpassword/${token}">link</a></h4>`
            }
           
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error)
                } else {
                    console.log("email sent " + info.response)
                }
               
            })
            res.status(200).json({message : "Email sent to user successfully"})
                }
            })
           
        } else {
            res.status(404).json({ message: "User not registered" })
        }
        // client.close();
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" })
    }
})

router.post("/login", async (req, res) => {
    try {
        let client = await MongoClient.connect(dbURL);
        let db = client.db('organisation');
        let data = await db.collection("users").findOne({ email: req.body.email})
        if (data.status == 'Activated') {
            let isValid = await bcrypt.compare(req.body.password, data.password)
            console.log(data)
            if (isValid) {
                let token = await jwt.sign({user_id:data._id},process.env.JWT_KEY)
                res.status(200).json({ message: "Login Sucessfull" ,token,data})
            }
            else {
                res.status(401).json({ message: "Invalid Credentials" })
            }
        }else if(data.status == 'pending') {
            res.status(401).json({message:"This account is not activated yet !! Please check your mail"})
        }
        else {
            res.status(404).json({ message: "User not registered" })
        }
        client.close();
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" })
    }
})

router.post("/register", async (req, res) => {
    try {
        let client = await MongoClient.connect(dbURL);
        let db = await client.db('organisation');
        let data = await db.collection("users").findOne({ email: req.body.email, password: req.body.password })
        if (!data) {
            let salt = await bcrypt.genSalt(10)
            let hash = await bcrypt.hash(req.body.password, salt)
            req.body.password = hash
            console.log(req.body)
            crypto.randomBytes(32,(err,buffer)=>{
                if(err){
                    console.log(err)
                }else{
                    const confirmationcode = buffer.toString("hex")
                    console.log(confirmationcode)
                    req.body.code = confirmationcode
                  
                  db.collection('users').insertOne(req.body)
            
           
            var mailOptions = {
                from: "nodemailera91@gmail.com",
                to:  req.body.email,
                subject: "Email Confirmation",
                html: `<h2>Hello</h2>
                <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
                <a href="https://invoice-fe.netlify.app/confirm/${confirmationcode}"> Click here</a>`
            }
           
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error)
                } else {
                    console.log("email sent " + info.response)
                }
                 
            })
            res.status(200).json({ message: "user successfully registered" })
                }
            })
           
        } else{
            res.send('user already exists')
        }

        client.close();  
        }
    
     catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" })

    }

})

router.post('/newpassword',async (req,res)=>{
    try {
        const newpassword = req.body.password;
        const sentToken = req.body.token;
    
        let client = await MongoClient.connect(dbURL);
            let db = await client.db('organisation');
            let user_token = await db.collection("users").findOne({ token : sentToken })
            if(!user_token){
                res.status(401).json({message : "Invalid Token"})
            }else{
                let salt = await bcrypt.genSalt(10)
                let hash = await bcrypt.hash(req.body.password,salt)
                req.body.password = hash
                await db.collection('users').update({token:sentToken},{$set:{password:req.body.password, token : undefined}})
                res.status(200).json({ message: "Password Updated Successfully" })
            }
            client.close();
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"Internal Server error"})
    }
   
})

router.put('/confirm',async(req,res)=>{
    try {
        const confirmationcode = req.body.confirmationcode
        const status = req.body.status

        let client = await MongoClient.connect(dbURL);
        let db = await client.db('organisation');
    let activation =  await db.collection("users").findOneAndUpdate({code : confirmationcode},{$set :{status : status,code:undefined} })
    if(activation){
        res.status(200).json({message:"Email activated"})
    }else{
        res.status(401).json({message : "Invalid activation code"})
    }
    client.close();
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"Internal server error"})
    }
})

module.exports = router;