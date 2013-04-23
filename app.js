

var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , DropboxStrategy = require('passport-dropbox').Strategy;

var fs = require('fs');
var http = require('https');
var DropboxClient = require('dropbox-node').DropboxClient;

var config;
try {
    config = require('./config');
} catch (e) {
    console.log("No configuration found in 'config.js'");
    console.log("Copy 'config.js.sample' to 'config.js' and edit the file to get started.");
    process.exit(1);
}
var DROPBOX_APP_KEY = config.DROPBOX_APP_KEY;
var DROPBOX_APP_SECRET = config.DROPBOX_APP_SECRET;



passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the DropboxStrategy within Passport.
passport.use(new DropboxStrategy({
    consumerKey: DROPBOX_APP_KEY,
    consumerSecret: DROPBOX_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/dropbox/callback"
  },
  function(token, tokenSecret, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
	var dropbox = new DropboxClient(DROPBOX_APP_KEY, DROPBOX_APP_SECRET, token, tokenSecret);
	dropbox.root = 'sandbox';
	
	return done(null, dropbox);
    });
  }
));




var app = express();

// configure Express
app.configure(function() {
    app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.engine('html', require('ejs').renderFile);
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  // Initialize Passport! Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});


app.get('/', function(req, res){
    res.render('index.html');
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});



app.get('/login', function(req, res){
    res.render('login', { user: req.user });
});

// GET /auth/dropbox
// Use passport.authenticate() as route middleware to authenticate the
// request. The first step in Dropbox authentication will involve redirecting
// the user to dropbox.com. After authorization, Dropbox will redirect the user
// back to this application at /auth/dropbox/callback
app.get('/auth/dropbox',
  passport.authenticate('dropbox'),
  function(req, res){
    // The request will be redirected to Dropbox for authentication, so this
    // function will not be called.
  });

// GET /auth/dropbox/callback
// Use passport.authenticate() as route middleware to authenticate the
// request. If authentication fails, the user will be redirected back to the
// login page. Otherwise, the primary route function function will be called,
// which, in this example, will redirect the user to the home page.
app.get('/auth/dropbox/callback',
  passport.authenticate('dropbox', { failureRedirect: '/login' }),
  function(req, res) {
      console.log(req.user);
      res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});




    
// Test if the person is logged in
app.get('/testlogin', function(req, res){

    var access_token;
    var access_token_secret;
    
    
    if(req.user == undefined){
	access_token = req.query.token;
	access_token_secret = req.query.token_secret;
    }
    else{
	access_token = req.user.access_token;
	access_token_secret = req.user.access_token_secret;
    }
    
    var dropbox = new DropboxClient(DROPBOX_APP_KEY, DROPBOX_APP_SECRET, access_token, access_token_secret);
    dropbox.root = 'sandbox';
    
    dropbox.getAccountInfo(function(err, data){
	// Error while getting account info
	if (err) {
	    console.log("Error: " + err);
	    res.send(401, err);
	}
	// Change main page to put user information in it, and refresh local tokens
	else{
	    console.log("Logged");
	    datajson = {"username": data.display_name, "token":access_token, "token_secret":access_token_secret};

	    req.user = dropbox;
	    
	    res.status(200);
	    res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin':'*'});
	    res.end(JSON.stringify(datajson));
	}
    });
    

    
});



// Test if the file exist on dropbox and delete it
app.get('/deletefile', function(req, res){
    console.log('will delete the file');
    access_token = req.query.token;
    access_token_secret = req.query.token_secret;
    var dropbox = new DropboxClient(DROPBOX_APP_KEY, DROPBOX_APP_SECRET, access_token, access_token_secret);
    dropbox.root = 'sandbox';


    dropbox.getMetadata(req.query.path, function(err, data){
	// If the file was never created on dropbox
	if(err){
	    res.status(200);
	    res.send(200);
	    //return console.log(err);
	}else{
	    // if the file was deleted previously
	    if(data.is_deleted){
		res.status(200);
		res.send(200);
	    }
	    else{
		console.log(data);
		dropbox.deleteItem(req.query.path, function(err2, data){
		    if(err2) return console.log(err2);
		    res.status(200);
		    res.send(200);
		});
	    }
	}

    });

/*
    dropbox.deleteItem(req.query.path, function(err, data){
	if(err) return console.log(err);
    });*/
});




// Send the content in the query to dropbox
app.get('/sendfile',  function(req, res){
    
    access_token = req.query.token;
    access_token_secret = req.query.token_secret;
    
    var dropbox = new DropboxClient(DROPBOX_APP_KEY, DROPBOX_APP_SECRET, access_token, access_token_secret);
    dropbox.root = 'sandbox';
    // write the content to a file temporarly
    fs.writeFile("/tmp/" + req.query.filename, req.query.content,  function(err){
	if(err){
	    return console.log(err);
	}
    });
    if(req.query.rev == 0){
	// Send the file to dropbox
	dropbox.putFile("/tmp/" + req.query.filename, '/' + req.query.filename, function (err, data){
    	    if (err) return console.log(err);
	    
	    console.log("File : " + req.query.filename);
	    console.log("revision before : " + req.query.rev);
	    console.log("revision after : " + data.rev);
	    res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin':'*'});
	    
	    
	    res.status(200);
	    res.end(JSON.stringify(data));
	});



    }
    else{
	// Send the file to dropbox
	dropbox.putFile("/tmp/" + req.query.filename, '/' + req.query.filename,  { parent_rev: req.query.rev }, function (err, data){
    	    if (err) return console.log(err);
	    
	    console.log("File : " + req.query.filename);
	    console.log("revision before : " + req.query.rev);
	    console.log("revision after : " + data.rev);
	    res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin':'*'});
	    
	    
	    res.status(200);
	    res.end(JSON.stringify(data));
	});

    }
    // Delete the file afterward
    fs.unlink("/tmp/" + req.query.filename, function(err){
	if(err){
	    return console.log(err);
	}
    });
    
    
   // res.redirect('/');
});



// Return a json of files' metadata
app.get('/getmany', function(req, res){
    
    access_token = req.query.token;
    access_token_secret = req.query.token_secret;
    
    var dropbox = new DropboxClient(DROPBOX_APP_KEY, DROPBOX_APP_SECRET, access_token, access_token_secret);
    dropbox.root = 'sandbox';
    dropbox.search('/', ".js" , {include_deleted:true}, function(err, data){
	if (err) return console.log(err);

	
	res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin':'*'});
	
	
        res.status(200);
        res.end(JSON.stringify(data));
	
    });

    
});


// Return a json of files' metadata
app.get('/delta', function(req, res){
    
    access_token = req.query.token;
    access_token_secret = req.query.token_secret;
    
    
    var dropbox = new DropboxClient(DROPBOX_APP_KEY, DROPBOX_APP_SECRET, access_token, access_token_secret);
    dropbox.root = 'sandbox';
    dropbox.delta(req.query.cursor , function(err, data){
	if (err) return console.log(err);

	
	
	res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin':'*'});
	
	
        res.status(200);
        res.end(JSON.stringify(data));
	
    });

    
});


// Get a file from path (parameter)
app.get('/getfile', function(req, res){

    console.log("Will attempt to read" + req.query.path);
    
    access_token = req.query.token;
    access_token_secret = req.query.token_secret;
    
    var dropbox = new DropboxClient(DROPBOX_APP_KEY, DROPBOX_APP_SECRET, access_token, access_token_secret);
    dropbox.root = 'sandbox';
    dropbox.getFile(req.query.path, function(err, content){
        if (err) {
            console.log("Can't read " + req.query.path);
        }
        if (err) return console.log(err);
	
        console.log("Got " + req.query.path + " successfully");
	
	
	dropbox.getMetadata(req.query.path, function(err, metadata){
	    
	    datajson = {"files": [{"content": content, "rev":metadata.rev}]};
	    
	    res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin':'*'});
	
	
            res.status(200);
            res.end(JSON.stringify(datajson));
	});

    });
});

    

    


app.listen(3000);
console.log('listening on 3000');


// Simple route middleware to ensure user is authenticated.
// Use this route middleware on any resource that needs to be protected. If
// the request is authenticated (typically via a persistent login session),
// the request will proceed. Otherwise, the user will be redirected to the
// login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
    res.redirect('/auth/dropbox');
}
