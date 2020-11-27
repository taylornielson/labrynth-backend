const express = require('express');
const app = express();
const pg = require('pg');
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json();
var connectionString = "postgres://jykvaezxzuclpd:1ff5f6ca1e1c7eb8a7a36c56f2ab4074e8f96b7ebddc79882cc2b841e5be38b1@ec2-52-7-39-178.compute-1.amazonaws.com:5432/d7k3kom1q6omfb";


//General Page
app.get('/', function(req, res) {
	res.send('Hello World!');
});
//Create Database
app.get('/createDatabase', function(request, response){
	var pgClient = new pg.Client(connectionString);
	pgClient.connect();
	pgClient.query("CREATE TABLE IF NOT EXISTS Users (userName varchar(255), password varchar(255), games int[], PRIMARY KEY (userName))",(err,res)=>{
		console.log(err,res);
	//	pgClient.end();
	//	else{
	//		response.send({"message":"creation succeeded"});
	//	}
	});
	pgClient.query("CREATE TABLE IF NOT EXISTS Games (id SERIAL PRIMARY KEY, name varchar(255), boardVals TEXT[][], status varchar(50), numPlayers int, turn int, p1UserName varchar(255), p2UserName varchar(255), p3UserName varchar(255), p4UserName varchar(255), p1Cards TEXT[], p2Cards TEXT[], p3Cards TEXT[], p4Cards TEXT[], currentTile TEXT[], turnName varchar(50))", (err, res)=>{
		console.log("logging games table");
		console.log(err,res);
		response.send({"message":err});
		pgClient.end()
	});
});
//Login User

app.post('/user/login', jsonParser, function(request, response){
        var pgClient = new pg.Client(connectionString);
        pgClient.connect();
                pgClient.query("SELECT password FROM users where userName = $1", [request.body.userName], (err, res)=>{
                        console.log(err,res);
			if (!res.rows[0]){
				response.send({"message":"This username is not registered"});
			}
			else if (res.rows[0]["password"] === request.body.password){
				response.send("logging in");
			}
			else{
				response.send({"message":"password is wrong"});
			}
			pgClient.end();
                });
});

//Register
app.post('/user/register', jsonParser, function(request, response){
        var pgClient = new pg.Client(connectionString);
	pgClient.connect();
		pgClient.query("INSERT INTO users (userName, password) VALUES($1, $2)", [request.body.userName, request.body.password], (err, res)=>{
			console.log(err,res);
			if (err){
				response.send(err);
			}else{
				response.send(res);
			}
			pgClient.end();
		});
});


//Load Game
app.post('/loadboard', jsonParser, function(request, response){
	var pgClient = new pg.Client(connectionString);
	pgClient.connect();
	pgClient.query("SELECT * FROM games WHERE id=$1", [request.body.gameID],(err,res)=>{
			console.log(err,res);
			if(err){
				response.send(err);
			}else{
				response.send(res.rows[0]);
			}
		pgClient.end();
	});
});


//Add Game
app.post('/addGame', jsonParser, function(request, response){
	var pgClient = new pg.Client(connectionString);
	pgClient.connect();
	pgClient.query("INSERT INTO games (name, numplayers, turn, p1UserName, turnName,status) VALUES($1,$2,$3,$4,$5,$6)", [request.body.name, request.body.numplayer,request.body.turn, request.body.playerOne, request.body.playerOne, "pending"], (err, res)=>{
		console.log(err, res);
		if(err){
			response.send({"message":err});
		}
		else{
			response.send(res);
		}
		pgClient.end(); // note
	});
});

//Get current games
app.post('/currentGames', jsonParser, function(request, response){
	var pgClient = new pg.Client(connectionString);
	pgClient.connect();
	pgClient.query("SELECT id, name, turnName, status FROM Games WHERE p1UserName = $1 OR p2UserName=$1 OR p3UserName=$1 OR p4UserName =$1", [request.body.userName], (err, res)=>{
		console.log(err, res);
		if(err){
			response.send({"message":err});
		}else{
			response.send(res);
		}
		pgClient.end();
	});
});

