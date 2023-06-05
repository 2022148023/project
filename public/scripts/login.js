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
      text: "유효한 아이디를 입력하세요.",
    });
    return;
  }

  if (!password || password !== password_confirmation) {
    Toast.fire({
      icon: "warning",
      text: "틀린 비밀번호입니다.",
    });
    return;
  }

  if (!email) {
    Toast.fire({
      icon: "warning",
      text: "유효한 이메일 주소를 입력하세요.",
    });
    return;
  }

  if (!profile) {
    Toast.fire({
      icon: "warning",
      text: "프로필 사진을 선택하세요",
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
          text: "성공적으로 회원가입이 되었습니다.",
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
