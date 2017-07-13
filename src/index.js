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
let timeline = Timeline();


// ** ------- DataLoader() ------- **
let getData = DataLoader()
	.on('error', err => { console.log(err); })

	.on('loaded', data => {
		const allCases = data.cases;
		// console.log(allCases);

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

    allCases.forEach(i => {
    	if (i.lat | i.lng != undefined) {
    		marker = new L.marker([i.lat, i.lng]).addTo(map);
    	}
    })

	}); //-->END .on('loaded')


	// ** ------- DATA QUERY ------- **
getData();

