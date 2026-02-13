import BookEvent from "@/components/BookEvent";
import EventCard from "@/components/EventCard";
import { EventAttrs } from "@/database/event.model";
import { getSimilarEventbySlug } from "@/lib/actions/event.actions";
import Image from "next/image";
import { notFound } from "next/navigation";

const BASE_URL =process.env.NEXT_PUBLIC_BASE_URL


const EventDetailItems = ({icons,alt,label}:{icons:string; alt:string;label:string})=>(
            <div className="flex-row-gap-2 items-center ">
                <Image src={icons} alt={alt} width={17} height={17}/>
                <p>{label}</p>
            </div>

)
     



const EventAgenda=({AgendaItems}:{AgendaItems:string[]})=>(
    <div className="agenda">
        <h2>Agenda</h2>

        <ul>
          
            {AgendaItems.map((item)=>(
                <li key={item}>{item}</li>
            ))}
        </ul>

    </div>

)


const EventTags = ({tags}:{tags:string[]})=>(
    <div className="flex flex-row gap-1.5 flex-wrap">
        {tags.map((tag)=>(
            <div className="pill" key={tag}>{tag}</div>
        ))}

    </div>
)

const Bookings =10

const similarEvents: EventAttrs[] = await getSimilarEventbySlug({slug})




const EventDetailsPage  = async ({params}:{params:Promise<{slug:string}>}) => {
    const {slug} = await params;
    const request = await fetch(`${BASE_URL}/api/events/${slug}`)

    if (!request.ok) return notFound();

    const data = await request.json();
    
    if (!data || !data.event) return notFound();

    const {description,image,overview,date,time,location,mode,agenda,audience,organizer,tags} = data.event;


    if(!description) return notFound()
``

  return (
    <section id='event'>
        <div className="header">
            <h1>Event Description</h1>
            <p>{description}</p>


        </div>

        <div className="details">
            {/* left side  event details*/}
            <div className="content">
                <Image src={image} alt='Event Banner' width={800}
                 height={800} className="banner"/>

                 <section className='flex-col-gap-2'>
                    <h2>Overview</h2>
                    <p>{overview}</p>
                 </section>

                 <section className="flex-col-gap-2">
                    <h2>Event Details</h2>
                    <EventDetailItems icons="/icons/calendar.svg" alt="calendar" label={date}/>
                    <EventDetailItems icons="/icons/clock.svg" alt="clock" label={time}/>
                    <EventDetailItems icons="/icons/pin.svg" alt="pin" label={location}/>
                    <EventDetailItems icons="/icons/mode.svg" alt="mode" label={mode}/>
                    <EventDetailItems icons="/icons/audience.svg" alt="audience" label={audience}/>

                 </section>

                <EventAgenda AgendaItems={agenda}/>



                <section>
                    <h2>About Organizer</h2>
                    <p>{organizer}</p>
                </section>

            <EventTags tags={JSON.parse(tags[0])} />

            </div>
            {/* right side  Event Booking */}
            <aside className="booking">
                <div className="signup-card">
                    <h2>Book Your Spot</h2>
                    {Bookings >0 ?(
                        
                        <p className="text-sm">
                            join {Bookings} people who have already booked their spot!
                        </p>
                    ):(
                        <p className="text-sm">
                            Be the first to book your sport!
                        </p>
                    )}
                    <BookEvent/>
                </div>

            </aside>
        </div>
        <div className='flex w-full flex-col gap-4 pt-20'>
            <h2>Similar Events</h2>
            <div className='events'>
                {similarEvents.length>0 && similarEvents.map((similarEvent:EventAttrs)=>(
                    <EventCard key={similarEvent.id} {...similarEvent}/>
                ))}
            </div>
        </div>
    </section>
  )
}

export default EventDetailsPage