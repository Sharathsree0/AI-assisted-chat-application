import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets';

function Profilepage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const nav = useNavigate();
  const [name, setName] = useState("Enter Name");
  const [bio, setBio] = useState("Hi there ......");

  const handleSubmit = async (e) => {
    e.preventDefault();
    nav('/');
  }

  return (
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center'>
      <div className='w-5/6 backdrop-blur-2xl max-w-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg'>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-10 flex-1">
          <h3 className='text-lg'>Profile details</h3>

          <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer'>
            <input
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
              onChange={(e) => setSelectedImage(e.target.files[0])}
            />
            <img
              src={selectedImage ? URL.createObjectURL(selectedImage) : assets.avatar_icon}
              alt="avatar"
              className={`w-12 h-12 ${selectedImage && 'rounded-full'}`}
            />
            upload profile image
          </label>

          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            required
            placeholder='Your name'
            className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500'
          />

          <textarea
            required
            placeholder="Write your bio..."
            rows={4}
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500'
          ></textarea>

          <button
            type='submit'
            className='bg-gradient-to-r from-purple-400 to-violet-600 text-white p-2 rounded-full text-lg cursor-pointer'
          >
            Save
          </button>
        </form>

        <img
          className='w-35 h-25 aspect-square mx-10 max-sm:mt-10'
          src={assets.logo_icon}
          alt="logo"
        />
      </div>
    </div>
  )
}

export default Profilepage
