import * as d3 from 'd3';
import * as L from 'leaflet';

function LMap(data){
      const svg = d3.select('#map').select('svg');
      const width = +svg.attr('width');
      const height = +svg.attr('height');

      function exports(selection){    
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

        function update() {
          featureElement.attr('d', path);

          let hexagons = svg
            .selectAll('aHex')
            .data(hex(updateHexCoords(coords)).sort(function(a,b) { return b-length - a.length; }));

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
              
          hexagons.exit().remove();
        }//-->END .update()
      }
}

export default LMap;

// ** ------- ACCESORY FUNCTIONS ------- **
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