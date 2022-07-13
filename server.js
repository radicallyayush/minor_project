// Michael Grewal
//https://betterloot.herokuapp.com/

//==================================================//
/*                                                  */
/*          'BETTER LOOT' SERVER JS FILE            */
/*                                                  */
//==================================================//


/* USER Objects
---------------*/
    //username, password, firstName, lastName, email, cash, stocks[], watchlists[[]], history[], userID
let users = require("./init_users.json");
let uniqueID = 0;

/* SUBSCRIPTION Objects
-----------------------*/
    //key:userID 
        // value: [{stock:symbol, minPercentChange:num, activated:bool, notifiedToday:bool, userID:num}], setInterval to check each sub/percent
let subscriptions = {};

/* NOTIFICATION Objects
-----------------------*/
    //key:userID
        //value: [{day:day, symbol:symbol}]
let notifications = {};
    
/*ORDER Objects
---------------*/
    //orderID, type, userID, stock, quantity, limit, expire, numOutstanding, filled, price
let orders = [];
let orderID = 0;
    //Completed orders get archived in 'filled orders'
let filledOrders = [];

// Day Counter
let day = 0;

// Server's current mode (true is 'live' and false is 'paused')
let playOrPause = false;
let realTime1;
let realTime2;

// Requires
const pug = require("pug");
const express = require("express");
const app = express();
const session = require("express-session");
let masterStocksList = require("./stocks.json");

// PUG template engines
const renderStocksListPage = pug.compileFile("public/views/stocks.pug");
const renderStockPage = pug.compileFile("public/views/stock.pug");
const renderUserPage = pug.compileFile("public/views/user_portfolio.pug");
const renderOrdersPage = pug.compileFile("public/views/orders.pug");
const renderAdminPage = pug.compileFile("public/views/admin.pug");
const renderHistoryPage = pug.compileFile("public/views/history.pug");
const renderNewsPage = pug.compileFile("public/views/news.pug");



/*              APP ROUTES              */
/*======================================*/
app.use(logger);
app.use(express.json());
app.use(session({secret: "shush it is a secret"}));
app.use(express.urlencoded({extended: true}));
app.use("/", sessionLogger);
app.use(express.static("public/css"), express.static("public/images"), express.static("public/js"), express.static("public/views"));



app.get("/users/:username", loggedInCheck, auth, showUserPage);
app.get("/stocks", queryParser, loadStocksFromQuery, showStocksListPage);
app.get("/stocks/:symbol", queryParser, loadStocksFromQuery, showStockPage);
app.get("/stocks/:symbol/history", queryParser, loadHistoricalTradeDataFromQuery, sendHistoricalTradeData);
app.get("/masterStocksList", sendMasterStocksList);
app.get("/day", sendDay);
app.get("/requestingUser", loggedInCheck, sendRequestingUser);
app.get("/:uid/orders", loggedInCheck, auth, sendOrders);
app.get("/playOrPause", loggedInCheck, sendPlayOrPause);
app.get("/orders", loggedInCheck, showOrdersPage);
app.get("/admin", loggedInCheck, showAdminPage);
app.get("/:uid/subscriptions", loggedInCheck, auth, sendSubscriptions);
app.get("/:uid/notifications", loggedInCheck, auth, sendNotifications);
app.get("/:uid/anyNotifications", loggedInCheck, auth, pingNotifications);
app.get("/:uid/history", loggedInCheck, auth, queryParser, loadHistoryFromQuery, showHistoryPage);
app.get("/news", showNewsPage);
app.get("/logout", loggedInCheck, logout);



app.post("/:uid/buyorder", loggedInCheck, auth, createBuyOrder);
app.post("/:uid/sellorder",loggedInCheck, auth, createSellOrder); 
app.post("/users", createUser);
app.post("/login", login);
app.post("/:uid/subscriptions", loggedInCheck, auth, createSubscription);


app.put("/users/:uid", loggedInCheck, auth, saveUser);
app.put("/eod", loggedInCheck, goToNextDay);
app.put("/playOrPause", loggedInCheck, updatePlayOrPause);
app.put("/:uid/subscriptions",loggedInCheck, auth, updateSubscriptions);


app.delete("/orders/:uid/:oid", loggedInCheck, auth, deleteOrder);
app.delete("/subscriptions/:uid/:symbol", loggedInCheck, auth, deleteSubscription);


//Server listens on port 3000
// app.listen(3000, "10.0.0.22");                       //LAN testing
// console.log("Server running on LAN.");
app.listen(process.env.PORT || 3000);
console.log('Server running at http://127.0.0.1:3000/');
console.log(" -- Server running with 20 A.I. background users.")




/*          ADMIN CONTROLS             */
/*=====================================*/
//AUTO MODE:
eod();
// setInterval(realtimeEvents, 500);
// setInterval(eod, 10000);

//PREPOPULATE MODE:
// startup();




