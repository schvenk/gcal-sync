# GCal Sync Apps Script (`gcal-sync`)
This is a Google Apps Script for syncing work and personal calendars, so that your work calendar reflects your personal availability. It makes a few **key assumptions**:
- You don't use the `❖` character in any event names.
- You're fine with your work account seeing the contents of your personal calendar.
- You'd prefer that colleagues who can see your work calendar can't see the details of your personal events.
- Both calendars are on Google Calendar.
All of the above can be changed and maybe if folks start using this I'll make it more configurable.

This whole script is adapted from [this original by Will Roman](https://gist.github.com/ttrahan/a88febc0538315b05346f4e3b35997f2), which in turn is based on an [earlier script](http://blog.debsankha.net/2011/01/merging-two-google-calendars.html) from 2011. The original lacks a license so I'm MIT-licensing this with the hope that that's OK.

## Setup
1. Open the `gcal-sync.js` file in this repo.
2. Follow the [instructions from the original script](https://medium.com/@willroman/auto-block-time-on-your-work-google-calendar-for-your-personal-events-2a752ae91dab)
   a. You're **doing this on your work calendar**, with the idea that your work would rather it happen that way round than that your personal calendar is constantly pulling from work.
   b. Ensure you substitute your personal email address for `[YOUR_PERSONAL_EMAIL_ADDRESS]`.
3. That should do it! Now when you make changes on your personal calendar they'll copy into your work calendar.
