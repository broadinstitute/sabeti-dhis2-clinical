// ** ------- DEPENDENCIES ------- **
import './styles/index.css';
import * as d3 from 'd3';
import * as hexbin from 'd3-hexbin';
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
    const geoCases = data.geoCases;

    console.log(geoCases);

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

    let geoArr = geoCases.filter(function(el, i){
      return !(el.features[0].geometry.coordinates[0] === undefined || el.features[0].geometry.coordinates[1] === undefined)
    })

    locationArr.forEach(d => { marker = new L.marker([d.lat, d.lng]).addTo(map); });

    locationArr.forEach(function(d) {
      d.LatLng = new L.LatLng(d.lat, d.lng)
    })


    //initialize svg layer

    let svgLayer = L.svg();
    svgLayer.addTo(map);
    let projectPoint;

    let svg = d3.select("#map").select("svg");
    let g = d3.select("#map").select("svg").select('g');
    g.attr("class", "leaflet-zoom-hide");

    let transform = d3.geoTransform({point: projectPoint}),
        path = d3.geoPath().projection(transform);

    let d3_features = g.selectAll('path')
      .datum({type: "FeatureCollection", features: geoArr.features})
      .enter().append('path');

    map.on('viewreset', reset);

    reset();

    function reset() {
        
    let bounds = map.getBounds(),
        topLeft = map.latLngToLayerPoint(bounds.getNorthWest()),
        bottomRight = map.latLngToLayerPoint(bounds.getSouthEast()),
        existing = d3.set(),
        drawLimit = bounds.pad(0.4);

      svg.style("width", map.getSize().x + 'px')
      .style("height", map.getSize().y + 'px')
      .style("margin-left", topLeft.x + "px")
      .style("margin-top", topLeft.y + "px");

      g.attr("transform", "translate(" + (-topLeft.x) + "," + (-topLeft.y) + ")");

      // initialize the path data 
      d3_features.attr("d", path)
        .style("fill-opacity", 0.7)
        .attr('fill','blue');


    // Use Leaflet to implement a D3 geometric transformation.
      function projectPoint(x, y) {
        let point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
      }
    }

  }); //-->END .on('loaded')


  // ** ------- DATA QUERY ------- **
getData();

