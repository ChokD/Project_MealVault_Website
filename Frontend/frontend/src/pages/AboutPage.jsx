import React from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

function AboutPage () {
    return (
        <div>
            <Navbar />
            <div className="pt-24"></div> {/* Padding to avoid Navbar overlap */}
            <h1>About us</h1>
            <p>This is the Menu Page where you can find various food menus.</p>
            <p>Currently, this page is under construction.</p> 
            <p>Stay tuned for updates!</p>
            <p>Thank you for your patience!</p> 
            <Link to="/">Back to Home</Link>
        </div>
    );
};

export default AboutPage;