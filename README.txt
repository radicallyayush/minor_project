BetterLoot is a stock market web app made with Node JS and Express.

Users can register, trade, create watchlists, view history, read news, and much more.
    
    run node server.js to start the application.
    localhost:3000
    or
    https://betterloot.herokuapp.com/
    
    You may register and login with your own info,
      OR you can login as 'auto1' through 'auto20' pw:tester
        If you choose to login as an auto user, you will notice the automation of orders
        in realtime when in the "LIVE" state (top left corner).
        Sit back and enjoy the 'auto' users.

REST API:
    All routes support REST API, here are some examples (this is not a complete list).
    Postman Collections allow for easier and quicker automated testing (see folder).
    
      /users/:username
      /stocks                 ?symbol= &minprice= &maxprice=
      /stocks/symbol          ?startday= &endday=
      /stocks/symbol/history  ?startday= &endday=
      /masterStocksList
      /day
      /:uid/orders
      /orders
      /:uid/subscriptions
      /:uid/notifications
      /logout

    The POST routes also work, but you must adhere to exactly what is required as JSON.
      For example you can POST to /login but you need to send:
        {username:yourusername, password:yourpassword} for it to work.
        Same with any other POST, PUT, and DELETE.
