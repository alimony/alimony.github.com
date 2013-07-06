(function () {
	'use strict';

	// Set to true to replace the static HTML with live data from the SCB
	// database through their API. For more information, see:
	// http://www.scb.se/Pages/List____354082.aspx
	var FETCH_LIVE_RESULTS = false;

	if (FETCH_LIVE_RESULTS) {
		// This will replace the table contents with a simple message string.
		var setMessage = function (message) {
			$('#tbody').html('<tr><td colspan="4" class="message">' + message + '</td></tr>');
		};

		var millionStringForValue = function (value) {
			return (value / 1000000).toFixed(2).replace('.', ',') + ' milj.';
		};

		var percentStringForValue = function (value) {
			return (value * 100).toFixed(2).replace('.', ',') + '%';
		};

		var POPULATION_2005_2012_API_URL = '//api.scb.se/OV0104/v1/doris/sv/ssd/AM/AM0401/AM0401A/NAKUBefolkningAr';
		var POPULATION_2005_2012_POST_DATA = {
			'query': [
				{
					'code': 'Alder',
					'selection': {
						'filter': 'item',
						'values': ['tot16-64']
					}
				},
				{
					'code': 'Arbetskraftstillh',
					'selection': {
						'filter': 'item',
						'values': ['TOTALT', 'SYS']
					}
				},
				{
					'code': 'ContentsCode',
					'selection': {
						'filter': 'item',
						'values': ['AM0401GB']
					}
				},
				{
					'code': 'Tid',
					'selection': {
						'filter': 'item',
						'values': [
							'2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012'
						]
					}
				}
			],
			'response': { 'format': 'json' }
		};
		var POPULATION_2005_2012_QUERY = JSON.stringify(POPULATION_2005_2012_POST_DATA);

		var POPULATION_1976_2004_API_URL = '//api.scb.se/OV0104/v1/doris/sv/ssd/AM/AM0401/AM0401B_OLD/AKUABefolkning';
		var POPULATION_1976_2004_POST_DATA = {
			'query': [
				{
					'code': 'Arbetskraftstillh',
					'selection': {
						'filter': 'item',
						'values': ['SYS', 'ALÖS', 'EIAKR']
					}
				},
				{
					'code': 'ContentsCode',
					'selection': {
						'filter': 'item',
						'values': ['AM0401H1']
					}
				},
				{
					'code': 'Tid',
					'selection': {
						'filter': 'item',
						'values': [
							'1976', '1977', '1978', '1979',
							'1980', '1981', '1982', '1983', '1984', '1985', '1986', '1987', '1988', '1989',
							'1990', '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999',
							'2000', '2001', '2002', '2003', '2004'
						]
					}
				}
			],
			'response': { 'format': 'json' }
		};
		var POPULATION_1976_2004_QUERY = JSON.stringify(POPULATION_1976_2004_POST_DATA);

		var results = {};

		setMessage('Hämtar data från SCB…');

		$.when(
			$.post(POPULATION_2005_2012_API_URL, POPULATION_2005_2012_QUERY, function (data) {
				$.each(data.data, function (index, element) {
					// The first half of the returned data array will be the population
					// values and the second half will be the employed values.
					var year = parseInt(element['key'][2], 10);
					results[year] = results[year] || { population: 0, employed: 0 };
					if (element['key'][1] === 'totalt') {
						results[year].population = parseInt(element['values'][0] * 1000, 10);
					}
					else if (element['key'][1] === 'sysselsatta') {
						results[year].employed = parseInt(element['values'][0] * 1000, 10);
					}
					else {
						console.log('Received unknown key %s', element['key'][1]);
					}
				});
			}),
			$.post(POPULATION_1976_2004_API_URL, POPULATION_1976_2004_QUERY, function (data) {
				$.each(data.data, function (index, element) {
					var year = element['key'][1];
					results[year] = results[year] || { population: 0, employed: 0 };
					if (element['key'][0] === 'sysselsatta') {
						results[year].employed = parseInt(element['values'][0] * 100, 10);
					}
					results[year].population += parseInt(element['values'][0] * 100, 10);
				});
			})
		)
		.done(function () {
			var resultString = '<tr>';
			$.each(results, function (year, data) {
				resultString += '<td>' + year + '</td>';
				resultString += '<td>' + millionStringForValue(data.population) + '</td>';
				resultString += '<td>' + millionStringForValue(data.employed) + '</td>';
				resultString += '<td>' + percentStringForValue(data.employed / data.population) + '</td>';
				resultString += '</tr>';
			});
			$('#tbody').html(resultString);
			loadChart();
		})
		.fail(function () {
			setMessage('Kunde inte hämta data från SCB.<br />Pröva att <a href="." target="_self">ladda om</a> sidan.<br />Om det ändå inte fungerar, <a href="mailto:markus.magnuson@gmail.com" target="_self">skriv gärna</a> och berätta det.');
		});
	}
	else {
		loadChart();
	}

	function loadChart() {
		google.load('visualization', '1.0', { 'packages': ['corechart'] });
		google.setOnLoadCallback(drawChart);
	}

	// This will draw the chart based on the current HTML content in the table.
	// By extracting the data from the table, this will work even when no live
	// data has been fetched and is available in, maybe, a more convenient
	// JavaScript object.
	function drawChart() {
		var tableData = $.map($('#tbody tr'), function (tr) {
			var tds = $(tr).find('td');
			return [[tds.eq(0).text(), parseFloat(tds.eq(3).text().replace(',', '.'), 10)]];
		});

		tableData.unshift(['År', 'Sysselsättningsgrad']);

		var chartData = google.visualization.arrayToDataTable(tableData);

		var formatter = new google.visualization.NumberFormat({
			fractionDigits: 2,
			suffix: '%'
		});
		formatter.format(chartData, 1);

		var chartOptions = {
			backgroundColor: '#efefef',
			chartArea: { width: '75%' },
			colors: ['#993300'],
			fontSize: 15,
			fontName: 'Playfair Display, Georgia, Times, Times New Roman, serif',
			legend: { position: 'none' },
			vAxis: { format: '#\'%\'' }
		};

		var chart = new google.visualization.ColumnChart(document.getElementById('chart'));

		chart.draw(chartData, chartOptions);
	}
}());
