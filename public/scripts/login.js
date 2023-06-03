$(".message a").click(function () {
  $("form").animate({ height: "toggle", opacity: "toggle" }, "slow");
});

const login_form = document.querySelector(`form.login-form`);

const signup_form = document.querySelector(`form.register-form`);

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

login_form.addEventListener("submit", function (event) {
  var formData = new FormData(login_form);
  const username = formData.get("username");
  const password = formData.get("password");
  if (!username || !password) {
    Toast.fire({
      icon: "warning",
      text: "complete all fields",
    });
    event.preventDefault();
  }
});

signup_form.addEventListener("submit", function (event) {
  event.preventDefault();
  var formData = new FormData(signup_form);
  const username = formData.get("username");
  const password = formData.get("password");
  const password_confirmation = formData.get("password_confirmation");
  const email = formData.get("email");
  const profile = formData.get("profile");

  if (!username) {
    Toast.fire({
      icon: "warning",
      text: "Enter a valid username",
    });
    return;
  }

  if (!password || password !== password_confirmation) {
    Toast.fire({
      icon: "warning",
      text: "Passwords are not matching",
    });
    return;
  }

  if (!email) {
    Toast.fire({
      icon: "warning",
      text: "Enter a valid email",
    });
    return;
  }

  if (!profile) {
    Toast.fire({
      icon: "warning",
      text: "Choose a profile picture",
    });
    return;
  }

  fetch("/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Specify the content type of the request body
    },
    body: JSON.stringify({ username, password, email, profile }), // Convert the data object to JSON string
  })
    .then((response) => response.text())
    .then((data) => {
      if (data === "OK") {
        Toast.fire({
          icon: "success",
          text: "Successfully signed up, you can login now",
        });
        $("form").animate({ height: "toggle", opacity: "toggle" }, "slow");
      } else {
        Toast.fire({
          icon: "error",
          text: data,
        });
      }
    })
    .catch((error) => {
      Toast.fire({
        icon: "error",
        text: error,
      });
    });
});
