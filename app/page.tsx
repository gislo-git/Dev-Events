import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import { EventAttrs } from "@/database/event.model"
import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;


const page =  async () => {

//  const response = await fetch("http://localhost:3000/api/events");
const response = await fetch (`${BASE_URL}/api/events`)

 const { events } = await response.json();



  return (
    <section>
      
      <h1 className=" text-center">The Hub for Every Dev <br/> Event you can't miss</h1>
      <p className=" text-center mt-4">Discover, Share, and Connect at DevEvents <br/> - Your Ultimate Destination for Hackthons, Developer Conferences, Meetups, and Workshops Worldwide!</p>

      <ExploreBtn/>

      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>


                        
                    <ul className="events">
                    {Array.isArray(events) && events.length > 0 &&
                        events.map((event: EventAttrs) => (
                        <li key={event.title}>
                            <EventCard {...event} />
                        </li>
                        ))}
                    </ul>

        {/* <ul className="events">
          {events && events.length > 0 && events.map((event:EventAttrs)=>(
            <li key={event.title}>
              <EventCard {...event} />

            </li>
          
          ))
      }
        </ul> */}
      </div>
    </section>
  )
}

export default page