/*              FUNCTIONS               */
/*======================================*/

function logger(req,res,next) {
    /* This function logs all incoming requests. */
    console.log(req.method + " " + req.url);
    next();
}

function sessionLogger(req,res,next){
    /* This function logs all sessions. */
    if(req.session.username){
        console.log("Request from user: "+req.session.username);
    }
    next();
}


function login(req,res,next) {
    /* This function handles the logging in and assigns the user to a session. */
    console.log(req.body);
    if(req.session.loggedIn==true){
        res.status(400).send("Error 'Sloth' ; You are already logged in.");
    }
    else if(req.body.hasOwnProperty("username") && req.body.hasOwnProperty("password")){
        let found = users.find(elem => elem.username===req.body.username && elem.password===req.body.password);
        if(found){
            req.session.loggedIn = true;
            req.session.username = found.username;
            req.session.userID = found.userID;
            res.status(200).send("LOGGED IN: Hello, "+found.username);
            return;
        }
        res.status(400).send("Error 'Skunk' : Could not find user in system.");           
    }
    else {
        res.status(401).send("Error 'Weasel' : Invalid credentials.\n {username:username, \npassword:password}\n");   
    }
}

function logout(req,res,next) {
    /* This function handles the logging out. */
    if(req.session.loggedIn){
        req.session.loggedIn = false;
        res.redirect("/index.html");
    } else {
        res.status(400).send("You're already logged out.");
    }
}

function loggedInCheck(req,res,next) {
    /* This function verifies that the user has a 'true' logged in status. */
    if(!req.session.loggedIn){
        res.status(401).send("<h1>You are logged out !</h1>");
        return;
    }
    next();
}

function auth(req,res,next) {
    /* This function verifies that the user has permission and is who they say they are to access requested data. */
    if(req.params.username===req.session.username || Number(req.params.uid)===Number(req.session.userID)){

        //only authorize a user to POST/PUT/DELETE if their userID matches (they can only change their own data).
        if(req.body.hasOwnProperty("userID")){
            if(Number(req.body.userID)!=Number(req.params.uid)){
                res.status(401).send("Error 'Snake' : You are unauthorized to access this content.");
                return;
            }
        }
        next();
    }
    else {
        res.status(401).send("Error 'Snake' : You are unauthorized to access this content.");
        return;    
    }
}

function queryParser(req,res,next) {
    /* This function parses query parameters used for providing search results. */
    if(!req.query.symbol){
        req.query.symbol = "*";
    }
    if(req.query.minprice){
        try{
            req.query.minprice = Number(req.query.minprice);
        } catch{
            req.query.minprice = undefined;
        }
    }
    if(req.query.maxprice){
        try{
            req.query.maxprice = Number(req.query.maxprice);
        } catch{
            req.query.maxprice = undefined;
        }
    }
    if(req.query.startday){
        try{
            req.query.startday = Number(req.query.startday);
            if(!req.query.endday){
                req.query.endday = day;
            }
        } catch{
            req.query.startday = undefined;
        }
    }
    if(req.query.endday){
        try{
            req.query.endday = Number(req.query.endday);
            if(!req.query.startday){
                req.query.startday = 0;
            }
        } catch{
            req.query.endday = undefined;
        }
    }
    if(req.query.action){
        try{
            if(!req.query.action==="buy" || !req.query.action==="sell" || !req.query.action==="deposit" || !req.query.action==="withdraw"){
                //default to "buy"
                req.query.action = undefined;
            }
        } catch{
            req.query.action = undefined;
        }
    }
    next();
}


function matchStockQuery(stock, query, req) {
    /* This function matches query to stocks. It returns true if all conditions are satisfied and match is found. */
    let satisfied;
    let nameCheck = query.symbol==="*" || query.symbol.toUpperCase()===stock.symbol;
    let minPriceCheck = (!query.minprice) || query.minprice<=stock.price;
    let maxPriceCheck = (!query.maxprice) || query.maxprice>=stock.price;
    satisfied = nameCheck && minPriceCheck && maxPriceCheck;

    return satisfied;
}

function loadHistoryFromQuery(req, res, next) {
    /* This function loads all the user account history data that matches the query params. */

    let results = [];
    let user = users.find(elem => elem.username===req.session.username);

    //if no startday and endday specified then default to complete history
    if(!req.query.startday && !req.query.endday){
        req.query.startday = 0;
        req.query.endday = day;
    }
    if(!req.query.action){
        //default to buy history if no action specified
        req.query.action = undefined;
    }

    for(let entry of user.history){
        if(entry.day>=req.query.startday && entry.day<=req.query.endday && entry.type===req.query.action){
            results.push(entry);
        }
    }
    res.results = results;
    next();
}



