'use server'

import { db } from "@/drizzle/db"
import { ScheduleTable } from "@/drizzle/schema"
import { ScheduleAvailabilityTable } from "@/drizzle/schema"
import { scheduleFormSchema } from "@/schema/schedule"
import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { BatchItem } from "drizzle-orm/batch"
import { revalidatePath } from "next/cache"
import z from "zod"
import { getCalendarEventTimes } from "../google/googleCalendar"
import { DAYS_OF_WEEK_IN_ORDER } from "@/constants"
import { addMinutes, areIntervalsOverlapping, interval, isFriday, isMonday, isSaturday, isSunday, isThursday, isTuesday, isWednesday, isWithinInterval, setHours, setMinutes, startOfDay } from "date-fns"
import {fromZonedTime} from "date-fns-tz"

type ScheduleRow = typeof ScheduleTable.$inferSelect
type AvailabilityRow = typeof ScheduleAvailabilityTable.$inferSelect

export type FullSchedule = ScheduleRow & {
    availabilities: AvailabilityRow[]
}

export async function getSchedule(userId:string): Promise<FullSchedule> {
    const schedule = await db.query.ScheduleTable.findFirst({
        where: ({clerkUserId}, {eq}) => eq(clerkUserId, userId),
        with: {
            availabilities: true
        }
    })

    return schedule as FullSchedule
}

export async function saveSchedule(
    unsafeData: z.infer<typeof scheduleFormSchema>
) {
    try {
        const {userId} = await auth();
        const {success, data} = scheduleFormSchema.safeParse(unsafeData);
        if (!success || !userId) {
            throw new Error("Invalid schedule data or user not authenticated.");
        }

        const {availabilities, ...scheduleData} = data
        const [{id: scheduleId}] = await db.insert(ScheduleTable).values({
            ...scheduleData,
            clerkUserId: userId
        }).onConflictDoUpdate({
            target: ScheduleTable.clerkUserId,
            set: scheduleData
            
        })
        .returning({id: ScheduleTable.id})

        const statements: [BatchItem<"pg">] = [
            db.delete(ScheduleAvailabilityTable)
            .where(eq(ScheduleAvailabilityTable.scheduleId, scheduleId))
        ]

        if(availabilities.length > 0){
            statements.push(
                db.insert(ScheduleAvailabilityTable)
                .values(availabilities.map((availability) => ({
                    ...availability,
                    scheduleId
                })))
            )
        }

        await db.batch(statements)

    } catch (error:any) {
        throw new Error(`Failed to save schedule: ${error.message || error}`);
    } finally {
        revalidatePath("/schedule")
    }
}

export async function getValidTimesFromSchedule(
    timesInOrder: Date[],
    event: {clerkUserId: string; durationInMinutes: number}
    
) : Promise<Date[]> {

    const {clerkUserId:userId, durationInMinutes} = event
    
    const start = timesInOrder[0]
    const end = timesInOrder.at(-1)

    if(!start || !end)
    {
        return []
    }

    const schedule = await getSchedule(userId)

    if(schedule === null)
    {
        return []
    }

    const groupedAvailabilities = Object.groupBy(
        schedule.availabilities,
        a => a.dayOfWeek
    )

    const eventTimes = await getCalendarEventTimes(
        userId, {
            start,
            end,
        }

    )

    return timesInOrder.filter(intervalDate => {
        const availabilities = getAvaliabilities(
            groupedAvailabilities,
            intervalDate,
            schedule.timezone
        )

    const eventInterval = {
        start: intervalDate,
        end: addMinutes(intervalDate, durationInMinutes)
    }

    return(
        eventTimes.every(eventTime => {
            return !areIntervalsOverlapping(eventTime, eventInterval)   
        }) &&
        availabilities.some(availability => {
            return (
                isWithinInterval(eventInterval.start, availability) &&
                isWithinInterval(eventInterval.end, availability)
            )
        })
    )
})
    
}

function getAvaliabilities(
    groupedAvailabilities: Partial<Record<(typeof DAYS_OF_WEEK_IN_ORDER)[number],(typeof ScheduleAvailabilityTable.$inferSelect)[]>>,
    date: Date,
    timezone: string
) : {start: Date; end: Date}[] {

    const dayOfWeek = (() => {
        if(isMonday(date)) return "monday"
        if(isTuesday(date)) return "tuesday"
        if(isWednesday(date)) return "wednesday"
        if(isThursday(date)) return "thursday"
        if(isFriday(date)) return "friday"
        if(isSaturday(date)) return "saturday"
        if(isSunday(date)) return "sunday"

        return null

    })()

    if(!dayOfWeek)
    {
        return []
    }

    const dayAvailabilities = groupedAvailabilities[dayOfWeek]

    if(!dayAvailabilities)
    {
        return []
    }

    return dayAvailabilities.map(({startTime, endTime}) => {
        const [startHour, startMinute] = startTime.split(":").map(Number)
        const [endHour, endMinute] = endTime.split(":").map(Number)

        const start= fromZonedTime(
            setMinutes(setHours(date, startHour), startMinute),timezone
        )

        const end = fromZonedTime(
            setMinutes(setHours(date, endHour), endMinute),timezone
        )

        return {start, end}

    })

}
