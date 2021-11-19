const sqlite3 = require("sqlite3").verbose();
const sqlite = require("sqlite");
const express = require("express");
const axios = require('axios');
const app = express();
app.use(express.json());

app.get("/appointments",async function(req,res){
    console.log("GET COLLECTION REQUEST RECEIVED");
    
    //get data to be sent back, return json
    const data = await db.all('SELECT * FROM appointment');

    console.log(JSON.stringify(data));

    res.json(data);
})
app.post("/appointment", async function(req, res){
    console.log(JSON.stringify(req.body));
    var stmt = await db.prepare('INSERT INTO appointment(user_id,restaurant_id,hour, minute,is_confirmed,username, token) VALUES(?,?,?,?,?,?,?)');
    await stmt.run(req.body.user_id, req.body.restaurant_id, req.body.hour, req.body.minute, false,req.body.username, req.body.token);
    stmt.finalize();
    res.json(stmt);
})

app.delete("/appointment/:id", async function(req,res){
    const data = await db.run(`DELETE FROM appointment WHERE id = ${req.params.id}`);
    res.json(data)
})
app.get("/reviews",async function(req,res){
    console.log("GET COLLECTION REQUEST RECEIVED");
    
    //get data to be sent back, return json
    const data = await db.all('SELECT * FROM review');

    console.log(JSON.stringify(data));

    res.json(data);
})
app.get("/reviewsbyid/:id", async function(req,res){
    console.log("GET Review COLLECTION REQUEST RECEIVED");
    
    //get data to be sent back, return json
    const data = await db.all('SELECT * FROM review WHERE restaurant_id = ' + req.params.id);

    console.log(JSON.stringify(data));

    res.json(data);
});
app.get("/myreviews/:id", async function(req,res){
    console.log("GET Review COLLECTION REQUEST RECEIVED");
    
    //get data to be sent back, return json
    const data = await db.all('SELECT * FROM review WHERE user_id = ' + req.params.id);

    console.log(JSON.stringify(data));

    res.json(data);
});
app.post("/review", async function(req, res){
    console.log(JSON.stringify(req.body));
    var stmt = await db.prepare('INSERT INTO review(user_id,restaurant_id,title, rating,description, img_url, restaurant_name) VALUES(?,?,?,?,?,?,?)');
    await stmt.run(req.body.user_id, req.body.restaurant_id, req.body.title, req.body.rating, req.body.description, req.body.img_url, req.body.restaurant_name);
    stmt.finalize();

    var data = await db.all('SELECT rating FROM review WHERE restaurant_id = ' + req.body.restaurant_id);
    var totalRating = 0;
    data.forEach(review => {
        totalRating = totalRating + review.rating;
    });
    var ratingAverage = totalRating / data.length;
    var update = await db.prepare(`UPDATE restaurant SET rating = ${ratingAverage} WHERE  restaurant_id = ${req.body.restaurant_id} `);
    await update.run();
    update.finalize();
    res.json(stmt);
})
app.put("/checkout/:id", async function(req, res){
    console.log("Start Check out");
    var stmt = await db.prepare(`UPDATE restaurant SET current_seat = current_seat - 1 WHERE restaurant_id = ${req.params.id} `);
    await stmt.run();
    stmt.finalize();
    console.log("Check out");
    res.json(stmt);
})
app.put("/checkin/:id", async function(req, res){
    
    var stmt = await db.prepare(`UPDATE restaurant SET current_seat = current_seat + 1 WHERE restaurant_id = ${req.params.id} `);
    await stmt.run();
    stmt.finalize();
    console.log("Check in");
    res.json(stmt);
})
app.get("/restaurants",async function(req,res){
    console.log("GET COLLECTION REQUEST RECEIVED");
    
    //get data to be sent back, return json
    const data = await db.all('SELECT * FROM restaurant');

    console.log(JSON.stringify(data));

    res.json(data);
})
app.get("/appointments/:id",async function(req,res){
    console.log("GET APPOINTMENT BY ID COLLECTION REQUEST RECEIVED");
    
    //get data to be sent back, return json
    const data = await db.all('SELECT * FROM appointment WHERE restaurant_id = ' + req.params.id);

    console.log(JSON.stringify(data));

    res.json(data);
})

app.get("/restaurant/:id", async function(req,res){
    const data = await db.get(`SELECT * FROM restaurant WHERE restaurant_id = ${req.params.id}`);
    console.log(JSON.stringify(data));
    res.json(data);
})

