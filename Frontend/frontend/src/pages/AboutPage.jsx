import React from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

function AboutPage () {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
            <Navbar />
            <div className="pt-28 max-w-2xl mx-auto px-6">
                <div className="bg-white rounded-3xl shadow-lg p-10 flex flex-col items-center">
                    <img
                        src="https://img.icons8.com/color/96/meal.png"
                        alt="About Us"
                        className="mb-6"
                    />
                    <h1 className="text-4xl font-bold text-green-700 mb-4">About Us</h1>
                    <p className="text-gray-700 text-lg mb-2 text-center">
                        Welcome to <span className="font-semibold text-green-600">MealVault</span>!<br />
                        Our mission is to make meal planning and food discovery easy and enjoyable for everyone.
                    </p>
                    <p className="text-gray-600 text-center mb-2">
                        We are passionate about helping you find delicious recipes, organize your meals, and save time in the kitchen.
                    </p>
                    <p className="text-gray-600 text-center mb-2">
                        This page is currently under construction.<br />
                        Stay tuned for exciting updates!
                    </p>
                    <p className="text-gray-500 text-center mb-6">
                        Thank you for your patience and support.
                    </p>
                    <Link
                        to="/"
                        className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-full transition"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;