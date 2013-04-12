

var dropbox_token;
var dropbox_token_secret;

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
	cb_syncDropbox();
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
	// Sync with dropbox when a save occure
	if(dropbox_token != undefined){
		console.log("sync");
		cb_syncDropbox();
	}
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


// add files from dropbox if they aren't in local storage already
function add_many_toLocal(files) {

	
	for(var i = 0; i < files.length; i++){
		dropbox_filename = getFileName(files[i].path);
		//rejet des noms contenant un tild
		if( !(dropbox.indexOf("~") < 0 || cb.fs.hasFile(dropbox_filename))){//TODO: Change to work with chrome
			dropboxGetFile(files[i].path, dropbox_filename);
		}
	}

}


function add_file_toLocal(filename, content, rev){
    // var filename = "testfact.js";
    

	if(!cb.fs.hasFile(filename)){
		var file = new CPFile(filename, content);
		file.rev = rev;
    	cb.fs.addFile(file);

    	cb.addFileToMenu(file);
	}
	else{
		var existing_file = cb.fs.getByName(filename);
		var was_open = cb.getContainerFor(filename);
		cb.closeFile(existing_file);
		//existing_file.setContent(content);
		existing_file.content = content;
		existing_file.rev = rev;
		if(was_open)
			cb.openFile(existing_file);

	}

	//console.log(cb.fs.getByName(filename));

    // cb.newTab(file);
    return filename;

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

	    add_file_toLocal(filename, data.files[0].content, data.files[0].rev);
	    
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
			var conflicts = cb_findConflicts(missingFiles, data);
			for(var i in missingFiles){
				cb_dropboxSendFile(missingFiles[i]);

			}
			// If there will be a conflict
			if(conflicts.length > 0){
				console.log("CONFLICTS : " + conflicts);
				cb_resolveConflicts(conflicts);

			}
			else{
				// add files that weren't in localstorage already
				add_many_toLocal(data);
			}
			
			
			
	    
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("Failed! " + textStatus + " (" + errorThrown + ")");
	
        }
    });
}

// Resolve conflicts
function cb_resolveConflicts(conflicts){
	
	//for(var filename in cb.fs.files){

	$.ajax({
        url: "http://localhost:3000/getmany",
        type: "GET",
        async: true,
		data: { token: dropbox_token, token_secret: dropbox_token_secret},
        success: function(data){
            

			//****
			for(var i = 0; i < conflicts.length; i++){
				dropboxGetFile(conflicts[i], getFileName(conflicts[i]));
			}
			// Add files that weren't in local storage already
			add_many_toLocal(data);
			// Refresh
			
			
	    
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("Failed! " + textStatus + " (" + errorThrown + ")");
	
        }
    });
}

// Test to know which files will have conflicts
function cb_findConflicts(filesToSend, dropboxFiles){
	
	var conflicts = new Array();
	
	for(var i = 0; i < dropboxFiles.length; i++){
		filename = getFileName(dropboxFiles[i].path);
		if(cb.fs.hasFile(filename)){
			
			if(cb.fs.getByName(filename).rev != dropboxFiles[i].rev){
				console.log("conflict? : " + filename + " rev : (local) " + cb.fs.getByName(filename).rev + " (dropbox) " + dropboxFiles[i].rev);
				conflicts.push(dropboxFiles[i].path);
			}
		}

	}

	return conflicts;
}

// Build an array of files to send to dropbox
function cb_dropboxMissingFiles(dropboxFiles){
	
	var results = new Array();
	for(var filename in cb.fs.files){
		if(filename.indexOf("sample/") == 0)
			continue;
		else
			results.push(filename);
		/*var exist = false;
		for(var i in dropboxFiles){
			if(dropboxFiles[i].path == "/" + filename){
				exist = true;
				break;
			}
		}	

		if(!exist)
			results.push(filename);*/
		
	}
	
	return results;
	
}

// Send a file to dropbox
function cb_dropboxSendFile(filename){
	
	
	var file = cb.fs.getByName(filename);
	$.ajax({
        url: "http://localhost:3000/sendfile",
        type: "GET",
        async: true,
		data: { filename: file.filename, content:file.content, token: dropbox_token, token_secret: dropbox_token_secret, rev: file.rev},

        success: function(data){
            // alert("Success! " + data);
	    // refresh_local_files("testfact.js", data);
		//alert("Success! " + data);
	    //refresh_local_files("random", data);
		//donnees = JSON.parse(data)
	    
	    //refresh_local_files(filename, data.files[0].content);
			file.rev = data.rev;
	    	console.log("Sent : " + file.filename + " old rev : " + file.rev + " new rev : " + data.rev);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Failed! " + textStatus + " (" + errorThrown + ")");
        }
    });

}



