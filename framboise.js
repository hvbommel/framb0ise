var LastUpdateTime = parseInt(0);
var checkLoop;

function updateCams() {
	var url = localStorage.domoticzUrl + '/json.htm?type=cameras';
	$.getJSON(url, function (data) {
		data.result.forEach(function (cam) {
			$.each(localStorage, function (key, value) {
				if (~key.indexOf("cam")) {
					if (value == cam.idx) {
						var url = 'http://' + cam.Username + ':' + cam.Password + '@' + cam.Address + ':' + cam.Port + '/' + cam.ImageURL
						$('#snapshot-' + cam.idx).attr('src', url).on('load', function () {
								$("#title-" + cam.idx).text(cam.Name)
								$('#snapshot-' + cam.idx).show();
							})
							.on('error', function () {
								$("#title-" + cam.idx).text(cam.Name + " - unreachable!")
							});
					}
				}
			})
		})
	})
}

function updateRss() {
	$("#tx-rss").empty();
	var rssUrl = localStorage.getItem('rssUrl');
	$("#tx-rss").rss(rssUrl, {
		ssl: true,
		limit: 5,
		layoutTemplate: '{entries}',
		entryTemplate: '<tr><td colspan="2">{title}</td></tr>'
	});
}

function updateIcs() {
	var icsUrl = 'https://crossorigin.me/' + localStorage.getItem('icsUrl');
	new ical_parser(icsUrl, function (cal) {
		var events = cal.getFutureEvents();
		var counter = 0;
		var widget = "";
		events.forEach(function (event) {
			if (counter < 5) {
				var date = event.start_date;
				date = date.replace(/\//g, "-")
				var time = event.start_time;
				widget = widget + '<tr><td class="device">' + date + ' ' + time + '</td><td class="data">' + event.SUMMARY + '</td></tr>'
			}
			counter++;
		});
		$("#tx-ics").html(widget);
	});
}

function fullPagerefresh() {
	location.reload();
}

function readCams() {
	$("#domoCams").empty();
	var url = localStorage.domoticzUrl + '/json.htm?type=cameras';
	var domoCam;
	$.getJSON(url, function (data) {
		data.result.forEach(function (cam) {
			domoCam = '<div class="checkbox"><label><input class="activeCam" type="checkbox" id="cam-' + cam.idx + '" value="' + cam.idx + '"> ' + cam.Name + '</label></div>';
			$("#domoCams").append(domoCam);
		})
	})
}

function editSettings() {
	var icsUrl = localStorage.getItem('icsUrl');
	$("#icsUrl").val(icsUrl);
	var domoticzUrl = localStorage.getItem('domoticzUrl');
	if (domoticzUrl == "") {
		var domoticzUrl = $(location).attr('protocol') + "//" + $(location).attr('host');
	}
	$("#domoticzUrl").val(domoticzUrl);
	var rssUrl = localStorage.getItem('rssUrl');
	$("#rssUrl").val(rssUrl);
	var panelClass = localStorage.getItem('panelClass');
	$("#panelClass").val(panelClass);
	$('input[type=radio]').each(function () {
		for (var i = 0, len = localStorage.length; i < len; i++) {
			var key = localStorage.key(i);
			var value = localStorage[key];
			if (key == "inlineRadio1" || key == "inlineRadio2" || key == "inlineRadio3") {
				$('#' + key).attr("checked", "checked");
			}
		}
	});
	$('input:checkbox').each(function () {
		for (var i = 0, len = localStorage.length; i < len; i++) {
			var key = localStorage.key(i);
			var value = localStorage[key];
			if (value >= 1) {
				$('#' + key).attr("checked", "checked");
			}
		}
	});
	$("#settings").modal('show');
}

function saveSettings() {
	$.ajaxSetup({
		"async": false
	});
	var jsonvar = "";
	var jsonvar2 = "";
	var jsonvar3 = "";
	var jsonvar4 = "";
	var domoticzUrl = $("#domoticzUrl").val();
	jsonvar = saveSettingVar('domoticzUrl', domoticzUrl, jsonvar);
	initializeDomoticzRooms()

	var icsUrl = $("#icsUrl").val();
	jsonvar2 = saveSettingVar('icsUrl', icsUrl, jsonvar2);
	var rssUrl = $("#rssUrl").val();
	jsonvar3 = saveSettingVar('rssUrl', rssUrl, jsonvar3);
	var panelClass = $("#panelClass").val();
	jsonvar4 = saveSettingVar('panelClass', panelClass, jsonvar4);
	$('input[type=radio]').each(function () {
		var RadioId = $(this).attr('id');
		if ($(this).is(":checked")) {
			localStorage.setItem(RadioId, 1);
		} else {
			localStorage.removeItem(RadioId);
		}
	});
	$('input:checkbox').each(function () {
		var checkboxId = $(this).attr('id');
		if ($(this).is(":checked")) {
			value = $(this).val();
			localStorage.setItem(checkboxId, value);
			jsonvar4 = saveSettingVar(checkboxId, value, jsonvar4);
			if (checkboxId.substring(0, 4) == "cam-") {
				var croom = "cameraWidget-" + checkboxId
				domoticzAddRoom(croom)
			}
		} else {
			localStorage.removeItem(checkboxId);
		}
	});
	savetodomoticzuservar("framb0ise", jsonvar)
	savetodomoticzuservar("framb0ise2", jsonvar2)
	savetodomoticzuservar("framb0ise3", jsonvar3)
	savetodomoticzuservar("framb0ise4", jsonvar4)
	$.ajaxSetup({
		"async": true
	});
	location.reload();
}

function savetodomoticzuservar(uservar, text) {
	if (localStorage.inlineRadio2 == 1) {
		var url = localStorage.domoticzUrl + '/json.htm?type=command&param=updateuservariable&vname=' + uservar + '&vtype=2&vvalue={' + text + '}';
		$.getJSON(url, function (data) {});
	}
}

function saveSettingVar(name, val, jsoninp) {
	localStorage.setItem(name, val)
	if (jsoninp != "") {
		jsoninp = jsoninp + ',';
	}
	return jsoninp + '"' + name + '":"' + val + '"'
}

function updateANWB() {
	var widget = "";
	var url = 'https://cors.5apps.com/?uri=https://www.anwb.nl/feeds/gethf';
	$.getJSON(url, function (data) {
		data.roadEntries.forEach(function (road) {
			if (road.events.trafficJams.length != 0) {
				road.events.trafficJams.forEach(function (jam) {
					widget = widget + '<tr><td>' + road.road + '</td><td>' + jam.from + ' -> ' + jam.to + '</td></tr>';
				});
			}
		});
		if ( widget == "" ) {
			widget = '<tr><td>No traffic jams</td><td></td></tr>';
			$("#td-trafficjams").empty().append(widget);
		} else {
			$("#td-trafficjams").empty().append(widget);
			$(".pagination-container").empty();
			$('#td-trafficjams').paginathing({
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
		}
	});
}

function updateBuienradar() {
	var widget = '<img src="https://api.buienradar.nl/image/1.0/RadarMapNL?w=256&h=256&' + new Date().getTime() + '"  width=100%>';
	$("#tx-buienradar").html(widget);

	var rainArray = [];
	var url = localStorage.domoticzUrl + '/json.htm?type=settings';
	$.getJSON(url, function (data) {
		var latitude = data.Location.Latitude;
		var longitude = data.Location.Longitude;
		var url = 'https://crossorigin.me/https://gpsgadget.buienradar.nl/data/raintext?lat=' + latitude + '&lon=' + longitude;
		$.get(url, function (data) {
			var rainData = data.split("\n");
			rainData.forEach(function (data) {
				if (data != "" && data.substring(0, 3) != "000") {
					rainArray.push(data.substring(4, 9))
				}
			})
			if (rainArray.length > 0) {
				$("#title-buienradar").html('<b><i class="fa fa-umbrella fa-lg" aria-hidden="true"></i> rain from ' + rainArray[0] + ' to ' + rainArray[rainArray.length - 1]).css('color', 'orange');
			} else {
				$("#title-buienradar").html('<b><i class="fa fa-umbrella fa-lg" aria-hidden="true"></i>');
			}
		});
	})
}

function setDimmer(idx, value) {
	var url = localStorage.domoticzUrl + '/json.htm?type=command&param=switchlight&idx=' + idx + '&switchcmd=Set%20Level&level=' + value;
	$.get(url, function (data) {
		checkWidgets();
	});
}

function readSettings(settings) {
	var url = localStorage.domoticzUrl + '/json.htm?type=settings';
	$.getJSON(url, function (data) {});
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
	$.getJSON(url, function (data) {});
	checkLoop = setInterval(checkWidgets, domoConfig.updateInterval);
}

function readHardware() {
	var url = localStorage.domoticzUrl + '/json.htm?type=hardware';
	$.getJSON(url, function (data) {
		if (data.result) {
			data.result.forEach(function (device) {
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
	$.get(url, function (data) {
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
			var weatherReport = '<table>';
			data.daily.data.forEach(function (report) {
				var weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
				var date = new Date(report.time * 1000);
				var weekday = weekDays[date.getDay()];
				var temperatureMin = data.daily.data[date.getDay()].temperatureMin;
				var temperatureMax = data.daily.data[date.getDay()].temperatureMax;
				weatherReport += '<tr><small><td>' + weekday + '</td><td>' + temperatureMin + '&deg;c - ' + temperatureMax + '&deg;c</td></small></tr>';
			})
			weatherReport += '</table>';
			$("#title-darksky").html('<b><i class="fa fa-thermometer-half fa-lg" aria-hidden="true"></i> ' + temperature + ' &deg;c</b>').attr('data-container', 'body').attr('data-placement', 'right').attr('data-content', weatherReport).attr('data-toggle', 'popover').attr('data-html', 'true');
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
	$.getJSON(url, function (data) {
		var sunRise = data.Sunrise;
		var sunSet = data.Sunset;
		$("#sunrise").html(sunRise);
		$("#sunset").html(sunSet);
	});
}

function switchScene(idx, action) {
	action = action || "On";
	var url = localStorage.domoticzUrl + '/json.htm?type=command&param=switchscene&idx=' + idx + '&switchcmd=' + action;
	$.getJSON(url, function (data) {
		checkWidgets();
	});
}

function switchLight(idx, action) {
	action = action || "Toggle";
	var url = localStorage.domoticzUrl + '/json.htm?type=command&param=switchlight&idx=' + idx + '&switchcmd=' + action;
	$.getJSON(url, function (data) {
		checkWidgets();
	});
}

function checkWidgets() {
	var urlr = localStorage.domoticzUrl + "/json.htm?type=plans&displayhidden=1";
	$.getJSON(urlr, function (data) {
		data.result.forEach(function (room) {
			var urld = localStorage.domoticzUrl + '/json.htm?type=devices&filter=all&used=true&order=Name&plan=' + room.idx;
			var datad
			$.getJSON(urld, function (datad) {
				if (typeof (datad.result) != "undefined") {
					datad.result.forEach(function (device) {
						updateWidget(device);
					});
				}
			});
		});
	});

}
checkLoop = setInterval(checkWidgets, 10000);

function updateWidget(device) {
	$('#td-' + device.PlanID + "-" + device.idx).html(device.Data);
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
	var url = localStorage.domoticzUrl + "/json.htm?type=plans&displayhidden=1";

	$.getJSON(url, function (data) {
		data.result.forEach(function (room) {
			if (room.Name.substring(0, 4) == "$fr-") {
				var fixedroom = room.Name.substring(4);
				var camname = "";
				if (fixedroom.substring(0, 12) == "cameraWidget") {
					camname = fixedroom.substring(13);
					camidx = fixedroom.substring(17);
					fixedroom = "cameraWidget";
				}
				switch (fixedroom) {
					case "anwbWidget":
						if (localStorage.anwbWidget == 1) {
							roomWidget = '<div class="panel ' + panelClass + '"><div class="panel-heading"><b><i class="fa fa-car fa-lg" aria-hidden="true"></i></b></div><table class="table" id="room-' + room.idx + '"></table></div>';
							$("#col-" + col).append(roomWidget);
							col++;
							if (col == 4) {
								col = 1;
							}
							widget = '<tr><td class="device"></td><td class="data" id="td-trafficjams"></td></tr></table>';
							$("#room-" + room.idx).append(widget);
							updateANWB();
							setInterval(updateANWB, 300000);
							AddDevices(room)
						}
						break;
					case "rssWidget":
						if (localStorage.rssWidget == 1) {
							if (!localStorage.rssUrl) {
								localStorage.rssUrl = 'http://www.nu.nl/rss/Algemeen';
							}
							roomWidget = '<div class="panel ' + panelClass + '"><div class="panel-heading" id="title-rss"><i class="fa fa-newspaper-o fa-lg" aria-hidden="true"></i></div><table class="table" id="room-' + room.idx + '"></table></div>';
							$("#col-" + col).append(roomWidget);
							col++;
							if (col == 4) {
								col = 1;
							}
							widget = '<tr><td colspan="2" id="tx-rss"></td></tr>';
							$("#room-" + room.idx).append(widget);
							updateRss();
							setInterval(updateRss, 300000);
							AddDevices(room)
						}
						break;
					case "buienradarWidget":
						if (localStorage.buienradarWidget == 1) {
							roomWidget = '<div class="panel ' + panelClass + '"><div id="title-buienradar" class="panel-heading"></b></div><table class="table" id="room-' + room.idx + '"></table></div>';
							$("#col-" + col).append(roomWidget);
							col++;
							if (col == 4) {
								col = 1;
							}
							widget = '<tr><td colspan="2" id="tx-buienradar"></td></tr>';
							$("#room-" + room.idx).append(widget);
							updateBuienradar();
							setInterval(updateBuienradar, 600000);
							AddDevices(room)
						}
						break;
					case "darkskyWidget":
						if (localStorage.darkskyWidget == 1) {
							roomWidget = '<div class="panel ' + panelClass + '"><div id="title-darksky" class="panel-heading"></div><table class="table" id="room-' + room.idx + '"></table></div>';
							$("#col-" + col).append(roomWidget);
							widget = '<tr><td class="data" id="td-darksky-icon" colspan="2" align="center"></td></tr>';
							widget = widget + '<tr><td class="device" id="td-darksky-preciptype"></td><td class="data" id="td-darksky-precipprobability"></td></tr>';
							widget = widget + '<tr><td class="device"><i class="fa fa-flag fa-lg" aria-hidden="true"></i></td><td class="data" id="td-darksky-wind"></td></tr>';
							$("#room-" + room.idx).append(widget);
							col++;
							if (col == 4) {
								col = 1;
							}
							updateDarkSky();
							setInterval(updateDarkSky, 300000);
							AddDevices(room)
						}
						break;
					case "icsWidget":
						if (localStorage.icsWidget == 1) {
							roomWidget = '<div class="panel ' + panelClass + '"><div class="panel-heading" id="title-ics"><i class="fa fa-calendar fa-lg" aria-hidden="true"></i></div><table class="table" id="room-' + room.idx + '"></table></div>';
							$("#col-" + col).append(roomWidget);
							col++;
							if (col == 4) {
								col = 1;
							}
							widget = '<tr><td colspan="2" id="tx-ics"></td></tr>';
							$("#room-" + room.idx).append(widget);
							updateIcs();
							setInterval(updateIcs, 60 * 60 * 1000);
							localStorage.setItem("room-" + room.idx, "room-ics")
							AddDevices(room)
						}
						break;
					case "cameraWidget":
						if (localStorage.getItem(camname) >= 1) {
							roomWidget = '<div class="panel ' + panelClass + '"><div class="panel-heading" id="title-' + camidx + '"><i class="fa fa-camera fa-lg" aria-hidden="true"></i><b></b></div><table class="table" id="room-' + room.idx + '"></table></div>';
							$("#col-" + col).append(roomWidget);
							widget = '<tr><td  colspan="2"><img id="snapshot-' + camidx + '" width="100%"></img></td></tr>';
							$("#room-" + room.idx).append(widget);
							col++;
							if (col == 4) {
								col = 1;
							}
							var url = localStorage.domoticzUrl + '/json.htm?type=cameras';
							$.getJSON(url, function (data) {
								data.result.forEach(function (cam) {
									$("#title-" + cam.idx).text(cam.Name)
								})
							})
							updateCams();
							setInterval(updateCams, 10000);
							AddDevices(room)
						}
						break;
					case "infoWidget":
						if (localStorage.infoWidget == 1) {
							roomWidget = '<div class="panel ' + panelClass + '"><div class="panel-heading" id="title-info"></div><table class="table" id="room-' + room.idx + '"></table></div>';
							$("#col-" + col).append(roomWidget);
							widget = '<tr><td class="time" id="time" colspan="2"></td></tr>';
							widget = widget + '<tr><td class="data" id="date" colspan="2"></td></tr>';
							widget = widget + '<tr><td class="device"><i class="fa fa-sun-o fa-lg" aria-hidden="true"></i></td><<td class="data" id="sunrise"></td>/tr>';
							widget = widget + '<tr><td class="device"><i class="fa fa-moon-o fa-lg" aria-hidden="true"></i></td><<td class="data" id="sunset"></td>/tr>';
							$("#room-" + room.idx).append(widget);
							col++;
							if (col == 4) {
								col = 1;
							}
							updateTimeDate();
							setInterval(updateTimeDate, 10000);
							AddDevices(room)
						}
						break;
				}
			}
			if (room.Name.substring(0, 1) != "$") {
				roomWidget = '<div class="panel panel ' + panelClass + '"><div class="panel-heading"><b>' + room.Name + '</b></div><table class="table" id="room-' + room.idx + '"></table></div>';
				$("#col-" + col).append(roomWidget);
				col++;
				if (col == 4) {
					col = 1;
				}
				AddDevices(room)
			}
		});
	});
	setInterval(fullPagerefresh, 60 * 60 * 1000);
	$('[data-toggle="popover"]').popover({
		trigger: "hover"
	});
}

function AddDevices(room) {
	var url1 = localStorage.domoticzUrl + '/json.htm?type=command&param=getplandevices&idx=' + room.idx;
	var url2 = localStorage.domoticzUrl + '/json.htm?type=devices&filter=all&used=true&order=Name&plan=' + room.idx;
	var data2
	$.getJSON(url2, function (data2) {
		$.getJSON(url1, function (data1) {
			if (typeof (data1.result) != "undefined") {
				data1.result.forEach(function (device1) {
					data2.result.forEach(function (device2) {
						if (device1.devidx == device2.idx) {
							if ((device2.Type == "Scene" || device2.Type == "Group") && device1.Name.substring(0, 7) == "[Scene]") {
								createWidget(device2);
							}
							if (device2.Type != "Scene" && device2.Type != "Group" && device1.Name.substring(0, 7) != "[Scene]") {
								createWidget(device2);
							}
						}
					});
				});
			}
		});
	});

}

function createWidget(device) {
	var widget;
	var roomname = "room-" + device.PlanID
	if (localStorage.getItem(roomname) != null) {
		roomname = localStorage.getItem(roomname);
	}

	if (device.Type == "Group") {
		widget = '<tr><td class="device">' + device.Name + '</td><td class="data" id="ts-' + device.PlanID + "-" + device.idx + '">' + "scene" + '</td></tr>';
		$("#" + roomname).append(widget);
		styleWidget(device);
	} else if (device.Type == "Scene") {
		widget = '<tr><td class="device">' + device.Name + '</td><td class="data" id="ts-' + device.PlanID + "-" + device.idx + '">' + "scene" + '</td></tr>';
		$("#" + roomname).append(widget);
		styleWidget(device);
	} else {
		if (device.CounterToday) {
			var data = device.CounterToday + ' (' + device.Data + ')';
		} else {
			var data = device.Data;
		}
		widget = '<tr><td class="device">' + device.Name + '</td><td class="data" id="td-' + device.PlanID + "-" + device.idx + '">' + data + '</td></tr>';
		$("#" + roomname).append(widget);
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
			$('#td-' + device.PlanID + "-" + device.idx).html('<div class="slider-div"><input type="text" id="slider-' + device.PlanID + "-" + device.idx + '" data-slider-value="' + device.LevelInt + '" data-slider-min="0" data-slider-max="' + device.MaxDimLevel + '" data-slider-tooltip="hide" />&nbsp;&nbsp;&nbsp;<button class="' + switchClass + '" Onclick="switchLight(' + device.idx +
				')"></button></div>');
			$("#slider-" + device.PlanID + "-" + device.idx).slider();
			$("#slider-" + device.PlanID + "-" + device.idx).on("slideStop", function (slideEvt) {
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
			$('#td-' + device.PlanID + "-" + device.idx).html('<div class="slider-div"><input type="text" id="slider-' + device.PlanID + "-" + device.idx + '" data-slider-value="' + device.LevelInt + '" data-slider-min="0" data-slider-max="' + device.MaxDimLevel + '" data-slider-step="1" data-slider-tooltip="hide" />&nbsp;&nbsp;&nbsp;<button class="' + switchClass + '" Onclick="switchLight(' + device.idx +
				')"></button></div>');
			$("#slider-" + device.PlanID + "-" + device.idx).slider();
			$("#slider-" + device.PlanID + "-" + device.idx).on("slideStop", function (slideEvt) {
				setDimmer(device.idx, slideEvt.value);
			});
			break;
		case "Venetian Blinds EU Percentage Inverted", "Blinds Percentage Inverted":
			if (device.Data == 'Open') {
				switchClass = 'btn btn-primary glyphicon glyphicon-off active';
			} else {
				switchClass = 'btn btn-success btn-primary glyphicon glyphicon-off active';
			}
			$('#td-' + device.PlanID + "-" + device.idx).html('<div class="slider-div"><input type="text" id="slider-' + device.PlanID + "-" + device.idx + '" data-slider-value="' + device.LevelInt + '" data-slider-min="0" data-slider-max="' + device.MaxDimLevel + '" data-slider-step="1" data-slider-tooltip="hide" />&nbsp;&nbsp;&nbsp;<button class="' + switchClass + '" Onclick="switchLight(' + device.idx +
				')"></button></div>');
			$("#slider-" + device.PlanID + "-" + device.idx).slider();
			$("#slider-" + device.PlanID + "-" + device.idx).on("slideStop", function (slideEvt) {
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
		case "Selector":
			var selections = device.LevelNames.split('|', 10);
			var switchbtn = 'btn-sm btn-primary';
			var switchbtna = 'btn-sm btn-success active';
			buttons = '';
			for (btext in selections) {
				perc = btext * 10;
				if (perc == device.LevelInt) {
					buttons = buttons + '<button type="button" class="' + switchbtna + '" Onclick="setDimmer(' + device.idx + ',' + perc + ')">' + selections[btext] + '</button>'
				} else {
					buttons = buttons + '<button type="button" class="' + switchbtn + '" Onclick="setDimmer(' + device.idx + ',' + perc + ')">' + selections[btext] + '</button>'
				}
			}
			$('#td-' + device.PlanID + "-" + device.idx).html('<div class="btn-group-lg">' + buttons + '</div>');
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
			$('#td-' + device.PlanID + "-" + device.idx).html('<div class="input-group"><span class="input-group-btn"><button class="btn btn-primary" onclick="downSetpoint(' + device.idx + ')"><span class="glyphicon glyphicon-minus"></button></span><input id="setpoint-' + device.idx + '"type="text" class="form-control" value="' + device.Data +
				'" readonly /><span class="input-group-btn"><button class="btn btn-primary" onclick="upSetpoint(' + device.idx + ')"><span class="glyphicon glyphicon-plus"></span></button><button class="btn btn-primary" onclick="setSetpoint(' + device.idx + ')">set</button>');
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
	localStorage.clear();
	localStorage.domoticzUrl = $(location).attr('protocol') + "//" + $(location).attr('host');
	var url = localStorage.domoticzUrl + '/json.htm?type=command&param=getuservariables';
	var found = 0;
	var found1 = 0;
	var found2 = 0;
	var found3 = 0;
	var found4 = 0;
	$.getJSON(url, function (data) {
		data.result.forEach(function (uservar) {
			if (uservar.Name.substring(0, 9) == "framb0ise") {
				var url = localStorage.domoticzUrl + '/json.htm?type=command&param=getuservariable&idx=' + uservar.idx;
				switch (uservar.Name) {
					case "framb0ise":
						found = 1;
						break;
					case "framb0ise2":
						found2 = 1;
						break;
					case "framb0ise3":
						found3 = 1;
						break;
					case "framb0ise4":
						found4 = 1;
						break;
				}
				$.getJSON(url, function (settings) {
					var changes = 0;
					settings.result.forEach(function (info) {
						var fields = JSON.parse(info["Value"]);
						for (field in fields) {
							if (localStorage.getItem(field) != fields[field]) {
								localStorage.setItem(field, fields[field]);
								changes = 1;
							}
						}
						if (changes == 1) {
							location.reload();
						}
					});
				});
			}
		});
		if (found == 0) {
			var url = localStorage.domoticzUrl + '/json.htm?type=command&param=saveuservariable&vname=framb0ise&vtype=2&vvalue={"domoticzUrl":"' + $(location).attr('protocol') + "//" + $(location).attr('host') + '"}';
			$.getJSON(url, function (data) {});
		}
		if (found2 == 0) {
			var url = localStorage.domoticzUrl + '/json.htm?type=command&param=saveuservariable&vname=framb0ise2&vtype=2&vvalue={""}';
			$.getJSON(url, function (data) {});
		}
		if (found3 == 0) {
			var url = localStorage.domoticzUrl + '/json.htm?type=command&param=saveuservariable&vname=framb0ise3&vtype=2&vvalue={""}';
			$.getJSON(url, function (data) {});
		}
		if (found4 == 0) {
			var url = localStorage.domoticzUrl + '/json.htm?type=command&param=saveuservariable&vname=framb0ise4&vtype=2&vvalue={""}';
			$.getJSON(url, function (data) {});
		}
	});
}

function domoticzAddRoom(newroom) {
	//	$.ajaxSetup({ "async": false });
	var url = localStorage.domoticzUrl + "/json.htm?type=plans&displayhidden=1";
	var alreadyexists = false;
	$.getJSON(url, function (data) {
		data.result.forEach(function (room) {
			if (room.Name.substring(0, 4) == "$fr-") {
				if (room.Name == "$fr-" + newroom) {
					alreadyexists = true;
				}
			}
		});
		if (!alreadyexists) {
			var url = localStorage.domoticzUrl + "/json.htm?type=command&param=addplan&name=" + '$fr-' + newroom;
			$.getJSON(url, function (data) {});
		}
	});
	//	$.ajaxSetup({ "async": true });
}

function initializeDomoticzRooms() {
	domoticzAddRoom("anwbWidget");
	domoticzAddRoom("buienradarWidget");
	domoticzAddRoom("darkskyWidget");
	domoticzAddRoom("icsWidget");
	domoticzAddRoom("cameraWidget");
	domoticzAddRoom("infoWidget");
	domoticzAddRoom("cssWidget");
}

$(document).ready(function () {
	if (!localStorage.domoticzUrl || localStorage.domoticzUrl == 'undefined') {
		loadsettingsfromdomoticz();
	}

	readHardware();
	createRooms();
	readCams();
});