const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();

// middleware
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://work-sphere.vercel.app', 'https://worksphere-8802e.web.ap  p'],
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions));
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xmhoqrm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const jobsCollection = client.db('workSphere').collection('jobs');
        const bidsCollection = client.db('workSphere').collection('bids');

        // jwt generate 
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            // console.log("Dynamic token for this user ---->", user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '365d'
            })
            res.
                cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
                })
                .send({ success: true });

        })

        // Clear token on logout 
        app.get('/logout', (req, res) => {
            res
                .clearCookie('token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                    maxAge: 0

                })
                .send({ success: true });
        })

        // get all jobs data from db 
        app.get('/jobs', async (req, res) => {
            const result = await jobsCollection.find().toArray();
            res.send(result)
        })

        // get a single job data from db using job id
        app.get('/job/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollection.findOne(query);
            res.send(result);
        })

        // save a bid data in db
        app.post('/bid', async (req, res) => {
            const bidData = req.body;
            console.log(bidData);
            const result = await bidsCollection.insertOne(bidData);
            res.send(result)
        })

        // save a job data in db
        app.post('/job', async (req, res) => {
            const jobData = req.body;
            const result = await jobsCollection.insertOne(jobData);
            res.send(result)
        })

        // get all job posted by a specific user 
        app.get('/jobs/:email', async (req, res) => {
            const email = req.params.email;
            const query = { 'buyer.email': email };
            const result = await jobsCollection.find(query).toArray();
            res.send(result);
        })

        //  delete a job data from db
        app.delete('/job/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollection.deleteOne(query);
            res.send(result);
        })

        //update a job data in db
        app.put('/job/:id', async (req, res) => {
            const id = req.params.id;
            const updateData = req.body;
            const query = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    ...updateData
                }
            }
            const result = await jobsCollection.updateOne(query, updateDoc, options);
            res.send(result);

        })

        // get all bids for a user by email from db
        app.get('/my-bids/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const result = await bidsCollection.find(query).toArray();
            res.send(result);

        })

        // get all bid requests from db for job owner
        app.get('/bid-requests/:email', async (req, res) => {
            const email = req.params.email;
            const query = { 'buyer.email': email }
            const result = await bidsCollection.find(query).toArray();
            res.send(result);

        })

        // Update bid status
        app.patch('/bid/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body;
            const query = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: status,
            };
            const result = await bidsCollection.updateOne(query, updateDoc);
            res.send(result);
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
    res.send('WorkSphere Server is running...')
})

app.listen(port, () => {
    console.log(`Server is running on Port: ${port}`);
})