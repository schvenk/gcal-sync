/*
 * Adapted slightly from from https://gist.github.com/ttrahan/a88febc0538315b05346f4e3b35997f2
 * GitHub repo at https://github.com/schvenk/gcal-sync
 * There are opportunities to simplify, improve readability, stabilize a bit.
 * Feb 2026
 */

const PersonalCalendarId = "[YOUR_PERSONAL_EMAIL_ADDRESS]"; // id of the secondary calendar to pull events from
const ClonedEventPrefix = "❖ ";
const ClonedEventColor = CalendarApp.EventColor.PALE_BLUE;

function sync() {
  const globals = PropertiesService.getUserProperties();
  const IsRunningKey = "IS_RUNNING";
  const isRunning = globals.getProperty("IS_RUNNING");

  try {
    if (!isRunning) {
      globals.setProperty(IsRunningKey, "TRUE");
      var today = new Date();
      var enddate = new Date();
      enddate.setDate(today.getDate() + 45); // how many days in advance to monitor and block off time

      var secondaryCal = CalendarApp.getCalendarById(PersonalCalendarId);
      var secondaryEvents = secondaryCal.getEvents(today, enddate);

      var primaryCal = CalendarApp.getDefaultCalendar();
      var primaryEvents = primaryCal.getEvents(today, enddate); // all primary calendar events

      var stat = 1;
      var thisSecondaryEvent, existingEventIdx;
      var primaryEventsPreviouslyCloned = []; // to contain primary calendar events that were previously created from secondary calendar
      var primaryEventsUpdated = []; // to contain primary calendar events that were updated from secondary calendar
      var primaryEventsCreated = []; // to contain primary calendar events that were created from secondary calendar
      var primaryEventsDeleted = []; // to contain primary calendar events previously created that have been deleted from secondary calendar

      Logger.log("Number of primaryEvents: " + primaryEvents.length);
      Logger.log("Number of secondaryEvents: " + secondaryEvents.length);

      // create filtered list of existing primary calendar events that were previously created from the secondary calendar
      for (pev in primaryEvents) {
        var prevClonedEvent = primaryEvents[pev];
        const title = prevClonedEvent.getTitle();
        if (title.startsWith(ClonedEventPrefix)) {
          primaryEventsPreviouslyCloned.push(prevClonedEvent);
        }
      }

      // process all events in secondary calendar
      for (sev in secondaryEvents) {
        stat = 1;
        const thisSecondaryEvent = secondaryEvents[sev];

        // if the secondary event has already been blocked in the primary calendar, update it
        for (existingEventIdx in primaryEventsPreviouslyCloned) {
          var prevClonedEvent = primaryEventsPreviouslyCloned[existingEventIdx];
          var secondaryTitle = thisSecondaryEvent.getTitle();
          var secondaryDesc = thisSecondaryEvent.getDescription();
          if (
            prevClonedEvent.getStartTime().getTime() ==
              thisSecondaryEvent.getStartTime().getTime() &&
            prevClonedEvent.getEndTime().getTime() ==
              thisSecondaryEvent.getEndTime().getTime()
          ) {
            stat = 0;
            let shouldUpdate = false;
            if (
              prevClonedEvent.getTitle() !==
              ClonedEventPrefix + secondaryTitle
            ) {
              prevClonedEvent.setTitle(ClonedEventPrefix + secondaryTitle);
              shouldUpdate = true;
            }
            if (prevClonedEvent.getDescription() !== secondaryDesc) {
              prevClonedEvent.setDescription(secondaryDesc);
              shouldUpdate = true;
            }
            if (prevClonedEvent.getColor() !== ClonedEventColor) {
              prevClonedEvent.setColor(ClonedEventColor);
              shouldUpdate = true;
            }
            if (
              prevClonedEvent.getTransparency() !==
              thisSecondaryEvent.getTransparency()
            ) {
              prevClonedEvent.setTransparency(
                thisSecondaryEvent.getTransparency(),
              );
              shouldUpdate = true;
            }

            if (shouldUpdate) {
              prevClonedEvent.setVisibility(CalendarApp.Visibility.PRIVATE); // set blocked time as private appointments in work calendar
              Logger.log(
                "PRIMARY EVENT UPDATED" +
                  "\nprimaryId: " +
                  prevClonedEvent.getId() +
                  " \nprimaryTitle: " +
                  prevClonedEvent.getTitle() +
                  " \nprimaryDesc: " +
                  prevClonedEvent.getDescription(),
              );
            } else {
              Logger.log("SKIPPED UPDATING IDENTICAL EVENT");
            }

            primaryEventsUpdated.push(prevClonedEvent.getId());
          }
        }

        // TODO this is weird. I think there's a better structure.
        if (stat == 0) continue;

        var d = thisSecondaryEvent.getStartTime();
        var n = d.getDay();

        if (thisSecondaryEvent.isAllDayEvent()) continue; // This script only syncs hour-based events
        if (n == 0 || n == 6) continue; // Skip weekends

        // if the secondary event does not exist in the primary calendar, create it
        var newEvent = primaryCal.createEvent(
          ClonedEventPrefix + thisSecondaryEvent.getTitle(),
          thisSecondaryEvent.getStartTime(),
          thisSecondaryEvent.getEndTime(),
        );
        // alternative version below that copies the exact secondary event information into the primary calendar event
        // var newEvent = primaryCal.createEvent(evi.getTitle(),evi.getStartTime(),evi.getEndTime(), {location: evi.getLocation(), description: evi.getDescription()});
        newEvent.setColor(ClonedEventColor);
        newEvent.setDescription(thisSecondaryEvent.getDescription());
        newEvent.setVisibility(CalendarApp.Visibility.PRIVATE); // set blocked time as private appointments in work calendar
        newEvent.setTransparency(thisSecondaryEvent.getTransparency());
        newEvent.removeAllReminders(); // so you don't get double notifications. Delete this if you want to keep the default reminders for your newly created primary calendar events
        primaryEventsCreated.push(newEvent.getId());
        Logger.log(
          "PRIMARY EVENT CREATED" +
            "\nprimaryId: " +
            newEvent.getId() +
            "\nprimaryTitle: " +
            newEvent.getTitle() +
            "\nprimaryDesc " +
            newEvent.getDescription() +
            "\n",
        );
      }

      // if a primary event previously created no longer exists in the secondary calendar, delete it
      for (pev in primaryEventsPreviouslyCloned) {
        var pevIsUpdatedIndex = primaryEventsUpdated.indexOf(
          primaryEventsPreviouslyCloned[pev].getId(),
        );
        if (pevIsUpdatedIndex == -1) {
          var pevIdToDelete = primaryEventsPreviouslyCloned[pev].getId();
          Logger.log(pevIdToDelete + " deleted");
          primaryEventsDeleted.push(pevIdToDelete);
          primaryEventsPreviouslyCloned[pev].deleteEvent();
        }
      }

      Logger.log(
        "Primary events previously created: " +
          primaryEventsPreviouslyCloned.length,
      );
      Logger.log("Primary events updated: " + primaryEventsUpdated.length);
      Logger.log("Primary events deleted: " + primaryEventsDeleted.length);
      Logger.log("Primary events created: " + primaryEventsCreated.length);
    }
  } catch (e) {
    Logger.log("ERROR");
  } finally {
    globals.deleteProperty(IsRunningKey);
  }
}
