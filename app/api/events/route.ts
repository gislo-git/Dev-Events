import { Event } from "@/database/event.model";
import { connectToDatabase } from "@/lib/mongodb";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
    try{

        await connectToDatabase();
        const FormData = await req.formData()

        let event;

        try{
            event = Object.fromEntries(FormData.entries())

        }catch(e){
            return NextResponse.json({message:'Invalid JSON data format'},{status:400})
        }

        const createEvent  = await Event.create(event)

        return NextResponse.json({message :'Event created successfully', event:createEvent},{status:201})



    }catch(e){
        console.error(e);
        return NextResponse.json({message:'Event Creation Failed', error: e  instanceof Error ? e.message : "Unknown"},{status:500})
    }
}