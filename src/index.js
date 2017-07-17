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

    //an array with only objects that have a valid lat and long
    let locationArr = allCases.filter(function(el) { return !(el.lat === undefined || el.lng === undefined) })

    let geoArr = geoCases.filter(function(el, i){
      return !(el.features[0].geometry.coordinates[0] === undefined || el.features[0].geometry.coordinates[1] === undefined)
    })

    let map;
    main(geoArr)

    function main(data){
      addLmaps();
      drawFeatures(data);   
    }

    function addLmaps() {
        map = L.map('map').setView([8.4506145, -11.3474766], 8);
        let mapLink = 
          '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        L.tileLayer(
          'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; ' + mapLink + ' Contributors',
          maxZoom: 18,
          }).addTo(map);

        L.svg().addTo(map);

        
    locationArr.forEach(d => { marker = new L.marker([d.lat, d.lng]).addTo(map); });

    locationArr.forEach(function(d) {
      d.LatLng = new L.LatLng(d.lat, d.lng)
    })


    }

    function projectPoint(x, y) {
      let point = map.latLngToLayerPoint(new L.LatLng(y, x));
      this.stream.point(point.x, point.y);
    }

    function drawFeatures(data) {
        var svg = d3.select("#map").select("svg");
        
        var transform = d3.geoTransform({point: projectPoint});
        var path = d3.geoPath().projection(transform);
    
        var featureElement = svg.selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("stroke", "gray")
            .attr("fill", "red")
            .attr("fill-opacity", 1);
    
        map.on("moveend", update);
        update();
    
        function update() {   
            featureElement.attr("d", path);
        } 
    }
  }); //-->END .on('loaded')


  // ** ------- DATA QUERY ------- **
getData();

