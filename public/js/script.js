// Michael Grewal
// 100 739 181
/*==========================================*/
/*                                          */
/*      'BETTER LOOT' CLIENT JS FILE        */
/*                                          */
/*==========================================*/

/* This file contains the client side functions, event handlers and XMLHttp Requests for each page. */


let masterStocksList = [];
let orders = [];
let matchedOrders = [];
let currentDay;
let playOrPause;
let isLive;
let requestingUser;
let mySubscriptions = [];
let myNotifications = [];


// INDEX PAGE
/*==========*/
function initIndex(){
    console.log("initIndex()");

    //Handlers
    let toLoginPageButton = document.getElementById("toLoginPageButton");
    toLoginPageButton.addEventListener("click", function(){
        console.log("to login page button");
    });

    let toRegisterPageButton = document.getElementById("toRegisterPageButton");
    toRegisterPageButton.addEventListener("click", function() {
        console.log("to register page button");
    });
}




//LOGIN PAGE:
/*==========*/
function initLogin() {
    console.log("initLogin()");

    //Handlers
    let toRegisterPageButton = document.getElementById("toRegisterPageButton");
    toRegisterPageButton.addEventListener("click", function() {
        console.log("to register page button");
    });

    let enterButton = document.getElementById("enterButton");
    enterButton.addEventListener("click", function() {
        console.log("enter button");
        login();
    });

}
//FUNCTIONS:
function login() {
    /* This function sends a /login request to the server credentials. */
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value
    if (username.length==0 && password.length==0){
        alert("Incorrect login.");
    }
    let credentials = {username:username, password:password};

    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if(this.readyState==4 && this.status==200){
            window.location.assign("/users/"+username);
        }
        else if(this.readyState==4 && this.status==401){
            alert("Invalid credentials.");
        }
    }
    xhttp.open("POST", "/login", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify(credentials));
}



//FORGOT PASSWORD PAGE:
/*====================*/
function initForgotPasswordPage() {
    console.log("initForgotPassword()");

    //Handlers
    let forgotButton = document.getElementById("forgotButton");
    forgotButton.addEventListener("click", function() {
        console.log("recover password");
        alert("Password sent to your email address.")
    });
}



//REGISTER PAGE:
/*=============*/
function initRegister() {
    console.log("initRegister()");

    //Handlers
    let registerButton = document.getElementById("submitRegister");
    registerButton.addEventListener("click", function() {
        console.log("submit register");
        registerNewUser();
    });
}

//FUNCTIONS
function registerNewUser() {
    /* This function registers a new user with the system. */

    console.log("registerNewUser()");
    let username = document.getElementById("usernameReg").value;
    let password = document.getElementById("passwordReg").value;
    let fname = document.getElementById("firstNameReg").value;
    let lname = document.getElementById("lastNameReg").value;
    let email = document.getElementById("emailReg").value;

    if (username.length>0 && password.length>0 && fname.length>0 && lname.length>0 && email.length>0){
        newUser = {username:username, password:password, firstName:fname, lastName:lname, email:email, cash:0, myStocks:[], myWatchlists:[], history:[]};
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if(this.readyState==4 && this.status==200) {
                console.log(this.responseText);
                alert("Registration Successful. You may login.");
            }
            else if(this.readyState==4 && this.status==400){
                alert("Sorry, the username '" + username +"' is taken." );
            }
        };
        xhttp.open("POST", "/users", true);
        xhttp.setRequestHeader("Content-Type","application/json");
        xhttp.send(JSON.stringify(newUser));

    }
    else {
        alert("Your input is invalid.")
    }
    document.getElementById("usernameReg").value = "";
    document.getElementById("passwordReg").value = "";
    document.getElementById("firstNameReg").value = "";
    document.getElementById("lastNameReg").value = "";
    document.getElementById("emailReg").value = "";
}



//USER PORTFOLIO PAGE
/*==================*/
function initUserPage() {
    console.log("initUserPage()");
    let historySwitch;
    let historyTimer;

    getDay();
    getMasterStockList();
    // getPlayOrPause();

    //FOR AUTO MODE:
    setInterval(getDay, 10000);
    setInterval(getPlayOrPause,2000);
    getRequestingUserWithRender(renderWatchlistSelection);

    //FOR PREPOPUATE MODE:
    // getDay();
    // getMasterStockList();
    // getRequestingUserWithRender();
    
    //Handlers
    let addWatchlistButton = document.getElementById("addWatchlist");
    addWatchlistButton.addEventListener("click", function() {
        console.log("add watchlist button");
        addWatchlist();
        putUserData(getRequestingUserWithRender);
        refreshViewWatchlistButton.click();
    });
    let removeWatchlistButton = document.getElementById("removeWatchlist");
    removeWatchlistButton.addEventListener("click", function(){
        console.log("remove watchlist button");
        removeWatchlist();
        putUserData(getRequestingUserWithRender);
        refreshViewWatchlistButton.click();

    });
    let addStockToWatchlistButton = document.getElementById("addStockToWatchlist");
    addStockToWatchlistButton.addEventListener("click", function() {
        console.log("add stock to watchlist button");
        addStockToWatchlist();
        putUserData(getRequestingUserWithRender);
        refreshViewWatchlistButton.click();

    });
    let removeStockFromWatchlistButton = document.getElementById("removeStockFromWatchlist");
    removeStockFromWatchlistButton.addEventListener("click", function(){
        console.log("remove stock from watchlist button");
        removeStockFromWatchlist();
        putUserData(getRequestingUserWithRender);
        refreshViewWatchlistButton.click();

    });
    let showHistoryTradesButton = document.getElementById("historyTradesButton");
    showHistoryTradesButton.addEventListener("click", function(historySwitch) {
        historySwitch = true;
        clearInterval(historyTimer);
        renderMyAccountHistory(historySwitch);
        historyTimer = setInterval(renderMyAccountHistory, 2000, historySwitch);
    });
    let showHistoryTransactionsButton = document.getElementById("historyTransactionsButton");
    showHistoryTransactionsButton.addEventListener("click", function(historySwitch) {
        historySwitch = false;
        clearInterval(historyTimer);
        renderMyAccountHistory(historySwitch);
        historyTimer = setInterval(renderMyAccountHistory, 2000, historySwitch);
    })
    let refreshViewWatchlistButton = document.getElementById("refreshWatchlist");
    refreshViewWatchlistButton.addEventListener("click", function() {
        console.log("---update---");
        getRequestingUserWithRender();
        renderWatchlistSelection();
    });
    // refreshViewWatchlistButton.click();

    let playOrPauseButton = document.getElementById("playOrPauseButton");
    playOrPauseButton.addEventListener("click", function() {
        //can only change html/css of the button here to indicate live/paused
        putPlayOrPause();
    });

    let notificationsButton = document.getElementById("getNotifications");
    notificationsButton.addEventListener("click", function() {
        getNotifications();
    });
}

