var express = require("express");
var app = express();
var request = require('request');
var pg = require("pg");
var dbgeo = require("dbgeo");

app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", function(req, res){
    res.render("home");
});

// query from AWS RDS directly
app.get("/results", function(req, res){

    var queryplace = req.query.place;
    console.log(queryplace);
    var querypoint = 'Point(' + req.query.lonSearch + ' ' + req.query.latSearch + ')';
    const promise = require('bluebird'); // or any other Promise/A+ compatible library;
    const initOptions = {
        promiseLib: promise // overriding the default (ES6 Promise);
    };
    const pgp = require('pg-promise')(initOptions);
    const connection = "postgres://username:password@db2.c8qdkldhfwra.us-east-1.rds.amazonaws.com:5432/db_argo";
    const db = pgp(connection);
    console.log("Start Query");
    if (queryplace == "nyc") {
        var querytext = "SELECT * FROM db_nyc WHERE ST_Contains (db_nyc.the_geom, ST_GeomFromText('" + querypoint + "', 4326))=TRUE;";
    } else {
        var querytext = "SELECT * FROM db_argo WHERE ST_Contains (db_argo.the_geom, ST_GeomFromText('" + querypoint + "', 4326))=TRUE;";
    };

    console.log(querytext);
    db.any(querytext, [true])
        .then(data => {
            console.log('DATA:', data); // print data;
            var long = req.query.lonSearch;
            var lati = req.query.latSearch;

            if (queryplace == "nyc") {
                res.render("geocrosswalkNYC", {longVar: long, latiVar: lati, data: data});
            } else {
                res.render("geocrosswalkLA", {longVar: long, latiVar: lati, data: data});
            }

        })
        .catch(error => {
            console.log('ERROR:', error); // print the error;
        })
        .finally(db.$pool.end); // For immediate app exit, shutting down the connection pool
    });

// get api page
app.get("/api", function(req, res) {
    res.render("apidoc");
});

//return a message when url is wrong
//should put in the end, as order sensitive in routing
app.get("*", function(req, res) {
    res.send("can not find")
})

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("server started!");
});
