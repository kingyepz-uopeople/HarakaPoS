"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Package, CheckCircle, AlertCircle } from "lucide-react";

export default function NotificationsPage() {
  const router = useRouter();

  // Placeholder notifications - in production, fetch from database
  const notifications = [
    {
      id: 1,
      type: "delivery",
      title: "New Delivery Assigned",
      message: "You have been assigned a new delivery to Galanos Hotel, Kangema",
      time: "5 minutes ago",
      read: false,
    },
    {
      id: 2,
      type: "success",
      title: "Delivery Completed",
      message: "Payment confirmed for delivery to Midway Butchery",
      time: "2 hours ago",
      read: true,
    },
    {
      id: 3,
      type: "alert",
      title: "Schedule Update",
      message: "Delivery time for order #1234 has been changed to 3:00 PM",
      time: "1 day ago",
      read: true,
    },
  ];

  function getIcon(type: string) {
    switch (type) {
      case "delivery":
        return <Package className="w-5 h-5 text-blue-600" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "alert":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  }

  function getBgColor(type: string) {
    switch (type) {
      case "delivery":
        return "bg-blue-50";
      case "success":
        return "bg-green-50";
      case "alert":
        return "bg-yellow-50";
      default:
        return "bg-gray-50";
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {notifications.filter(n => !n.read).length} unread
        </p>
        <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          Mark all as read
        </button>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-500">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-2xl shadow-sm border ${
                notification.read ? "border-gray-100" : "border-emerald-200"
              } overflow-hidden`}
            >
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-full ${getBgColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-400">{notification.time}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
