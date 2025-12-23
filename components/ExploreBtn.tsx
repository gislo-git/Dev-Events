'use client'
import { Button } from './ui/button'
import Image from 'next/image'

const ExploreBtn = () => {
  return (
    <Button type='button' id='explore-btn'
      onClick={()=> console.log('btn')}>
        <a href='#events' >
            Explore Events

            <Image src={'/icons/arrow-down.svg'}
             alt='arro-down' width={24} height={24}>

             </Image>

        </a>

    </Button>
  )
}

export default ExploreBtn