app.get("/restaurantbyuser/:owner_id", async function(req,res){
    const data = await db.get(`SELECT * FROM restaurant WHERE owner_id = ${req.params.owner_id}`);
    console.log(JSON.stringify(data));
    res.json(data);
})
app.put("/availableSeat/:id", async function(req,res){
    if(req.body.max >= req.body.current ){
        var stmt = await db.prepare(`UPDATE restaurant SET current_seat = current_seat + 1 WHERE restaurant_id = ${req.params.id} `);
        await stmt.run();
        stmt.finalize();
        res.json(stmt);
    }else{
        res.json({
            body:"Failed to update"

        });
    }       
})
app.post("/restaurant", async function(req, res){
    var apiKey = process.env.API_GEOCODING
    var params ={
        url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + req.body.address + "&key= " + apiKey,
        method:'get'
    }
    var maps = await axios(params);
    var long = maps.data.results[0].geometry.location.lng;
    var lat = maps.data.results[0].geometry.location.lat;

    var stmt = await db.prepare('INSERT INTO restaurant(name,rating,current_seat,max_seat,img_url,owner_id,address, contact_number, long, lat ) VALUES(?,?,?,?, ?, ?,?,?, ?,?)');
    await stmt.run(req.body.name, req.body.rating, req.body.current_seat, req.body.max_seat,req.body.img_url, req.body.owner_id, req.body.address, req.body.contact_number,long,lat );
    stmt.finalize();



    res.json(stmt);
})

app.post("/user", async function(req, res){
    var stmt = await db.prepare('INSERT INTO user (first_name, last_name,address ,is_owner , email) VALUES (?,?,?,?,?)');
    await stmt.run(req.body.first_name, req.body.last_name, req.body.address, req.body.is_owner,req.body.email);
    stmt.finalize();
    res.json(JSON.stringify(stmt));
})
app.get("/user/:email", async function(req,res){
    const data = await db.get(`SELECT * FROM user WHERE email = '${req.params.email}'`);
    console.log(JSON.stringify(data));
    res.json(data);
})

app.put("/user/:email", async function(req,res){

        var stmt = await db.prepare(`UPDATE user SET restaurant_id = ${req.body.restaurant_id} WHERE email = ${req.params.email} `);
        await stmt.run();
        stmt.finalize();
        res.json(stmt);  
})
app.get("/users",async function(req,res){
    console.log("GET COLLECTION REQUEST RECEIVED");
    
    //get data to be sent back, return json
    const data = await db.all('SELECT * FROM user');

    console.log(JSON.stringify(data));

    res.json(data);
})
async function startup(){
      
    db = await sqlite.open({
        filename: "myReview.db",
        driver: sqlite3.Database
    });

    //create database 
    //await db.run("DROP TABLE IF EXISTS restaurant");
    //await db.run("DROP TABLE IF EXISTS appointment");
    //await db.run("DROP TABLE IF EXISTS review");
    
    await db.run("CREATE TABLE IF NOT EXISTS user (user_id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT,first_name TEXT, last_name TEXT,is_owner INTEGER, address TEXT,restaurant_id INTEGER)");
    await db.run("CREATE TABLE IF NOT EXISTS restaurant (restaurant_id INTEGER PRIMARY KEY AUTOINCREMENT,owner_id INTEGER, name TEXT,img_url TEXT, max_seat INTEGER,current_seat INTEGER, rating REAL,address TEXT, contact_number TEXT, long REAL, lat REAL)");
    await db.run("CREATE TABLE IF NOT EXISTS appointment (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, restaurant_id INTEGER, is_confirmed BLOB, hour INTEGER, minute INTEGER, username TEXT, token TEXT)");
    await db.run("CREATE TABLE IF NOT EXISTS review(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, restaurant_id INTEGER, title TEXT, rating REAL, description TEXT, img_url TEXT, restaurant_name TEXT)");
    // await db.run("INSERT INTO restaurant(owner_id,name,img_url,max_seat, current_seat,address ) VALUES(1,'McDonalds','https://picsum.photos/200/300',10, 5, 'L8S2X5' )");
    // await db.run("INSERT INTO restaurant(owner_id,name,img_url,max_seat, current_seat,address ) VALUES(1,'Pho Excellent','https://picsum.photos/200/300', 15,15, 'L8S2X5' )");
    // await db.run("INSERT INTO restaurant(owner_id,name,img_url,max_seat, current_seat,address ) VALUES(1,'The Bean Bar','https://picsum.photos/200/300', 20,10, 'L8S2X5' )");
    // await db.run("INSERT INTO restaurant(owner_id,name,img_url,max_seat, current_seat,address ) VALUES(1,'Starwood Seafood & Grill','https://picsum.photos/200/300',10, 10, 'L8S2X5' )");
    // await db.run("INSERT INTO restaurant(owner_id,name,img_url,max_seat, current_seat,address ) VALUES(1,'Lancaster Eatery','https://picsum.photos/200/300', 5,2, 'L8S2X5' )");

    
    //collectionName = "movies";


    const server = app.listen(3000, function(){
        console.log("server is listening");
    });
}

startup();