function loadHistoricalTradeDataFromQuery(req,res,next) {
    /* This function obtains the correct historical trade data specified from query and assigns it to the
        response object 'results' array. */
    let results = [];
    for(let user of users){
        for(let order of user.history){
            //if no startday and endday query then set it to default current day
            if(!req.query.startday && !req.query.endday){
                req.query.startday = day;
                req.query.endday = day;
            }
            if(order.symbol===req.params.symbol && order.day>=req.query.startday && order.day<=req.query.endday){
                results.push(order);
            }
        }
    }
    res.results = results;
    next();
}


function sendHistoricalTradeData(req,res,next) {
    /* This function sends JSON representation of historical trade data. */
    try{
        res.json(res.results);
    }
    catch(err) {
        let message = "Error 'Dinosaur' : could not send historical data.";
        send404(message, err);
    }
}

function loadStocksFromQuery(req,res,next) {
    /* This function collects all stocks that match a query and assigns it to the response object results array. */
    let results = [];

    //If this request is /stocks/symbol
    if(req.params.symbol){
        let stock = masterStocksList.find(elem => elem.symbol===req.params.symbol);
        //If request is for the html page and there no query then send full history data so it can be shown
        if(req.headers.accept.includes("text/html") && !req.query.startday && !req.query.endday) {
            results.push(stock);
            res.results = results;
            next();
        }
        //Otherwise send the appropriate history filtered (b/c REST:API JSON needs to be defaulted at current day if no query specified)
        else {
            let output = JSON.parse(JSON.stringify(stock));
            output.history = output.history.filter(entry => entry.day>=req.query.startday && entry.day<=req.query.endday);
            results.push(output);
            res.results = results;
            next();
        }
    }
    else {
        for(let elem of masterStocksList){
            if(matchStockQuery(elem,req.query,req)){
                results.push(elem);
            }
        }
        res.results = results;
        next();
    }
}


function showUserPage(req,res,next){
    /* This function sends the PUG render of the user's profile page. */
    try{
        // res.status(200).send(renderUserPage({user:requestingUser}));
        let found = users.find(elem => elem.username===req.session.username);
        if(found){
            res.format({
                "text/html":() => {res.status(200).send(renderUserPage({user:found}));
            },
                "application/json":() => {res.json(found)}
            });
        }
    }
    catch(err) {
        let message = "Error 'Rabbit' : could not show user page.";
        send404(message, err);
    }
}

function showOrdersPage(req,res,next){
    try{
        res.status(200).send(renderOrdersPage({user:req.session}));
    }
    catch(err){
        let message = "Error 'Eagle' : could not show orders page";
        send404(message, err);
    }
}

function showAdminPage(req,res,next){
    try{
        res.status(200).send(renderAdminPage({user:req.session}));
    }
    catch(err){
        let message = "Error 'Baboon' : could not show admin page.";
        send404(message, err);
    }
}


function showStocksListPage(req,res,next){
    /* This function sends the list of stocks as either an html PUG rendered page or JSON depending on the
        specified Accept format. */
    try{
        res.format({
            "text/html":() => {res.status(200).send(renderStocksListPage({stocks:masterStocksList, username:req.session}))},
            "application/json":() => {res.json(res.results)}
        });
        return;
    }
    catch(err) {
        let message = "Error 'Shark' : could not show stocks page.";
        send404(message, err);
    }
}


function showStockPage(req,res,next){
    /* This function shows the PUG render of a specific stock page along with the corresponding user data. */
    let userData;
    let user;

    try {
        //Only do searching if request is for html page
        if(req.headers.accept.includes("text/html")){
            // userData = requestingUser.myStocks.find(stock => stock.symbol === req.params.symbol);
            user = users.find(elem => elem.username===req.session.username);
            userData = user.myStocks.find(stock => stock.symbol === req.params.symbol);


        }
        res.format({
            "text/html":() => {res.status(200).send(renderStockPage({stock:res.results[0], history:res.results[0].history, user:user, userData:userData}))},
            "application/json":() => {res.json(res.results)}
        });
        return;
    }
    catch(err){
        let message = "Error 'Whale' : could not show stock page.";
        send404(message, err);
    }
}

function showHistoryPage(req,res,next){
    /* This function renders the search results for a user's account history. */

    //Decide which table style should be rendered, they have different headers
    let whichTable;
    if(res.results.length>0){
        if(Object.values(res.results[0]).includes("buy") || Object.values(res.results[0]).includes("sell")){
            whichTable = "trade";
        }
        else{
            whichTable = "account";
        }
    }
    
    try {
        res.format({
            "text/html":() => {res.status(200).send(renderHistoryPage({data:res.results, username:req.session.username, whichTable:whichTable}))},
            "application/json":() => {res.json(res.results)}
        });
        return;
    }   
    catch(err){
        let message = "Error 'Ant' : could not show history page.";
        send404(message, err);
    }
}