//FUNCTIONS:
function getPlayOrPause() {
    /* This function pings for the current server's state (i.e. Play or Pause state) and updates the client */

    let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState==4 && this.status==200) {
                if(this.responseText==="false"){
                    playOrPause = false;
                    playOrPauseButton.innerHTML = "PAUSED";
                    playOrPauseButton.style.background = "#C7CEEA";
                }
                else{
                    playOrPause = true;
                    playOrPauseButton.innerHTML = "*LIVE*";
                    playOrPauseButton.style.background = "#B5EAD7";
                }
                console.log("Client: (true:play, false:paused)"+playOrPause);
                clearInterval(isLive);

                if(playOrPause){
                    // GOLIVE;
                    // playOrPause needs to come from the server (GET), and if it's true then continue getting all other data
                    // if user changes to pause then PUT to server that it's paused so server pauses 'realtime' tasks until playOrPause
                        // is set back to true then we send it back with PUT and continue the GET for server status.
                    isLive = setInterval(getRequestingUserWithRender, 2000);
                } else {
                    // PAUSE;
                    clearInterval(isLive);
                }
                
            }
        };
        xhttp.open("GET", "/playOrPause", true);
        xhttp.send();
}


function putPlayOrPause() {
    /* This function is used to change the server's current state from PLAY to PAUSE or vice versa. */
    let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState==4 && this.status==200) {
                console.log(this.responseText);
            }
        };
        xhttp.open("PUT", "/playOrPause", true);
        xhttp.send();
}


function renderMyAccountHistory(condition){
    if(condition==true){
        renderMyAccountHistoryTrades();
    }
    else if(condition==false){
        renderMyAccountHistoryCash();
    }
}


function getRequestingUserWithRender(next){
    /* This function gets the user's data and calls appropriate functions to render the view (tables, etc...) */

    let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState==4 && this.status==200) {
                requestingUser = JSON.parse(this.responseText);
                // renderMyStocksTable();
                getMasterStockList(renderMyStocksTable);
                renderMyWatchlistTable(getWatchlistSelectionIndex());
                // renderWatchlistSelection();
                updateCash();
                updateTotalMarketValue();
                getOrders();
                getSubscriptions(renderMySubscriptionsTable);
                pingNotifications();

                // renderMyPendingOrdersTable();
                if(next){
                    next();
                }
            }
        };
        xhttp.open("GET", "/requestingUser", true);
        xhttp.send();
}


function getRequestingUserNoRender(next, next2) {
    /* This function is used to get the user data but no rendering on client side. */

    let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState==4 && this.status==200) {
                requestingUser = JSON.parse(this.responseText);
                if(next){
                    next();
                }
                if(next2){
                    next2();
                }
            }
        };
        xhttp.open("GET", "/requestingUser", true);
        xhttp.send();
}

function getNotifications() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState==4 && this.status==200){
            let tempSpace = [];
            tempSpace = JSON.parse(this.responseText);
            for(let notify of tempSpace){
                myNotifications.push(notify);
            }
            showNotifications();
            pingNotifications();
        }
    };
    xhttp.open("GET", "/"+requestingUser.userID+"/notifications", true);
    xhttp.send();
}

function pingNotifications() {
    /* This function is used to ask the server if there are any notifications available for the user. */

    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState==4 && this.status==200){
            
            if(this.responseText=="true"){
                document.getElementById("getNotifications").innerHTML = "Notifications!";
                document.getElementById("getNotifications").style.backgroundColor = "#B5EAD7"
                document.getElementById("getNotifications").disabled = false;
            }
            else {
                document.getElementById("getNotifications").innerHTML = "No Notifications...";
                document.getElementById("getNotifications").style.backgroundColor = "#FFB7B2";
                document.getElementById("getNotifications").disabled = true;
            }
        }
    }
    xhttp.open("GET", "/"+requestingUser.userID+"/anyNotifications", true);
    xhttp.send();
}

function showNotifications() {
    if(myNotifications.length>0){
        let notify = document.createElement("div");
        notify.className = "notify";
        notify.id = "notify";
        notify.innerHTML = myNotifications[0].symbol+ " moved by "+myNotifications[0].percentChange+"% on day "+myNotifications[0].day;
        notify.style.opacity = "1";

        let container = document.getElementById("notifications");
        let numDivs = container.getElementsByTagName("div").length;
        if(numDivs>3){
            container.removeChild(document.getElementById("notify"));
        }        
        container.appendChild(notify);

        myNotifications.splice(0,1);
        setTimeout(()=>notify.style.opacity = "0", 6000);
        setTimeout(showNotifications, 2000);
    }
        
}


function putUserData(next){
    /* This function saves the user's data with the server. */

    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState==4 && this.status==200) {
            console.log(this.responseText);
            if(next){
                next();
            }
        }
    }
    xhttp.open("PUT", "/users/"+requestingUser.userID, true);
    xhttp.setRequestHeader("Content-Type","application/json");
    xhttp.send(JSON.stringify(requestingUser));
}