//Upload Game
app.post('/upload', jsonParser, function(request, response){
	var pgClient = new pg.Client(connectionString);
	pgClient.connect();
	pgClient.query("UPDATE games SET p1Cards = $1, p2Cards = $2, p3Cards = $3, p4Cards = $4, currentTile = $5, boardVals = $6 WHERE id = $7", [request.body.p1Cards, request.body.p2Cards, request.body.p3Cards, request.body.p4Cards, request.body.currentTile, request.body.boardVals, request.body.id], (err, res)=>{
		console.log(request.body.p2Cards);
		//console.log(err, res);
		if(err){
			response.send({"message":err});
		}else{
			response.send(res);
		}
		pgClient.end();
	});
});


//Join Game
app.post('/join', jsonParser, function(request, response){
	var pgClient = new pg.Client(connectionString);
	pgClient.connect();
	pgClient.query("SELECT * FROM Games WHERE id = $1",[request.body.id],(err, res)=>{
		console.log(err, res);
		if(err){
			response.send({"message":err});
		}else if (res.rows[0].p1username === request.body.userName || res.rows[0].p2username === request.body.userName || res.rows[0].p3username === request.body.userName || res.rows[0].p4username === request.body.userName){
			response.send("Youre already in that game");
		}else{
			var numPlayers = res.rows[0].numplayers;
			if (numPlayers === 2){
				if(res.rows[0].p2username === null){
					pgClient.query("UPDATE games SET p2username = $1, status = 'playing' WHERE id = $2", [request.body.userName, request.body.id],(err,res)=>{
						if(err){
							response.send(err);
						}else{
							response.send("updated");
						}
						});
				}else{
					response.send({"message":"Game is full"});
				}
				
				
			}
			else if (numPlayers === 3){
				if (res.rows[0].p2username === null){
					console.log("about to enter update");
					pgClient.query("UPDATE Games SET p2username = $1 WHERE id = $2", [request.body.userName, request.body.id],(err,res)=>{
                                        if(err){
                                                response.send(err);
                                        }else{
						console.log("Successfull update");
                                                response.send("updated");
                                        }
						pgClient.end();
                                });				
				}
				else if (res.rows[0].p3username === null){
					pgClient.query("UPDATE games SET p3username = $1, status = 'playing' WHERE id = $2", [request.body.userName, request.body.id],(err,res)=>{
                                        if(err){
                                                response.send(err);
                                        }else{
                                                response.send("updated");
                                        }
						pgClient.end();
                                });

				}
				else{
					response.send({"message":"Game is full"});
				}
			}
			else if (numPlayers === 4){
				if (res.rows[0].p2username === null){
                                        console.log("about to enter update");
                                        pgClient.query("UPDATE Games SET p2username = $1 WHERE id = $2", [request.body.userName, request.body.id],(err,res)=>{
                                        if(err){
                                                response.send(err);
                                        }else{
                                                console.log("Successfull update");
                                                response.send("updated");
                                        }
                                                pgClient.end();
                                });
                                }
                                else if (res.rows[0].p3username === null){
                                        pgClient.query("UPDATE games SET p3username = $1 WHERE id = $2", [request.body.userName, request.body.id],(err,res)=>{
                                        if(err){
                                                response.send(err);
                                        }else{
                                                response.send("updated");
                                        }
                                                pgClient.end();
                                });

                                }
				else if (res.rows[0].p4username === null){
                                        pgClient.query("UPDATE games SET p4username = $1, status = 'playing' WHERE id = $2", [request.body.userName, request.body.id],(err,res)=>{
                                        if(err){
                                                response.send(err);
                                        }else{
                                                response.send("updated");
                                        }
                                                pgClient.end();
                                });

                                }
                                else{
                                        response.send({"message":"Game is full"});
                                }
			}


		}
		//pgClient.end();
	});
	
});


app.listen( process.env.PORT || 3000,() => console.log('Labrynth app listening on port 3000!'));
