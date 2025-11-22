import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_URL, IMAGE_URL } from '../config/api';

function NotificationDropdown() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  // ดึงข้อมูล notifications
  const fetchNotifications = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ดึงจำนวน notifications ที่ยังไม่อ่าน
  const fetchUnreadCount = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch unread count');
      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // อัพเดทสถานะ notification เป็นอ่านแล้ว
  const markAsRead = async (notificationId) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.notification_id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // ดึงข้อมูลเมื่อเปิด dropdown
  useEffect(() => {
    if (isOpen && token) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isOpen, token]);

  // ดึงข้อมูล unread count เป็นระยะๆ
  useEffect(() => {
    if (token) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // อัพเดททุก 30 วินาที
      return () => clearInterval(interval);
    }
  }, [token]);

  // ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // จัดการการคลิก notification
  const handleNotificationClick = (notification) => {
    markAsRead(notification.notification_id);
    setIsOpen(false);

    // ดึง cpost_id และ comment_id - ตรวจสอบหลายแหล่ง
    // สำหรับ report type, backend ควรจะส่ง cpost_id มาแล้วจาก Report
    let targetCpostId = notification.cpost_id;
    let targetCommentId = notification.comment_id;

    console.log('NotificationDropdown - Notification clicked:', {
      notification_type: notification.notification_type,
      cpost_id: notification.cpost_id,
      comment_id: notification.comment_id,
      report_data: notification.report_data
    });

    // สำหรับ report type, ใช้จาก report_data เป็นหลัก (fallback)
    if (notification.notification_type === 'report') {
      if (notification.report_data) {
        // ใช้จาก report_data เป็นหลักสำหรับ report type
        targetCpostId = notification.report_data.cpost_id || notification.cpost_id || null;
        targetCommentId = notification.report_data.comment_id || notification.comment_id || null;
      } else {
        // ถ้าไม่มี report_data ให้ใช้จาก notification โดยตรง
        targetCpostId = notification.cpost_id || null;
        targetCommentId = notification.comment_id || null;
      }
    }

    console.log('NotificationDropdown - Final values:', {
      targetCpostId,
      targetCommentId
    });

    // นำทางไปยังโพสต์ที่เกี่ยวข้อง
    if (targetCpostId) {
      // สร้าง query parameters สำหรับ highlight
      const params = new URLSearchParams();
      params.set('post', targetCpostId);
      if (notification.notification_type === 'report') {
        params.set('reported', 'true');
        if (targetCommentId) {
          params.set('comment', targetCommentId);
        }
      }
      const url = `/community?${params.toString()}`;
      console.log('NotificationDropdown - Navigating to:', url);
      navigate(url, { replace: false });
    } else {
      console.error('NotificationDropdown - No cpost_id found:', notification);
      console.error('NotificationDropdown - Notification object:', JSON.stringify(notification, null, 2));
    }
  };

  // แปลงวันที่เป็นรูปแบบที่อ่านง่าย
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    if (days < 7) return `${days} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH');
  };

  const isAdmin = user?.isAdmin || false;
  const badgeColor = isAdmin ? 'bg-red-500' : 'bg-green-500';
  const bgHoverColor = isOpen ? (isAdmin ? 'bg-red-50' : 'bg-green-50') : '';

  if (!token) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors ${bgHoverColor}`}
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className={`absolute top-0 right-0 w-5 h-5 ${badgeColor} text-white text-xs rounded-full flex items-center justify-center font-bold`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">การแจ้งเตือน</h3>
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className={`text-sm ${isAdmin ? 'text-red-600' : 'text-green-600'} hover:underline`}
            >
              ดูทั้งหมด
            </Link>
          </div>

          {isLoading ? (
            <div className="p-4 text-center text-gray-500">กำลังโหลด...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">ไม่มีแจ้งเตือน</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.notification_id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      !notification.is_read ? (isAdmin ? 'bg-red-500' : 'bg-green-500') : 'bg-transparent'
                    }`} />
                    <div className="flex-grow">
                      <p className="text-sm text-gray-800">{notification.notification_message}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(notification.notification_datetime)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;