function delUserOrder(thisOrderID){
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState==4 && this.status==200) {
            let refresh = document.getElementById("refreshWatchlist")
            refresh.click();
        }
    }
    xhttp.open("DELETE", "/orders/"+requestingUser.userID+"/"+thisOrderID, true);
    xhttp.setRequestHeader("Content-Type","text/plain");
    xhttp.send();
}


function delSubscription(symbol){
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState==4 && this.status==200) {
            let refresh = document.getElementById("refreshWatchlist")
            refresh.click();
        }
    }
    xhttp.open("DELETE", "/subscriptions/"+requestingUser.userID+"/"+symbol, true);
    xhttp.setRequestHeader("Content-Type","text/plain");
    xhttp.send();
}


function getDay() {
    //Get the current day
    let day = document.getElementById("dayCounter");
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if(this.readyState==4 && this.status==200){
            currentDay = this.responseText;
            if(window.location.href.includes("users")){
                day.innerHTML = "Day: "+this.responseText;
            }
        }
    }
    xhttp.open("GET", "/day", true);
    xhttp.send();
}


function updateCash() {
    let cash = document.getElementById("myCash");
    cash.innerHTML = "Cash: $" + requestingUser.cash;
}

function updateTotalMarketValue() {
    let totalValueText = document.getElementById("totalValue");
    let total = 0;
    for(let holding of requestingUser.myStocks){
        total += holding.avgPrice * holding.quantity;
    }
    totalValueText.innerHTML = "Total Market Value: $" + total.toFixed(2);
}


function getWatchlistSelectionIndex() {
    let selection = document.getElementById("selectMyWatchlists").selectedIndex;
    return selection;
}


function getMasterStockList(next, next2) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState==4 && this.status==200) {
            //Action to perform when document is ready
            masterStocksList = JSON.parse(this.responseText);
            renderStocksSelection("allStocks");
            if(next){
                next();
            }
            if(next2){
                next2();
            }
        }
    };
    xhttp.open("GET", "/masterStocksList", true);
    xhttp.send();
}


function getOrders() {      //requestingUser
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState==4 && this.status==200) {
            //Action to perform when document is ready
            orders = JSON.parse(this.responseText);
            let location = window.location.href;
            if (location.includes("users")){
                renderMyPendingOrdersTable();
            }
        }
    };
    xhttp.open("GET", "/"+requestingUser.userID+"/orders", true);
    xhttp.send();
}


function renderMyAccountHistoryCash() {

    let newTableHeader = document.createElement("table");
    newTableHeader.id = "myHistoryHeader";
    let newTableHeaderRow = document.createElement("tr");

    let titleDay = document.createElement("td");
    titleDay.innerHTML = "Day";
    let titleType = document.createElement("td");
    titleType.innerHTML = "Transaction";
    let titleAmount = document.createElement("td");
    titleAmount.innerHTML = "Amount"
    

    newTableHeaderRow.appendChild(titleDay);
    newTableHeaderRow.appendChild(titleType);
    newTableHeaderRow.appendChild(titleAmount);
    newTableHeader.appendChild(newTableHeaderRow);

    let originalTableHeader = document.getElementById("myHistoryHeader");
    originalTableHeader.parentNode.replaceChild(newTableHeader, originalTableHeader);

    //renders a specific user's pending orders on the page
    let newTable = document.createElement("table");
    newTable.id = "myHistoryTable";

    requestingUser.history.forEach(elem => {
        //if the elem has a symbol property then it must be a trade history
        if(elem.type==="withdraw" || elem.type==="deposit"){

            //Create row for each order
            let newRow = document.createElement("tr");
            // newRow.id = elem.orderID;
            newRow.name = "myHistory";

            //Create td for each piece of info then append
            for (let key in elem){
                
                let data = document.createElement("td");
                data.innerHTML = elem[key];
                //for color text (red/green);
                if (elem[key]==="deposit") {
                    data.id = "profit";
                }
                else if (elem[key]==="withdraw") {
                    data.id = "loss";
                }
                newRow.appendChild(data);
                }
            newTable.appendChild(newRow);
            }
        });

    let originalTable = document.getElementById("myHistoryTable");
    originalTable.parentNode.replaceChild(newTable, originalTable);
}


function renderMyAccountHistoryTrades() {
    let newTableHeader = document.createElement("table");
    newTableHeader.id = "myHistoryHeader";
    let newTableHeaderRow = document.createElement("tr");

    let titleDay = document.createElement("td");
    titleDay.innerHTML = "Day";
    let titleSymbol = document.createElement("td");
    titleSymbol.innerHTML = "Symbol";
    let titleType = document.createElement("td");
    titleType.innerHTML = "Type";
    let titleAmount = document.createElement("td");
    titleAmount.innerHTML = "Total Price"
    let titleQuantity = document.createElement("td");
    titleQuantity.innerHTML = "Quantity"
    let titlePPS = document.createElement("td");
    titlePPS.innerHTML = "Price Per Share";

    newTableHeaderRow.appendChild(titleDay);
    newTableHeaderRow.appendChild(titleSymbol);
    newTableHeaderRow.appendChild(titleType);
    newTableHeaderRow.appendChild(titleAmount);
    newTableHeaderRow.appendChild(titleQuantity);
    newTableHeaderRow.appendChild(titlePPS);
    newTableHeader.appendChild(newTableHeaderRow);

    let originalTableHeader = document.getElementById("myHistoryHeader");
    originalTableHeader.parentNode.replaceChild(newTableHeader, originalTableHeader);

    //renders a specific user's pending orders on the page
    let newTable = document.createElement("table");
    newTable.id = "myHistoryTable";

    requestingUser.history.forEach(elem => {
        //if the elem has a symbol property then it must be a trade history

        if (elem.hasOwnProperty("symbol")) {
            //Create row for each order
            let newRow = document.createElement("tr");
            // newRow.id = elem.orderID;
            newRow.name = "myHistory";

            //Create td for each piece of info then append
            for (let key in elem){
                
                if (key==="symbol"){
                    let data = document.createElement("td");
                    data.innerHTML = "<a href=/stocks/"+elem.symbol+">"+elem.symbol+"</a>"
                    newRow.appendChild(data);
                }
                else {
                    let data = document.createElement("td");
                    data.innerHTML = elem[key];
                    //for color text (red/green)
                    if (elem[key]==="buy") {
                        data.id = "loss";
                    }
                    else if (elem[key]==="sell") {
                        data.id = "profit";
                    }
                    newRow.appendChild(data);
                }
            }
            newTable.appendChild(newRow);
        }
    });

    let originalTable = document.getElementById("myHistoryTable");
    originalTable.parentNode.replaceChild(newTable, originalTable);
}



