import * as d3 from 'd3';
import * as L from 'leaflet';

function LMap(data){
	let map;
	
	addLmaps()
	let arr = data;
  function addLmaps() {
    const mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';

    map = L.map('map').setView([8.4506145, -11.3474766], 8);
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; ' + mapLink + ' Contributors',
      maxZoom: 18,
      }).addTo(map);
    L.svg().addTo(map);
  }

  // function drawFeatures(data) {
  //   const svg = d3.select('#map').select('svg');
  //   const width = +svg.attr('width');
  //   const height = +svg.attr('height');
  //   let transform = d3.geoTransform({point: projectPoint});
  //   let path = d3.geoPath().projection(transform);
  //   path.pointRadius(7);

  //   let hex = hexbin()
  //   .radius(40)
  //     .extent([[0, 0], [width, height]])

  //   let color = d3.scaleSequential(d3.interpolateLab("white", "steelblue"))
  //     .domain([1, 3]);

  //   let featureElement = svg.selectAll('path')
  //       .data(data)
  //       .enter()
  //       .append('path')
  //       .attr('stroke', 'gray')
  //       .attr('fill', 'red')
  //       .attr("fill-opacity", 0.2);

  //   // let hexagons = svg.append('g')
  //   //   .attr('class', 'hexagon')
  //   //   .selectAll('path')
  //   //   .data(hex(updateHexCoords(coords)).sort(function(a,b) { return b-length - a.length; }))
  //   //   .enter().append('path')
  //   //     .attr("d", hex.hexagon())
  //   //     .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")";
  //   //     })
  //   //     .attr("fill", function(d) { return color(d.length); })
  //   //     .attr('fill-opacity', .5);

  //   map.on('zoom moveend', update);
  //   update();

  //   function update() {
  //     console.log(updateHexCoords(coords));
  //     featureElement.attr('d', path);
  //   }
  // }

}

export default LMap;

// ** ------- ACCESORY FUNCTIONS ------- **
function projectPoint(x, y) {
  let point = map.latLngToLayerPoint(new L.LatLng(y, x));
  this.stream.point(point.x, point.y);
}

function updateHexCoords(array) {
  let test = []
  array.forEach(el => {
    let point = map.latLngToLayerPoint([el[1], el[0]]);
    test.push([point.x, point.y]);
  });
  return test;
}