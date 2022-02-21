import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";  
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";


dotenv.config(); 

const app = express();

const PORT = process.env.PORT; 

app.use(cors());

app.use(express.json()); 

const MONGO_URL = process.env.MONGO_URL;

async function createConnection(){
    const client =  new MongoClient(MONGO_URL) 
    await client.connect();  
    console.log("Mongodb Connected");
    return client;
}

const client = await createConnection();


app.get("/",(request,response)=>{
    response.send("hello happy world");
});

app.get("/movies", async (request,response)=>{
  
    console.log(request.query);
	
	const filter = request.query;
	console.log(filter);
	if(filter.rating){
		filter.rating = +filter.rating;
	}

	const filterMovies = await getMovies(filter); 

	   response.send(filterMovies);
});


app.post("/movies", async (request,response)=>{
    const data = request.body;
    const result = await createMovies(data);
    response.send(result);
    });
    

    app.get("/movies/:id", async (request,response)=>{
        console.log(request.params);
        const {id} = request.params;
        const movie = await getMoviesById(id)
        console.log(movie);
    
        movie? response.send(movie) : response.status(404).send({message:"no matching movie found"});
    });
    
    app.delete("/movies/:id", async (request,response)=>{
        console.log(request.params);
        const {id} = request.params;
        const result = await deleteMoviesById(id)
        console.log(result);
    
        result.deletedCount>0? response.send(result) : response.status(404).send({message:"no matching movie found"});
    });
    
    app.put("/movies/:id", async (request,response)=>{
        console.log(request.params);
        const {id} = request.params;
        const data = request.body;
        const result = await editMoviesById(id, data);
        const movie = await getMoviesById(id);
        console.log(result);
        response.send(movie);
    });
    
    async function editMoviesById(id, data) {
        return await client
            .db("b28wd")
            .collection("movies")
            .updateOne({ _id: ObjectId(id) }, { $set: data });
    }
    
    async function deleteMoviesById(id) {
        return await client
            .db("b28wd")
            .collection("movies")
            .deleteOne({ _id: ObjectId(id) });
    }
    
    async function createMovies(data) {
        return await client.db("b28wd").collection("movies").insertOne(data);
    }
    
    async function getMoviesById(id) {
        return await client
            .db("b28wd")
            .collection("movies")
            .findOne({ _id: ObjectId(id) });
    }
    
    async function getMovies(filter) {
        return await client
            .db("b28wd")
            .collection("movies")
            .find(filter)
            .toArray();
    }


    async function createUser(data) {
        return await client.db("b28wd").collection("password").insertOne(data);
    }
    
    async function getUserByName(email) {
        return await client
            .db("b28wd")
            .collection("password")
            .findOne({ email: email });
    }
    
    
    
    async function genPassword(password){
        const NO_OF_ROUNDS = 10;
        const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
        console.log(salt);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(hashedPassword);
        return hashedPassword;
    }
    
    
    app.post("/signup", async (request,response)=>{
        const {email, password} = request.body;
        const userFromDB = await getUserByName(email);
    console.log(userFromDB);
    
    if(userFromDB){
        response.send({message: "email already exists"});
      
        return;
    }
    
    if(password.length < 8){
        response.send({message: "password must be longer"});
       
        return;
    }
        const hashedPassword = await genPassword(password); 
        const result = await createUser({ email, password:hashedPassword });
        response.send(result);   
        });
    
    app.post("/login", async (request,response)=>{
        const {email, password} = request.body;
        const userFromDB = await getUserByName(email);
    
        if(!userFromDB){
            response.send({message: "Invalid Credentials"});
           
            return;
        }
    
        const storedPassword = userFromDB.password;
        console.log(storedPassword);
    
        const isPasswordMatch = await bcrypt.compare(password, storedPassword);
    
        console.log(isPasswordMatch);
        console.log(userFromDB);
    
        if (isPasswordMatch) {
            
            response.send({message: "sucessful login"});
        }else{
            response.send({message: "Invalid Credentials"});
      
        }
    
        
    });

    app.listen(PORT,()=>console.log("app is started in",PORT));