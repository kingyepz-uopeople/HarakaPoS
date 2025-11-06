"use client";"use client";



import { useState, useEffect } from "react";import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";import { createClient } from "@/lib/supabase/client";

import { import { 

  ArrowLeft,   ArrowLeft, 

  Bell,   Bell, 

  Package,   Package, 

  CheckCircle,   CheckCircle, 

  AlertCircle,   AlertCircle, 

  TrendingDown,  TrendingDown,

  DollarSign,  DollarSign,

  Trash2  Trash2

} from "lucide-react";} from "lucide-react";



interface Notification {interface Notification {

  id: string;  id: string;

  type: string;  type: string;

  title: string;  title: string;

  message: string;  message: string;

  created_at: string;  created_at: string;

  is_read: boolean;  is_read: boolean;

  link_to?: string;  link_to?: string;

}}



export default function NotificationsPage() {export default function NotificationsPage() {

  const router = useRouter();  const router = useRouter();

  const supabase = createClient();  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [loading, setLoading] = useState(true);  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<"all" | "unread">("all");  const [filter, setFilter] = useState<"all" | "unread">("all");



  useEffect(() => {  useEffect(() => {

    fetchNotifications();    fetchNotifications();



    // Real-time subscription    // Real-time subscription

    const channel = supabase    const channel = supabase

      .channel("driver-notifications")      .channel("driver-notifications")

      .on(      .on(

        "postgres_changes",        "postgres_changes",

        {        {

          event: "INSERT",          event: "INSERT",

          schema: "public",          schema: "public",

          table: "notifications",          table: "notifications",

        },        },

        (payload) => {        (payload) => {

          setNotifications((prev) => [payload.new as Notification, ...prev]);          setNotifications((prev) => [payload.new as Notification, ...prev]);

          // Show browser notification if permission granted          // Show browser notification if permission granted

          if ("Notification" in window && Notification.permission === "granted") {          if ("Notification" in window && Notification.permission === "granted") {

            const newNotif = payload.new as Notification;            const newNotif = payload.new as Notification;

            new Notification(newNotif.title, {            new Notification(newNotif.title, {

              body: newNotif.message,              body: newNotif.message,

              icon: "/icon-192x192.png",              icon: "/icon-192x192.png",

            });            });

          }          }

        }        }

      )      )

      .subscribe();      .subscribe();



    return () => {    return () => {

      supabase.removeChannel(channel);      supabase.removeChannel(channel);

    };    };

  }, []);  }, []);



  const fetchNotifications = async () => {  const fetchNotifications = async () => {

    setLoading(true);    setLoading(true);

    try {    try {

      const { data: { user } } = await supabase.auth.getUser();      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;      if (!user) return;



      const { data, error } = await supabase      const { data, error } = await supabase

        .from("notifications")        .from("notifications")

        .select("*")        .select("*")

        .eq("user_id", user.id)        .eq("user_id", user.id)

        .order("created_at", { ascending: false })        .order("created_at", { ascending: false })

        .limit(50);        .limit(50);



      if (error) {      if (error) {

        console.error("Error fetching notifications:", error);        console.error("Error fetching notifications:", error);

      } else {      } else {

        setNotifications(data || []);        setNotifications(data || []);

      }      }

    } catch (error) {    } catch (error) {

      console.error("Error:", error);      console.error("Error:", error);

    } finally {    } finally {

      setLoading(false);      setLoading(false);

    }    }

  };  };



  const markAsRead = async (id: string) => {  const markAsRead = async (id: string) => {

    try {    try {

      const { error } = await supabase      const { error } = await supabase

        .from("notifications")        .from("notifications")

        .update({ is_read: true })        .update({ is_read: true })

        .eq("id", id);        .eq("id", id);



      if (error) throw error;      if (error) throw error;



      setNotifications((prev) =>      setNotifications((prev) =>

        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))

      );      );

    } catch (error) {    } catch (error) {

      console.error("Error marking as read:", error);      console.error("Error marking as read:", error);

    }    }

  };  };



  const markAllAsRead = async () => {  const markAllAsRead = async () => {

    try {    try {

      const { data: { user } } = await supabase.auth.getUser();      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;      if (!user) return;



      const { error } = await supabase      const { error } = await supabase

        .from("notifications")        .from("notifications")

        .update({ is_read: true })        .update({ is_read: true })

        .eq("user_id", user.id)        .eq("user_id", user.id)

        .eq("is_read", false);        .eq("is_read", false);



      if (error) throw error;      if (error) throw error;



      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    } catch (error) {    } catch (error) {

      console.error("Error marking all as read:", error);      console.error("Error marking all as read:", error);

    }    }

  };  };



  const deleteNotification = async (id: string) => {  const deleteNotification = async (id: string) => {

    try {    try {

      const { error} = await supabase      const { error } = await supabase

        .from("notifications")        .from("notifications")

        .delete()        .delete()

        .eq("id", id);        .eq("id", id);



      if (error) throw error;      if (error) throw error;



      setNotifications((prev) => prev.filter((n) => n.id !== id));      setNotifications((prev) => prev.filter((n) => n.id !== id));

    } catch (error) {    } catch (error) {

      console.error("Error deleting notification:", error);      console.error("Error deleting notification:", error);

    }    }

  };  };



  const handleNotificationClick = (notification: Notification) => {  const handleNotificationClick = (notification: Notification) => {

    markAsRead(notification.id);    markAsRead(notification.id);

    if (notification.link_to) {    if (notification.link_to) {

      router.push(notification.link_to);      router.push(notification.link_to);

    }    }

  };  };



  function getIcon(type: string) {  function getIcon(type: string) {

    switch (type) {    switch (type) {

      case "low_stock":      case "low_stock":

      case "expiring_soon":      case "expiring_soon":

        return <Package className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />;        return <Package className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />;

      case "payment_received":      case "payment_received":

      case "order_created":      case "order_created":

        return <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;        return <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;

      case "wastage_alert":      case "wastage_alert":

        return <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />;        return <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />;

      case "delivery":      case "delivery":

        return <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />;        return <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />;

      case "success":      case "success":

        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;

      case "alert":      case "alert":

        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />;        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />;

      default:      default:

        return <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />;        return <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />;

    }    }

  }  }



  function getBgColor(type: string, isRead: boolean) {  function getBgColor(type: string, isRead: boolean) {

    const opacity = isRead ? "bg-opacity-30" : "bg-opacity-50";    const opacity = isRead ? "bg-opacity-30" : "bg-opacity-50";

    switch (type) {    switch (type) {

      case "low_stock":      case "low_stock":

      case "expiring_soon":      case "expiring_soon":

      case "wastage_alert":      case "wastage_alert":

        return `bg-orange-50 ${opacity}`;        return `bg-orange-50 ${opacity}`;

      case "payment_received":      case "payment_received":

      case "order_created":      case "order_created":

      case "success":      case "success":

        return `bg-green-50 ${opacity}`;        return `bg-green-50 ${opacity}`;

      case "delivery":      case "delivery":

        return `bg-blue-50 ${opacity}`;        return `bg-blue-50 ${opacity}`;

      case "alert":      case "alert":

        return `bg-yellow-50 ${opacity}`;        return `bg-yellow-50 ${opacity}`;

      default:      default:

        return `bg-gray-50 ${opacity}`;        return `bg-gray-50 ${opacity}`;

    }    }

  }  }



  function getTimeAgo(dateString: string) {  function getTimeAgo(dateString: string) {

    const now = new Date();    const now = new Date();

    const date = new Date(dateString);    const date = new Date(dateString);

    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);



    if (seconds < 60) return "Just now";    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) return `${minutes}m ago`;    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h ago`;    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);    const days = Math.floor(hours / 24);

    if (days < 7) return `${days}d ago`;    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();    return date.toLocaleDateString();

  }  }



  const filteredNotifications = notifications.filter((n) =>  const filteredNotifications = notifications.filter((n) =>

    filter === "all" ? true : !n.is_read    filter === "all" ? true : !n.is_read

  );  );



  const unreadCount = notifications.filter((n) => !n.is_read).length;  const unreadCount = notifications.filter((n) => !n.is_read).length;



  return (  return (

    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 mb-20">    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 mb-20">

      {/* Header */}      {/* Header */}

      <div className="flex items-center justify-between">      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2 sm:gap-3">        <div className="flex items-center gap-2 sm:gap-3">

          <button          <button

            onClick={() => router.back()}            onClick={() => router.back()}

            className="btn-icon btn-icon-sm btn-ghost"            className="btn-icon btn-icon-sm btn-ghost"

            aria-label="Go back"            aria-label="Go back"

          >          >

            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />

          </button>          </button>

          <div>          <div>

            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Notifications</h1>            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Notifications</h1>

            {unreadCount > 0 && (            {unreadCount > 0 && (

              <p className="text-xs sm:text-sm text-gray-600">{unreadCount} unread</p>              <p className="text-xs sm:text-sm text-gray-600">{unreadCount} unread</p>

            )}            )}

          </div>          </div>

        </div>        </div>

      </div>      </div>



      {/* Filter & Actions */}      {/* Filter & Actions */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

          <div className="flex gap-2">          <div className="flex gap-2">

            <button            <button

              onClick={() => setFilter("all")}              onClick={() => setFilter("all")}

              className={`btn btn-sm ${              className={`btn btn-sm ${

                filter === "all" ? "btn-primary" : "btn-ghost"                filter === "all" ? "btn-primary" : "btn-ghost"

              }`}              }`}

            >            >

              All ({notifications.length})              All ({notifications.length})

            </button>            </button>

            <button            <button

              onClick={() => setFilter("unread")}              onClick={() => setFilter("unread")}

              className={`btn btn-sm ${              className={`btn btn-sm ${

                filter === "unread" ? "btn-primary" : "btn-ghost"                filter === "unread" ? "btn-primary" : "btn-ghost"

              }`}              }`}

            >            >

              Unread ({unreadCount})              Unread ({unreadCount})

            </button>            </button>

          </div>          </div>

          {unreadCount > 0 && (          {unreadCount > 0 && (

            <button            <button

              onClick={markAllAsRead}              onClick={markAllAsRead}

              className="btn btn-sm btn-outline"              className="btn btn-sm btn-outline"

            >            >

              <CheckCircle className="w-4 h-4" />              <CheckCircle className="w-4 h-4" />

              Mark all as read              Mark all as read

            </button>            </button>

          )}          )}

        </div>        </div>

      </div>      </div>



      {/* Notifications List */}      {/* Notifications List */}

      {loading ? (      {loading ? (

        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>

          <p className="text-gray-600">Loading notifications...</p>          <p className="text-gray-600">Loading notifications...</p>

        </div>        </div>

      ) : filteredNotifications.length === 0 ? (      ) : filteredNotifications.length === 0 ? (

        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 text-center">        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 text-center">

          <Bell className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />          <Bell className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />

          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">

            No notifications            No notifications

          </h3>          </h3>

          <p className="text-sm sm:text-base text-gray-500">          <p className="text-sm sm:text-base text-gray-500">

            {filter === "unread"            {filter === "unread"

              ? "You're all caught up!"              ? "You're all caught up!"

              : "You'll see notifications here"}              : "You'll see notifications here"}

          </p>          </p>

        </div>        </div>

      ) : (      ) : (

        <div className="space-y-2 sm:space-y-3">        <div className="space-y-2 sm:space-y-3">

          {filteredNotifications.map((notification) => (          {filteredNotifications.map((notification) => (

            <div            <div

              key={notification.id}              key={notification.id}

              className={`bg-white rounded-xl sm:rounded-2xl shadow-sm border transition-all ${              className={`bg-white rounded-xl sm:rounded-2xl shadow-sm border transition-all ${

                notification.is_read                notification.is_read

                  ? "border-gray-100"                  ? "border-gray-100"

                  : "border-emerald-200 shadow-md"                  : "border-emerald-200 shadow-md"

              } overflow-hidden hover:shadow-lg`}              } overflow-hidden hover:shadow-lg`}

            >            >

              <div              <div

                className={`p-3 sm:p-4 ${getBgColor(                className={`p-3 sm:p-4 ${getBgColor(

                  notification.type,                  notification.type,

                  notification.is_read                  notification.is_read

                )} cursor-pointer`}                )} cursor-pointer`}

                onClick={() => handleNotificationClick(notification)}                onClick={() => handleNotificationClick(notification)}

              >              >

                <div className="flex items-start gap-3">                <div className="flex items-start gap-3">

                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center shadow-sm">                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center shadow-sm">

                    {getIcon(notification.type)}                    {getIcon(notification.type)}

                  </div>                  </div>

                  <div className="flex-1 min-w-0">                  <div className="flex-1 min-w-0">

                    <div className="flex items-start justify-between gap-2">                    <div className="flex items-start justify-between gap-2">

                      <h3                      <h3

                        className={`text-sm sm:text-base font-semibold ${                        className={`text-sm sm:text-base font-semibold ${

                          notification.is_read                          notification.is_read

                            ? "text-gray-700"                            ? "text-gray-700"

                            : "text-gray-900"                            : "text-gray-900"

                        }`}                        }`}

                      >                      >

                        {notification.title}                        {notification.title}

                      </h3>                      </h3>

                      {!notification.is_read && (                      {!notification.is_read && (

                        <div className="flex-shrink-0 w-2 h-2 bg-emerald-600 rounded-full mt-1.5"></div>                        <div className="flex-shrink-0 w-2 h-2 bg-emerald-600 rounded-full mt-1.5"></div>

                      )}                      )}

                    </div>                    </div>

                    <p                    <p

                      className={`text-xs sm:text-sm mt-1 ${                      className={`text-xs sm:text-sm mt-1 ${

                        notification.is_read ? "text-gray-500" : "text-gray-700"                        notification.is_read ? "text-gray-500" : "text-gray-700"

                      }`}                      }`}

                    >                    >

                      {notification.message}                      {notification.message}

                    </p>                    </p>

                    <p className="text-xs text-gray-400 mt-2">                    <p className="text-xs text-gray-400 mt-2">

                      {getTimeAgo(notification.created_at)}                      {getTimeAgo(notification.created_at)}

                    </p>                    </p>

                  </div>                  </div>

                  <button                  <button

                    onClick={(e) => {                    onClick={(e) => {

                      e.stopPropagation();                      e.stopPropagation();

                      deleteNotification(notification.id);                      deleteNotification(notification.id);

                    }}                    }}

                    className="btn-icon btn-icon-sm hover:bg-red-100 text-gray-400 hover:text-red-600"                    className="btn-icon btn-icon-sm hover:bg-red-100 text-gray-400 hover:text-red-600"

                    aria-label="Delete notification"                    aria-label="Delete notification"

                  >                  >

                    <Trash2 className="w-4 h-4" />                    <Trash2 className="w-4 h-4" />

                  </button>                  </button>

                </div>                </div>

              </div>              </div>

            </div>            </div>

          ))}          ))}

        </div>        </div>

      )}      )}

    </div>    </div>

  );  );

}}

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
