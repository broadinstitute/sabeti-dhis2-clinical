// ** ------- DEPENDENCIES ------- **
import './styles/index.css';
import * as d3 from 'd3';
import * as L from 'leaflet';
let cf = require('crossfilter');

let marker;
// ** ------- JS MODULES ------- **
import DataLoader from './data';
import Timeline from './Timeline';


// ** ------- MODULES INIT ------- **
let timeline = Timeline().on('disBrush', data => {
	// console.log(`MAIN: ${data.startDate} --> ${data.endDate}`)
});

// ** ------- DataLoader() ------- **
let getData = DataLoader()
	.on('error', err => { console.log(err); })

	.on('loaded', data => {
		const allCases = data.cases;

		// data nested by eventDate
		const casesByDate = d3.nest()
			.key(function(d) { return d.eventDate; })
			.rollup(function(cases) { return cases.length; })
			.entries(allCases);



		// console.log(casesByDate);
		d3.select('#timeline').datum(casesByDate).call(timeline);

		let map = L.map('map').setView([8.4506145, -11.3474766], 8);
        let mapLink = 
          '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        L.tileLayer(
          'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; ' + mapLink + ' Contributors',
          maxZoom: 18,
          }).addTo(map);

    //an array with only objects that have a valid lat and long
    let locationArr = allCases.filter(function(el) { return !(el.lat === undefined || el.lng === undefined) })

    locationArr.forEach(d => { marker = new L.marker([d.lat, d.lng]).addTo(map); });


let drawLayer = function() {
    var bounds = map.getBounds(),
        topLeft = map.latLngToLayerPoint(bounds.getNorthWest()),
        bottomRight = map.latLngToLayerPoint(bounds.getSouthEast()),
        existing = d3.set(),
        drawLimit = bounds.pad(0.4);

    let filteredPoints = locationArr.filter(function(p){
    	let latlng = new L.LatLng(p.lat, p.lng);
    	
    	let point = map.latLngToLayerPoint(latlng);

    	p.x = point.x;
      p.y = point.y;
    	return drawLimit.contains(latlng);
    })

    var svg = d3.select(map.getPanes().overlayPane).append("svg")
      .attr('id', 'overlay')
      .attr("class", "leaflet-zoom-hide")
      .style("width", map.getSize().x + 'px')
      .style("height", map.getSize().y + 'px')
      .style("margin-left", topLeft.x + "px")
      .style("margin-top", topLeft.y + "px");

    var g = svg.append("g")
      .attr("transform", "translate(" + (-topLeft.x) + "," + (-topLeft.y) + ")");

    let svgPoints = svg.selectAll('g')
    	.data(filteredPoints)
    	.enter()
    	.append('g')

    svgPoints.append('circle')
    	.attr("transform", function(d) { console.log(d); return "translate(" + d.x + "," + d.y + ")"; })
    	.attr('r', 5);
  }

    //Add layer of SVGs
    let mapLayer = {
    	onAdd: function(map) {
    		map.on('viewreset moveend', drawLayer);
    		drawLayer();
    	}
    };

	  map.on('ready', function() {
	      map.addLayer(mapLayer);
	  });

	}); //-->END .on('loaded')


	// ** ------- DATA QUERY ------- **
getData();

