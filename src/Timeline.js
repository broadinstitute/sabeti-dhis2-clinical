import * as d3 from 'd3';

function Timeline(){
	let W, H, M = {t:20,r:20,b:20,l:20};
	const baseRadius = 60;
	let timeRange = d3.range(1, 13, 1);
	let pieRange = d3.range(0, 12, 1);

	function exports(selection){
		let arr = selection.datum()?selection.datum():[];
		W = W || selection.node().clientWidth - M.l - M.r;
		H = H || selection.node().clientHeight - M.t - M.b;


		// ** ------- SCALES & AXES ------- **
		let timeExtent = d3.extent(arr, function(d) { return new Date(d.key); })

		let scaleTime = d3.scaleTime()
			.domain([timeExtent[0], timeExtent[1]])
			.range([0 + M.l, W]);

		let scaleVals = d3.scaleLinear()
			.domain([0, d3.max(arr, function(d) { return +d.value })])
			.range([H, 0]);

		let xAxis = d3.axisBottom(scaleTime)
			// .tickFormat(d3.timeFormat("%Y-%m-%d"));
		let yAxis = d3.axisLeft(scaleVals).ticks(4);

		// ** ------- APPEND SVG ------- **
		let svg = selection.selectAll('svg')
			.data([0])

		let svgEnter = svg.enter()
			.append('svg') //ENTER
			.attr('width', W + M.l + M.r)
			.attr('height', H + M.t + M.b)

		let plotEnter = svgEnter.append('g').attr('class','plot time-series')
			.attr('transform','translate('+M.l+','+M.t+')');

		plotEnter.append('g').attr('class', 'axis axisX').attr('transform', 'translate(' + 0 + ',' + H + ')');
		plotEnter.append('g').attr('class', 'axis axisY');

		plotEnter.selectAll('.bars').data(arr).enter().append('rect')
				.attr('class', 'bars')
		    .attr('x', function(d) { return scaleTime(new Date(d.key)); })
		    .attr('y', function(d) { return scaleVals(d.value); })
		    .attr('width', 5)
		    .attr('height', function(d) {return H - scaleVals(d.value); })
		    .style('fill', '#000');

		svgEnter.select('.axisX').call(xAxis);
		svgEnter.select('.axisY').call(yAxis);

	};//-->END exports()
	return exports;
}//-->END Timeline()

export default Timeline;
