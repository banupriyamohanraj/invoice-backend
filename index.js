const express = require('express')
const {MongoClient,ObjectID} = require('mongodb')
const cors = require('cors')
const userAuth = require('./userAuth')
require ("dotenv").config();
const app = express();
const port = process.env.PORT || 9000
const dbURL = process.env.DB_URL || 'mongodb://127.0.0.1:27017'
const authorize = require('./Authorize')
const invoicerouter = require('./invoice')


app.use(express.json());
app.use(cors())
app.use("/auth",userAuth)
app.use('/invoice',invoicerouter)

app.get("/", authorize,async (req, res) => {
    try {
        let client = await MongoClient.connect(dbURL);
        let db = await client.db('organisation');
        let data = await db.collection("users").find().toArray();
        if (data) {
            console.log(data)
            res.status(200).json(data)
        } else {
            res.status(404).json({ message: "no data found" })
        }
        client.close();
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" })
    }
})

app.listen(port, () => console.log(`app runs with ${port}`))