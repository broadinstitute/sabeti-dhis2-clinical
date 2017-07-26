// ** ------- DEPENDENCIES ------- **
import './styles/index.css';
import * as d3 from 'd3';
import {hexbin} from 'd3-hexbin';
import * as L from 'leaflet';
let _ = require('lodash');
let cf = require('crossfilter');
require('es6-promise').polyfill();
require('isomorphic-fetch');
let pixelCoords = [];
let map;


// ** ------- JS MODULES ------- **
import DataLoader from './data';
import Timeline from './Timeline';
import Details from './Details';
import Fasta from './Fasta';
import Secret from '../Secret';
import LMap from './Map';

let dis = d3.dispatch('timeUpdate', 'hexHover');
let details = Details();


// 

// ** ------- MODULES INIT ------- **
let timeline = Timeline().on('disBrush', data => {
  let startDate = data.startDate,
      endDate = data.endDate

  dis.call('timeUpdate', null, {start: startDate, end: endDate});

  d3.select('#details').datum({start: startDate, end: endDate}).call(details);

});

// function call(){
//   var request = require('request');

//   var headers = {
//       'Authorization': 'Bearer d330c834-9687-4544-b320-3fc68364d543'
//   };

//   var options = {
//       url: 'https://play.dhis2.org/dev/api/dataElements.json',
//       headers: headers
//   };

//   function callback(error, response, body) {
//       if (!error && response.statusCode == 200) {
//           console.log(body);
//       }
//       console.log(response);
//   }

//   request(options, callback);

// }

// call();


function redraw(array) {
  let filtered = [];

  dis.on('timeUpdate', d => {
    let coords = [];
    filtered = _.filter(array, function(el) {
      return el.features[0].properties.eventDate >= d.start && el.features[0].properties.eventDate <= d.end
    })

    //array with all the coordinates (used for hexagonal binning)    
    filtered.forEach(el => {coords.push([el.features[0].geometry.coordinates[0], el.features[0].geometry.coordinates[1], el.features[0].properties.sequence]) });

    LMap(map, filtered, coords);


  });//-->END .on('timeUpdate')
}

// ** ------- DataLoader() ------- **
let getData = DataLoader()
  .on('error', err => { console.log(err); })

  .on('loaded', data => {

    const allCases = data.cases;
    const geoCases = data.geoCases;
    const dummyCases = data.dummyCases;

    const mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
    map = L.map('map').setView([8.4506145, -11.3474766], 9);
    L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=${Secret.mapbox}`, {
      maxZoom: 18,
      }).addTo(map);
    L.svg().addTo(map)


    const casesByDate = d3.nest()
      .key(function(d) { return d.features[0].properties.eventDate; })
      .rollup(function(cases) {return cases.length})
      .entries(dummyCases);
    d3.select('#timeline').datum(casesByDate).call(timeline);

    redraw(dummyCases); //where all the magic happens
 
  }); //-->END .on('loaded')


  // ** ------- DATA QUERY ------- **
getData();

