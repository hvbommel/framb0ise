# framb0ise
Clean domoticz-dashboard with a silly name

![Alt text](/img/screenshot.png?raw=true "framb0ise")

# Setup
ssh into your domoticz server;

cd </your/domoticz/dir>

cd www

git clone https://github.com/safi78/framb0ise

point your browser to: <your-domoticz-url>/framb0ise/

All your settings will be safely stored in 'localStorage' so are preserved during updates.

# Features
- Support for most domoticz devices (just add a feature request on the 'issues'-page if yours isn't working!)
- Weather Widget (Darksky information from domoticz)
- Weather Map Widget (Buienradar (NL))
- News Widget (customisable RSS-feed)
- Calendar Widget (customisable ICS-feed)
- Traffic Widget (ANWB (NL))
- Webcams
- ... 

# How to order stuff
Everything is based on the 'room-plan' inside domoticz. 

If you change the order of the rooms, or the order of the devices in that rooms, framb0ise will use that accordingly.

If you don't want a room to show up in framb0ise, but don't want to delete it either, just add a '$' to the room name in domoticz. This will 'hide' the room. (I use this for my homebridge stuff for example.)

# Dependencies
- bootstrap
- font-awesome
- JavaScript-Ical-Parser
- jquery
- jquery-rss
- paginathing
- seiyria-bootstrap-slider
- skycons