$(document).ready(function () {
	'use strict';

	var ARTIST_ID = 3592216; // Interpreti Veneziani on Discogs.
	var NUMBER_OF_RELEASES = 18; // To keep track of how many releases are left to add on Discogs.
	var RELEASES_API_URL = 'http://api.discogs.com/artists/' + ARTIST_ID + '/releases';
	var WEBSITE_BASE_URL = 'http://www.interpretiveneziani.com/en';
	var CONCERTS_JSONP_URL = 'http://rightbox.org/alimony.github.com/interpreti-veneziani/scripts/concerts.php';

	// This will map Discogs id to a release's URL on the official website.
	var WEBSITE_PATHS = {
		5189934: '/disco-8-concerti-a-titolo.html',
		5195481: '/disco-139-strings-dances.html',
		5196226: '/disco-143-virtuoso.html',
		5199356: '/disco-175-geminiani-albinoni-vivaldi.html',
		5202488: '/en/disco-145-yumi-yamagata---dreaming-venice.html',
		5204682: '/disco-140-il-cimento-dellarmonia-e-dellinvenzione-i-le-quattro-stagioni.html'
	};

	// Fetch all releases from Discogs.
	$.ajax({
		url: RELEASES_API_URL,
		dataType: 'jsonp',
		success: function (data) {
			// Log all fetched release data, might be good to look at.
			console.log('Successfully fetched release data:', data);

			// Sort all releases by date, latest first.
			var releases = _.sortBy(data.data.releases, 'year').reverse();

			// We will construct all elements outside the DOM for efficiency.
			var elementsToAdd = [];

			$.each(releases, function (index, release) {
				// If there no website was found in our static data above, this
				// will default to the base URL instead.
				var url = WEBSITE_BASE_URL + (WEBSITE_PATHS[release.id] || '');

				// Split the release title on dash and only keep the first part,
				// i.e. throw away any subtitles, to avoid for our purposes
				// unnecessarily long titles.
				var title = release.title.split('-')[0];

				elementsToAdd.push('' +
					'<div class="release">' +
					'<a class="image-link" href="' + url + '" target="_blank"><img src="' + release.thumb + '" width="150" height="150" data-adaptive-background="1" /></a>' +
					'<h3><a href="' + url + '" target="_blank">' + title + '</a></h3>' +
					'<em class="year">' + release.year + '</em>' +
					'</div>');
			});

			var releasesLeft = NUMBER_OF_RELEASES - releases.length;
			if (releasesLeft > 0) {
				elementsToAdd.push('' +
					'<div class="release" style="background: none;">' +
					'<em class="year">(' + releasesLeft + ' releases not yet<br /> added to <a href="http://www.discogs.com/artist/3592216-Interpreti-Veneziani" target="_blank">Discogs</a>.)</em>' +
					'</div>');
			}

			// Remove the "Loading..." text by emptying its parent, and add all elements.
			$('#releases').empty().append(elementsToAdd.join(''));

			// Color all album backgrounds based on colors in the image.
			$.adaptiveBackground.run({
				parent: 'div.release'
			});
		}
	});

	// Fetch all upcoming concert dates and wrestle them into a simpler object.
	$.ajax({
		url: CONCERTS_JSONP_URL,
		dataType: 'jsonp',
		success: function (data) {
			console.log('Successfully fetched concert data:', { data: data });

			var calendar = {};
			// This object will at the end hold a structure of dates like this:
			// calendar = {
			//     [year]: {
			//         [month]: {
			//             [day]: url,
			//             [day]: url,
			//             [day]: url,
			//             ...
			//         },
			//         ...
			//     },
			//     ...
			// }
			var elementsToAdd = [];
			$.each(data, function (index, element) {
				var date = moment(element[0]);
				var now = moment();
				if (date > now) {
					var year = date.year();
					var month = date.month();
					var day = date.date();
					var url = WEBSITE_BASE_URL + '/' + element[1];
					if (!(year in calendar)) {
						calendar[year] = {};
					}
					if (!(month in calendar[year])) {
						calendar[year][month] = {};
					}
					calendar[year][month][day] = url;
				}
			});
			// Now that we have a nicely sorted object, build HTML from it.
			$.each(_.keys(calendar), function (index, year) {
				elementsToAdd.push('<h3>' + year + '</h3>');
				$.each(_.keys(calendar[year]), function (index, month) {
					elementsToAdd.push('<h4>' + moment.months()[month] + ':');
					$.each(_.keys(calendar[year][month]), function (index, day) {
						elementsToAdd.push('<a href="' + calendar[year][month][day] + '" target="_blank">' + day + '</a>');
					});
					elementsToAdd.push('</h4>');
				});
			});
			$('#concerts').empty().append(elementsToAdd.join(''));
		}
	});
});
