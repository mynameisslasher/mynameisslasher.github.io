let map, userPlacemark, followUser = true, lastCoords = null, deviceAngle = 0;

function init() {
  map = new ymaps.Map("map", {
    center: [56.8519, 60.6122],
    zoom: 17,
    controls: [],
    behaviors: ["drag", "dblClickZoom", "multiTouch", "scrollZoom", "rotate"]
  });

  navigator.geolocation.watchPosition(updateUserLocation, error => console.error("Ошибка геолокации:", error), {
    enableHighAccuracy: true
  });

  window.addEventListener("deviceorientation", event => {
    deviceAngle = event.alpha || 0;
  });

  map.events.add("actionbegin", () => followUser = false);

  fetch("camera_coordinates.json")
    .then(response => response.json())
    .then(cameras => {
      cameras.forEach(camera => {
        let coords = camera.geometry.coordinates;
        let props = camera.properties;
        let placemark = new ymaps.Placemark(coords, {
          hintContent: props.hintContent,
          balloonContentBody: props.balloonContentBody
        }, {
          preset: "islands#redIcon"
        });
        map.geoObjects.add(placemark);
      });
    })
    .catch(error => console.error("Ошибка загрузки камер:", error));
}

function updateUserLocation(position) {
  console.log("Получены координаты:", position.coords.latitude, position.coords.longitude);
  const { latitude, longitude, heading } = position.coords;
  const newCoords = [latitude, longitude];

  if (!userPlacemark) {
    userPlacemark = new ymaps.Placemark(newCoords, {}, {
      iconLayout: "default#image",
      iconImageHref: "arrow.png",
      iconImageSize: [40, 40],
      iconImageOffset: [-20, -20]
    });
    map.geoObjects.add(userPlacemark);
  }

  userPlacemark.geometry.setCoordinates(newCoords);

  let rotationAngle = heading !== undefined ? heading : (lastCoords ? getRotationAngle(lastCoords, newCoords) : deviceAngle);
  userPlacemark.options.set("iconRotate", rotationAngle);

  lastCoords = newCoords;

  if (followUser) {
    map.setCenter(newCoords, undefined, { duration: 300 });
  }
}

function getRotationAngle(oldCoords, newCoords) {
  const dx = newCoords[1] - oldCoords[1];
  const dy = newCoords[0] - oldCoords[0];
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}

function recenterMap() {
  followUser = true;
  if (userPlacemark) {
    map.setCenter(userPlacemark.geometry.getCoordinates(), undefined, { duration: 300 });
  }
}

ymaps.ready(init);
