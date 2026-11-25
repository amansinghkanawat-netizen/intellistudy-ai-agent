import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{background:'linear-gradient(135deg,#060412 0%,#0d0a24 40%,#060d1f 100%)'}}>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
