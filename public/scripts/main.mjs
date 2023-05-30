var container = document.getElementById("map");

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
  level: 8,
};

var map = new kakao.maps.Map(container, options);

var geocoder = new kakao.maps.services.Geocoder();

var clickHandler = function (event) {
  geocoder.coord2RegionCode(
    event.latLng.getLng(),
    event.latLng.getLat(),
    (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        Toast.fire({
          icon: "info",
          title: result[0].region_3depth_name,
        });
      } else {
        Toast.fire({
          icon: "error",
          title: "Network Error",
        });
      }
    }
  );
};

kakao.maps.event.addListener(map, "click", clickHandler);

let neighborhoodsData = null;

document.addEventListener("DOMContentLoaded", () => {
  fetch("/data/seoul_sig.geojson")
    .then((response) => response.json())
    .then((areaData) => {
      fetch("/data/seoul_map.geojson")
        .then((response) => response.json())
        .then((data) => {
          neighborhoodsData = data.features;
          areaData.features.map((area) =>
            renderArea({
              coordinates: area.geometry.coordinates[0],
              ...area.properties,
            })
          );
        })
        .catch((e) => {
          console.log(e);
        });
    })
    .catch((error) => {
      Toast.fire({
        icon: "error",
        title: "Network Error",
      });
    });
});

var details_window_open = false;

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

let activePolygon = null;

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

function renderArea(area) {
  var polygonPath = [];

  for (var coords of area.coordinates) {
    polygonPath.push(new kakao.maps.LatLng(coords[1], coords[0]));
  }

  const fillColor = getRandomAndRemove(polygonColors);

  // 지도에 표시할 다각형을 생성합니다
  var polygon = new kakao.maps.Polygon({
    map: map, // main map object
    path: polygonPath, // 그려질 다각형의 좌표 배열입니다
    strokeWeight: 2, // 선의 두께입니다
    strokeColor: "#444", // 선의 색깔입니다
    strokeOpacity: 0.8, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
    strokeStyle: "longdash", // 선의 스타일입니다
    fillColor: fillColor, // 채우기 색깔입니다
    fillOpacity: 0.5, // 채우기 불투명도 입니다
  });

  // 다각형에 마우스오버 이벤트가 발생했을 때 변경할 채우기 옵션입니다
  var mouseoverOption = {
    fillColor: "#EFFFED", // 채우기 색깔입니다
    fillOpacity: 0.5, // 채우기 불투명도 입니다
  };

  // 다각형에 click 이벤트를 등록하고 이벤트가 발생하면 다각형의 이름과 면적을 인포윈도우에 표시합니다
  kakao.maps.event.addListener(polygon, "click", function (mouseEvent) {
    if (!details_window_open) {
      polygon.setOptions(mouseoverOption);
      activePolygon = { polygon, color: fillColor };
      drawNeighborhoods(area.SIG_CD);
      // modal window
      /* $.ajax({
        url: "scripts/modal.handlebars",
        dataType: "text",
        success: function (templateCode) {
          var compiledTemplate = Handlebars.compile(templateCode);
          var content = compiledTemplate({ area });
          var customOverlay = new kakao.maps.CustomOverlay({
            position: mouseEvent.latLng,
            clickable: true,
            content: content,
            xAnchor: 0.5,
            yAnchor: 0.5,
          });
          customOverlay.setMap(map);
          details_window_open = true;
        },
      }); */
    }
  });
}

function drawNeighborhoods(areaID) {
  neighborhoodsData
    .filter((neighborhood) => neighborhood.properties.COL_ADM_SE === areaID)
    .map((neighborhood) => {
      neighborhood.geometry.coordinates.map((coords) => {
        var polygonPath = [];
        for (var coord of coords[0]) {
          polygonPath.push(new kakao.maps.LatLng(coord[1], coord[0]));
        }
        var polygon = new kakao.maps.Polygon({
          map: map, // main map object
          path: polygonPath, // 그려질 다각형의 좌표 배열입니다
          strokeWeight: 2, // 선의 두께입니다
          strokeColor: "#444", // 선의 색깔입니다
          strokeOpacity: 0.8, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
          strokeStyle: "longdash", // 선의 스타일입니다
          fillColor: "#aaa", // 채우기 색깔입니다
          fillOpacity: 0.5, // 채우기 불투명도 입니다
        });
      });
    });
}

window.removeModal = function removeModal(event) {
  const id = event.target.dataset["areaId"];
  var element = document.getElementById(id);
  element.classList.add("animate__animated", "animate__fadeOut");
  setTimeout(() => {
    element.parentNode.removeChild(element);
  }, 1500);
  details_window_open = false;
  activePolygon.polygon.setOptions({
    fillColor: activePolygon.color,
    fillOpacity: 0.5,
  });
};
