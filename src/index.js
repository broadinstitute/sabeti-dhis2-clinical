// ** ------- DEPENDENCIES ------- **
import './styles/index.css';
import * as d3 from 'd3';
import {hexbin} from 'd3-hexbin';
import * as L from 'leaflet';
// import '@asymmetrik/leaflet-d3'
let cf = require('crossfilter');
let pixelCoords = [];

// console.log(HexbinLayer());


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
    let map;
    const allCases = data.cases;
    const geoCases = data.geoCases;


    // ** ------- Data Models ------- **
    // nested by eventDate
    const casesByDate = d3.nest()
      .key(function(d) { return d.eventDate; })
      .rollup(function(cases) { return cases.length; })
      .entries(allCases);

    //arrays with only objects that have a valid lat and long
    let locationArr = allCases.filter(function(el) { return !(el.lat === undefined || el.lng === undefined) })

    let geoArr = geoCases.filter(function(el, i){
      return !(el.features[0].geometry.coordinates[0] === undefined || el.features[0].geometry.coordinates[1] === undefined)
    })

    //array with all the coordinates (used for hexagonal binning)    
    let coords = []
    
    geoArr.forEach(el => {coords.push([el.features[0].geometry.coordinates[0], el.features[0].geometry.coordinates[1]]) });


    // ** ------- calling drawing functions ------- **
    // calling the timeline
    d3.select('#timeline').datum(casesByDate).call(timeline);

    // calling the map
    main(geoArr);



    function addLmaps() {
      let marker;
      const mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';

      map = L.map('map').setView([8.4506145, -11.3474766], 8);
      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; ' + mapLink + ' Contributors',
        maxZoom: 18,
        }).addTo(map);
      L.svg().addTo(map);

      // var hexLayer = L.hexbinLayer().addTo(map);

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



    console.log(pixelCoords);

    function drawFeatures(data) {
      const svg = d3.select('#map').select('svg');
      const width = +svg.attr('width');
      const height = +svg.attr('height');
      let transform = d3.geoTransform({point: projectPoint});
      let path = d3.geoPath().projection(transform);
      path.pointRadius(7);

      // var randomX = d3.randomNormal(width / 2, 80),
      // randomY = d3.randomNormal(height / 2, 80),
      // points = d3.range(50).map(function() { return [randomX(), randomY()]; });


    coords.forEach(el => {
      let point = map.latLngToLayerPoint([el[1], el[0]]);
      
      pixelCoords.push([point.x, point.y]);
      return pixelCoords;
    });

      let hex = hexbin()
      .radius(20)
        .extent([[0, 0], [width, height]])
      
      console.log(hex(pixelCoords));
      console.log(coords);

      let radius = d3.scaleLinear()
        .domain([1, 3])
        .range([5, 100]);

      let color = d3.scaleSequential(d3.interpolateLab("white", "steelblue"))
        .domain([1, 3]);

      let featureElement = svg.selectAll('path')
          .data(data)
          .enter()
          .append('path')
          .attr('stroke', 'gray')
          .attr('fill', 'red')
          .attr("fill-opacity", 0.2);

      let hexagons = svg.append('g')
        .attr('class', 'hexagon')
        .selectAll('path')
        .data(hex(pixelCoords).sort(function(a,b) { return b-length - a.length; }))
        .enter().append('path')
          .attr("d", hex.hexagon())
          .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")";
          })
          .attr("fill", function(d) { return color(d.length); })
          .attr('fill-opacity', 1);
  
      map.on('moveend', update);
      update();
  
      function update() {
          featureElement.attr('d', path);
          hexagons
          .data(hex(pixelCoords).sort(function(a,b) { return b-length - a.length; }))
          .attr("d", hex.hexagon())
          hexagons.attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")";
          })
      }
    }
  }); //-->END .on('loaded')


  // ** ------- DATA QUERY ------- **
getData();