function showNewsPage(req,res,next){
    try {
        res.status(200).send(renderNewsPage({username:req.session.username}));
        return;
    }
    catch(err){
        let message = "Error 'Bumblebee' : could not show news page.";
        send404(message, err);
    }
}


function sendPlayOrPause(req,res,next) {
    /* This function sends the current 'state' of the application. If the app is 'live' it means the AI users
        are generating trades and time is moving forward. If any user switches the state to 'paused' then this
        change is reflected across all logged in users. This is a global server state. */
    try{
        res.status(200).send(""+playOrPause);
    }
    catch(err){
        let message = "Error 'Moon' : could not get server state.";
        send404(message, err);
    }
}


function sendMasterStocksList(req,res,next){
    /* This function sends all the stock object data. */
    try{
        res.status(200).json(masterStocksList);
    }
    catch(err){
        let message = "Error 'Frog' : could not send master stocks list.";
        send404(message, err);
    }
}


function sendDay(req,res,next){
    /* This function sends the current day that the app is in. */
    try{
        res.status(200).send(String(day));
    }
    catch(err){
        let message = "Error 'Sun' : could not send the current day.";
        send404(message, err);
    }
}


function sendRequestingUser(req,res,next){
    /* This function sends the session's requesting user's data. */
    try{
        let found = users.find(elem => elem.username===req.session.username);
        res.status(200).json(found);
    }
    catch(err){
        let message = "Error 'Chameleon' : could not send the user data.";
        send500(message, err);
    }
}


function sendOrders(req,res,next){
    /* This function sends all outstanding order information from a specific user. */
    try{
        let requestingUserID = req.params.uid;
        let sending = orders.filter(elem => elem.userID==requestingUserID);
        if (sending){
            res.status(200).json(sending);
        }
    }
    catch(err){
        let message = "Error 'Owl' : could not send order data.";
        send404(message, err);
    }
}



function createBuyOrder(req,res,next){
    /* This function handles the creation of a buy order. */
    try{
        let order = req.body;
        //if order has valid format then allow it
        if(order.hasOwnProperty("stock") && order.hasOwnProperty("limit") && order.hasOwnProperty("expire") && order.hasOwnProperty("quantity")){
            orders.push({orderID:orderID, stock:order.stock, type:"buy", limit:Number(order.limit), expire:order.expire, quantity:Number(order.quantity), numOutstanding:Number(order.quantity), userID:Number(req.session.userID), filled:false});
            orderID++;
            res.status(200).send("POST OK: " + order.stock + " for buy.");
            return;
        }
        //otherwise send back the 'format'
        res.status(400).send("Error 'Octopus' : Invalid POST body format, needs to have...\n{stock:symbol, \ntype:buy, \nlimit:number, \nexpire:gtc/eod, \nquantity:number, \nuserID:yourUserID}\n");
        
    }
    catch(err){
        let message = "Error 'Bat' : could not create buy order.";
        send500(message, err);
    }
}


function createSellOrder(req,res,next){
    /* This function handles the creation of a sell order. */
    try{
        let order = req.body;
        //if order has valid format then allow it
        if(order.hasOwnProperty("stock") && order.hasOwnProperty("limit") && order.hasOwnProperty("expire") && order.hasOwnProperty("quantity")){
            orders.push({orderID:orderID, stock:order.stock, type:"sell", limit:Number(order.limit), expire:order.expire, quantity:Number(order.quantity), numOutstanding:Number(order.quantity), userID:Number(req.session.userID), filled:false});
            orderID++;
            res.status(200).send("POST OK: " + order.stock + " for sell.");
            return;
        }
        //otherwise send back the 'format'
        res.status(400).send("Error 'Moth' : Invalid POST body format, needs to have...\n{stock:symbol, \ntype:buy, \nlimit:number, \nexpire:gtc/eod, \nquantity:number, \nuserID:yourUserID}\n");
    }
    catch(err){
        let message = "Error 'Robin' : could not create sell order.";
        send500(message, err);
    }
}


function createUser(req,res,next){
    /* This function handles the creation of a new user who wants to register. */
    try{
        let newUser = req.body;
        //if new user has correct format then allow it
        if(newUser.hasOwnProperty("username") && newUser.hasOwnProperty("password") && newUser.hasOwnProperty("firstName") && newUser.hasOwnProperty("lastName") && newUser.hasOwnProperty("email")){
            //if username is already taken then don't allow registration
            let found = users.find(elem => elem.username===newUser.username);
            if(found){
                res.status(400).send("Error 'Raccoon' : Username already exists in system.");
                return;
            }
            newUser.userID = uniqueID;
            users.push(newUser);
            uniqueID++;
            res.status(200).send("POST OK: " + newUser.username + " now registered.");
            console.log(newUser);
            return;
        }
        //otherwise send back the 'format'
        res.status(400).send("Error 'Raccoon' : Invalid POST body format, needs to have...\n{username:name, \npassword:secret, \nfirstName:yourFirstName, \nlastName:yourLastName, \nemail:yourEmail}\n");
    }
    catch(err){
        let message = "Error 'Raccoon' : could not create user.";
        send500(message, err);
    }
}


