const video = document.querySelector("video");
const canvas = document.querySelector("canvas");
const screenshotContainer = document.querySelector(".screenshot-container");
const screenshotImage = document.querySelector("img.screenshot-image");
const screenshot = document.querySelector("button.screenshot");

let streamStarted = false;

const broswerWidth = window.innerWidth;
const browserHeight = window.innerHeight;

console.log(broswerWidth);
console.log(browserHeight);

const constraints = {
  video: {
    width: {
      min: 0,
      ideal: broswerWidth,
      max: broswerWidth,
    },
    height: {
      min: 0,
      ideal: browserHeight,
      max: browserHeight,
    },
    facingMode: "environment",
  },
};

const getCameraSelection = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter((device) => device.kind === "videoinput");
  console.log(videoDevices);
  const updatedConstraints = {
    ...constraints,
    deviceId: {
      exact: videoDevices[0].deviceId,
    },
  };
  startStream(updatedConstraints);
};

const startStream = async (constraints) => {
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  handleStream(stream);
};

const handleStream = (stream) => {
  video.srcObject = stream;

  streamStarted = true;
};

const doScreenshot = () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  screenshotImage.src = canvas.toDataURL("image/webp");
  screenshotContainer.style.display = "block";
  screenshotImage.classList.remove("d-none");
};

screenshot.onclick = doScreenshot;

document.addEventListener("DOMContentLoaded", async () => {
  await getCameraSelection();
});
