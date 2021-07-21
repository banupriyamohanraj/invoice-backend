require("dotenv").config();
const router = require('express').Router();
const { MongoClient } = require('mongodb');
const{ObjectId}= require('mongodb');
const cors = require('cors')
var easyinvoice = require('easyinvoice');



const dbURL = process.env.DB_URL || 'mongodb://127.0.0.1:27017'

router.use(cors())


router.post('/createinvoice', async (req, res) => {

    try {
        
        let client = await MongoClient.connect(dbURL);
        let db = await client.db('organisation');
        let data = await db.collection("Invoices-generated").insertOne({ invoice:req.body ,date : new Date()});
    if(data){
            res.status('200').json({ message: "invoice saved  !!" })

        } else {
            res.status("401").json({ message: "Not saved" })
        }
        client.close();
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" })
    }


})


router.get('/list', async (req, res) => {
    try {
        let client = await MongoClient.connect(dbURL);
        let db = await client.db('organisation');
        let data = await db.collection("Invoices-generated").find().toArray();
        if (data) {
           
            res.status(200).json(data);
        } else {
            res.status(404).json({ message: "data not found" })
        }
      client.close();
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" })
    }

})

router.post('/list/:id',async(req,res)=>{
    try {
        let client = await MongoClient.connect(dbURL);
        let db = await client.db('organisation');
        let data = await db.collection("Invoices-generated").findOne({ _id : ObjectId(req.body.id) });
        if(data){
            res.status(200).json(data);
        } else {
            res.status(404).json({ message: "data not found" })
        }
        client.close();
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" })
    }
})

router.post('/userinvoice',async(req,res)=>{
    try {
        let client = await MongoClient.connect(dbURL);
        let db = await client.db('organisation');
        let data = await db.collection("Invoices-generated").find({date:{$gte:new Date(req.body.date)}}).toArray();
        if(data){
            res.status(200).json(data);
        } else {
            res.status(404).json({ message: "data not found" })
        }
        client.close();
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" })
    }
})

module.exports = router;