function saveUser(req,res,next){
    /* This function saves the user profile and overwrites what is stored on the server. */
    try{
        let updatedInfo = req.body;
        // console.log(req.body);
        let found = users.find(user => user.userID===Number(req.params.uid));
            if (found) {
                // let index = users.indexOf(found);
                // users[index] = updatedInfo;
                // Object.assign(req.session.user,updatedInfo);
                Object.assign(found,updatedInfo);
                res.status(200).send("SEVER: USER DATA SAVED.");
            }
            else {
                res.status(400).send("Could not find user." + req.params.uid);
            }
        }
    catch(err){
        let message = "Error 'Chickadee' : could not save user data.";
        send500(message, err);
    }
}



function deleteOrder(req,res,next){
    /* This function handles the deletion of an order. */
    try{
        let removed = req.params.oid;
        let found = orders.find(elem => elem.orderID==removed);
        let index = orders.indexOf(found);
        orders.splice(index,1);
        res.status(200).send("SERVER: ORDER DELETED.");
        return;
    }
    catch(err) {
        let message = "Error 'Dragon' : could not delete order.";
        send500(message, err);
    }
}



function deleteSubscription(req,res,next){
    /* This function handles the deletion of a subscription. */
    try{
        let userID = req.params.uid;
        let symbol = req.params.symbol;
        let found = subscriptions[userID].find(elem => elem.symbol===symbol);
        let index = subscriptions[userID].indexOf(found);
        subscriptions[userID].splice(index,1);
        res.status(200).send("SERVER: SUBSCRIPTION DELETED.");
    }
    catch(err) {
        let message = "Error 'Ghoul' : could not delete subscription.";
        send500(message, err);
    }
}



function updateSubscriptions(req,res,next) {
    /* This function handles updating a subscription (active/deactive, changing % threshold) */
    try {
        let userID = req.params.uid;
        subscriptions[userID] = req.body;
        res.status(200).send("SERVER: SUBSCRIPTIONS UPDATED.");
    }
    catch(err) {
        let message = "Error 'Skeleton' : could not update subscriptions.";
        send500(message, err);
    }
}



function goToNextDay(req,res,next){
    /* This function handles moving time forward to the next day. */
    try{
        eod();
        res.status(200).send(String(day));
    }
    catch(err){
        let message = "Error 'Zombie' : could not go to next day.";
        send500(message, err);
    }
}



function updatePlayOrPause(req,res,next){
    /* This function handles the switching of the server's state from/to 'live' state and paused. */
    try{
        playOrPause = !playOrPause;
        
        if(!playOrPause){
            clearInterval(realTime1);
            clearInterval(realTime2);
        }
        else{
            realTime1 = setInterval(realtimeEvents, 2000);
            realTime2 = setInterval(eod, 30000);
        }
        res.status(200).send("SERVER: (true:play, false:paused)"+playOrPause);
    }
    catch(err){
        let message = "Error 'Golem' : could not update play/pause state.";
        send500(message, err)
    }
}



function createSubscription(req,res,next) {
    /* This function handles the creation of a subscription. */
    try{
        let userID = req.params.uid;
        //Check if request body has valid format, if not then send back the 'format'
        if(!req.body.hasOwnProperty("symbol") && !req.body.hasOwnProperty("minPercentChange") && !req.body.hasOwnProperty("activated") && !req.body.hasOwnProperty("notifiedToday") && !req.body.hasOwnProperty("userID")){
            res.status(400).send("Error 'Butterfly' : Invalid POST body format. Needs to have...\n{symbol:symbol, \nminPercentChange:number, \nactivated:true/false, \nnotifiedToday:false, \nuserID:yourUserID}");
            return;
        }
        //Cast the types to ensure proper format (ie if someone was interacting with Postman)
        req.body.minPercentChange = Number(req.body.minPercentChange);
        req.body.activated = Boolean(req.body.activated);
        req.body.notifiedToday = Boolean(req.body.notifiedToday);
        req.body.userID = Number(userID);

        //If subscriptions does not contain this userID yet, give them a key.
        if(!subscriptions.hasOwnProperty(userID)){
            subscriptions[userID] = [req.body];
            notifications[userID] = [];
        } else {
            subscriptions[userID].push(req.body);
        }

        res.status(200).send("SUBSCRIPTION " + req.body.symbol + " RECEIVED.");
    }
    catch(err){
        let message = "Error 'Hamster' : could not create subscription.";
        send500(message, err);
    }
}



