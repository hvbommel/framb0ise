var LastUpdateTime = parseInt(0);
var checkLoop;

function updateCams() {
	var url = localStorage.domoticzUrl + '/json.htm?type=cameras';
	$.getJSON(url, function(data) {
		data.result.forEach(function(cam) {
			$.each(localStorage, function(key, value) {
				if (~key.indexOf("cam")) {
					if (value == cam.idx) {
						var url = 'http://' + cam.Username + ':' + cam.Password + '@' + cam.Address + ':' + cam.Port + '/' + cam.ImageURL
						$('#snapshot-' + cam.idx).attr('src', url).on('load', function() {
							$('#snapshot-' + cam.idx).show();
						});
					}
				}
			})
		})
	})
}

function updateRss() {
	$("#room-news").empty();
	var rssUrl = localStorage.getItem('rssUrl');
	$("#room-news").rss(rssUrl, {
		ssl: true,
		limit: 5,
		layoutTemplate: '{entries}',
		entryTemplate: '<tr><td colspan="2">{title}</td></tr>'
	});
}

function updateCalendar() {
	$("#room-calendar").empty();
	var icsUrl = 'https://crossorigin.me/' + localStorage.getItem('icsUrl');
	new ical_parser(icsUrl, function(cal) {
		var events = cal.getFutureEvents();
		var counter = 0;
		events.forEach(function(event) {
			if (counter < 5) {
				var date = event.start_date;
				date = date.replace(/\//g, "-")
				var time = event.start_time;
				var widget = '<tr><td class="device">' + date + ' ' + time + '</td><td class="data">' + event.SUMMARY + '</td></tr>'
				$("#room-calendar").append(widget);
			}
			counter++;
		});
	});
}

function fullPagerefresh() {
	location.reload();
}

function readCams() {
	$("#domoCams").empty();
	var url = localStorage.domoticzUrl + '/json.htm?type=cameras';
	var domoCam;
	$.getJSON(url, function(data) {
		data.result.forEach(function(cam) {
			domoCam = '<div class="checkbox"><label><input class="activeCam" type="checkbox" id="cam-' + cam.idx + '" value="' + cam.idx + '"> ' + cam.Name + '</label></div>';
			$("#domoCams").append(domoCam);
		})
	})
}

function editSettings() {
	var icsUrl = localStorage.getItem('icsUrl');
	$("#icsUrl").val(icsUrl);
	var domoticzUrl = localStorage.getItem('domoticzUrl');
	var domoticzUrl = localStorage.getItem('domoticzUrl');
	if (domoticzUrl == "") {
		var domoticzUrl = $(location).attr('protocol') + "//" + $(location).attr('host');
	}
	$("#domoticzUrl").val(domoticzUrl);
	var rssUrl = localStorage.getItem('rssUrl');
	$("#rssUrl").val(rssUrl);
	var panelClass = localStorage.getItem('panelClass');
	$("#panelClass").val(panelClass);
	$('input[type=radio]').each(function() {
		for (var i = 0, len = localStorage.length; i < len; i++) {
			var key = localStorage.key(i);
			var value = localStorage[key];
			if (key == "inlineRadio1" || key == "inlineRadio2" || key == "inlineRadio3") {
				$('#' + key).attr("checked", "checked");
			}
		}
	});
	$('input:checkbox').each(function() {
		for (var i = 0, len = localStorage.length; i < len; i++) {
			var key = localStorage.key(i);
			var value = localStorage[key];
			if (value == 1) {
				$('#' + key).attr("checked", "checked");
			}
		}
	});
	$("#settings").modal('show');
}

function saveSettings() {
	var jsonvar = "";
	var domoticzUrl = $("#domoticzUrl").val();
	//localStorage.setItem('domoticzUrl', domoticzUrl)
	jsonvar = saveSettingVar('domoticzUrl', domoticzUrl, jsonvar)
	var icsUrl = $("#icsUrl").val();
	//localStorage.setItem('icsUrl', icsUrl)
	jsonvar = saveSettingVar('icsUrl', icsUrl, jsonvar)
	var rssUrl = $("#rssUrl").val();
	//localStorage.setItem('rssUrl', rssUrl)
	jsonvar = saveSettingVar('rssUrl', rssUrl, jsonvar)
	var panelClass = $("#panelClass").val();
	//localStorage.setItem('panelClass', panelClass)
	jsonvar = saveSettingVar('panelClass', panelClass, jsonvar)
	$('input[type=radio]').each(function() {
		var RadioId = $(this).attr('id');
		if ($(this).is(":checked")) {
			localStorage.setItem(RadioId, 1);
			console.log("Radio=" + $(this).val() + $(this).is(":checked"))
		} else {
			localStorage.removeItem(RadioId);
		}
	});
	$('input:checkbox').each(function() {
		var checkboxId = $(this).attr('id');
		if ($(this).is(":checked")) {
			value = $(this).val();
			localStorage.setItem(checkboxId, value);
			jsonvar = saveSettingVar(checkboxId, value, jsonvar)
		} else {
			localStorage.removeItem(checkboxId);
		}
	});
	if ( localStorage.inlineRadio2 == 1 ) {
		var url = localStorage.domoticzUrl + '/json.htm?type=command&param=updateuservariable&vname=framb0ise&vtype=2&vvalue={' + jsonvar + '}';
		console.log("Update Domoticz uservariable framb0ise:" + url)
		$.getJSON(url, function(data) {});
	}
	location.reload();
}

function saveSettingVar(name, val, jsoninp) {
	localStorage.setItem(name, val)
	if (jsoninp != "") {
		jsoninp = jsoninp + ',';
	}
	return jsoninp + '"' + name + '":"' + val + '"'
}

function updateTraffic() {
	var widget;
	var url = 'https://cors.5apps.com/?uri=https://www.anwb.nl/feeds/gethf';
	$.getJSON(url, function(data) {
		data.roadEntries.forEach(function(road) {
			if (road.events.trafficJams.length != 0) {
				road.events.trafficJams.forEach(function(jam) {
					widget = widget + '<tr><td>' + road.road + '</td><td>' + jam.from + ' -> ' + jam.to + '</td></tr>';
				});
			}
		});
		$("#room-traffic").empty().append(widget);
		$(".pagination-container").empty();
		$('#room-traffic').paginathing({
			perPage: 5,
			prevNext: true,
			firstLast: true,
			prevText: '&laquo;',
			nextText: '&raquo;',
			firstText: 'First',
			lastText: 'Last',
			containerClass: 'pagination-container',
			ulClass: 'pagination',
			liClass: 'page',
			activeClass: 'active',
			disabledClass: 'disable'
		});
	});
}

function updateWeathermap() {
	var rainArray = [];
	var url = localStorage.domoticzUrl + '/json.htm?type=settings';
	$.getJSON(url, function(data) {
		var latitude = data.Location.Latitude;
		var longitude = data.Location.Longitude;
		var url = 'https://crossorigin.me/https://gpsgadget.buienradar.nl/data/raintext?lat=' + latitude + '&lon=' + longitude;
		$.get(url, function(data) {
			var rainData = data.split("\n");
			rainData.forEach(function(data) {
				if (data.substring(0, 3) != "000") {
					rainArray.push(data.substring(4, 9))
				}
			})
			if (rainArray.length > 1) {
				$("#title-weathermap").html('<b><i class="fa fa-umbrella fa-lg" aria-hidden="true"></i> rain from ' + rainArray[0] + ' to ' + rainArray[rainArray.length - 1]).css('color', 'orange');
			} else {
				$("#title-weathermap").html('<b><i class="fa fa-umbrella fa-lg" aria-hidden="true"></i>');
			}
		});
	})
	$("#room-weathermap").empty();
	var widget = '<tr><td colspan="2"><img src="https://api.buienradar.nl/image/1.0/RadarMapNL?w=256&h=256" width=100%></td></tr>';
	$("#room-weathermap").append(widget);
}

function setDimmer(idx, value) {
	var url = localStorage.domoticzUrl + '/json.htm?type=command&param=switchlight&idx=' + idx + '&switchcmd=Set%20Level&level=' + value;
	$.get(url, function(data) {
		checkWidgets();
	});
}

function readSettings(settings) {
	var url = localStorage.domoticzUrl + '/json.htm?type=settings';
	$.getJSON(url, function(data) {});
}

function upSetpoint(idx) {
	clearInterval(checkLoop);
	var setPoint = $("#setpoint-" + idx).val();
	setPoint = parseFloat(setPoint);
	setPoint = setPoint + 0.5;
	setPoint = setPoint.toFixed(1);
	$("#setpoint-" + idx).attr('value', setPoint);
}

function downSetpoint(idx) {
	clearInterval(checkLoop);
	var setPoint = $("#setpoint-" + idx).val();
	setPoint = parseFloat(setPoint);
	setPoint = setPoint - 0.5;
	setPoint = setPoint.toFixed(1);
	$("#setpoint-" + idx).attr('value', setPoint);
}

function setSetpoint(idx) {
	var setPoint = $("#setpoint-" + idx).val();
	var url = localStorage.domoticzUrl + '/json.htm?type=command&param=setsetpoint&idx=' + idx + '&setpoint=' + setPoint;
	$.getJSON(url, function(data) {});
	checkLoop = setInterval(checkWidgets, domoConfig.updateInterval);
}

function readHardware() {
	var url = localStorage.domoticzUrl + '/json.htm?type=hardware';
	$.getJSON(url, function(data) {
		if (data.result) {
			data.result.forEach(function(device) {
				switch (device.Type) {
				case 25:
					localStorage.setItem('DarkSkyUsername', device.Username);
					localStorage.setItem('DarkSkyPassword', device.Password);
					break;
				}
			});
		}
	});
}

function updateDarkSky() {
	url = 'https://cors.5apps.com/?uri=https://api.darksky.net/forecast/' + localStorage.DarkSkyUsername + '/' + localStorage.DarkSkyPassword + '?units=ca';
	$.get(url, function(data) {
		if (data.currently) {
			var skycons = new Skycons({
				"color": "black"
			});
			$("#td-darksky-icon").html('<canvas width="80" height ="80" id="skycon"></canvas>');
			switch (data.currently.icon) {
			case 'clear-day':
				skycons.set("skycon", Skycons.CLEAR_DAY);
				break;
			case 'clear-night':
				skycons.set("skycon", Skycons.CLEAR_NIGHT);
				break;
			case 'rain':
				skycons.set("skycon", Skycons.RAIN);
				break;
			case 'snow':
				skycons.set("skycon", Skycons.SNOW);
				break;
			case 'sleet':
				skycons.set("skycon", Skycons.SLEET);
				break;
			case 'wind':
				skycons.set("skycon", Skycons.WIND);
				break;
			case 'fog':
				skycons.set("skycon", Skycons.FOG);
				break;
			case 'cloudy':
				skycons.set("skycon", Skycons.CLOUDY);
				break;
			case 'partly-cloudy-day':
				skycons.set("skycon", Skycons.PARTLY_CLOUDY_DAY);
				break;
			case 'partly-cloudy-night':
				skycons.set("skycon", Skycons.PARTLY_CLOUDY_NIGHT);
				break;
			}
			if (data.currently.precipType == 'snow') {
				var precipIcon = '<i class="fa fa-snowflake-o fa-lg" aria-hidden="true"></i>';
			} else {
				var precipIcon = '<b><i class="fa fa-umbrella fa-lg" aria-hidden="true"></i></b>';
			}
			$("#td-darksky-preciptype").html(precipIcon);
			var precipProbability = data.currently.precipProbability * 100;
			precipProbability = precipProbability.toFixed(0);
			$("#td-darksky-precipprobability").html(precipProbability + ' %');
			var temperature = data.currently.temperature;
			temperature = parseFloat(temperature);
			temperature = temperature.toFixed(1);

			var weatherReport='<table>';
			console.log(data);
			data.daily.data.forEach(function(report){

			var weekDays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

			var date = new Date(report.time*1000);
			var weekday = weekDays[date.getDay()];
			var temperatureMin = data.daily.data[date.getDay()].temperatureMin;
			var temperatureMax = data.daily.data[date.getDay()].temperatureMax;

			weatherReport +='<tr><small><td>' + weekday + '</td><td>'+ temperatureMin +'&deg;c - '+ temperatureMax +'&deg;c</td></small></tr>';


			})

			weatherReport += '</table>';



			$("#title-weather").html('<b><i class="fa fa-thermometer-half fa-lg" aria-hidden="true"></i> ' + temperature + ' &deg;c</b>').attr('data-container', 'body').attr('data-placement', 'right').attr('data-content', weatherReport).attr('data-toggle', 'popover').attr('data-html', 'true');
			$('[data-toggle="popover"]').popover({
				trigger: "hover"
			});
			$("#td-darksky-wind").html(data.currently.windSpeed + ' km/h');
			skycons.play();
		}
	});
}

function updateTimeDate() {
	var currentTime = new Date();
	var hours = currentTime.getHours();
	var minutes = currentTime.getMinutes();
	var seconds = currentTime.getSeconds();
	var day = currentTime.getDate();
	var month = currentTime.getMonth() + 1;
	var year = currentTime.getFullYear();
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if (seconds < 10) {
		seconds = "0" + seconds;
	}
	var time = hours + ":" + minutes;
	var date = day + "-" + month + "-" + year;
	$("#time").html(time).css("font-size", "40px");
	$("#title-info").html('<b><i class="fa fa-clock-o fa-lg" aria-hidden="true"></i> ' + date + '</b>');
	var url = localStorage.domoticzUrl + '/json.htm?type=command&param=getSunRiseSet';
	$.getJSON(url, function(data) {
		var sunRise = data.Sunrise;
		var sunSet = data.Sunset;
		$("#sunrise").html(sunRise);
		$("#sunset").html(sunSet);
	});
}

function switchScene(idx, action) {
	action = action || "On";
	var url = localStorage.domoticzUrl + '/json.htm?type=command&param=switchscene&idx=' + idx + '&switchcmd=' + action;
	$.getJSON(url, function(data) {
		checkWidgets();
	});
}

function switchLight(idx, action) {
	action = action || "Toggle";
	var url = localStorage.domoticzUrl + '/json.htm?type=command&param=switchlight&idx=' + idx + '&switchcmd=' + action;
	$.getJSON(url, function(data) {
		checkWidgets();
	});
}

function checkWidgets() {
	//http://192.168.0.30:8080/jos/undefined/json.htm?type=devices&filter=all&used=true&order=Name&lastupdate=0
	if (typeof(localStorage.domoticzUrl) == "undefined") {
		console.log("!!! reset domoticzUrl")
		localStorage.domoticzUrl = "";
	}
	var url = localStorage.domoticzUrl + "/json.htm?type=devices&filter=all&used=true&order=Name&lastupdate=" + LastUpdateTime;
	$.getJSON(url, function(data) {
		if (data.result) {
			LastUpdateTime = parseInt(data.ActTime);
			data.result.forEach(function(device) {
				updateWidget(device);
			});
		}
	});
}
checkLoop = setInterval(checkWidgets, 10000);

function updateWidget(device) {
	$('#td-' + device.idx).html(device.Data);
	styleWidget(device);
}

function createRooms() {
	var col = 1;
	var roomWidget;
	var widget;
	if (!localStorage.panelClass) {
		localStorage.panelClass = 'panel-primary';
	};
	var panelClass = localStorage.panelClass;
	if (localStorage.infoWidget == 1) {
		roomWidget = '<div class="panel ' + panelClass + '"><div class="panel-heading" id="title-info"></div><table class="table" id="room-info"></table></div>';
		$("#col-" + col).append(roomWidget);
		widget = '<tr><td class="time" id="time" colspan="2"></td></tr>';
		widget = widget + '<tr><td class="data" id="date" colspan="2"></td></tr>';
		widget = widget + '<tr><td class="device"><i class="fa fa-sun-o fa-lg" aria-hidden="true"></i></td><<td class="data" id="sunrise"></td>/tr>';
		widget = widget + '<tr><td class="device"><i class="fa fa-moon-o fa-lg" aria-hidden="true"></i></td><<td class="data" id="sunset"></td>/tr>';
		$("#room-info").append(widget);
		col++;
		if (col == 4) {
			col = 1;
		}
		updateTimeDate();
		setInterval(updateTimeDate, 10000);
	}
	var url = localStorage.domoticzUrl + '/json.htm?type=cameras';
	$.getJSON(url, function(data) {
		data.result.forEach(function(cam) {
			$.each(localStorage, function(key, value) {
				if (~key.indexOf("cam")) {
					if (value == cam.idx) {
						roomWidget = '<div class="panel ' + panelClass + '"><div class="panel-heading" id="title-' + value + '"><i class="fa fa-camera fa-lg" aria-hidden="true"></i><b> ' + cam.Name + '</b></div><table class="table" id="room-' + value + '"></table></div>';
						$("#col-" + col).append(roomWidget);
						widget = '<tr><td  colspan="2"><img id="snapshot-' + cam.idx + '" width="100%"></img></td></tr>';
						$("#room-" + value).append(widget);
						col++;
						if (col == 4) {
							col = 1;
						}
						updateCams();
						setInterval(updateCams, 10000);
					}
				}
			})
		})
	})
	if (localStorage.calendarWidget == 1) {
		roomWidget = '<div class="panel ' + panelClass + '"><div class="panel-heading" id="title-calendar"><i class="fa fa-calendar fa-lg" aria-hidden="true"></i></div><table class="table" id="room-calendar"></table></div>';
		$("#col-" + col).append(roomWidget);
		col++;
		if (col == 4) {
			col = 1;
		}
		updateCalendar();
		setInterval(updateCalendar, 60 * 60 * 1000);
	}
	if (localStorage.weatherWidget == 1) {
		roomWidget = '<div class="panel ' + panelClass + '"><div id="title-weather" class="panel-heading"></div><table class="table" id="room-weather"></table></div>';
		$("#col-" + col).append(roomWidget);
		widget = '<tr><td class="data" id="td-darksky-icon" colspan="2" align="center"></td></tr>';
		widget = widget + '<tr><td class="device" id="td-darksky-preciptype"></td><td class="data" id="td-darksky-precipprobability"></td></tr>';
		widget = widget + '<tr><td class="device"><i class="fa fa-flag fa-lg" aria-hidden="true"></i></td><td class="data" id="td-darksky-wind"></td></tr>';
		$("#room-weather").append(widget);
		col++;
		if (col == 4) {
			col = 1;
		}
		updateDarkSky();
		setInterval(updateDarkSky, 300000);
	}
	if (localStorage.newsWidget == 1) {
		if (!localStorage.rssUrl) {
			localStorage.rssUrl = 'http://www.nu.nl/rss/Algemeen';
		}
		roomWidget = '<div class="panel ' + panelClass + '"><div class="panel-heading" id="title-news"><i class="fa fa-newspaper-o fa-lg" aria-hidden="true"></i></div><table class="table" id="room-news"></table></div>';
		$("#col-" + col).append(roomWidget);
		col++;
		if (col == 4) {
			col = 1;
		}
		updateRss();
		setInterval(updateRss, 300000);
	}
	if (localStorage.weathermapWidget == 1) {
		roomWidget = '<div class="panel ' + panelClass + '"><div id="title-weathermap" class="panel-heading"></b></div><table class="table" id="room-weathermap"></table></div>';
		$("#col-" + col).append(roomWidget);
		col++;
		if (col == 4) {
			col = 1;
		}
		updateWeathermap();
		setInterval(updateWeathermap, 1800000);
	}
	if (localStorage.trafficWidget == 1) {
		roomWidget = '<div class="panel ' + panelClass + '"><div class="panel-heading"><b><i class="fa fa-car fa-lg" aria-hidden="true"></i></b></div><table class="table" id="room-traffic"></table></div>';
		$("#col-" + col).append(roomWidget);
		widget = '<tr><td class="device"></td><td class="data" id="td-trafficjams"></td></tr></table>';
		$("#room-traffic").append(widget);
		col++;
		if (col == 4) {
			col = 1;
		}
		updateTraffic();
		setInterval(updateTraffic, 300000);
	}
	var url = localStorage.domoticzUrl + "/json.htm?type=plans&order=name&used=true";
	$.getJSON(url, function(data) {
		data.result.forEach(function(room) {
			roomWidget = '<div class="panel panel ' + panelClass + '"><div class="panel-heading"><b>' + room.Name + '</b></div><table class="table" id="room-' + room.idx + '"></table></div>';
			$("#col-" + col).append(roomWidget);
			col++;
			if (col == 4) {
				col = 1;
			}
			var url1 = localStorage.domoticzUrl + '/json.htm?type=command&param=getplandevices&idx=' + room.idx;
			var url2 = localStorage.domoticzUrl + '/json.htm?type=devices&filter=all&used=true&order=Name&plan=' + room.idx;
			var data2
			$.getJSON(url2, function(data2) {
				$.getJSON(url1, function(data1) {
					data1.result.forEach(function(device1) {
						data2.result.forEach(function(device2) {
							if (device1.Name == device2.Name || device1.Name == "[Scene] " + device2.Name) {
								createWidget(device2);
							}
						});
					});
				});
			});
		});
	});
	setInterval(fullPagerefresh, 60 * 60 * 1000);
	$('[data-toggle="popover"]').popover({
		trigger: "hover"
	});
}

function createWidget(device) {
	var widget;
	if (device.Type == "Group") {
		widget = '<tr><td class="device">' + device.Name + '</td><td class="data" id="ts-' + device.PlanID + "-" + device.idx + '">' + "scene" + '</td></tr>';
		$("#room-" + device.PlanID).append(widget);
		styleWidget(device);
	} else if (device.Type == "Scene") {
		widget = '<tr><td class="device">' + device.Name + '</td><td class="data" id="ts-' + device.PlanID + "-" + device.idx + '">' + "scene" + '</td></tr>';
		$("#room-" + device.PlanID).append(widget);
		styleWidget(device);
	} else {
		if (device.CounterToday) {
			var data = device.CounterToday + ' (' + device.Data + ')';
		} else {
			var data = device.Data;
		}
		widget = '<tr><td class="device">' + device.Name + '</td><td class="data" id="td-' + device.PlanID + "-" + device.idx + '">' + data + '</td></tr>';
		$("#room-" + device.PlanID).append(widget);
		styleWidget(device);
	}
}

function styleWidget(device) {
	var switchClass;
	var switchClassOn;
	var SwitchClassOff;
	var canvasId;
	var airQualityClass;
	var motionClass;
	var labelClass;
	var soundLevelClass;
	var iconClass;
	var progressbarClass;
	var percentage;
	var dimmerStatus;
	switch (device.SwitchType) {
	case "Smoke Detector":
		if (device.Data == 'Normal' || device.Data == 'Off') {
			switchClass = 'success glyphicon glyphicon-fire';
		} else {
			switchClass = 'danger glyphicon glyphicon-fire';
		}
		$('#td-' + device.PlanID + "-" + device.idx).html('<span class="' + switchClass + '"></span>');
		break;
	case "Push Off Button":
		switchClass = "btn btn-primary glyphicon glyphicon-off active";
		$('#td-' + device.PlanID + "-" + device.idx).html('<button type="button" class="' + switchClass + '" Onclick="switchLight(' + device.idx + ',\'Off\')"></button>');
		break;
	case "Push On Button":
		switchClass = "btn btn-primary glyphicon glyphicon-off active";
		$('#td-' + device.PlanID + "-" + device.idx).html('<button type="button" class="' + switchClass + '" Onclick="switchLight(' + device.idx + ',\'On\')"></button>');
		break;
	case "On/Off":
		if (device.HardwareType == 'System Alive Checker (Ping)') {
			if (device.Data == 'On') {
				switchClass = 'glyphicon glyphicon-eye-open success';
			} else {
				switchClass = '';
			}
			$('#td-' + device.PlanID + "-" + device.idx).html('<span class="' + switchClass + '"></span>');
		} else {
			if (device.Data == 'On') {
				switchClass = 'btn btn-success glyphicon glyphicon-off active';
			} else {
				switchClass = 'btn btn-primary glyphicon glyphicon-off active';
			}
			$('#td-' + device.PlanID + "-" + device.idx).html('<button type="button" class="' + switchClass + '" Onclick="switchLight(' + device.idx + ')"></button>');
		}
		break;
	case "Dimmer":
		if (device.Data == 'Off') {
			switchClass = 'btn btn-primary glyphicon glyphicon-off active';
		} else {
			switchClass = 'btn btn-success glyphicon glyphicon-off active';
		}
		$('#td-' + device.PlanID + "-" + device.idx).html('<div class="slider-div"><input type="text" id="slider-' + device.PlanID + "-" + device.idx + '" data-slider-value="' + device.LevelInt + '" data-slider-min="0" data-slider-max="' + device.MaxDimLevel + '" data-slider-tooltip="hide" />&nbsp;&nbsp;&nbsp;<button class="' + switchClass + '" Onclick="switchLight(' + device.idx + ')"></button></div>');
		$("#slider-" + device.PlanID + "-" + device.idx).slider();
		$("#slider-" + device.PlanID + "-" + device.idx).on("slideStop", function(slideEvt) {
			setDimmer(device.idx, slideEvt.value);
		});
		break;
	case "Venetian Blinds EU", "Blinds":
		if (device.Data == 'Open') {
			switchClass = 'btn btn-success btn-primary glyphicon glyphicon-off active';
		} else {
			switchClass = 'btn btn-primary glyphicon glyphicon-off active';
		}
		$('#td-' + device.PlanID + "-" + device.idx).html('<button type="button" class="' + switchClass + '" Onclick="switchLight(' + device.idx + ')"></button>');
		break;
	case "Venetian Blinds EU Inverted", "Blinds Inverted":
		if (device.Data == 'Open') {
			switchClass = 'btn btn-primary glyphicon glyphicon-off active';
		} else {
			switchClass = 'btn btn-success btn-primary glyphicon glyphicon-off active';
		}
		$('#td-' + device.PlanID + "-" + device.idx).html('<button type="button" class="' + switchClass + '" Onclick="switchLight(' + device.idx + ')"></button>');
		break;
	case "Venetian Blinds EU Percentage", "Blinds Percentage":
		if (device.Data == 'Open') {
			switchClass = 'btn btn-success btn-primary glyphicon glyphicon-off active';
		} else {
			switchClass = 'btn btn-primary glyphicon glyphicon-off active';
		}
		$('#td-' + device.PlanID + "-" + device.idx).html('<div class="slider-div"><input type="text" id="slider-' + device.PlanID + "-" + device.idx + '" data-slider-value="' + device.LevelInt + '" data-slider-min="0" data-slider-max="' + device.MaxDimLevel + '" data-slider-step="1" data-slider-tooltip="hide" />&nbsp;&nbsp;&nbsp;<button class="' + switchClass + '" Onclick="switchLight(' + device.idx + ')"></button></div>');
		$("#slider-" + device.PlanID + "-" + device.idx).slider();
		$("#slider-" + device.PlanID + "-" + device.idx).on("slideStop", function(slideEvt) {
			setDimmer(device.idx, slideEvt.value);
		});
		break;
	case "Venetian Blinds EU Percentage Inverted", "Blinds Percentage Inverted":
		if (device.Data == 'Open') {
			switchClass = 'btn btn-primary glyphicon glyphicon-off active';
		} else {
			switchClass = 'btn btn-success btn-primary glyphicon glyphicon-off active';
		}
		$('#td-' + device.PlanID + "-" + device.idx).html('<div class="slider-div"><input type="text" id="slider-' + device.PlanID + "-" + device.idx + '" data-slider-value="' + device.LevelInt + '" data-slider-min="0" data-slider-max="' + device.MaxDimLevel + '" data-slider-step="1" data-slider-tooltip="hide" />&nbsp;&nbsp;&nbsp;<button class="' + switchClass + '" Onclick="switchLight(' + device.idx + ')"></button></div>');
		$("#slider-" + device.PlanID + "-" + device.idx).slider();
		$("#slider-" + device.PlanID + "-" + device.idx).on("slideStop", function(slideEvt) {
			setDimmer(device.idx, slideEvt.value);
		});
		break;
	case "Motion Sensor":
		if (device.Data == "On") {
			motionClass = 'glyphicon glyphicon-eye-open danger';
		} else {
			motionClass = 'glyphicon glyphicon-eye-open success';
		}
		$('#td-' + device.PlanID + "-" + device.idx).html('<span class="' + motionClass + '"></span>');
		break;
	}
	switch (device.Type) {
	case "Group":
		switchClassOn = "btn btn-success glyphicon glyphicon-off active";
		switchClassOff = "btn btn-primary glyphicon glyphicon-off active";
		$('#ts-' + device.PlanID + "-" + device.idx).html('<div class="btn-group"><button class="' + switchClassOn + '" Onclick="switchScene(' + device.idx + ',\'On\')"></button><button class="' + switchClassOff + '" Onclick="switchScene(' + device.idx + ',\'Off\')"></button></div>');
		break;
	case "Scene":
		switchClass = "btn btn-primary glyphicon glyphicon-off active";
		$('#ts-' + device.PlanID + "-" + device.idx).html('<button class="' + switchClass + '" Onclick="switchScene(' + device.idx + ',\'On\')"></button>');
		break;
	case "Thermostat":
		$('#td-' + device.PlanID + "-" + device.idx).html('<div class="input-group"><span class="input-group-btn"><button class="btn btn-primary" onclick="downSetpoint(' + device.idx + ')"><span class="glyphicon glyphicon-minus"></button></span><input id="setpoint-' + device.idx + '"type="text" class="form-control" value="' + device.Data + '" readonly /><span class="input-group-btn"><button class="btn btn-primary" onclick="upSetpoint(' + device.idx + ')"><span class="glyphicon glyphicon-plus"></span></button><button class="btn btn-primary" onclick="setSetpoint(' + device.idx + ')">set</button>');
		break;
	case "Air Quality":
		var airQuality = device.Data.replace(" ppm", "");
		if (airQuality > 1000) {
			airQualityClass = "warning";
		} else {
			airQualityClass = "success";
		}
		airQuality = airQuality + " ppm";
		$('#td-' + device.PlanID + "-" + device.idx).html(airQuality).addClass(airQualityClass);
		break;
	case "Rain":
		if (device.Rain == 0.0) {
			labelClass = "success";
		} else {
			labelClass = "warning";
		}
		$('#td-' + device.PlanID + "-" + device.idx).text(device.Rain + ' mm').addClass(labelClass);
		break;
	case "Wind":
		if (device.Speed < 10) {
			labelClass = "success";
		} else {
			labelClass = "warning";
		}
		$('#td-' + device.PlanID + "-" + device.idx).html(device.Speed + ' m/s').addClass(labelClass);
		break;
	case "P1 Smart Meter":
		if (device.SubType == "Energy") {
			$('#td-' + device.PlanID + "-" + device.idx).html(device.Usage + ' (' + device.CounterToday + ')');
		}
		if (device.SubType == "Gas") {
			$('#td-' + device.PlanID + "-" + device.idx).html(device.CounterToday);
		}
		break;
	case "Temp":
		var classTemp;
		var temp = parseFloat(device.Temp).toFixed(0);
		if (temp <= 17) {
			classTemp = "progress-bar progress-bar-warning";
		}
		if (temp <= 15) {
			classTemp = "progress-bar progress-bar-danger";
		}
		if (temp >= 17 && temp <= 25) {
			classTemp = "progress-bar progress-bar-success";
		}
		if (temp >= 25 && temp <= 30) {
			classTemp = "progress-bar progress-bar-warning";
		}
		if (temp >= 30 && temp <= 40) {
			classTemp = "progress-bar progress-bar-danger";
		}
		if (temp >= 40 && temp <= 70) {
			classTemp = "progress-bar progress-bar-success";
		}
		if (temp >= 70) {
			classTemp = "progress-bar progress-bar-warning";
		}
		$("#td-" + device.PlanID + "-" + device.idx).html('<div class="progress"><div class="' + classTemp + '" role="progressbar" aria-valuenow="' + temp + '" aria-valuemin="4" aria-valuemax="50" style="width:' + temp + '%";>' + temp + "&deg;c" + '</div></div>');
		break;
	case "Temp + Humidity":
		if (device.HumidityStatus == "Comfortable") {
			labelClass = 'success';
		} else {
			labelClass = 'danger';
		}
		$("#td-" + device.PlanID + "-" + device.idx).html('<span class="' + labelClass + '">' + device.Data + '</span>');
		break;
	case "Lux":
		break;
	}
	switch (device.SubType) {
	case "Sound Level":
		var soundLevel = device.Data.replace(" dB", "");
		if (soundLevel < 70) {
			soundLevelClass = "success";
		} else {
			soundLevelClass = "danger";
		}
		soundLevel = soundLevel + ' dB';
		$("#td-" + device.PlanID + "-" + device.idx).html(soundLevel).addClass(soundLevelClass);
		break;
	case "Percentage":
		percentage = device.Data.replace("%", "");
		percentage = parseInt(percentage).toFixed(0);
		$("#td-" + device.PlanID + "-" + device.idx).html('<div class="progress"><div class="progress-bar" role="progressbar" aria-valuenow="' + percentage + '" aria-valuemin="0" aria-valuemax="100" style="min-width: 3em; width:' + percentage + '%";>' + percentage + "%" + '</div></div>');
		break;
	}
}
function loadsettingsfromdomoticz() {
	var url = '/json.htm?type=command&param=getuservariables';
	var found = 0;
	localStorage.clear();
	$.getJSON(url, function(data) {
		data.result.forEach(function(uservar) {
			//console.log("uservar.Name = " + uservar.Name);
			if (uservar.Name == "framb0ise") {
				console.log("Found " + uservar.Name + "=" + uservar.idx);
				var url = '/json.htm?type=command&param=getuservariable&idx=' + uservar.idx;
				console.log(url);
				found = 1;
				$.getJSON(url, function(settings) {
					var changes = 0;
					settings.result.forEach(function(info) {
						console.log(info["Value"]);
						var fields = JSON.parse(info["Value"]);
						console.log(" force check of changes ..") ;
						for(field in fields){
							if ( localStorage.getItem(field) != fields[field] ) {
								localStorage.setItem(field, fields[field]) ;
								changes = 1;
								console.log("changed -> field: " + field + "   Value: " + fields[field]);
							}
						}
						if (changes == 1) {
							console.log(" Changes found ... reload website");
							location.reload();
						}
					});
				});
			}
		});
		if (found == 0) {
			console.log("Domoticz uservariable framb0ise not found .. making uservar in domoticz")
			var url = localStorage.domoticzUrl + '/json.htm?type=command&param=saveuservariable&vname=framb0ise&vtype=2&vvalue={"domoticzUrl":"' + $(location).attr('protocol') + "//" + $(location).attr('host') + '"}';
			$.getJSON(url, function(data) {});
		}
	});
}
$(document).ready(function() {
	// load settings from domoticsz uservariable
	if (!localStorage.domoticzUrl || localStorage.domoticzUrl == 'undefined') {
		console.log("No localstorage yet.");
		localStorage.domoticzUrl = $(location).attr('protocol') + "//" + $(location).attr('host');
		loadsettingsfromdomoticz(1)
	}
<<<<<<< HEAD
=======

>>>>>>> 5d1a01be4eb29335735cc666de978a3e0a453ccb
	readHardware();
	createRooms();
	readCams();
});