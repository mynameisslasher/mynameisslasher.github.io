let map, userPlacemark, followUser = true, lastCoords = null, deviceAngle = 0;

function init() {
  map = new ymaps.Map("map", {
    center: [56.8519, 60.6122],
    zoom: 17,
    controls: [],
    behaviors: ["drag", "scrollZoom", "multiTouch", "dblClickZoom"]
  });

  // Слежение за движением пользователя
  navigator.geolocation.watchPosition(updateUserLocation, 
    err => console.error("Ошибка геолокации:", err), 
    { enableHighAccuracy: true });

  // Получение угла устройства (не во всех браузерах)
  window.addEventListener("deviceorientationabsolute", event => {
    if (event.alpha !== null) {
      deviceAngle = event.alpha;
    }
  }, true);

  map.events.add("actionbegin", () => followUser = false);

  // Загрузка камер
  fetch("camera_coordinates.json")
    .then(res => res.json())
    .then(cameras => {
      cameras.forEach(camera => {
        const coords = camera.geometry.coordinates;
        const props = camera.properties;
        const placemark = new ymaps.Placemark(coords, {
          hintContent: props.hintContent,
          balloonContentBody: props.balloonContentBody
        }, {
          preset: "islands#redIcon"
        });
        map.geoObjects.add(placemark);
      });
    })
    .catch(err => console.error("Ошибка загрузки камер:", err));
}

function updateUserLocation(position) {
  const { latitude, longitude, heading } = position.coords;
  const coords = [latitude, longitude];

  if (!userPlacemark) {
    userPlacemark = new ymaps.Placemark(coords, {}, {
      iconLayout: "default#image",
      iconImageHref: "arrow.png",
      iconImageSize: [40, 40],
      iconImageOffset: [-20, -20],
      iconRotate: true
    });
    map.geoObjects.add(userPlacemark);
  }

  userPlacemark.geometry.setCoordinates(coords);

  let angle = heading ?? (lastCoords ? getRotationAngle(lastCoords, coords) : deviceAngle);
  userPlacemark.options.set("iconAngle", angle);

  lastCoords = coords;

  if (followUser) {
    map.setCenter(coords, undefined, { duration: 300 });
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