function renderMyPendingOrdersTable() {
    //Table Heading Titles
    let newTableHeader = document.createElement("table");
    newTableHeader.id = "myPendingOrdersHeader";
    let newTableHeaderRow = document.createElement("tr");
    let titleButton = document.createElement("td");
    titleButton.innerHTML = "";
    let titleID = document.createElement("td");
    titleID.innerHTML = "Order ID";
    let titleSymbol = document.createElement("td");
    titleSymbol.innerHTML = "Symbol";
    let titleType = document.createElement("td");
    titleType.innerHTML = "Type"
    let titlePrice = document.createElement("td");
    titlePrice.innerHTML = "Limit Price";
    let titleExpire = document.createElement("td");
    titleExpire.innerHTML = "Expire";
    let titleQuantity = document.createElement("td");
    titleQuantity.innerHTML = "Total Quantity";
    let titleOutstanding = document.createElement("td");
    titleOutstanding.innerHTML = "Outstanding Quantity"

    newTableHeaderRow.appendChild(titleButton);
    newTableHeaderRow.appendChild(titleID);
    newTableHeaderRow.appendChild(titleSymbol);
    newTableHeaderRow.appendChild(titleType);
    newTableHeaderRow.appendChild(titlePrice);
    newTableHeaderRow.appendChild(titleExpire)
    newTableHeaderRow.appendChild(titleQuantity);
    newTableHeaderRow.appendChild(titleOutstanding);
    newTableHeader.appendChild(newTableHeaderRow);

    let originalTableHeader = document.getElementById("myPendingOrdersHeader");
    originalTableHeader.parentNode.replaceChild(newTableHeader, originalTableHeader);


    //renders a specific user's pending orders on the page
    let newTable = document.createElement("table");
    newTable.id = "myPendingOrdersTable";

    orders.forEach(elem => {

            //Create row for each order
            let newRow = document.createElement("tr");
            newRow.id = elem.orderID;
            newRow.name = "myPendingOrders";

            let removeButton = document.createElement("button");
            removeButton.className = "smallButtons";
            removeButton.innerHTML = "-";
            removeButton.addEventListener("click", function() {
                let index = orders.indexOf(elem);
                orders.splice(index, 1);
                delUserOrder(elem.orderID);
            });
            let removeButtonTD = document.createElement("td");
            removeButtonTD.appendChild(removeButton);
            newRow.appendChild(removeButtonTD);

            //Create td for each piece of info then append
            for (let key in elem){
                if (key==="userID" || key==="filled" || key==="price") {
                    continue;
                }
                if (key==="stock"){
                    let data = document.createElement("td");
                    data.innerHTML = "<a href=/stocks/"+elem.stock+">"+elem.stock+"</a>"
                    newRow.appendChild(data);
                }
                else {
                    let data = document.createElement("td");
                    data.innerHTML = elem[key];
                    //for color text (red/green)
                    if (elem[key]==="buy"){
                        data.id = "loss";
                    }
                    else if (elem[key]==="sell"){
                        data.id = "profit";
                    }
                    newRow.appendChild(data);
                }
            }
            newTable.appendChild(newRow);
    });

    let originalTable = document.getElementById("myPendingOrdersTable");
    originalTable.parentNode.replaceChild(newTable, originalTable);
}


function addWatchlist() {
    // let name = document.getElementById("newWatchlistName").value;
    let name = prompt("Enter new watchlist name: ");
    let stocks = [];
    let newList = {name:name, stocks:stocks};

    if(name.length>0){
        requestingUser.myWatchlists.push(newList);
        // document.getElementById("newWatchlistName").value = "";
    }
    else {
        alert("Watchlist needs a name.");
    }
}


function removeWatchlist() {
    if(requestingUser.myWatchlists.length>0){
        let list = document.getElementById("selectMyWatchlists");
        let selection = requestingUser.myWatchlists[list.selectedIndex].name;
        let found = requestingUser.myWatchlists.find(elem => elem.name===selection);
        if (found){
            console.log("removing " + selection);
            let index = requestingUser.myWatchlists.indexOf(found);
            requestingUser.myWatchlists.splice(index, 1);
        }
    }
    else {
        alert("You don't have any watchlists.");
    }
}


function renderWatchlistSelection() {
    
    let oldList = document.getElementById("selectMyWatchlists");
    let index = oldList.selectedIndex;

    let newList = document.createElement("select");

    for (let list of requestingUser.myWatchlists) {
        let option = document.createElement("option");
        if (index>=0 && index<requestingUser.myWatchlists.length){
            let selection = requestingUser.myWatchlists[index].name;
            if(list.name===selection){
                option.selected = true;
                }
            }
        option.innerHTML = list.name;
        option.value = list.name;
        option.id = list.name;
        newList.appendChild(option);
    }

    newList.id = "selectMyWatchlists";
    oldList.parentNode.replaceChild(newList, oldList);
}


