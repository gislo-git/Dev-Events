import { Event } from "@/database/event.model";
import { connectToDatabase } from "@/lib/mongodb";
import { v2 as cloudinary } from "cloudinary";
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

        const file  = FormData.get('image') as File

        if (! file){
            return NextResponse.json({message:'Image file is required'},{status:400})

        }
         
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const uploadResult = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { resource_type: "image", folder: "DevEvents" },
                (error, result) => {
                if (error) return reject(error);
                resolve(result);
                }
            );

            stream.end(buffer);
                });

        event.image = (uploadResult as { secure_url:string}).secure_url;

        const createEvent  = await Event.create(event)

        return NextResponse.json({message :'Event created successfully', event:createEvent},{status:201})



    }catch(e){
        console.error(e);
        return NextResponse.json({message:'Event Creation Failed', error: e  instanceof Error ? e.message : "Unknown"},{status:500})
    }
}

export async function GET() {
  try {
    await connectToDatabase();

    const events = await Event.find().sort({ createdAt: -1 });
    return NextResponse.json(
      { message: "Event fetched successfully", events },
      { status: 200 }
    );
  } catch (e) {
    console.log("Event fetched failed!");
    return NextResponse.json(
      { message: "Event fetching failed", error: e },
      { status: 500 }
    );
  }
}