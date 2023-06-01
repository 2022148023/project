const mapContainer = document.getElementById("map");
const mapLoading = document.querySelector(".data-loading");
const typeButtons = document.querySelectorAll(".type-button");
const typeButtonsContainer = document.querySelector(".type-buttons");

let type = "일반주택";

typeButtons.forEach((typeButton) =>
  typeButton.addEventListener("click", (event) => {
    removeDetailsModal();
    removeNeighborhoodName();
    type = event.currentTarget.dataset.type;
    event.currentTarget.classList.remove("type-button-disabled");
    typeButtons.forEach((typeButtonToBeDisabled) => {
      if (typeButtonToBeDisabled != typeButton) {
        typeButtonToBeDisabled.classList.add("type-button-disabled");
      }
    });
  })
);

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

var options = {
  // Seoul Center
  center: new kakao.maps.LatLng(37.566826, 126.9786567),
  // zoom level
  level: 8,
};

var map = new kakao.maps.Map(mapContainer, options);

// set bounds for zooming
map.setMinLevel(4);
map.setMaxLevel(8);

let neighborhoodsData = null;
let recyclingData = null;
let modalTemplate = null;

function getUserLocation() {
  // Check if the browser supports the Geolocation API
  if (navigator.geolocation) {
    // Get the current position
    navigator.geolocation.getCurrentPosition(showPosition, showError, {
      enableHighAccuracy: true,
    });
  } else {
  }

  // Callback function to handle the position
  function showPosition(position) {
    // Retrieve latitude and longitude from the position object
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    var customOverlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(latitude, longitude),
      content: `<div class="box">
                  <div class="circle">
                  <div class="inner"></div>
                   <div class="highlight"></div>
                  </div>
                  <div class="square"></div>
                  </div>
                  <div class="shadow">
                </div>`,
    });

    customOverlay.setMap(map);
  }

  function showError(error) {
    console.log(error);
    Toast.fire({
      icon: "error",
      title: "현재 위치를 찾을 수 없습니다.",
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetch("/data/seoul_sig.geojson")
    .then((response) => response.json())
    .then((apiAreaData) => {
      fetch("/data/seoul_map.geojson")
        .then((response) => response.json())
        .then((apiNeighborhoodsData) => {
          neighborhoodsData = apiNeighborhoodsData.features;
          fetch("/data/recyling_data.json")
            .then((response) => response.json())
            .then((apiRecyclingData) => {
              fetch("/scripts/modal.ejs")
                .then((response) => response.text())
                .then((template) => {
                  modalTemplate = template;
                  recyclingData = apiRecyclingData.areas;
                  apiAreaData.features.map((area) =>
                    renderArea({
                      coordinates: area.geometry.coordinates[0],
                      ...area.properties,
                    })
                  );
                  getUserLocation();
                  mapLoading.style.display = "none";
                  typeButtonsContainer.style.display = "flex";
                })
                .catch((e) => {
                  Toast.fire({
                    icon: "error",
                    title: "Network Error",
                  });
                  console.log(e);
                });
            })
            .catch((e) => {
              Toast.fire({
                icon: "error",
                title: "Network Error",
              });
              console.log(e);
            });
        })
        .catch((e) => {
          Toast.fire({
            icon: "error",
            title: "Network Error",
          });
          console.log(e);
        });
    })
    .catch((e) => {
      Toast.fire({
        icon: "error",
        title: "Network Error",
      });
      console.log(e);
    });
});

const polygonColors = [
  "#FF6B6B",
  "#FF5252",
  "#FF4081",
  "#E040FB",
  "#7C4DFF",
  "#536DFE",
  "#448AFF",
  "#40C4FF",
  "#18FFFF",
  "#64FFDA",
  "#69F0AE",
  "#B2FF59",
  "#EEFF41",
  "#FFFF00",
  "#FFD740",
  "#FFAB40",
  "#FF6E40",
  "#FF5722",
  "#FF5252",
  "#FF4081",
  "#E040FB",
  "#7C4DFF",
  "#536DFE",
  "#448AFF",
  "#40C4FF",
];

const guCenter = {
  종로구: [126.97731698295541, 37.5949204264249],
  중구: [126.99596860612809, 37.56014296463335],
  용산구: [126.97990787458595, 37.53138563096196],
  성동구: [127.0410585916884, 37.55102998390312],
  광진구: [127.08574555256342, 37.546721593729664],
  동대문구: [127.05484838155998, 37.58195730240092],
  중랑구: [127.09288423999374, 37.59781910775036],
  성북구: [127.01757821335562, 37.605701397703214],
  강북구: [127.01118489107438, 37.64347733212335],
  도봉구: [127.03236700307802, 37.66910528098116],
  노원구: [127.07503364225907, 37.652516327068135],
  은평구: [126.92702834139575, 37.61921535613365],
  서대문구: [126.93906273977069, 37.577786309689074],
  마포구: [126.9082639856086, 37.55931220901952],
  양천구: [126.85547947640283, 37.5247897221147],
  강서구: [126.82280364738905, 37.561235946641155],
  구로구: [126.85630222129522, 37.49440416619712],
  금천구: [126.90081778777216, 37.46056915846997],
  영등포구: [126.91016920847493, 37.52230978534629],
  동작구: [126.95164023678285, 37.49887637235844],
  관악구: [126.94533549651021, 37.467376552377694],
  서초구: [127.0312084634201, 37.47329794906061],
  강남구: [127.06297487683099, 37.4966458307771],
  송파구: [127.11529110676939, 37.50562076588534],
  강동구: [127.14701444562756, 37.55045131011757],
};

let activeArea = {};
let activeNeighborhoods = [];
let activeDetailsOverlay = {};
let activeNeighborhoodNameOverlay = {};

function renderArea(area) {
  var polygonPath = [];

  for (var coords of area.coordinates) {
    polygonPath.push(new kakao.maps.LatLng(coords[1], coords[0]));
  }

  const fillColor = getRandomAndRemove(polygonColors);

  // area polygon
  var polygon = new kakao.maps.Polygon({
    map: map, // main map object
    path: polygonPath, // 그려질 다각형의 좌표 배열입니다
    strokeWeight: 2, // 선의 두께입니다
    strokeColor: "#fff", // 선의 색깔입니다
    strokeOpacity: 0.8, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
    strokeStyle: "longdash", // 선의 스타일입니다
    fillColor: fillColor, // 채우기 색깔입니다
    fillOpacity: 0.5, // 채우기 불투명도 입니다
  });

  // Gu name badge
  var customOverlay = new kakao.maps.CustomOverlay({
    position: new kakao.maps.LatLng(
      guCenter[area.SIG_KOR_NM][1],
      guCenter[area.SIG_KOR_NM][0]
    ),
    content: `<span class ="gu-label">${area.SIG_KOR_NM}</span>`,
  });

  customOverlay.setMap(map);

  kakao.maps.event.addListener(polygon, "click", function (event) {
    if (polygon != activeArea.polygon && activeArea.polygon) {
      removeAllNeighborhoods();
    }
    activeArea = { polygon, color: fillColor };
    drawNeighborhoods(area);
  });
}

function drawNeighborhoods(area) {
  neighborhoodsData
    .filter(
      (neighborhood) => neighborhood.properties.COL_ADM_SE === area.SIG_CD
    )
    .map((neighborhood) => {
      neighborhood.geometry.coordinates.map((coords) => {
        var polygonPath = [];
        for (var coord of coords[0]) {
          polygonPath.push(new kakao.maps.LatLng(coord[1], coord[0]));
        }
        // neighborhood polygon
        var polygon = new kakao.maps.Polygon({
          map: map, // main map object
          path: polygonPath, // 그려질 다각형의 좌표 배열입니다
          strokeWeight: 2, // 선의 두께입니다
          strokeColor: "#fff", // 선의 색깔입니다
          strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
          strokeStyle: "solid", // 선의 스타일입니다
          fillColor: "#aaa", // 채우기 색깔입니다
          fillOpacity: 0.5, // 채우기 불투명도 입니다
          zIndex: 10,
        });
        activeNeighborhoods.push(polygon);

        // 다각형에 마우스오버 이벤트가 발생했을 때 변경할 채우기 옵션입니다
        var mouseoverOption = {
          fillColor: "#000", // 채우기 색깔입니다
          fillOpacity: 0.3, // 채우기 불투명도 입니다
        };

        // 다각형에 마우스아웃 이벤트가 발생했을 때 변경할 채우기 옵션입니다
        var mouseoutOption = {
          fillColor: "#aaa", // 채우기 색깔입니다
          fillOpacity: 0.5, // 채우기 불투명도 입니다
        };

        kakao.maps.event.addListener(polygon, "mouseover", function (event) {
          polygon.setOptions(mouseoverOption);
        });

        kakao.maps.event.addListener(polygon, "mouseout", function () {
          if (!activeDetailsOverlay.customOverlay) {
            polygon.setOptions(mouseoutOption);
          }
        });

        kakao.maps.event.addListener(polygon, "mousemove", function (event) {
          if (
            !activeNeighborhoodNameOverlay.neighborhoodNameOverlay ||
            activeNeighborhoodNameOverlay.name != neighborhood.properties.EMD_NM
          ) {
            if (activeNeighborhoodNameOverlay.neighborhoodNameOverlay) {
              removeNeighborhoodName();
            }
            const newPosition = new kakao.maps.LatLng(
              event.latLng.getLat() - 0.002,
              event.latLng.getLng() - 0.002
            );

            var neighborhoodNameOverlay = new kakao.maps.CustomOverlay({
              position: newPosition,
              content: `<span class="neighborhoodNameOverlay">${neighborhood.properties.EMD_NM}</span>`,
            });
            activeNeighborhoodNameOverlay = {
              neighborhoodNameOverlay,
              name: neighborhood.properties.EMD_NM,
            };
            neighborhoodNameOverlay.setMap(map);
          } else {
            // update position
            const newPosition = new kakao.maps.LatLng(
              event.latLng.getLat() - 0.002,
              event.latLng.getLng() - 0.002
            );
            activeNeighborhoodNameOverlay.neighborhoodNameOverlay.setPosition(
              newPosition
            );
          }
        });

        kakao.maps.event.addListener(polygon, "click", function (event) {
          if (
            !activeDetailsOverlay.customOverlay ||
            activeDetailsOverlay.name !== neighborhood.properties.EMD_NM
          ) {
            removeNeighborhoodName();
            if (activeDetailsOverlay.customOverlay) {
              removeDetailsModal();
            }
            const areaRecyclingData = recyclingData.filter(
              (areaName) => areaName.SIG_NM === area.SIG_KOR_NM
            )[0];
            const neighborhoodRecylcingData = areaRecyclingData["EMDs"].filter(
              (neighborhoodRecylcing) =>
                neighborhoodRecylcing.EMD_NM === neighborhood.properties.EMD_NM
            )[0];
            const schedule = [false, false, false, false, false, false, false];
            for (day of neighborhoodRecylcingData.schedule) {
              schedule[day] = true;
            }
            const data = {
              area: areaRecyclingData,
              neighborhood: { ...neighborhoodRecylcingData, schedule },
              type,
            };
            var customOverlay = new kakao.maps.CustomOverlay({
              position: event.latLng,
              clickable: true,
              content: ejs.render(modalTemplate, data),
              xAnchor: 0.5,
              yAnchor: 0.5,
            });
            customOverlay.setMap(map);
            activeDetailsOverlay = {
              customOverlay,
              name: neighborhood.properties.EMD_NM,
              polygon: polygon,
            };
          }
        });
      });
    });
}

function removeAllNeighborhoods() {
  activeNeighborhoods.map((polygon) => {
    polygon.setMap(null);
    polygon = null;
  });
}

function removeDetailsModal() {
  if (activeDetailsOverlay.customOverlay) {
    activeDetailsOverlay.customOverlay.setMap(null);
    activeDetailsOverlay.polygon.setOptions({
      fillColor: "#aaa", // 채우기 색깔입니다
      fillOpacity: 0.5, // 채우기 불투명도 입니다
    });
  }
  activeDetailsOverlay.customOverlay = null;
  activeDetailsOverlay.name = null;
  activeDetailsOverlay.polygon = null;
}

function removeNeighborhoodName() {
  if (activeNeighborhoodNameOverlay.neighborhoodNameOverlay) {
    activeNeighborhoodNameOverlay.neighborhoodNameOverlay.setMap(null);
  }
  activeNeighborhoodNameOverlay.name = null;
}

// helper functions
function getRandomAndRemove(array) {
  // Generate a random index
  const randomIndex = Math.floor(Math.random() * array.length);
  // Retrieve the random element
  const randomElement = array[randomIndex];
  // Remove the element from the array
  array.splice(randomIndex, 1);
  // Return the random element
  return randomElement;
}
