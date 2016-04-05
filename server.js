var express = require("express");
var app     = express();
var bodyParser = require("body-parser");

var schedule = require('node-schedule');

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var fs = require("fs");
var request = require('request');


// configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));

// email sending config read from config.json
var emailConfig = {};

var createCronJobs = function(config) {

    for(var daysI = 0; daysI < config.days.length; daysI++) {
        var hour = Math.floor(config.timeOfDay/60);
        var minute = config.timeOfDay%60;
        var cronInterval = '0 ' + minute + ' ' + hour + ' * * ' + config.days[daysI].toString();
        console.log('Scheduled job for cron interval: ' + cronInterval);
        schedule.scheduleJob(cronInterval, function() {
            var emailText = "";
            for(var subsI = 0; subsI < config.subs.length; subsI++) {
                var subsGrabbed = []; // keep track of subs grabbed
                var url = 'http://www.reddit.com/r/' + config.subs[subsI] + '.json?sort=top&t=day';
                request(url, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var subInfo = JSON.parse(body);
                        var topPosts = subInfo.data.children;
                        var subRedditName = topPosts[0].data.subreddit.toLowerCase().split(" ").join("");
                        emailText += ("<div><h1>" + subRedditName + "</h1>");
                        emailText += "<table>";
                        for(var postI = 0; postI < topPosts.length; postI++) {
                            topPosts[postI].data.url;
                            emailText += "<tr>";
                            emailText += ("<td>" + topPosts[postI].data.title + "</td>");
                            emailText += ("<td>" + topPosts[postI].data.url + "</td>");
                            emailText += ("<td>" + topPosts[postI].data.score + "</td>");
                            emailText += "</tr>";
                        }
                        emailText += "</table></div>";

                        // if this is the last subreddit to grab, then send the email
                        subsGrabbed.push(subRedditName);
                        if(subsGrabbed.length == config.subs.length) {
                            console.log("sending mail..");
                            sendEmailTo(config.dest, emailText);
                        }
                    }
                });
            }
        });
    }
}

var sendEmailTo = function(destination, payload) {
    var smtpTransport = nodemailer.createTransport("SMTP",{
        host: emailConfig.host,
        secureConnection: true,
        port: emailConfig.port,
        auth: {
            user: emailConfig.auth.user,
            pass: emailConfig.auth.pass
        }
    });

    var formattedSender = "<" + emailConfig.sender + ">";
    var mailOptions = {
        from: formattedSender,
        to: destination,
        subject: "Newsletter ",
        text: "",
        html: payload
    };

    // send mail with defined transport object
    smtpTransport.sendMail(mailOptions, function(error, response){
        if(error) {
            console.log(error);
        }

        smtpTransport.close(); // shut down the connection pool, no more messages
    });
}

/** On Startup **/
// read input arguments
var configContents = fs.readFileSync("config.json");
var config = JSON.parse(configContents);
console.log(config);
if(!('subs' in config) || !Array.isArray(config.subs) || config.subs.length == 0) {
    console.log("Error: In config.json 'subs': expecting non-empty array of reddit sub names as strings.");
    process.exit(9);
}
if(!('days' in config) || !Array.isArray(config.days) || config.days.length == 0) {
    console.log("Error: In config.json 'days': expecting non-empty array of days to send newsletter (1 = Monday, 2 = Tuesday, ... 7 = Sunday).");
    process.exit(9);
}
if(!('timeOfDay' in config) || (typeof config.timeOfDay) != "number"  || config.timeOfDay < 0 || config.timeOfDay > (60*24)) {
    console.log("Error: In config.json 'timeOfDay': expecting integer representing the number of minutes since the start of the day (0 = 12:00am, 390 = 6:30am, 915 = 3:15pm,..).");
    process.exit(9);
}
if(!('dest' in config) || (typeof config.dest) != "string" || config.dest.length == 0) {
    console.log("Error: In config.json 'dest': expected destination email as a non-empty string.");
    process.exit(9);
}
// set the email comfig
emailConfig = config.emailConfig;

// create cron jobs for emailing top posts for the subs
createCronJobs(config);


app.listen(3096);