// ** ------- DEPENDENCIES ------- **
import './styles/index.css';
import * as d3 from 'd3';
import {hexbin} from 'd3-hexbin';
import * as L from 'leaflet';
let _ = require('lodash');
let pixelCoords = [];
let map;


// ** ------- JS MODULES ------- **
import DataLoader from './data';
import Timeline from './Timeline';
import Details from './Details';
import Fasta from './Fasta';
import {projectPoint, updateHexCoords} from './Utils';
import Secret from '../Secret'; //go to Secret.js and add your own MapBox key

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


function redraw(array) {
  let filtered = [];

  dis.on('timeUpdate', d => {
    let coords = [];
    filtered = _.filter(array, function(el) {
      return el.features[0].properties.eventDate >= d.start && el.features[0].properties.eventDate <= d.end
    })

    //array with all the coordinates (used for hexagonal binning)    
    filtered.forEach(el => {coords.push([el.features[0].geometry.coordinates[0], el.features[0].geometry.coordinates[1], el.features[0].properties.sequence]) });

    drawFeatures(filtered);

    function projectPoint(x, y) {
      let point = map.latLngToLayerPoint(new L.LatLng(y, x));
      this.stream.point(point.x, point.y);
    }

    function updateHexCoords(array) {
      let newArr = []
      array.forEach(el => {
        let point = map.latLngToLayerPoint([el[1], el[0]]);
        newArr.push([point.x, point.y, el[2]]);
      });
      return newArr;
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

      let color = d3.scaleQuantize()
        .domain([1, 7])
        .range(['#fef0d9','#fdcc8a','#fc8d59','#d7301f'])

      let featureElement = svg.selectAll('path')
          .data(data)
          .enter()
          .append('path')
          .attr('class', 'point-case')
          .attr('stroke', 'gray')
          .attr('fill', 'red')
          .attr("fill-opacity", 0.4)
          .attr('style', 'pointer-events:visiblePainted;')
          .classed('hide', true)
          .on('mouseover', function(d) {
            let id = d.features[0].properties.sequence;
            Fasta(id);
          })
          .on('mouseout', function(d) {
            let detailsNode = document.getElementById('hexDetails');
            detailsNode.innerHTML = '';
          })

      map.on('zoom movend viewreset', update);
      update();


      document.getElementById('cases-btn').onclick = showCases;
      document.getElementById('cluster-btn').onclick = showCluster;

      function showCases() {
        let points = d3.selectAll('.point-case');
        let hexagons = d3.selectAll('.aHex');

        points.classed('hide', !points.classed("hide"));
        hexagons.classed('hide', !hexagons.classed("hide"));
      }

      function showCluster() {
        let points = d3.selectAll('.point-case');
        let hexagons = d3.selectAll('.aHex');

        points.classed('hide', !points.classed("hide"));
        hexagons.classed('hide', !hexagons.classed("hide"));
      }

      function update() {
        featureElement.attr('d', path);
        // d3.selectAll('.aHex').remove();

        let hexagons = svg
          .selectAll('path')
          .data(hex(updateHexCoords(coords)).sort(function(a,b) { return b-length - a.length; }));

        //UPDATE
        hexagons.attr('class', 'hexagon');

        hexagons.exit().remove();

        //ENTER+UPDATE
        hexagons.enter().append('path')
          .attr('class', 'aHex')
          .attr('fill-opacity', .5)
            .merge(hexagons)
            .attr("d", hex.hexagon())
            .attr("fill", function(d) { return color(d.length); })
            .attr('stroke', 'gray')
            .attr('style', 'pointer-events:visiblePainted;')
            .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")"; })
            



            .on('mouseover', function(d) {
              let listOfIds = [];
              let detailsNode = document.getElementById('hexDetails');
              let coords = map.layerPointToLatLng([d.x, d.y]);

              d3.select(this).classed('hexHover', true);

              d.forEach(d => {
                listOfIds.push(d[2])
                return listOfIds;
              })
              
              const markup = `
              <h5>
                ${d.length} cases near</span>
              </h5>
              <h5>
                ${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}
              </h5>
              <ul></ul>
              `;
              detailsNode.innerHTML = markup;
            })

            .on("mouseout", function(d) {
              d3.select(this).classed('hexHover', !d3.select(this).classed('hexHover'));

              let detailsNode = document.getElementById('hexDetails');
              detailsNode.innerHTML = '';
            });
            
      
      }//-->END .update()
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
    L.svg().addTo(map)


    const casesByDate = d3.nest()
      .key(function(d) { return d.features[0].properties.eventDate; })
      .rollup(function(cases) {return cases.length})
      .entries(dummyCases);
    d3.select('#timeline').datum(casesByDate).call(timeline);

    console.log(casesByDate);

    redraw(dummyCases); //where all the magic happens
 
  }); //-->END .on('loaded')


  // ** ------- DATA QUERY ------- **
getData();

