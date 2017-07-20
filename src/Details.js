import * as d3 from 'd3';
import Timeline from './Timeline';

function Details(){
	let W, H, M = {t:20,r:30,b:20,l:30};
	let dis = d3.dispatch('hexHover');

	function exports(selection){
		let arr = selection.datum()?selection.datum():[];
		W = W || selection.node().clientWidth - M.l - M.r;
		H = H || selection.node().clientHeight - M.t - M.b;

		let timeline = Timeline().on('disBrush', data => {
  		let startDate = data.startDate,
      endDate = data.endDate

      console.log(startDate);
    })

		let svg = selection.selectAll('svg')
			.data([0])

		let svgEnter = svg.enter()
			.append('svg') //ENTER
			.attr('width', W + M.l + M.r)
			.attr('height', H + M.t + M.b)

		svgEnter
			.append("text")
			.text('some text')
			.attr('dy', '1em');

	};//-->END exports()

	exports.on = function(event, callback){
		dis.on(event, callback);
		return this;
	}

	return exports;
}//-->END Details()

export default Details;
