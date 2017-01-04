
<script>


  var edit = document.querySelector("#edit");
	var profileImage = document.getElementById("profileImage");
	
	profileImage.addEventListener("click", function(e){
		if(edit.getAttribute("data-isEdit") == 1){
			var imageElem = document.getElementById("imageElem");
			imageElem.click();	
		}
	});

  edit.addEventListener("click", function(e){
		var profileImage = document.getElementById("profileImage");
		if(edit.getAttribute("data-isEdit") == 0){
			edit.setAttribute("data-isEdit", 1);
			edit.src = "/images/save_icon.png";
			showBannerInput();
			showAboutInput();
			profileImage.style.border = "4px solid grey";
		}else{
			edit.setAttribute("data-isEdit", 0);
			hideInput();
			profileImage.style.border = "none";
			edit.src = "/images/edit_icon.png";
		}
  });

function handleImage(file){
		var url = window.URL.createObjectURL(file[0]);
		var profileImage = document.getElementById("profileImage");
		profileImage.src=url;
		var form = document.forms.namedItem("profileForm");

		formData = new FormData(form);

		var req = new XMLHttpRequest();
		req.open("POST", "/p/{{ userProfile }}/update/about", true);
		req.send(formData);
}

function showBannerInput(){
  var flashBanner = document.getElementById("flashBanner");

  if(flashBanner.getAttribute("data-token") == "0"){
    var input = document.createElement("textarea");
    var value;
    flashBanner.setAttribute("data-token", "1");
    input.className = "input";
    input.setAttribute("id", "flashBannerInput");
    value = flashBanner.innerText;
    flashBanner.innerText = '';
    input.value = value;
    flashBanner.appendChild(input);
  }
}

function showAboutInput(){
  var about = document.getElementById("about");

  if(about.getAttribute("data-token") == "0"){
    var input = document.createElement("textarea");
    var value;
    about.setAttribute("data-token", "1");
    input.className = "input";
    input.setAttribute("id", "aboutInput");
    value = about.innerText;
    about.innerText = '';
    input.value = value;
    about.appendChild(input);
  }
}


function hideInput(){
  var flashBanner = document.getElementById("flashBanner");
  var about = document.getElementById("about");

  if(about.getAttribute("data-token") == "1"){
    var input = document.getElementById("aboutInput");
    var p = document.createElement("p");
    var value = input.value;
    p.id = "aboutContext";
    p.innerText = value;
    about.removeChild(input);
    about.appendChild(p);
    about.setAttribute("data-token", "0");

		var req = new XMLHttpRequest();
		var messageData  = {}
		messageData['about'] = value;
		req.open("POST", "/p/{{ userProfile }}/update/about", true);
		req.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		req.send(JSON.stringify(messageData));
  }

  if(flashBanner.getAttribute("data-token") == "1"){
    var input = document.getElementById("flashBannerInput");
    var p = document.createElement("p");
    var value = input.value;
    p.id = "flashBannerContext";
    p.innerText = value;
    flashBanner.removeChild(input);
    flashBanner.appendChild(p);
    flashBanner.setAttribute("data-token", "0");

		var req = new XMLHttpRequest();
		var messageData  = {}
		messageData['flashBanner'] = value;
		req.open("POST", "/p/{{ userProfile }}/update/about", true);
		req.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		req.send(JSON.stringify(messageData));
  }
}

</script>
