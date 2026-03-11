/**
 * @license
 * MIT
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Game from './pages/Game';
import Tool from './pages/Tool';
import History from './pages/History';
import Sitemap from './pages/Sitemap';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="settings" element={<Settings />} />
          <Route path="games/:id" element={<Game />} />
          <Route path="tools/:id" element={<Tool />} />
          <Route path="history" element={<History />} />
          <Route path="sitemap" element={<Sitemap />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