function renderStocksSelection(destination) {
    let stocksSelectionList = document.getElementById(destination);
    if(stocksSelectionList.length>0){
        return;
    }
    
    for (let stock of masterStocksList) {
        let option = document.createElement("option");
        option.innerHTML = stock.symbol;
        option.value = stock.symbol;
        option.id = stock.symbol;
        stocksSelectionList.appendChild(option);
    }
}


function addStockToWatchlist(stock) {
    let symbol;
    let listIndex = document.getElementById("selectMyWatchlists").selectedIndex;
    if(!stock){
        let stockIndex = document.getElementById("allStocks").selectedIndex;
        symbol = masterStocksList[stockIndex].symbol;
    }
    else{
        symbol = stock;
    }

    if (listIndex<0){
        alert("You must have a watchlist selected.");
    } else {
        let found = requestingUser.myWatchlists[listIndex].stocks.find(stock => stock===symbol);
        if (found) {
            alert("This watchlist already contains that symbol.");
            return;
        }
        else {
            requestingUser.myWatchlists[listIndex].stocks.push(symbol);
            if(window.location.href.includes("stocks")){
                alert(symbol + " added to your watchlist.");
            }
        }
    }
    
}


function removeStockFromWatchlist() {
    let listIndex = document.getElementById("selectMyWatchlists").selectedIndex;
    let stockIndex = document.getElementById("allStocks").selectedIndex;
    let symbol = masterStocksList[stockIndex].symbol;
    if (listIndex<0){
        alert("You must have a watchlist selected.");
    } else {
        if(requestingUser.myWatchlists[listIndex].stocks.includes(symbol)){
            let index = requestingUser.myWatchlists[listIndex].stocks.indexOf(symbol);
            requestingUser.myWatchlists[listIndex].stocks.splice(index, 1);
        }
        else{
            alert("Your watchlist does not contain this stock.");
        }
    }
    
    
}



function renderMyStocksTable() {
    
    //Table Heading Titles
    let newTableHeader = document.createElement("table");
    newTableHeader.id = "myStocksHeader";
    let newTableHeaderRow = document.createElement("tr");
    let titleSymbol = document.createElement("td");
    titleSymbol.innerHTML = "Symbol";
    let titleName = document.createElement("td");
    titleName.innerHTML = "Company";
    let titlePrice = document.createElement("td");
    titlePrice.innerHTML = "Current Price";
    let titleAvgPrice = document.createElement("td");
    titleAvgPrice.innerHTML = "Average Price";
    let titleQuantity = document.createElement("td");
    titleQuantity.innerHTML = "Quantity";
    let titleDailyPercentChange = document.createElement("td");
    titleDailyPercentChange.innerHTML = "Daily % Change";
    let titlePercentPL = document.createElement("td");
    titlePercentPL.innerHTML = "Profit & Loss %";

    newTableHeaderRow.appendChild(titleSymbol);
    newTableHeaderRow.appendChild(titleName);
    newTableHeaderRow.appendChild(titlePrice);
    newTableHeaderRow.appendChild(titleAvgPrice);
    newTableHeaderRow.appendChild(titleQuantity);
    newTableHeaderRow.appendChild(titleDailyPercentChange);
    newTableHeaderRow.appendChild(titlePercentPL);
    newTableHeader.appendChild(newTableHeaderRow);

    let originalTableHeader = document.getElementById("myStocksHeader");
    originalTableHeader.parentNode.replaceChild(newTableHeader, originalTableHeader);


    //renders a specific user's stocks on the page
    let newTable = document.createElement("table");
    newTable.id = "myStocks";

    requestingUser.myStocks.forEach(elem => {
        let stock = masterStocksList.find(stock => stock.symbol===elem.symbol);
        elem.price = stock.price;

        //Create row for each stock
        let newRow = document.createElement("tr");
        newRow.id = elem.symbol;
        newRow.name = "myStocks";

        //Create td for each piece of info then append
        for (let key in elem){
            if (key==="symbol"){
                let data = document.createElement("td");
                data.innerHTML = "<a href=/stocks/"+elem.symbol+">"+elem.symbol+"</a>"
                newRow.appendChild(data);
            }
            else {
                let data = document.createElement("td");
                data.innerHTML = elem[key];
                newRow.appendChild(data);
            }
        }
        //Daily % Change Info
        let dailyPercentChange = document.createElement("td");
        // let stock = masterStocksList.find(stock => stock.symbol===elem.symbol);
        let yesterdayPrice = stock.history[currentDay-1].closing;
        dailyPercentChange.innerHTML = ((elem.price-yesterdayPrice)/elem.price * 100).toFixed(2);
        if(dailyPercentChange.innerHTML>0){
            dailyPercentChange.id = "profit";
        }
        else if (dailyPercentChange.innerHTML<0){
            dailyPercentChange.id = "loss";
        }
        newRow.appendChild(dailyPercentChange);
        
        //P&L % Info
        let profitAndLoss = document.createElement("td");
        profitAndLoss.innerHTML = ((elem.price-elem.avgPrice)/elem.price * 100).toFixed(2);
        //for color text (red/green)
        if(profitAndLoss.innerHTML>0){
            profitAndLoss.id = "profit";
        }
        else if (profitAndLoss.innerHTML<0){
            profitAndLoss.id = "loss";
        }
        newRow.appendChild(profitAndLoss);
        newTable.appendChild(newRow);
    });

    let originalTable = document.getElementById("myStocks");
    originalTable.parentNode.replaceChild(newTable, originalTable);
}



