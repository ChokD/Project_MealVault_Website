import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';

function NotificationsPage() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // ดึงข้อมูล notifications
  const fetchNotifications = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3000/api/notifications', {
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
      const response = await fetch('http://localhost:3000/api/notifications/unread-count', {
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
      const response = await fetch(`http://localhost:3000/api/notifications/${notificationId}/read`, {
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

  // ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว
  const markAllAsRead = async () => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3000/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // จัดการการคลิก notification
  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.notification_id);
    }

    // Debug: ตรวจสอบข้อมูล notification
    console.log('Notification clicked:', notification);
    console.log('notification_type:', notification.notification_type);
    console.log('cpost_id:', notification.cpost_id);
    console.log('comment_id:', notification.comment_id);
    console.log('report_data:', notification.report_data);

    // ดึง cpost_id และ comment_id - ตรวจสอบหลายแหล่ง
    let targetCpostId = null;
    let targetCommentId = null;

    // Debug: ตรวจสอบข้อมูลทั้งหมด
    console.log('=== Notification Click Debug ===');
    console.log('Full notification object:', JSON.stringify(notification, null, 2));
    console.log('Notification keys:', Object.keys(notification));
    console.log('notification.cpost_id:', notification.cpost_id);
    console.log('notification.comment_id:', notification.comment_id);
    console.log('notification.report_data:', notification.report_data);
    console.log('notification.notification_type:', notification.notification_type);
    console.log('notification.creport_id:', notification.creport_id);

    // สำหรับ report type, ตรวจสอบหลายแหล่ง
    if (notification.notification_type === 'report') {
      // 1. ลองจาก report_data ก่อน (backend ควรส่งมา)
      if (notification.report_data) {
        targetCpostId = notification.report_data.cpost_id || null;
        targetCommentId = notification.report_data.comment_id || null;
        console.log('Using from report_data:', { targetCpostId, targetCommentId });
      }
      
      // 2. ถ้ายังไม่มี ลองจาก notification โดยตรง
      if (!targetCpostId) {
        targetCpostId = notification.cpost_id || null;
        targetCommentId = notification.comment_id || null;
        console.log('Using from notification:', { targetCpostId, targetCommentId });
      }
      
      // 3. ถ้ายังไม่มี และมี creport_id ให้แสดง warning
      if (!targetCpostId && notification.creport_id) {
        console.warn('Notification has creport_id but no cpost_id. This might be an old notification.');
      }
    } else {
      // สำหรับ notification type อื่น ใช้จาก notification โดยตรง
      targetCpostId = notification.cpost_id || null;
      targetCommentId = notification.comment_id || null;
    }

    console.log('Final values:', { targetCpostId, targetCommentId });

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
      console.log('Navigating to:', url);
      navigate(url, { replace: false });
    } else {
      // แสดง error message ที่ชัดเจนขึ้น
      console.error('=== ERROR: No cpost_id found ===');
      console.error('Notification Type:', notification.notification_type);
      console.error('Notification ID:', notification.notification_id);
      console.error('Has report_data:', !!notification.report_data);
      console.error('Has creport_id:', !!notification.creport_id);
      console.error('Full notification:', JSON.stringify(notification, null, 2));
      
      // แสดง alert ที่มีข้อมูลมากขึ้น
      const errorMsg = `ไม่พบข้อมูลโพสต์ที่เกี่ยวข้อง\n\n` +
        `Notification Type: ${notification.notification_type}\n` +
        `Notification ID: ${notification.notification_id}\n` +
        `Has report_data: ${!!notification.report_data}\n` +
        `Has creport_id: ${!!notification.creport_id}\n\n` +
        `กรุณาตรวจสอบ console log สำหรับข้อมูลเพิ่มเติม\n` +
        `หากเป็น notification เก่า อาจต้องรายงานใหม่`;
      
      alert(errorMsg);
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
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ดึงข้อมูลเมื่อ component mount
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [token]);

  const isAdmin = user?.isAdmin || false;
  const primaryBg = isAdmin ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700';
  const unreadBg = isAdmin ? 'bg-red-50 border-l-4 border-red-500' : 'bg-green-50 border-l-4 border-green-500';
  const dotColor = isAdmin ? 'bg-red-500' : 'bg-green-500';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-6 sm:px-8 py-8 max-w-4xl">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className={`text-2xl font-bold ${isAdmin ? 'text-red-600' : 'text-gray-800'}`}>
                การแจ้งเตือน
              </h1>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className={`px-4 py-2 ${primaryBg} rounded-lg hover:opacity-80 transition-opacity text-sm font-semibold`}
                >
                  ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-lg">ไม่มีแจ้งเตือน</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      !notification.is_read 
                        ? unreadBg 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <p className="text-gray-800">{notification.notification_message}</p>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(notification.notification_datetime)}</p>
                        
                        {/* แสดงข้อมูลรายงานสำหรับ Admin */}
                        {notification.notification_type === 'report' && notification.report_data && (
                          <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                            <p className="text-xs text-gray-600">
                              <strong>ประเภท:</strong> {notification.report_data.creport_type}
                            </p>
                            {notification.report_data.creport_details && (
                              <p className="text-xs text-gray-600 mt-1">
                                <strong>รายละเอียด:</strong> {notification.report_data.creport_details}
                              </p>
                            )}
                            {notification.report_data.reporter_fname && (
                              <p className="text-xs text-gray-600 mt-1">
                                <strong>รายงานโดย:</strong> {notification.report_data.reporter_fname}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      {!notification.is_read && (
                        <div className={`ml-4 w-3 h-3 rounded-full ${dotColor} flex-shrink-0 mt-1`} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default NotificationsPage;

