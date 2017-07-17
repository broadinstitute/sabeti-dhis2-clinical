import {queue, csv, dispatch} from 'd3';

function DataLoader(){
	let q = queue();
	let dis = dispatch('loaded', 'error');

	function parseCases(d){
		return {
			program: d.program,
			orgUnit: d.orgUnitName,
			eventDate: parseTime(d.eventDate),
			outcome: d['Kenema | Outcome']?d['Kenema | Outcome']:undefined,
			district: d.District,
			chiefdom: d.Chiefdom,
			age: d['Age in years'],
			pcrLoad: d['EBOV PCR Load'],
			gender: d.Gender?d.Gender:undefined,
			genBankId: d['GenBank IDs'],
			lng: +parseLocation(d['Household location'])[0]?+parseLocation(d['Household location'])[0]:undefined,
			lat: +parseLocation(d['Household location'])[1]?+parseLocation(d['Household location'])[1]:undefined,
			// genBankId: d['GenBank IDs'].split(','),
			gid: d.GID,
			uid: d.event
		};
	}

	function parseGeoJson(d){
		return {
      type: "FeatureCollection",
      "features": [
	      { "type": "Feature",
		      "geometry": {type: "Point", "coordinates": [
		      	+parseLocation(d['Household location'])[0]?+parseLocation(d['Household location'])[0]:undefined,
		      	+parseLocation(d['Household location'])[1]?+parseLocation(d['Household location'])[1]:undefined
		      ]},
		      "properties": {
						program: d.program,
						orgUnit: d.orgUnitName,
						eventDate: parseTime(d.eventDate),
						outcome: d['Kenema | Outcome']?d['Kenema | Outcome']:undefined,
						district: d.District,
						chiefdom: d.Chiefdom,
						age: d['Age in years'],
						pcrLoad: d['EBOV PCR Load'],
						gender: d.Gender?d.Gender:undefined,
						genBankId: d['GenBank IDs'],
						// genBankId: d['GenBank IDs'].split(','),
						gid: d.GID,
						uid: d.event
		      }
	      }
      ]
    }
  }

	function parseLocation(loc){ return  loc.replace(/\[|\]/g, '').split(',') } //remove '[' and ']' from '[lng, lat]'

	function parseTime(timeStr){
		let time = timeStr.split('-'),
			year = +time[0],
			month = +time[1]-1,
			day = +time[2];
		return new Date(year, month, day);
	}

	function exports(){
		q
			.defer(csv, '../data/kenema_data.csv',parseCases)
			.defer(csv, '../data/kenema_data.csv',parseGeoJson)
			.await((err, cases, geocCases)=>{
				if (err){
					dis.call('error', null, Error(err));
					return; //break
				}
				dis.call('loaded', null, {cases: cases, geoCases: geocCases});
			});
	}

	exports.on = function(event, callback){
		dis.on(event, callback);
		// dis.on.apply(dis, arguments);
		return this; //this = exports
	}

	return exports;
}

export default DataLoader;