function renderMyWatchlistTable(index) {

    //Table Heading Titles
    let newTableHeader = document.createElement("table");
    newTableHeader.id = "myWatchlistHeader";
    let newTableHeaderRow = document.createElement("tr");
    let titleSymbol = document.createElement("td");
    titleSymbol.innerHTML = "Symbol";
    let titleName = document.createElement("td");
    titleName.innerHTML = "Company";
    let titlePrice = document.createElement("td");
    titlePrice.innerHTML = "Price";
    let titleLow = document.createElement("td");
    titleLow.innerHTML = "Daily Low";
    let titleHigh = document.createElement("td");
    titleHigh.innerHTML = "Daily High";
    let titleBid = document.createElement("td");
    titleBid.innerHTML = "Current Bid";
    let titleAsk = document.createElement("td");
    titleAsk.innerHTML = "Current Ask";
    let titleNumSold = document.createElement("td");
    titleNumSold.innerHTML = "Shares Traded Today";

    newTableHeaderRow.appendChild(titleSymbol);
    newTableHeaderRow.appendChild(titleName);
    newTableHeaderRow.appendChild(titlePrice);
    newTableHeaderRow.appendChild(titleLow);
    newTableHeaderRow.appendChild(titleHigh);
    newTableHeaderRow.appendChild(titleBid);
    newTableHeaderRow.appendChild(titleAsk);
    newTableHeaderRow.appendChild(titleNumSold);

    newTableHeader.appendChild(newTableHeaderRow);

    let originalTableHeader = document.getElementById("myWatchlistHeader");
    originalTableHeader.parentNode.replaceChild(newTableHeader, originalTableHeader);


    if(index >= 0 && requestingUser.myWatchlists.length>0){
    //If selection is valid

        //renders a specific user's stocks on the page
        let newTable = document.createElement("table");
        newTable.id = "myWatchlistView";


        requestingUser.myWatchlists[index].stocks.forEach(elem => {

            //Create row for each stock
            let newRow = document.createElement("tr");
            newRow.id = elem;
            newRow.name = "myWatchlist";

            let stockInfo = masterStocksList.find(stock => stock.symbol === elem);
            for (let key in stockInfo){
                if (key==="symbol"){
                    let data = document.createElement("td");
                    data.innerHTML = "<a href=/stocks/"+stockInfo.symbol+">"+stockInfo.symbol+"</a>"
                    newRow.appendChild(data);
                    continue;
                }
                if (key==="history"){
                    continue;
                }
                else {
                    let data = document.createElement("td");
                    data.innerHTML = stockInfo[key];
                    newRow.appendChild(data);
                }
            }

            newTable.appendChild(newRow);
        });

        let originalTable = document.getElementById("myWatchlistView");
        originalTable.parentNode.replaceChild(newTable, originalTable);

    } else {
        // Then no table is selected, so nothing should show
            // i.e. if user removes all tables
        let newTable = document.createElement("table");
        newTable.id = "myWatchlistView";

        let originalTable = document.getElementById("myWatchlistView");
        originalTable.parentNode.replaceChild(newTable, originalTable);

    }
}

function renderMySubscriptionsTable() {
    //Table Heading Titles
    let newTableHeader = document.createElement("table");
    newTableHeader.id = "mySubscriptionsHeader";
    let newTableHeaderRow = document.createElement("tr");
    let titleRemoveButton = document.createElement("td");
    titleRemoveButton.innerHTML = "";
    let titleActive = document.createElement("td");
    titleActive.innerHTML = "Active";
    let titleSymbol = document.createElement("td");
    titleSymbol.innerHTML = "Symbol";
    let titleMinPercentChange = document.createElement("td");
    titleMinPercentChange.innerHTML = "Min % Change";
    let titleEdit = document.createElement("td");
    titleEdit.innerHTML = "Edit";

    newTableHeaderRow.appendChild(titleRemoveButton);
    newTableHeaderRow.appendChild(titleSymbol);
    newTableHeaderRow.appendChild(titleMinPercentChange);
    newTableHeaderRow.appendChild(titleActive);
    newTableHeaderRow.appendChild(titleEdit);
    newTableHeader.appendChild(newTableHeaderRow);

    let originalTableHeader = document.getElementById("mySubscriptionsHeader");
    originalTableHeader.parentNode.replaceChild(newTableHeader, originalTableHeader);

    //renders a specific user's pending orders on the page
    let newTable = document.createElement("table");
    newTable.id = "mySubscriptionsTable";

    mySubscriptions.forEach(elem => {

            //Create row for each order
            let newRow = document.createElement("tr");
            newRow.name = "mySubscriptions";

            let removeButton = document.createElement("button");
            removeButton.className = "smallButtons";
            removeButton.innerHTML = "-";
            removeButton.addEventListener("click", function() {
                let index = mySubscriptions.indexOf(elem);
                mySubscriptions.splice(index, 1);
                delSubscription(elem.symbol);
            });
            let removeButtonTD = document.createElement("td");
            removeButtonTD.appendChild(removeButton);
            newRow.appendChild(removeButtonTD);

            //Create td for each piece of info then append
            for (let key in elem){
                if (key==="userID" || key==="notifiedToday") {
                    continue;
                }
                if (key==="symbol"){
                    let data = document.createElement("td");
                    data.innerHTML = "<a href=/stocks/"+elem.symbol+">"+elem.symbol+"</a>"
                    newRow.appendChild(data);
                }
                else if (key==="activated"){
                    let activeButtonTD = document.createElement("td");
                    let activeButton = document.createElement("button");
                    activeButton.className = "smallButtons";
                    activeButton.innerHTML = "";
                    if(elem.activated==true){
                        activeButton.id = "activated";
                    } else {
                        activeButton.id = "deactivated";
                    }
                    activeButton.addEventListener("click", function() {
                        elem.activated = !elem.activated;
                        if(elem.activated==true){
                            activeButton.id = "activated";
                        } else {
                            activeButton.id = "deactivated";
                        }
                        updateSubscriptions();
                        //if true/false then change ID so color can change
                    });
                    activeButtonTD.appendChild(activeButton);
                    newRow.appendChild(activeButtonTD);
                }
                else {
                    let data = document.createElement("td");
                    data.innerHTML = elem[key];                    
                    newRow.appendChild(data);
                }
            }
            let editButtonTD = document.createElement("td");
            let editButton = document.createElement("button");
            editButton.className = "smallButtons";
            editButton.innerHTML = "...";
            editButton.addEventListener("click", function() {
                let newMinPercentChange = prompt("What's the new minimum percent change? ");
                let sub = mySubscriptions.find(sub => sub.symbol===elem.symbol);
                sub.minPercentChange = Number(newMinPercentChange);
                updateSubscriptions(renderMySubscriptionsTable);
            });
            editButtonTD.appendChild(editButton);
            newRow.appendChild(editButtonTD);

            newTable.appendChild(newRow);
    });

    let originalTable = document.getElementById("mySubscriptionsTable");
    originalTable.parentNode.replaceChild(newTable, originalTable);
}

