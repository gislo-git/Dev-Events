'use client'

import { useState } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"






const BookEvent = () => {

    const [email , setEmail] = useState('')
    const [submited ,setSubmitted ] = useState(false)
    const handleSubmit=(e: React.FormEvent)=>{
        e.preventDefault()
        setTimeout(()=>{
            setSubmitted(true)
        },1000)

    }

  return (
    <div id="book-event">

        {submited ?(
            <p className="text-sm"> Thank you for signing up!</p>

        ):(

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email Address</label>
                    <Input
                        type='email'
                        value={email}
                        id='email'
                        placeholder='enter your email address'
                        onChange={(e)=>setEmail(e.target.value)}
                    
                    
                    />

                    
                </div>
                <Button type='submit'>Submit</Button>
            </form>
           
        )}

    
    
    </div>
  )
}

export default BookEvent