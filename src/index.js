// ** ------- DEPENDENCIES ------- **
import './styles/index.css';
import * as d3 from 'd3';
import {hexbin} from 'd3-hexbin';
import * as L from 'leaflet';
let cf = require('crossfilter');


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
    geoArr.forEach(el => { coords.push([el.features[0].geometry.coordinates[0], el.features[0].geometry.coordinates[1]]) });


    // ** ------- calling drawing functions ------- **
    // calling the timeline
    d3.select('#timeline').datum(casesByDate).call(timeline);

    // calling the map
    main(geoArr);

    function main(data){
      addLmaps();
      drawFeatures(data);   
    }

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

    function projectPoint(x, y) {
      let point = map.latLngToLayerPoint(new L.LatLng(y, x));
      this.stream.point(point.x, point.y);
    }

    function drawFeatures(data) {
      const svg = d3.select('#map').select('svg');
      const width = +svg.attr('width');
      const height = +svg.attr('height');
      let transform = d3.geoTransform({point: projectPoint});
      let path = d3.geoPath().projection(transform);
      path.pointRadius(7);
      
      var randomX = d3.randomNormal(width / 2, 80),
      randomY = d3.randomNormal(height / 2, 80),
      points = d3.range(50).map(function() { return [randomX(), randomY()]; });

      let hex = hexbin()
        // .extent([0, 0], [width, height])

      let radius = d3.scaleLinear()
        .domain([0, 3])
        .range([5, 30]);

      console.log(hex(coords));

      console.log(map.getPixelBounds())
  
      let featureElement = svg.selectAll('path')
          .data(data)
          .enter()
          .append('path')
          .attr('stroke', 'gray')
          .attr('fill', 'red')
          .attr("fill-opacity", 1);

      svg.append('g')
        .attr('class', 'hexagon')
        .selectAll('path')
        .data(hex(coords))
        .enter().append('path')
          .attr("d", function(d) { return hex.hexagon(radius(d.length)); })
          .attr("transform", function(d) {
            console.log(map.latLngToLayerPoint([d.x, d.y]))
            return "translate(" + map.latLngToLayerPoint([d.y, d.x]).x + "," + map.latLngToLayerPoint([d.y, d.x]).y + ")";
          })
          .attr('fill', 'blue');
  
      map.on('moveend', update);
      update();
  
      function update() {   
          featureElement.attr('d', path);
      }
    }
  }); //-->END .on('loaded')


  // ** ------- DATA QUERY ------- **
getData();