function updateSubscriptions(next) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState==4 && this.status==200){
            console.log(this.responseText);
            if(next){
                next();
            }
        }
    }
    xhttp.open("PUT", "/"+requestingUser.userID+"/subscriptions", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify(mySubscriptions));
}

function getSubscriptions(next) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState==4 && this.status==200){
            mySubscriptions = JSON.parse(this.responseText);
            if(next){
                next();
            }
        }
    }
    xhttp.open("GET", "/"+requestingUser.userID+"/subscriptions", true);
    xhttp.send();
}



//STOCKS PAGE
/*==========*/
function initStocksPage() {
    console.log("initStocksPage()");
}


//STOCK PAGE
/*==========*/
function initStockPage() {
    console.log("initStockPage()");
    requestingUser = getRequestingUserNoRender(renderWatchlistSelection, getSubscriptions);
    let thisStock = document.getElementById("thisStockSymbol").innerHTML;

    //Handlers
    let subscribeButton = document.getElementById("subscribeButton");
    subscribeButton.addEventListener("click", function(){
        let minPercentChange = document.getElementById("minPercentChange").value;
        if(Number(minPercentChange)>0){
            subscribe(thisStock, minPercentChange);
            document.getElementById("minPercentChange").value = "";
        } else {
            alert("Min percent change has to be a valid number.");
        }
    });
    
    let placeOrder = document.getElementById("submitOrder");
    placeOrder.addEventListener("click", function(){
        console.log("Place Order Button Clicked")
        order(thisStock);
    });

    let addStockToWatchlistButton = document.getElementById("addStockToWatchlistOnStockPage");
    addStockToWatchlistButton.addEventListener("click", function() {
        console.log("add stock to watchlist button");
        addStockToWatchlist(thisStock);
        putUserData();
    });

}

function subscribe() {
    /* This function is used to create an event subscription. */

    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        if(this.readyState==4 && this.status==200){
            //server reply.
            console.log(this.responseText);
            alert("Subscribed to " + symbol + " at %" + minPercentChange + " threshold.");
            getSubscriptions();
        }
    }
    let symbol = document.getElementById("thisStockSymbol").innerText;
    let minPercentChange = Number(document.getElementById("minPercentChange").value);
    let subscription = {symbol:symbol, minPercentChange:minPercentChange, activated:false, notifiedToday:false, userID:requestingUser.userID};
    for(let sub of mySubscriptions){
        if(sub.symbol===symbol){
            alert("You're already subscribed to this stock.");
            return;
        }
    }
    xhttp.open("POST", "/"+requestingUser.userID+"/subscriptions", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify(subscription));
}


//ORDERS PAGE
/*==========*/
function initOrdersPage() {
    console.log("initOrdersPage()");

    requestingUser = getRequestingUserNoRender();

    //Get the list of all stocks to choose
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState==4 && this.status==200) {
            masterStocksList = JSON.parse(this.responseText);
            //Can add implementation for filter buy and sell only
            renderStocksSelection("allStocks");
        }
    };
    xhttp.open("GET", "/masterStocksList", true);
    xhttp.send();

    
    //Handlers
    let placeOrder = document.getElementById("submitOrder");
    placeOrder.addEventListener("click", function(){
        console.log("Place Order Button Clicked")
        order();
    });
}

//FUNCTIONS:
function order(choice) {
    /* This function creates an order, either buy order or sell order with an optional choice argument.
        If no choice was passed in as input, then the choice must be the stock the user is viewing on the stock page. */

    let buy = document.getElementById("buy");
    let sell = document.getElementById("sell");

    let selection;

    if(!choice){
        selection = document.getElementById("allStocks").selectedIndex;
        choice = masterStocksList[selection].symbol;
    }
    else {
        selection = 1;
    }
    
    let quantity = document.getElementById("orderQuantity").value;
    let limitPrice = document.getElementById("orderLimit").value;
    let expireEOD = document.getElementById("orderEOD");
    let expireGTC = document.getElementById("orderGTC");

    //If the form is incomplete then don't submit the order
    if(selection+1 && choice && quantity && limitPrice && (expireEOD.checked || expireGTC.checked)){
        if(buy.checked) {
            if(expireEOD.checked){
                submitBuyOrder(choice, quantity, limitPrice, "eod", requestingUser);
            }
            else if (expireGTC.checked){
                submitBuyOrder(choice, quantity, limitPrice, "gtc", requestingUser);
            }
        }
        else if(sell.checked) {
            if(expireEOD.checked){
                submitSellOrder(choice, quantity, limitPrice, "eod", requestingUser);
            }
            else if(expireGTC.checked){
                submitSellOrder(choice, quantity, limitPrice, "gtc", requestingUser);
            }
        }
        document.getElementById("buy").checked = false;
        document.getElementById("sell").checked = false;
        document.getElementById("orderQuantity").value = "";
        document.getElementById("orderLimit").value = "";
        document.getElementById("orderEOD").checked = false;
        document.getElementById("orderGTC").checked = false;
    }
    else {
        alert("Your order is not complete.");
    }

    

}

