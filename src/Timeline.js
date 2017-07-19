import * as d3 from 'd3';

function Timeline(){
	let W, H, M = {t:20,r:20,b:20,l:20};
	let dis = d3.dispatch('disBrush');

	function exports(selection){
		let arr = selection.datum()?selection.datum():[];
		W = W || selection.node().clientWidth - M.l - M.r;
		H = H || selection.node().clientHeight - M.t - M.b;

		// ** ------- SCALES & AXES ------- **
		let timeExtent = d3.extent(arr, function(d) { return new Date(d.key); })

		console.log(timeExtent);

		let scaleTime = d3.scaleTime()
			.domain([timeExtent[0], timeExtent[1]])
			.range([0, W])
			.clamp(true)
			.nice();

		let scaleVals = d3.scaleLinear()
			.domain([0, d3.max(arr, function(d) { return +d.value })])
			.range([H, 0]);

		let xAxis = d3.axisBottom(scaleTime)
			// .tickFormat(d3.timeFormat("%Y-%m-%d"));
		let yAxis = d3.axisLeft(scaleVals).ticks(4);

		let brush = d3.brushX()
			.extent([[0,0], [W, H]])
			.on("end", brushed);

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

		let context = plotEnter.append('g').attr('class', 'context').attr('transform', 'translate(' + 0 + ',' + 0 + ')');

		context.append('g')
			.attr('class', 'brush')
			.call(brush)
			.call(brush.move, scaleTime.range())

		function brushed() {
			let selection = d3.event.selection;
			let startDate = scaleTime.invert(selection[0]);
			let endDate = scaleTime.invert(selection[1]);

			dis.call('disBrush', null, {startDate: startDate, endDate: endDate});
		}

	};//-->END exports()

	exports.on = function(event, callback){
		dis.on(event, callback);
		return this;
	}

	return exports;
}//-->END Timeline()

export default Timeline;
