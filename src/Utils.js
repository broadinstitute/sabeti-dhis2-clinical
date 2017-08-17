function projectPoint(map, x, y) {
  let point = map.latLngToLayerPoint(new L.LatLng(y, x));
  this.stream.point(point.x, point.y);
}

function updateHexCoords(array) {
  let newArr = []
  array.forEach(el => {
    let point = map.latLngToLayerPoint([el[1], el[0]]);
    newArr.push([point.x, point.y, el[2]]);
  });
  return newArr;
}

export default {projectPoint, updateHexCoords};