function sendSubscriptions(req,res,next) {
    /* This function sends a specific user's subscriptions. */
    try{
        let userID = req.params.uid;

        if(!subscriptions.hasOwnProperty(userID)){
            //just so the table is at least rendered even if user has no subs
            res.json([]);
            return;
        }
        res.json(subscriptions[userID]);
    }
    catch(err) {
        let message = "Error 'Sheep' : could not send subscriptions.";
        send500(message, err);
    }
}

function pingNotifications(req,res,next) {
    try {
        let userID = req.params.uid;

        if(!notifications[userID]){
            res.status(200).send("false");
            return;
        }

        if(notifications[userID].length>0){
            res.status(200).send("true");
        }
        else {
            res.status(200).send("false");
        }
    }
    catch(err) {
        let message = "Error 'Pig' : could not process ping notifications request.";
        send500(message, err);
    }
}

function sendNotifications(req,res,next) {
    try{
        let userID = req.params.uid;

        if(!notifications.hasOwnProperty(userID)){
            notifications[userID] = [];
            return;
        }
        else if(notifications[userID].length>0){

            res.json(notifications[userID]);
            notifications[userID].splice(0,notifications[userID].length);
        }
        else {
            res.send("No notifications at this time, check back later...");
        }
    }
    catch(err){
        let message = "Error 'Horse' : could not send notifications.";
        send500(message, err);
    }
}



function send404(message, err){
    console.log(err);
    res.status(404).send(message);
}
function send500(message, err){
    console.log(err);
    res.status(500).send(message);
}




function eod(){
    /* This function processes all of the 'end of day' activities and moves time to the next day. */

    // Record each stock's daily statistics and reset the daily high/low
    for (let stock of masterStocksList) {
        stock.history.push({day:day, closing:stock.price, numSharesTraded:stock.numSharesTraded, low:stock.low, high:stock.high});
        stock.numSharesTraded = 0;
        stock.high = stock.price;
        stock.low = stock.price;
    }
    day++;

    
    cleanFilledOrders(matchOrders);
    removeEODOrders();
    cleanPortfolio();
    resetSubscriptions();

    //FOR PREPOPULATE MODE:
    // populateOrders();
    // matchOrders();
    // updateCurrentAsk();
    // updateCurrentBid();

}
//RUN "DAYSGONE" DAYS OF ACTIVITY WHEN SERVER STARTS (FOR PREPOPULATE MODE)
function startup(){
    let daysGone = 30;
    console.log("populating orders...");
    for (let i=0; i<daysGone; i++){
        eod();
    }
    console.log(daysGone+ " days gone by...");
}



function realtimeEvents(){
    //things that should be done in 'real time'
    matchOrders();
    updateCurrentAsk();
    updateCurrentBid();
    createNotifications();
    populateOrders();       //*

}



