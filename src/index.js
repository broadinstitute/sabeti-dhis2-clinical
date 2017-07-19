// ** ------- DEPENDENCIES ------- **
import './styles/index.css';
import * as d3 from 'd3';
import {hexbin} from 'd3-hexbin';
import {contourDensity} from 'd3-contour';
import * as L from 'leaflet';
let _ = require('lodash');
// import '@asymmetrik/leaflet-d3'
let cf = require('crossfilter');
let pixelCoords = [];


// ** ------- JS MODULES ------- **
import DataLoader from './data';
import Timeline from './Timeline';
import LMap from './Map';


let dis = d3.dispatch('timeUpdate');

// ** ------- MAIN MAP ------- **
let control = d3.map()

control.set('startDate', '');
control.set('endDate', '');


// ** ------- MODULES INIT ------- **
let timeline = Timeline().on('disBrush', data => {
  let startDate = data.startDate,
      endDate = data.endDate

  dis.call('timeUpdate', null, {start: startDate, end: endDate});
});


function mainDraw(array) {
  let filtered = [];

  dis.on('timeUpdate', d => {
    filtered = _.filter(array, function(el) {
      return el.features[0].properties.eventDate >= d.start && el.features[0].properties.eventDate <= d.end
    })
    
    console.log(filtered.length);

  });


}

let mapFunction = LMap();

// ** ------- DataLoader() ------- **
let getData = DataLoader()
  .on('error', err => { console.log(err); })

  .on('loaded', data => {
    let map;
    const allCases = data.cases;
    const geoCases = data.geoCases;
    const dummyCases = data.dummyCases;

    mainDraw(dummyCases);

    // ** ------- Data Models ------- **
    // nested by eventDate
    const casesByDate = d3.nest()
      .key(function(d) { return d.features[0].properties.eventDate; })
      .rollup(function(cases) {return cases.length})
      .entries(dummyCases);


    //arrays with only objects that have a valid lat and long
    let locationArr = allCases.filter(function(el) { return !(el.lat === undefined || el.lng === undefined) })

    let geoArr = geoCases.filter(function(el, i){
      return !(el.features[0].geometry.coordinates[0] === undefined || el.features[0].geometry.coordinates[1] === undefined)
    })

    //array with all the coordinates (used for hexagonal binning)    
    let coords = []
    // geoArr.forEach(el => {coords.push([el.features[0].geometry.coordinates[0], el.features[0].geometry.coordinates[1]]) });
    dummyCases.forEach(el => {coords.push([el.features[0].geometry.coordinates[0], el.features[0].geometry.coordinates[1]]) });


    // ** ------- calling drawing functions ------- **
    // calling the timeline
    d3.select('#timeline').datum(casesByDate).call(timeline);

    // calling the map
    // main(dummyCases);

    function addLmaps() {
      let marker;
      const mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';

      map = L.map('map').setView([8.4506145, -11.3474766], 8);
      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; ' + mapLink + ' Contributors',
        maxZoom: 18,
        }).addTo(map);
      L.svg().addTo(map);

      // locationArr.forEach(d => { marker = new L.marker([d.lat, d.lng]).addTo(map); });
      // locationArr.forEach(function(d) { d.LatLng = new L.LatLng(d.lat, d.lng) })
    }

      function main(data){
      addLmaps();
      drawFeatures(data);   
    }

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



    function drawFeatures(data) {
      const svg = d3.select('#map').select('svg');
      const width = +svg.attr('width');
      const height = +svg.attr('height');
      let transform = d3.geoTransform({point: projectPoint});
      let path = d3.geoPath().projection(transform);
      path.pointRadius(7);

      let hex = hexbin()
      .radius(40)
        .extent([[0, 0], [width, height]])

      let color = d3.scaleSequential(d3.interpolateLab("white", "steelblue"))
        .domain([1, 3]);

      let featureElement = svg.selectAll('path')
          .data(data)
          .enter()
          .append('path')
          .attr('stroke', 'gray')
          .attr('fill', 'red')
          .attr("fill-opacity", 0.2);

      // let hexagons = svg.append('g')
      //   .attr('class', 'hexagon')
      //   .selectAll('path')
      //   .data(hex(updateHexCoords(coords)).sort(function(a,b) { return b-length - a.length; }))
      //   .enter().append('path')
      //     .attr("d", hex.hexagon())
      //     .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")";
      //     })
      //     .attr("fill", function(d) { return color(d.length); })
      //     .attr('fill-opacity', .5);
  
      map.on('zoom moveend', update);
      update();
  
      function update() {

        // hex.radius(map.getZoom()*5);

        console.log(updateHexCoords(coords));
        featureElement.attr('d', path);
        
        // hexagons
        // .data(hex(updateHexCoords(coords)).sort(function(a,b) { return b-length - a.length; }))
        // .attr("d", hex.hexagon())
        // hexagons.attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")";
        // })
      }
    }
  }); //-->END .on('loaded')


  // ** ------- DATA QUERY ------- **
getData();

