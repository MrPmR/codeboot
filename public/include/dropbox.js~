

var dropbox_token;
var dropbox_token_secret;

// login dropbox
// test function can be deleted
function cb_dropboxLogin(){
	
	$.ajax({
	url: "http://localhost:3000/testlogin",
	type: "GET",
	async: true,
	data: { token: "nemk510rf79h8ni",
			token_secret: "v1qzvmb8all2dgi"},
	success: function(data){
	    alert("Success! " + data.username + " " + data.token);
		dropbox_token = data.token;
		dropbox_token_secret = data.token_secret;
		//save_tokens(data.token, data.token_secret);
	},
	error: function (jqXHR, textStatus, errorThrown){
	    alert("Failed! " + textStatus + " (" + errorThrown + ")");
		
		window.location = "http://localhost:3000/auth/dropbox";
	}
    });
}

// Test if token and token_secret works. If it does, retreive the user name.
function cb_dropboxTestLogin(){
	

	$.ajax({
		url: "http://localhost:3000/testlogin",
		type: "GET",
		async: true,
		data: { token: dropbox_token,
				token_secret: dropbox_token_secret},
		success: function(data){
			
			cb_setConnected(data);
		},
		// Not connected
		error: function (jqXHR, textStatus, errorThrown){
			cb_logout();
			console.log("Test failed");
			
		}
    });

}

function cb_setConnected(data){
	dropbox_token = data.token;
	dropbox_token_secret = data.token_secret;
	var element = document.getElementById("dropboxStatus");
	element.innerHTML = data.username + " (logout)";
	element.href = "#";
	element.setAttribute( "onClick" , "javascript : cb_logout(); return false;");
}


function cb_logout(){
	dropbox_token = undefined;
	dropbox_token_secret = undefined;
	cb.saveSession();
	var element = document.getElementById("dropboxStatus");
	element.innerHTML = "Connect with dropbox";
	element.href = "/auth/dropbox";
	//element.onclick = function() {};
	element.setAttribute( "onClick" , "javascript : ");
	//logout from session in node
	$.ajax({
		url: "http://localhost:3000/logout",
		type: "GET",
		async: true,
		success: function(){
	    	//alert("Success! ");
			console.log("success, logged out");
		},
		error: function (jqXHR, textStatus, errorThrown){
	    	//alert("Failed! " + textStatus + " (" + errorThrown + ")");
			console.log("failed " + textStatus + " ( " + errorThrown + ")");
		}
    });
}


cb.serializeDropboxState = function(){

	var json = {
        token: dropbox_token,
        token_secret: dropbox_token_secret
    };
    return json;

}
cb.restoreDropbox = function(dropbox){
	console.log("restore : " + dropbox.token + " " + dropbox.token_secret);
	dropbox_token = dropbox.token;
	dropbox_token_secret = dropbox.token_secret;
	cb_dropboxTestLogin();
}

// Test function can be deleted
function cb_login() {
    $.ajax({
	url: "http://localhost:3000/loginn",
	type: "GET",
	async: true,
	success: function(data){
	    alert("Success! " + data);
	},
	error: function (jqXHR, textStatus, errorThrown){
	    alert("Failed! " + textStatus + " (" + errorThrown + ")");
	}
    });

}





//*************************************** File system dropbox ***


// test function, can be deleted
function cb_refresh() {
    $.ajax({
        url: "http://localhost:3000/test/get",
        type: "GET",
        async: true,
        success: function(data){
            // alert("Success! " + data);
	    // refresh_local_files("testfact.js", data);
		console.log(data);
		//alert("Success! " + data);
	    //refresh_local_files("random", data);
		//donnees = JSON.parse(data)
	    alert("Success! " + data.files[0].file);
	    refresh_local_files(data.files[0].filename, data.files[0].file);
	    
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Failed! " + textStatus + " (" + errorThrown + ")");
        }
    });
}


// add files from dropbox
function add_many_toLocal(files) {


	for(var i = 0; i < files.length; i++){
		fileName = getFileName(files[i].path);
		//rejet des noms contenant un tild
		if(!fileName.contains("~")){
			dropboxGetFile(files[i].path, fileName);
		}
	}

}