function matchOrders() {
/*      This function goes through all pending orders and attempts to match buys with sells.

        Algorithm:
        1. Find a pair of buy/sell orders that meet certain conditions (priority given to earlier submitted orders).
        2. Conduct the sale 1 share at a time until either fills.
        3. If the buyer has enough money to finish the trade then finalize the order.
        4. Update each user's accounts (cash, price and average prices).
        5. If the order is completely filled then set it's flag to true.                                            */

    //find a sell order that's not been filled

    for (let sellOrder of orders) {
        if (sellOrder.type==="sell" && sellOrder.filled==false) {

            //match the sell order with a buy order

            for (let buyOrder of orders) {

                let satisfied = buyOrder.type==="buy" && buyOrder.filled==false && buyOrder.numOutstanding<=sellOrder.numOutstanding
                    && buyOrder.stock===sellOrder.stock && buyOrder.limit>=sellOrder.limit;

            
                if(satisfied){
                    //If base conditions are met we can search for the users buying and selling and the stock
                    let buyingUser = users.find(user => user.userID===buyOrder.userID);
                    let sellingUser = users.find(user => user.userID===sellOrder.userID);
                    let thisStock = masterStocksList.find(elem => elem.symbol===buyOrder.stock);
                    let sellerHolding = sellingUser.myStocks.find(elem => elem.symbol===thisStock.symbol);
                    let thisSaleQuantity = 0;
                    //This algorithm favors the seller. The seller gets the highest possible cash.
                    let thisOrderPrice = Math.max(buyOrder.limit, sellOrder.limit);

                    while(satisfied && buyingUser.userID!==sellingUser.userID){
                        //count the sale quantity while selling 1 stock at a time
                        buyOrder.numOutstanding-=1;
                        sellOrder.numOutstanding-=1;
                        thisSaleQuantity+=1;
                        thisStock.numSharesTraded+=1;
                        //break the loop if either buy/sell outstanding quantities are 0
                        if (buyOrder.numOutstanding==0 || sellOrder.numOutstanding==0) {
                            buyOrder.price = sellOrder.limit;
                            sellOrder.price = sellOrder.limit;
                            break;
                        }
                    }
                   
                    //check if buying user has enough cash and selling user has enough shares to complete the sale
                    if(buyingUser && buyingUser.cash >= thisOrderPrice*thisSaleQuantity && sellerHolding.quantity > thisSaleQuantity && thisSaleQuantity>0) {

                        buyingUser.cash -= thisStock.price * thisSaleQuantity;
                        sellingUser.cash += thisStock.price * thisSaleQuantity;
                        //adjust the stock price to this (most current sale) price
                        thisStock.price = thisOrderPrice;
                        //check to see if this new price is the stock's new daily high or low
                        if(thisStock.price>thisStock.high) {
                            thisStock.high = thisStock.price;
                        }
                        if(thisStock.price<thisStock.low) {
                            thisStock.low = thisStock.price;
                        }
                        //add purchased stock to the buyer's portfolio and update price and average price
                        //push a new object if the stock symbol does not exist, otherwise update the existing stock object
                        let foundBuyerHolding = false;
                        for(let holding of buyingUser.myStocks){
                            if(holding.symbol===thisStock.symbol){
                                foundBuyerHolding = true;
                                let weightOfOldAvg = holding.quantity/(holding.quantity + thisSaleQuantity);
                                let weightOfNewSale = 1-weightOfOldAvg;
                                let newAverage = weightOfOldAvg*holding.avgPrice + weightOfNewSale*thisOrderPrice;
                                holding.avgPrice = parseFloat(newAverage).toFixed(2);
                                holding.quantity += thisSaleQuantity;
                                holding.price = thisStock.price;
                                buyingUser.history.push({day:day, symbol:thisStock.symbol, type:"buy", amount:thisOrderPrice*thisSaleQuantity, quantity:thisSaleQuantity, pricePerShare:thisOrderPrice});
                                break;
                            }
                        }
                        if(foundBuyerHolding==false){
                            buyingUser.myStocks.push({symbol:thisStock.symbol, name:thisStock.name, price:thisStock.price, avgPrice:parseFloat(thisOrderPrice).toFixed(2), quantity:thisSaleQuantity});
                            buyingUser.history.push({day:day, symbol:thisStock.symbol, type:"buy", amount:thisOrderPrice*thisSaleQuantity, quantity:thisSaleQuantity, pricePerShare:thisOrderPrice});
                        }

                        //remove sold stock quantities from seller's portfolio and update their price and average price
                        sellerHolding.quantity -= thisSaleQuantity;
                        sellerHolding.price = thisStock.price;
                        sellingUser.history.push({day:day, symbol:thisStock.symbol, type:"sell", amount:thisOrderPrice*thisSaleQuantity, quantity:thisSaleQuantity, pricePerShare:thisOrderPrice});
                    }
                    //if buying user does not have enough money or selling user does not have enough shares then reset the order quantities
                    else {
                        buyOrder.numOutstanding+=thisSaleQuantity;
                        sellOrder.numOutstanding+=thisSaleQuantity;
                    }
    
                    //if all outstanding quantities are empty then change property .filled to true
    
                    if (buyOrder.numOutstanding==0) {
                        buyOrder.filled = true;
                    }
                    if (sellOrder.numOutstanding==0) {
                        sellOrder.filled = true;
                    }       
                }
            } 
        }
    }
}


function cleanFilledOrders(next) {
    /*  If an order has been completely filled then remove it from the orders list and store it 
        in the filledOrders list.   */

    for (let order of orders) {
        if (order.filled==true || order.numOutstanding==0 || order.quantity==0) {
            filledOrders.push({orderID:order.orderID, type:order.type, userID:order.userID, quantity:order.quantity, stock:order.stock, price:order.price});
        }
    }
    orders = orders.filter(elem => elem.filled==false);
    next();
}

function removeEODOrders() {
/*      This function goes through all the pending orders and filters out all the orders with an expiry
        set to end of day. It keeps only the orders with 'good until cancel'.                           */
        orders = orders.filter(order => order.expire==="gtc");
}

function updateCurrentBid() {
    /*  This function goes through all the pending orders and updates the current bid for each stock.
        The current bid is specified as the highest buy offer for the stock.                            */
        for(let order of orders) {
            if(order.type==="buy") {
                let orderStock = order.stock;
                let stock = masterStocksList.find(elem => elem.symbol===orderStock);
                if(order.limit>stock.bid || stock.bid==0) {
                    stock.bid = order.limit;
            }
        }
    }
}

function updateCurrentAsk() {
    /*  This function goes through all the pending orders and updates the current ask for each stock.
        The current ask is specified as the highest sell offer for the stock.                           */
        for(let order of orders) {
            if(order.type==="sell") {
                let orderStock = order.stock;
                let stock = masterStocksList.find(elem => elem.symbol===orderStock);
                if(order.limit<stock.ask || stock.ask==0) {
                    stock.ask = order.limit;
            }
        }
    }
}