function submitBuyOrder(stock, quantity, limit, expire, requestingUser) {
    if (requestingUser.cash<=quantity*limit){
        alert("You do not have enough cash.");
        return;
    }
    let order = {userID:requestingUser.userID, stock:stock, quantity:quantity, limit:limit, expire:expire}
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState==4 && this.status==200) {
            console.log("Order Placed: "+ this.responseText);
            alert("Buy order for "+quantity+" shares of "+stock+" at limit of $"+limit+" placed, expring "+expire+".");
        }
    };
    xhttp.open("POST", "/"+requestingUser.userID+"/buyorder", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(order));
}
function submitSellOrder(stock, quantity, limit, expire, requestingUser) {
    let found = requestingUser.myStocks.find(elem => elem.symbol===stock);
    if(!found){
        alert("You don't own this stock.");
        return;
    }
    if(found && found.quantity<quantity){
        alert("You don't own enough shares.");
        return;
    }
    let order = {userID:requestingUser.userID, stock:stock, quantity:quantity, limit:limit, expire:expire}
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState==4 && this.status==200) {
            console.log("Order Placed: "+this.responseText);
            alert("Sell order for "+quantity+" shares of "+stock+" at limit of $"+limit+" placed, expring "+expire+".");
        }
    }
    xhttp.open("POST", "/"+requestingUser.userID+"/sellorder", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(order));
}



//ADMIN PAGE
/*==========*/

function initAdmin() {
    console.log("initAdmin()");
    getDay();
    getRequestingUserNoRender();

    //Handlers
    let depositButton = document.getElementById("depositButton");
    depositButton.addEventListener("click", function() {
        console.log("deposit clicked");
        deposit();
        putUserData();
    });
    let withdrawButton = document.getElementById("withdrawButton");
    withdrawButton.addEventListener("click", function() {
        console.log("withdraw clicked");
        withdraw();
        putUserData();

    });
    let eodButton = document.getElementById("eod");
    eodButton.addEventListener("click", function() {
        console.log("END OF DAY...");
        eod();
    });
}

//FUNCTIONS:
function deposit() {
    /* Add funds to the user's account */
    let amount = document.getElementById("deposit").value;

    if(amount.length==0){
        alert("No amount specified");
    }
    else{
        requestingUser.cash += parseInt(amount);
        requestingUser.history.push({day:Number(currentDay), type:"deposit", amount:Number(amount)});
        console.log(requestingUser);

        document.getElementById("deposit").value = "";
        alert("Funds deposited.");
    }
    

}
function withdraw() {
    /* Withdraw funds from the user's account. */
    let amount = document.getElementById("withdraw").value;

    if(requestingUser.cash>=parseInt(amount)){
        requestingUser.cash-=parseInt(amount);
        requestingUser.history.push({day:currentDay, type:"withdraw", amount:amount});
        alert("Funds withdrawn.");

        document.getElementById("withdraw").value = "";
    }
    else if(amount.length==0){
        alert("No amount specified.")
    }
    else {
        alert("You don't have enough cash.");
    }
}

function eod() {
    /* End of day function */
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState==4 && this.status==200) {
            console.log("New Day: "+this.responseText);
            alert("End of Day.");

        }
    };
    xhttp.open("PUT", "/eod", true);
    xhttp.setRequestHeader("Content-Type","text/html");
    xhttp.send();
}



//NEWS PAGE

function initNews() {
    getMasterStockList();
    let viewNewsButton = document.getElementById("viewNews");
    viewNewsButton.addEventListener("click", function() {
        
        viewNewsButton.innerHTML = "Fetching...";
        viewNewsButton.disabled = true;
        let stockIndex = document.getElementById("allStocks").selectedIndex;
        let symbol = masterStocksList[stockIndex].symbol;
        getNews(symbol);
    });
    
}

function renderNews(articles) {
    /* This function renders the news information gathered from Yahoo Finance News API */

    let newNews = document.createElement("div");
    newNews.id = "news";

    for(let article of articles){
        
        let title = document.createElement("h3");
        let author = document.createElement("h5");
        let summary = document.createElement("p");
        let link = document.createElement("p");
        let img = document.createElement("img");

        title.innerHTML = article.title;
        author.innerHTML = article.author;

        //Only display a maximum length of 300 characters for summaries
        if(article.summary.length > 500){
            summary.innerHTML = article.summary.slice(0,500);
            summary.innerHTML += "[...]";
        }
        else{
            summary.innerHTML = article.summary;
        }

        link.innerHTML = "<a href=" + article.link + ">" + "Read full article..." + "</a>";
        if(article.main_image){
            img.src = article.main_image.original_url;
            img.style.height = 180;
            img.style.width = 300;
        }
        
        newNews.appendChild(title);
        newNews.appendChild(author);
        newNews.appendChild(summary);
        newNews.appendChild(link);
        newNews.appendChild(img);

    }

    let originalNews = document.getElementById("news");
    originalNews.parentNode.replaceChild(newNews, originalNews);

    let viewNewsButton = document.getElementById("viewNews");
    viewNewsButton.innerHTML = "Search";
    viewNewsButton.disabled = false;
}

function getNews(symbol) {
    /* This function fetches news articles from Yahoo Finanace News API */

    let data = null;

    let xhr = new XMLHttpRequest();
    xhr.withCredentials = false;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            let rawData = JSON.parse(this.responseText);
            let articles = rawData.items.result;
            renderNews(articles);
        }
    });

    xhr.open("GET", "https://apidojo-yahoo-finance-v1.p.rapidapi.com/news/list?category="+symbol+"&region=US");
    xhr.setRequestHeader("x-rapidapi-key", "d970401e1amsh139b1463884374bp190a5cjsn9aded8f66cd1");
    xhr.setRequestHeader("x-rapidapi-host", "apidojo-yahoo-finance-v1.p.rapidapi.com");

    xhr.send(data);
}