function add_file_toLocal(filename, content){
    // var filename = "testfact.js";
    var file = new CPFile(filename, content);

	if(!cb.fs.hasFile(filename)){

    	cb.fs.addFile(file);

    	cb.addFileToMenu(file);
	}


    // cb.newTab(file);
    return filename;

}



// Fonction temporaire de test
function cb_refresh_many() {
    $.ajax({
        url: "http://localhost:3000/getmany",
        type: "GET",
        async: true,
		data: { token: dropbox_token, token_secret: dropbox_token_secret},
        success: function(data){
            
	    // refresh_local_files("testfact.js", data);
	    //donnees = JSON.parse(data)

	    //alert("Success! " + donnees.files[0].file);
			add_many_toLocal(data);
	    //refresh_local_files(donnees.files[0].filename, donnees.files[0].file);
	    
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("Failed! " + textStatus + " (" + errorThrown + ")");
	
        }
    });
}

// Fonction temporaire de test
function cb_getDropboxFilesMetaData() {
	var metadata;
    $.ajax({
        url: "http://localhost:3000/getmany",
        type: "GET",
        async: true,
		data: { token: dropbox_token, token_secret: dropbox_token_secret},
        success: function(data){
            
			metadata =  data;
	    
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("Failed! " + textStatus + " (" + errorThrown + ")");
	
        }
    });
	return metadata;
}




// Remove the path and only keeps the file name
function getFileName(path) {
	//return path.split(&#39/&#39).pop();
	return path.split("/").pop();
}



// Retreive a file from dropbox
function dropboxGetFile(path, filename) {
    $.ajax({
        url: "http://localhost:3000/getfile",
        type: "GET",
        async: true,
		data: { path: path, token: dropbox_token, token_secret: dropbox_token_secret},

        success: function(data){
            // alert("Success! " + data);
	    // refresh_local_files("testfact.js", data);
		//alert("Success! " + data);
	    //refresh_local_files("random", data);
		//donnees = JSON.parse(data)
	    
	    add_file_toLocal(filename, data.files[0].content);
	    
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Failed! " + textStatus + " (" + errorThrown + ")");
        }
    });
}


// Synchronise with dropbox
function cb_syncDropbox(){
	
	//for(var filename in cb.fs.files){

	$.ajax({
        url: "http://localhost:3000/getmany",
        type: "GET",
        async: true,
		data: { token: dropbox_token, token_secret: dropbox_token_secret},
        success: function(data){
            
			//for(var i = 0; i < data.length; i ++){
			//	console.log(data[i].path);
			//}
			
			var missingFiles = cb_dropboxMissingFiles(data);
			for(var i in missingFiles){
				cb_dropboxSendFile(missingFiles[i]);

			}

			add_many_toLocal(data);
	    
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("Failed! " + textStatus + " (" + errorThrown + ")");
	
        }
    });

	
}

// Test which files are missing in the dropbox
function cb_dropboxMissingFiles(dropboxFiles){
	
	var results = new Array();
	for(var filename in cb.fs.files){
		if(filename.contains("sample"))
			continue;
		var exist = false;
		for(var i in dropboxFiles){
			if(dropboxFiles[i].path == "/" + filename){
				exist = true;
				break;
			}
		}	

		if(!exist)
			results.push(filename);
		
	}
	
	return results;
	
}

// Send a file to dropbox
function cb_dropboxSendFile(filename){
	
	
	file = cb.fs.getByName(filename);
	$.ajax({
        url: "http://localhost:3000/sendfile",
        type: "GET",
        async: true,
		data: { filename: file.filename, content:file.content, token: dropbox_token, token_secret: dropbox_token_secret},

        success: function(data){
            // alert("Success! " + data);
	    // refresh_local_files("testfact.js", data);
		//alert("Success! " + data);
	    //refresh_local_files("random", data);
		//donnees = JSON.parse(data)
	    
	    //refresh_local_files(filename, data.files[0].content);
	    console.log("Sent : " + file.filename);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Failed! " + textStatus + " (" + errorThrown + ")");
        }
    });

}



