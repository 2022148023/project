const video = document.querySelector("video");
const canvas = document.querySelector("canvas");
const screenshotContainer = document.querySelector(".screenshot-container");
const screenshotImage = document.querySelector("img.screenshot-image");
const screenshotButton = document.querySelector("button.screenshot-button");

let streamStarted = false;

const Toast = Swal.mixin({
  toast: true,
  position: "bottom-start",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const broswerWidth = window.innerWidth;
const browserHeight = window.innerHeight;

const constraints = {
  video: {
    facingMode: "environment",
  },
};

const getCameraSelection = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );
    const updatedConstraints = {
      ...constraints,
      deviceId: {
        exact: videoDevices[0].deviceId,
      },
    };
    startStream(updatedConstraints);
  } catch (e) {
    Toast.fire({
      icon: "error",
      title: "카메라 실행중 문제가 발생하였습니다.",
    });
    screenshotButton.setAttribute("disabled", "true");
  }
};

const startStream = async (constraints) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleStream(stream);
  } catch (e) {
    Toast.fire({
      icon: "error",
      title: "카메라 실행중 문제가 발생하였습니다.",
    });
    screenshotButton.setAttribute("disabled", "true");
  }
};

const handleStream = (stream) => {
  video.srcObject = stream;
  streamStarted = true;
};

const doScreenshot = async () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  screenshotImage.src = canvas.toDataURL("image/webp");
  screenshotContainer.style.display = "block";
  screenshotImage.style.display = "block";
  if (!model) {
    await initializeTeachableMachineModel();
  }
  setTimeout(async () => {
    const prediction = await model.predict(canvas);
    prediction.sort(
      (prediction1, prediction2) =>
        prediction2.probability - prediction1.probability
    );
    console.log(prediction);

    var context = "";
    for (var body of descriptionData[prediction[0].className].context) {
      context += "<h1>" + body.tag + "</h1>";
      for (var line of body.description) context += "<p>" + line + "</br>";
      context += "</p>";
    }
    var imageURL =
      "/images/trash_type/" + descriptionData[prediction[0].className].image;

    Swal.fire({
      html: context,
      imageUrl: imageURL,
      imageWidth: "75%",
      imageHeight: "80%",
      imageAlt: "Custom image",
      confirmButtonText: "확인",
    });
    screenshotContainer.style.display = "none";
  }, 2000);
};

screenshotButton.onclick = doScreenshot;

let descriptionData = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await getCameraSelection();
    fetch("/data/description.json")
      .then((response) => response.json())
      .then((data) => {
        descriptionData = data.trash_type;
      })
      .catch((e) => {
        Toast.fire({
          icon: "error",
          title: "카메라 실행중 문제가 발생하였습니다.",
        });
      });
  } catch (e) {
    Toast.fire({
      icon: "error",
      title: "카메라 실행중 문제가 발생하였습니다.",
    });
  }
});

// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const teachableMachineModelURL =
  "https://teachablemachine.withgoogle.com/models/6dYb8rUgB/";

let model, maxPredictions;

// Load the image model and setup the webcam
async function initializeTeachableMachineModel() {
  const modelURL = teachableMachineModelURL + "model.json";
  const metadataURL = teachableMachineModelURL + "metadata.json";

  // load the model and metadata
  // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
  // or files from your local hard drive
  // Note: the pose library adds "tmImage" object to your window (window.tmImage)
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  /*   // Convenience function to setup a webcam
  const flip = true; // whether to flip the webcam
  webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
  await webcam.setup(); // request access to the webcam
  await webcam.play();
  window.requestAnimationFrame(loop); */

  /*   // append elements to the DOM
  document.getElementById("webcam-container").appendChild(webcam.canvas);
  labelContainer = document.getElementById("label-container");
  for (let i = 0; i < maxPredictions; i++) {
    // and class labels
    labelContainer.appendChild(document.createElement("div"));
  } */
}

/* async function loop() {
  webcam.update(); // update the webcam frame
  await predict();
  window.requestAnimationFrame(loop);
} */

// run the webcam image through the image model
/* async function predict() {
  // predict can take in an image, video or canvas html element
  const prediction = await model.predict(webcam.canvas);
  for (let i = 0; i < maxPredictions; i++) {
    const classPrediction =
      prediction[i].className + ": " + prediction[i].probability.toFixed(2);
    labelContainer.childNodes[i].innerHTML = classPrediction;
  }
}
 */
