import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Banks from './pages/Banks';

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/banks" element={<Banks />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