function cleanPortfolio() {
/*      This function goes through all the users' profiles and filters out all the 0 quantity holdings.     */
    for(let user of users){
        user.myStocks = user.myStocks.filter(stock => stock.quantity>0);
    }
}


function populateOrders() {
    /* This function will auto generate some random orders from userID 901 to 920 */

    for (let k=0; k<users.length; k++) {
        if(users[k].userID<901){
            continue;
        }
        let randomNumOrders = Math.floor(Math.random() * 5);

        for (let i=0; i<randomNumOrders; i++) {
            let diceRoll1 = 1 + Math.floor(Math.random() * 20);
            let diceRoll2 = 1 + Math.floor(Math.random() * 20);
            let diceRoll3 = 1 + Math.floor(Math.random() * 20);
            let randomOrderType = Math.floor(Math.random() * 10);
            let randomStock = Math.floor(Math.random() * masterStocksList.length);
            let randomQuantity = 1 + Math.floor(Math.random() * 100);
            // let randomLimit = 1 + Math.floor(Math.random() * masterStocksList[randomStock].price);
            let randomLimit = masterStocksList[randomStock].price;
            let anotherRandomizerForPercentChange = 0;      //used to potentially drive price down (by max+/-5%)
            let maxPercentChange = 5;

            //Depending on the dice roll, the randomLimit could be above or below the stock price.
            if(diceRoll1<11){
                anotherRandomizerForPercentChange = (Math.floor(Math.random() * (maxPercentChange)+1))/100;
                if(diceRoll2<19){
                    //limit goes down by max of maxPercentChange
                        //need to bias lowering because sales are favoured towards the seller
                    randomLimit*=(1-anotherRandomizerForPercentChange);
                }
                else{
                    //limit goes up by max of maxPercentChange
                    randomLimit*=(1+anotherRandomizerForPercentChange);
                }
                //slight chance to allow randomLimits to have bigger impact. ("critical strike")
                if(diceRoll3<2){
                    randomLimit*=(0.85);
                }
                else if(diceRoll3>19){
                    randomLimit*=(1.15);
                }
                //Keep it an integer above 1
                randomLimit = 1+Math.floor(randomLimit);
            }
            

            //Randomly decide the expire type eod/gtc
            let randomExpire = 1 + Math.floor(Math.random() * 5);
            let expire;
            if(randomExpire<=17){
                expire = "eod"
            } else {
                expire = "gtc"
            }

            //User ID 999 is admin, who is issuing all stocks at the start.

            if (users[k].userID!=999 && randomQuantity>0 && randomOrderType<5 && users[k].cash>masterStocksList[randomStock].price*randomQuantity) {
                let newOrder = {orderID:orderID, stock:masterStocksList[randomStock].symbol, type:"buy", limit:randomLimit, expire:expire, quantity:randomQuantity, numOutstanding:randomQuantity, userID:users[k].userID, filled:false};
                orders.push(newOrder);
                orderID++;
            }
            else if ((users[k].userID==999 || randomOrderType>=5) && randomQuantity>0) {
                let found = users[k].myStocks.find(elem => elem.symbol===masterStocksList[randomStock].symbol);
                if (found && found.quantity>=randomQuantity){
                    let newOrder = {orderID:orderID, stock:masterStocksList[randomStock].symbol, type:"sell", limit:randomLimit, expire:expire, quantity:randomQuantity, numOutstanding:randomQuantity, userID:users[k].userID, filled:false};
                    orders.push(newOrder);
                    orderID++;
                }
            }
        }
    }
}

function createNotifications() {
    for(let user of Object.keys(subscriptions)){
        for(let sub of subscriptions[user]){
            if(sub.activated && !sub.notifiedToday){
                let found = masterStocksList.find(elem => elem.symbol===sub.symbol);
                let yesterdayPrice = found.history[day-1].closing;
                let dailyPercentChange = ((found.price-yesterdayPrice)/found.price * 100).toFixed(2);
                if(sub.minPercentChange <= Math.abs(dailyPercentChange)){
                    sub.notifiedToday = true;
                    notifications[user].push({day:day, symbol:found.symbol, percentChange:dailyPercentChange, sent:false});
                    if(notifications[user].length>30){
                        notifications[user].splice(0,1);
                        console.log("Too many notifications, need to shrink.");
                    }
                }
            }   
        }
    }
}

function resetSubscriptions() {
    for(let user of Object.keys(subscriptions)){
        for(let sub of subscriptions[user]){
            sub.notifiedToday = false;
        }
    }
}





/*      NOTES FOR SELF          */
/*      THINGS STILL NEEDED     */
        // MANDATORY FEATURES
//MongoDB Mongoose

        //OPTIONAL FEATURES
//dividends (pay out every 7 days?)
//create a news feed?
    //each company gets a new property 'sector' and randomly generate news story based off sector if prev day price moves significantly
//create input validation functions (like for PUT routes).
//compare closing prices and generate news headline based off that
