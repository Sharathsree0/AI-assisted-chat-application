import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Homepage from './pages/homepage'
import Loginpage from './pages/Loginpage'
import Profilepage from './pages/Profilepage'
import {Toaster} from "react-hot-toast"
import { useContext } from 'react'
import { AuthContext } from './context/authContext'
 
function App() {
  const {authUser}=useContext(AuthContext)
  return (
    <div className="bg-[url('./src/assets/bgimage.svg')] bg-contain bg-black bg-no-repeat bg-center">
      <Toaster/>
      <Routes>
          <Route path='/' element={authUser ? <Homepage/>:<Navigate to="/login"/>}/>
          <Route path='/login' element={!authUser ? <Loginpage/> :<Navigate to="/"/>}/>
          <Route path='/Profile' element={authUser ? <Profilepage/> :<Navigate to="/login"/>}/>
      </Routes>
    </div>
  )
}

export default App