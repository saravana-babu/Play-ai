/**
 * @license
 * MIT
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Generator from './pages/Generator';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Game from './pages/Game';
import Tool from './pages/Tool';
import History from './pages/History';
import Sitemap from './pages/Sitemap';
import Docs from './pages/Docs';

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            fontSize: '14px',
            fontWeight: '600'
          },
        }} 
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="generator" element={<Generator />} />
          <Route path="login" element={<Login />} />
          <Route path="settings" element={<Settings />} />
          <Route path="games/:id" element={<Game />} />
          <Route path="tools/:id" element={<Tool />} />
          <Route path="history" element={<History />} />
          <Route path="sitemap" element={<Sitemap />} />
          <Route path="docs" element={<Docs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

