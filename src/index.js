// ** ------- DEPENDENCIES ------- **
import './styles/index.css';
import * as d3 from 'd3';
import {hexbin} from 'd3-hexbin';
import * as L from 'leaflet';
let _ = require('lodash');
let cf = require('crossfilter');
let pixelCoords = [];
let map;


// ** ------- JS MODULES ------- **
import DataLoader from './data';
import Timeline from './Timeline';
import Details from './Details';
import Secret from '../Secret';

let dis = d3.dispatch('timeUpdate', 'hexHover');
let details = Details();

d3.select('#details').datum([0]).call(details);

// ** ------- MODULES INIT ------- **
let timeline = Timeline().on('disBrush', data => {
  let startDate = data.startDate,
      endDate = data.endDate

  dis.call('timeUpdate', null, {start: startDate, end: endDate});

  dis.call('hexHover', null, {data: startDate});



});


function redraw(array) {
  let filtered = [];

  dis.on('timeUpdate', d => {
    let coords = [];
    filtered = _.filter(array, function(el) {
      return el.features[0].properties.eventDate >= d.start && el.features[0].properties.eventDate <= d.end
    })

    //array with all the coordinates (used for hexagonal binning)    
    filtered.forEach(el => {coords.push([el.features[0].geometry.coordinates[0], el.features[0].geometry.coordinates[1]]) });

    drawFeatures(filtered);

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
        .radius(30)
        .extent([[0, 0], [width, height]])

      // let color = d3.scaleSequential(d3.interpolateLab("#fef0d9", "#d7301f'"))
      //   .domain([1, 3]);

      let color = d3.scaleThreshold()
        .domain([1, 5])
        .range(['#fef0d9','#fdcc8a','#fc8d59','#d7301f'])

      let featureElement = svg.selectAll('path')
          .data(data)
          .enter()
          .append('path')
          .attr('stroke', 'gray')
          .attr('fill', 'red')
          .attr("fill-opacity", 0.4)

      map.on('zoom movend viewreset', update);
      update();

      function update() {
        // featureElement.attr('d', path);
        d3.selectAll('.aHex').remove();

        let hexagons = svg.append('g')
          .selectAll('path')
          .data(hex(updateHexCoords(coords)).sort(function(a,b) { return b-length - a.length; }))
          .attr('class', 'hexagon');;

        //UPDATE
        hexagons.attr('class', 'hexagon');

        //ENTER+UPDATE
        hexagons.enter().append('path')
          .attr('class', 'aHex')
          .attr('fill-opacity', .5)
          .merge(hexagons)
            .attr("d", hex.hexagon())
            .attr("fill", function(d) { return color(d.length); })
            .attr('stroke', 'gray')
            .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")"; })
            
        hexagons.exit().remove();
      }
    } //-->END .drawFeatures()


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
    L.svg().addTo(map);



    const casesByDate = d3.nest()
      .key(function(d) { return d.features[0].properties.eventDate; })
      .rollup(function(cases) {return cases.length})
      .entries(dummyCases);
    d3.select('#timeline').datum(casesByDate).call(timeline);

    redraw(dummyCases); //where all the magic happens
 
  }); //-->END .on('loaded')


  // ** ------- DATA QUERY ------- **
getData();

