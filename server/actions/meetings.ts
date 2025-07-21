'use server'

import { db } from "@/drizzle/db";
import { meetingActionSchema, meetingFormSchema } from "@/schema/meetings";
import { fromZonedTime } from "date-fns-tz";
import z from "zod";
import { getValidTimesFromSchedule } from "./schedule";
import { createCalendarEvent } from "../google/googleCalendar";

export async function createMeeting(unsafeData: z.infer<typeof meetingActionSchema>) {

    const path = `/book/${unsafeData.clerkUserId}/${unsafeData.eventId}/success?startTime=${unsafeData.startTime.toISOString()}`
    
    try {
        const {success, data} = meetingActionSchema.safeParse(unsafeData);

        if(!success) {
            throw new Error("Invalid meeting data.")
        }

        const event = await db.query.EventTable.findFirst({
            where: ({clerkUserId, isActive, id}, {eq, and}) => 
                and(
                    eq(isActive, true),
                    eq(clerkUserId, data.clerkUserId),
                    eq(id, data.eventId)
                )
        })
                
            if(!event) {
                throw new Error("Event not found.")
            }

            const startInTimezone = fromZonedTime(data.startTime, data.timezone);
            const validTimes = await getValidTimesFromSchedule([startInTimezone], event);

            if(validTimes.length === 0) {
                throw new Error("No valid times for this event.")
            }

            await createCalendarEvent({
                ...data,
                startTime: startInTimezone,
                durationInMinutes: event.durationInMinutes,
                eventName: event.name
            });

            return {
                clerkUserId: data.clerkUserId,
                eventId: data.eventId,
                startTime: data.startTime
            }
        
    }catch (error: any) {
        console.error(`Error creating meeting: ${error.message || error}`);
        throw new Error(`Failed to create meeting: ${error.message || error}`);
    } 
}