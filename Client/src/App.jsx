import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Homepage from './pages/homepage'
import Loginpage from './pages/Loginpage'
import Profilepage from './pages/Profilepage'

function App() {
  return (
    <div className="bg-[url('./src/assets/bgimage.svg')] bg-contain bg-black bg-no-repeat bg-center">
      <Routes>
          <Route path='/' element={<Homepage/>}/>
          <Route path='/login' element={<Loginpage/>}/>
          <Route path='/Profile' element={<Profilepage/>}/>
      </Routes>
    </div>
  )
}

export default App