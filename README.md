# Reddit Newsletter

Node.js app that will email you the top 25 links that day from your selected subs.

Useage: Run in same directory as config.json file containing:
  - ``` subs ```: array of reddit subs to get daily top posts from
  - ```days```: array of days to send newsletter (1 = Monday, 2 = Tuesday, ..... 7 = Sunday)
  - ```timeOfDay```: time of day to send newsletter (number of minutes since 12am)
  - ```dest```: destination email
  - ```emailConfig```: email service config as shown in example below.
    
Example:
```
{
    "subs": ["programming", "technology", "economics"],
    "days": [1, 2, 3, 4, 5],
    "timeOfDay": 390,
    "dest": "myemail@address.com",

    "emailConfig": {
        "host": "mail.service",
        "port": 465,
        "sender": "sender@address.com",
        "auth": {
            "user": "mail.service.user",
            "pass": "mail.service.password"
        }
    }
}
```
*This config will email the top 25 posts from /r/programming, /r/technology, and /r/economics every weekday (M-F) at 6:30am to myemail@address.com*


