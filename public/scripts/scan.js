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

const doScreenshot = () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  screenshotImage.src = canvas.toDataURL("image/webp");
  screenshotContainer.style.display = "block";
  screenshotImage.classList.remove("d-none");
};

screenshotButton.onclick = doScreenshot;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await getCameraSelection();
  } catch (e) {
    Toast.fire({
      icon: "error",
      title: "카메라 실행중 문제가 발생하였습니다.",
    });
  }
});
