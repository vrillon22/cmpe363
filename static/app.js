//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; //stream from getUserMedia()
var rec; //Recorder.js object
var input; //MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //audio context to help us record
/*
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseRecording);
*/

const microphoneImage = document.getElementById("microphoneInput");
const microphoneContainer = document.getElementById("microphoneContainer");
const textHolder = document.getElementById("W");

microphoneImage.addEventListener("click",()=>{
  if(!listening){
    startRecording();
    
  }
  else{
    stopRecording();
    microphoneContainer.style.backgroundColor = "white";
  }
})
let listening = false

function startRecording() {
  console.log("recordButton clicked");

  /*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/

  var constraints = { audio: true, video: false };

  /*
    	Disable the record button until we get a success or fail from getUserMedia() 
	*/
/*
  recordButton.disabled = true;
  stopButton.disabled = false;
  pauseButton.disabled = false;
*/
  /*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      console.log(
        "getUserMedia() success, stream created, initializing Recorder.js ..."
      );
      listening = true;
      microphoneContainer.style.backgroundColor = "red";
      audioContext = new AudioContext();

      //update the forma

      /*  assign to gumStream for later use  */
      gumStream = stream;

      /* use the stream */
      input = audioContext.createMediaStreamSource(stream);
      rec = new Recorder(input, { numChannels: 1 });

      //start the recording process
      rec.record();

      console.log("Recording started");
    })
    .catch(function (err) {

    });
}

function pauseRecording() {
  console.log("pauseButton clicked rec.recording=", rec.recording);
  if (rec.recording) {
    //pause
    rec.stop();
    pauseButton.innerHTML = "Resume";
  } else {
    //resume
    rec.record();
    pauseButton.innerHTML = "Pause";
  }
}

function stopRecording() {
  listening = false;
  console.log("stopButton clicked");

  //reset button just in case the recording is stopped while paused

  //tell the recorder to stop the recording
  rec.stop();

  //stop microphone access
  gumStream.getAudioTracks()[0].stop();

  //create the wav blob and pass it on to createDownloadLink
  rec.exportWAV(createDownloadLink);
}

function createDownloadLink(blob) {
  var reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = function () {
    var base64data = reader.result;
    console.log(base64data);
    fetch("https://localhost:7097/api/SpeechServices", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(base64data.split(",")[1]),
    })
      .then((response) => response.json())
      .then((response) => textHolder.value = response.replace(".",""));
  };

  var url = URL.createObjectURL(blob);
  var au = document.createElement("audio");
  var li = document.createElement("li");
  var link = document.createElement("a");

  //name of .wav file to use during upload and download (without extendion)
  var filename = new Date().toISOString();

  //add controls to the <audio> element
  au.controls = true;
  au.src = url;

  //save to disk link
  link.href = url;
  link.download = filename + ".wav"; //download forces the browser to donwload the file using the  filename
  link.innerHTML = "Save to disk";

  //add the new audio element to li
  li.appendChild(au);

  //add the filename to the li
  li.appendChild(document.createTextNode(filename + ".wav "));

  //add the save to disk link to li
  li.appendChild(link);

  //upload link
  var upload = document.createElement("a");
  upload.href = "#";
  upload.innerHTML = "Upload";
  upload.addEventListener("click", function (event) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function (e) {
      if (this.readyState === 4) {
        console.log("Server returned: ", e.target.responseText);
      }
    };
    var fd = new FormData();
    fd.append("audio_data", blob, filename);
    xhr.open("POST", "upload.php", true);
    xhr.send(fd);
  });
  li.appendChild(document.createTextNode(" ")); //add a space in between
  li.appendChild(upload); //add the upload link to li

  //add the li element to the ol
  recordingsList.appendChild(li);
}
