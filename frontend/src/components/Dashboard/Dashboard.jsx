import React, { useEffect, useRef, useState } from "react";
import IntegrationConsentModal from "../Integrations/IntegrationConsentModal";
import {
  FaHeart,
  FaStar,
  FaCog,
  FaTrash,
  FaUndo,
  FaSignOutAlt,
} from "react-icons/fa";

// --- Reusable Slider ---
const Slider = ({ value, onChange, min = 0, max = 100, disabled = false }) => (
  <div
    className={`relative w-full h-2 rounded-full bg-gray-300 dark:bg-[#1a1f3c] ${disabled ? "opacity-50" : ""
      }`}
  >
    <div
      className="absolute h-2 rounded-full bg-gradient-to-r from-[#412D15] to-[#6B4B25] dark:from-purple-700 dark:to-purple-400"
      style={{ width: `${((value - min) / (max - min)) * 100}%` }}
    />
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`absolute inset-0 w-full opacity-0 h-2 ${disabled ? "cursor-not-allowed" : "cursor-pointer"
        }`}
    />
    <div
      className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#412D15] dark:bg-purple-400 border-2 border-white shadow-[#412D15] dark:shadow-purple-900 pointer-events-none"
      style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 7px)` }}
    />
  </div>
);

// --- Size Button ---
const SizeBtn = ({ label, active, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-200 text-[10px] ${active
        ? "bg-[#412D15]/60 dark:bg-purple-700/60 border border-[#412D15] dark:border-purple-500 text-white"
        : "bg-[#F5F1E8] dark:bg-[#12172e] border border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600"
      }`}
  >
    <div
      className={`w-6 h-5 rounded border-2 ${active
          ? "border-[#412D15] dark:border-purple-500"
          : "border-gray-400 dark:border-gray-500"
        } flex items-center justify-center`}
    >
      {icon}
    </div>
    <span>{label}</span>
  </button>
);

const defaultTimeZone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const getLocationNameFromTimeZone = (timeZone) => {
  if (timeZone === "UTC") {
    return "UTC";
  }

  return timeZone.split("/").at(-1).replaceAll("_", " ");
};

const getTimeZoneOffsetLabel = (timeZone) => {
  try {
    const timeZoneName = new Intl.DateTimeFormat([], {
      timeZone,
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;

    return timeZoneName ?? "";
  } catch {
    return "";
  }
};

const featuredClockLocations = [
  {
    label: "Local Time",
    timeZone: defaultTimeZone,
    keywords: [defaultTimeZone, getLocationNameFromTimeZone(defaultTimeZone)],
  },
  {
    label: "Vietnam",
    timeZone: "Asia/Ho_Chi_Minh",
    keywords: ["vietnam", "viet nam", "ho chi minh", "hanoi", "saigon"],
  },
  {
    label: "Houston, Texas",
    timeZone: "America/Chicago",
    keywords: ["houston", "texas", "central time", "america chicago"],
  },
  {
    label: "New York",
    timeZone: "America/New_York",
    keywords: ["new york", "eastern time", "usa", "united states"],
  },
  {
    label: "Los Angeles",
    timeZone: "America/Los_Angeles",
    keywords: ["los angeles", "california", "pacific time", "usa"],
  },
  { label: "Bangkok", timeZone: "Asia/Bangkok", keywords: ["thailand"] },
  { label: "Tokyo", timeZone: "Asia/Tokyo", keywords: ["japan"] },
  { label: "Singapore", timeZone: "Asia/Singapore", keywords: ["singapore"] },
  { label: "London", timeZone: "Europe/London", keywords: ["united kingdom", "uk"] },
  { label: "Paris", timeZone: "Europe/Paris", keywords: ["france"] },
  { label: "Sydney", timeZone: "Australia/Sydney", keywords: ["australia"] },
];

const getClockLocations = () => {
  const timeZones =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [
        "UTC",
        "Asia/Ho_Chi_Minh",
        "Asia/Bangkok",
        "Asia/Tokyo",
        "Asia/Singapore",
        "Europe/London",
        "Europe/Paris",
        "America/Chicago",
        "America/New_York",
        "America/Los_Angeles",
        "Australia/Sydney",
      ];

  const generatedLocations = timeZones.map((timeZone) => ({
    label: getLocationNameFromTimeZone(timeZone),
    timeZone,
    keywords: [timeZone],
  }));

  const seenLocations = new Set();

  return [...featuredClockLocations, ...generatedLocations].filter(
    (location) => {
      const key = `${location.label}-${location.timeZone}`;

      if (seenLocations.has(key)) {
        return false;
      }

      seenLocations.add(key);
      return true;
    }
  );
};

const clockLocations = getClockLocations();

const defaultWeatherLocation = {
  label: "Vietnam",
  latitude: 10.8231,
  longitude: 106.6297,
  timezone: "Asia/Ho_Chi_Minh",
};

const featuredWeatherLocations = [
  defaultWeatherLocation,
  {
    label: "Houston, Texas",
    latitude: 29.7604,
    longitude: -95.3698,
    timezone: "America/Chicago",
  },
  {
    label: "New York",
    latitude: 40.7128,
    longitude: -74.006,
    timezone: "America/New_York",
  },
  {
    label: "Bangkok",
    latitude: 13.7563,
    longitude: 100.5018,
    timezone: "Asia/Bangkok",
  },
  {
    label: "Tokyo",
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: "Asia/Tokyo",
  },
  {
    label: "London",
    latitude: 51.5072,
    longitude: -0.1276,
    timezone: "Europe/London",
  },
];

const getWeatherCondition = (code) => {
  if (code === 0) return "Clear";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";

  return "Weather";
};

const getLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCalendarDays = (taskDateKeys = []) => {
  const dates = new Map();
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  [-1, 0, 1].forEach((offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    dates.set(getLocalDateKey(date), date);
  });

  taskDateKeys.forEach((dateKey) => {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (!Number.isNaN(date.getTime())) dates.set(dateKey, date);
  });

  return [...dates.values()].sort((left, right) => left - right).map((date) => {
    const offset = Math.round(
      (new Date(date.getFullYear(), date.getMonth(), date.getDate()) - todayStart) / 86400000
    );
    return {
      key: getLocalDateKey(date),
      dayNumber: date.getDate(),
      isToday: offset === 0,
      isAdjacentDay: Math.abs(offset) === 1,
    };
  });
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const widgetSizeLimits = {
  minWidth: 120,
  minHeight: 90,
  maxWidth: 900,
  maxHeight: 760,
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const defaultWidgetColor = "#C9B5E0";

const normalizeWidget = (widget) => {
  const isTaskManagementWidget = widget.type === "Task Management";

  return {
    width: isTaskManagementWidget ? 480 : 220,
    height: isTaskManagementWidget ? 440 : 140,
    opacity: 100,
    cornerRadius: 16,
    padding: 16,
    color: defaultWidgetColor,
    textColor: "#000000",
    timeZone: defaultTimeZone,
    locationLabel: "Local Time",
    weatherLocation: defaultWeatherLocation,
    tasksByDate: {},
    isFavorite: false,
    isDeleted: false,
    ...widget,
  };
};

const Dashboard = ({ user, onLogout }) => {
  const hasLoadedDashboardState = useRef(false);
  const skipNextDashboardSave = useRef(false);
  const [activeTab, setActiveTab] = useState("layout");
  const [activeSize, setActiveSize] = useState("wide");
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState(null);
  const [showIntegrationConsent, setShowIntegrationConsent] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [activeMenu, setActiveMenu] = useState("My Widgets");


  const [width, setWidth] = useState(220);
  const [height, setHeight] = useState(140);
  const [opacity, setOpacity] = useState(100);
  const [cornerRadius, setCornerRadius] = useState(16);
  const [padding, setPadding] = useState(16);
  const [color, setColor] = useState(defaultWidgetColor);
  const [textColor, setTextColor] = useState("#000000");
  const [clockTimeZone, setClockTimeZone] = useState(defaultTimeZone);
  const [clockLocationSearch, setClockLocationSearch] = useState("");
  const [isClockLocationOpen, setIsClockLocationOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState({});
  const [weatherLocationSearch, setWeatherLocationSearch] = useState("");
  const [weatherLocationResults, setWeatherLocationResults] = useState([]);
  const [isWeatherLocationOpen, setIsWeatherLocationOpen] = useState(false);
  const [isWeatherSearching, setIsWeatherSearching] = useState(false);
  const [calendarTaskInput, setCalendarTaskInput] = useState("");
  const [notionResources, setNotionResources] = useState({});
  const [resizingWidget, setResizingWidget] = useState(null);
  const [permanentlyDeletingWidgetId, setPermanentlyDeletingWidgetId] = useState(null);

  const sizes = [];
  const activeWidgets = widgets.filter((widget) => !widget.isDeleted);
  const favoriteWidgets = widgets.filter(
    (widget) => widget.isFavorite && !widget.isDeleted
  );
  const trashWidgets = widgets.filter((widget) => widget.isDeleted);
  const selectedWidget = widgets.find(
    (widget) => widget.id === selectedWidgetId && !widget.isDeleted
  );
  const clockLocationSearchText = clockLocationSearch.trim().toLowerCase();
  const filteredClockLocations = clockLocations
    .filter((location) => {
      if (!clockLocationSearchText) {
        return featuredClockLocations.some(
          (featuredLocation) =>
            featuredLocation.label === location.label &&
            featuredLocation.timeZone === location.timeZone
        );
      }

      return [location.label, location.timeZone, ...(location.keywords ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(clockLocationSearchText);
    })
    .slice(0, 40);
  const visibleWeatherLocations = weatherLocationSearch.trim()
    ? weatherLocationResults
    : featuredWeatherLocations;
  const notionWidgetIds = widgets
    .filter((widget) => widget.type === "Task Management" && widget.integrations?.notion)
    .map((widget) => widget.id)
    .join(",");

  useEffect(() => {
    const token = localStorage.getItem("notify_token");

    if (!token) {
      console.error("No authentication token found.");
      hasLoadedDashboardState.current = true;
      return;
    }

    fetch(`${API_BASE_URL}/dashboard-state/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load dashboard: ${res.status}`);
        }

        return res.json();
      })
      .then((data) => {
        setWidgets((data.widgets || []).map(normalizeWidget));
      })
      .catch((err) => {
        console.error("Dashboard load failed:", err);
      })
      .finally(() => {
        hasLoadedDashboardState.current = true;
      });
  }, []);

  useEffect(() => {
    if (!hasLoadedDashboardState.current) {
      return;
    }

    if (skipNextDashboardSave.current) {
      skipNextDashboardSave.current = false;
      return;
    }

    const token = localStorage.getItem("notify_token");

    if (!token) {
      console.error("No authentication token found.");
      return;
    }

    // Debounce frequent updates (e.g., dragging opacity and resizing).
    const saveTimer = setTimeout(() => {
      fetch(`${API_BASE_URL}/dashboard-state/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ widgets }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
              `Dashboard save failed: ${response.status} ${errorText}`
            );
          }

          const data = await response.json();
          const serverWidgets = (data.widgets || []).map(normalizeWidget);

          // Sync database IDs back to frontend.
          // Only update state when the IDs actually changed
          // so we don't create an infinite save loop.
          setWidgets((currentWidgets) => {
            const sameIds =
              currentWidgets.length === serverWidgets.length &&
              currentWidgets.every(
                (widget, index) =>
                  widget.id === serverWidgets[index]?.id
              );

            return sameIds ? currentWidgets : serverWidgets;
          });

          console.log("Dashboard saved successfully");
        })
        .catch((err) => {
          console.error("Dashboard save failed:", err);
        });
    }, 350);

    return () => clearTimeout(saveTimer);
  }, [widgets]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!notionWidgetIds) return;

    const token = localStorage.getItem("notify_token");
    if (!token) return;

    let cancelled = false;
    const headers = { Authorization: `Bearer ${token}` };
    const loadNotionData = () => fetch(`${API_BASE_URL}/integrations/notion/status`, { headers })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("status")))
      .then(async (status) => {
        if (!status.connected) return { connected: false, tasksByDate: {} };
        const today = getLocalDateKey(new Date());
        const tasksResponse = await fetch(`${API_BASE_URL}/integrations/notion/tasks?today=${today}`, { headers });
        if (!tasksResponse.ok) throw new Error("Notion data");
        const taskData = await tasksResponse.json();
        return {
          connected: true,
          workspaceName: status.workspace_name,
          tasksByDate: taskData.tasks_by_date || {},
        };
      })
      .then((data) => {
        if (cancelled) return;
        const resources = {
          connected: data.connected,
          workspaceName: data.workspaceName,
          tasksByDate: data.tasksByDate || {},
        };
        setNotionResources((previous) => {
          const next = { ...previous };
          notionWidgetIds.split(",").forEach((id) => { next[id] = resources; });
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) {
          setNotionResources((previous) => {
            const next = { ...previous };
            notionWidgetIds.split(",").forEach((id) => { next[id] = { connected: false, items: [] }; });
            return next;
          });
        }
      });

    loadNotionData();
    const refreshTimer = setInterval(loadNotionData, 60_000);

    return () => {
      cancelled = true;
      clearInterval(refreshTimer);
    };
  }, [notionWidgetIds]);

  useEffect(() => {
    if (!resizingWidget) {
      return undefined;
    }

    const handleMouseMove = (event) => {
      const nextWidth = clamp(
        resizingWidget.startWidth + event.clientX - resizingWidget.startX,
        widgetSizeLimits.minWidth,
        widgetSizeLimits.maxWidth
      );
      const nextHeight = clamp(
        resizingWidget.startHeight + event.clientY - resizingWidget.startY,
        widgetSizeLimits.minHeight,
        widgetSizeLimits.maxHeight
      );

      updateWidgetDimensions(resizingWidget.id, nextWidth, nextHeight);
    };

    const handleMouseUp = () => {
      setResizingWidget(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingWidget]);

  useEffect(() => {
    widgets
      .filter((widget) => widget.type === "Weather" && !widget.isDeleted)
      .forEach((widget) => {
        const location = widget.weatherLocation ?? defaultWeatherLocation;
        const locationKey = `${location.latitude},${location.longitude}`;
        const cachedWeather = weatherData[widget.id];

        if (
          cachedWeather?.locationKey === locationKey &&
          ["loading", "ready", "error"].includes(cachedWeather.status)
        ) {
          return;
        }

        setWeatherData((prev) => ({
          ...prev,
          [widget.id]: {
            locationKey,
            status: "loading",
          },
        }));

        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius&timezone=auto`
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error("Weather request failed");
            }

            return response.json();
          })
          .then((data) => {
            setWeatherData((prev) => ({
              ...prev,
              [widget.id]: {
                locationKey,
                status: "ready",
                current: data.current,
              },
            }));
          })
          .catch(() => {
            setWeatherData((prev) => ({
              ...prev,
              [widget.id]: {
                locationKey,
                status: "error",
              },
            }));
          });
      });
  }, [widgets, weatherData]);

  useEffect(() => {
    const searchText = weatherLocationSearch.trim();

    if (!isWeatherLocationOpen || searchText.length < 2) {
      setWeatherLocationResults([]);
      setIsWeatherSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsWeatherSearching(true);

      fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          searchText
        )}&count=8&language=en&format=json`,
        { signal: controller.signal }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error("Location search failed");
          }

          return response.json();
        })
        .then((data) => {
          setWeatherLocationResults(data.results ?? []);
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            setWeatherLocationResults([]);
          }
        })
        .finally(() => {
          setIsWeatherSearching(false);
        });
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [isWeatherLocationOpen, weatherLocationSearch]);

  const selectWidget = (widget) => {
    setSelectedWidgetId(widget.id);
    setWidth(widget.width);
    setHeight(widget.height);
    setOpacity(widget.opacity ?? 100);
    setCornerRadius(widget.cornerRadius ?? 16);
    setPadding(widget.padding ?? 16);
    setColor(widget.color ?? defaultWidgetColor);
    setTextColor(widget.textColor ?? "#000000");
    setClockTimeZone(widget.timeZone ?? defaultTimeZone);
    setClockLocationSearch("");
    setIsClockLocationOpen(false);
    setWeatherLocationSearch("");
    setIsWeatherLocationOpen(false);
    setCalendarTaskInput("");
  };

  const createWidget = (integrations = []) => {
    const isTaskManagementWidget = selectedWidgetType === "Task Management";
    if (!selectedWidgetType) return;

    const newWidget = {
      id: Date.now(),
      type: selectedWidgetType,
      width: isTaskManagementWidget ? 480 : 220,
      height: isTaskManagementWidget ? 440 : 140,
      opacity: 100,
      cornerRadius: 16,
      padding: 16,
      color: defaultWidgetColor,
      textColor: "#000000",
      timeZone: defaultTimeZone,
      locationLabel: "Local Time",
      weatherLocation: defaultWeatherLocation,
      tasksByDate: {},
      ...(isTaskManagementWidget && {
        integrations: {
          notion: integrations.includes("notion"),
          google_calendar: integrations.includes("google_calendar"),
        },
      }),
      isFavorite: false,
      isDeleted: false,
    };

    setWidgets((prev) => [...prev, newWidget]);
    selectWidget(newWidget);
    setActiveMenu("My Widgets");
    setSelectedWidgetType(null);
    setShowCreateMenu(false);
    setShowIntegrationConsent(false);
    return newWidget;
  };

  const handleIntegrationContinue = async (integrations) => {
    const newWidget = createWidget(integrations);
    if (!newWidget || !integrations.includes("notion")) return;

    const token = localStorage.getItem("notify_token");
    if (!token) {
      window.alert("Your Notify session expired. Sign in again, then connect Notion.");
      return;
    }

    try {
      // Persist the widget before leaving Notify for Notion's authorization page.
      skipNextDashboardSave.current = true;
      const saveResponse = await fetch(`${API_BASE_URL}/dashboard-state/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ widgets: [...widgets, newWidget] }),
      });
      if (!saveResponse.ok) throw new Error("Could not save the Task Management Widget.");

      const savedDashboard = await saveResponse.json();
      setWidgets((savedDashboard.widgets || []).map(normalizeWidget));

      const authResponse = await fetch(`${API_BASE_URL}/integrations/notion/authorize-url`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!authResponse.ok) {
        const error = await authResponse.json().catch(() => ({}));
        throw new Error(error.detail || "Could not start Notion authorization.");
      }

      const { authorization_url: authorizationUrl } = await authResponse.json();
      window.location.assign(authorizationUrl);
    } catch (error) {
      skipNextDashboardSave.current = false;
      setWidgets((current) => [...current]);
      window.alert(error.message || "Could not connect to Notion.");
    }
  };

  // Update one widget in React state. Changes are persisted by the
  // dashboard-state effect below, including soft deletion into Trash.
  // Accept both a partial object and a callback for calendar task updates.
  const updateWidget = (widgetId, changes) => {
    setWidgets((previousWidgets) =>
      previousWidgets.map((widget) => {
        if (widget.id !== widgetId) return widget;

        const updatedFields =
          typeof changes === "function" ? changes(widget) : changes;
        return { ...widget, ...updatedFields };
      })
    );
  };

  const permanentlyDeleteWidget = async (widgetId) => {
    const token = localStorage.getItem("notify_token");
    if (!token) {
      window.alert("Your Notify session expired. Sign in again and retry.");
      return;
    }

    const remainingWidgets = widgets.filter((widget) => widget.id !== widgetId);
    setPermanentlyDeletingWidgetId(widgetId);

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard-state/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ widgets: remainingWidgets }),
      });

      if (!response.ok) {
        throw new Error("Could not permanently delete this widget.");
      }

      const data = await response.json();
      setWidgets((data.widgets || []).map(normalizeWidget));
      if (selectedWidgetId === widgetId) setSelectedWidgetId(null);
    } catch (error) {
      window.alert(error.message || "Could not permanently delete this widget.");
    } finally {
      setPermanentlyDeletingWidgetId(null);
    }
  };

  const updateWidgetDimensions = (widgetId, nextWidth, nextHeight) => {
    const clampedWidth = Math.round(
      clamp(nextWidth, widgetSizeLimits.minWidth, widgetSizeLimits.maxWidth)
    );
    const clampedHeight = Math.round(
      clamp(nextHeight, widgetSizeLimits.minHeight, widgetSizeLimits.maxHeight)
    );

    updateWidget(widgetId, { width: clampedWidth, height: clampedHeight });

    if (selectedWidgetId === widgetId) {
      setWidth(clampedWidth);
      setHeight(clampedHeight);
    }
  };

  const startWidgetResize = (event, widget) => {
    event.preventDefault();
    event.stopPropagation();
    selectWidget(widget);
    setResizingWidget({
      id: widget.id,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: widget.width,
      startHeight: widget.height,
    });
  };

  const renderResizeHandle = (widget) => (
    <button
      type="button"
      onMouseDown={(event) => startWidgetResize(event, widget)}
      className="absolute bottom-2 right-2 z-20 h-6 w-6 cursor-se-resize rounded-md bg-white/20 text-white/80 backdrop-blur-sm hover:bg-white/30"
      aria-label="Resize widget"
    >
      <span className="absolute bottom-1 right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-current" />
    </button>
  );

  const updateSelectedWidgetSize = (dimension, value) => {
    const nextValue = Math.max(1, Number(value) || 1);

    if (!selectedWidgetId) {
      if (dimension === "width") {
        setWidth(nextValue);
      } else {
        setHeight(nextValue);
      }

      return;
    }

    updateWidgetDimensions(
      selectedWidgetId,
      dimension === "width" ? nextValue : width,
      dimension === "height" ? nextValue : height
    );
  };

  const updateSelectedWidgetPadding = (value) => {
    const nextPadding = Math.round(clamp(Number(value) || 0, 0, 40));
    setPadding(nextPadding);
    if (selectedWidgetId) {
      updateWidget(selectedWidgetId, { padding: nextPadding });
    }
  };

  const updateSelectedWidgetAppearance = (property, value) => {
    if (!selectedWidgetId) {
      return;
    }

    if (property === "opacity") {
      setOpacity(value);
    }

    if (property === "cornerRadius") {
      setCornerRadius(value);
    }

    if (property === "color") {
      setColor(value);
    }

    if (property === "textColor") {
      setTextColor(value);
    }

    if (property === "timeZone") {
      setClockTimeZone(value);
    }

    updateWidget(selectedWidgetId, { [property]: value });
  };

  const updateSelectedClockLocation = (location) => {
    if (!selectedWidgetId) {
      return;
    }

    setClockTimeZone(location.timeZone);
    setClockLocationSearch("");
    setIsClockLocationOpen(false);

    updateWidget(selectedWidgetId, {
      timeZone: location.timeZone,
      locationLabel: location.label,
    });
  };

  const updateSelectedWeatherLocation = (location) => {
    if (!selectedWidgetId) {
      return;
    }

    const nextLocation = {
      label: `${location.name ?? location.label}${location.admin1 ? `, ${location.admin1}` : ""
        }`,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone,
    };

    setWeatherLocationSearch("");
    setWeatherLocationResults([]);
    setIsWeatherLocationOpen(false);
    setWeatherData((prev) => ({
      ...prev,
      [selectedWidgetId]: undefined,
    }));

    updateWidget(selectedWidgetId, { weatherLocation: nextLocation });
  };

  const addCalendarTask = (widgetId) => {
    const taskText = calendarTaskInput.trim();

    if (!taskText) {
      return;
    }

    const todayKey = getLocalDateKey(new Date());

    const addTaskToWidget = (widget) => {
      const tasksByDate = widget.tasksByDate ?? {};
      const todaysTasks = tasksByDate[todayKey] ?? [];

      return {
        ...widget,
        tasksByDate: {
          ...tasksByDate,
          [todayKey]: [...todaysTasks, { id: Date.now(), text: taskText, completed: false }],
        },
      };
    };

    updateWidget(widgetId, addTaskToWidget);

    setCalendarTaskInput("");
  };

  const toggleCalendarTask = (widgetId, dateKey, taskIndex, completed) => {
    updateWidget(widgetId, (widget) => {
      const tasksByDate = widget.tasksByDate ?? {};
      const tasks = [...(tasksByDate[dateKey] ?? [])];
      const task = tasks[taskIndex];
      tasks[taskIndex] = typeof task === "string"
        ? { text: task, completed }
        : { ...task, completed };
      return { ...widget, tasksByDate: { ...tasksByDate, [dateKey]: tasks } };
    });
  };

  const toggleNotionTask = async (widgetId, task, completed) => {
    const token = localStorage.getItem("notify_token");
    const updateTaskInState = (isCompleted) => {
      setNotionResources((previous) => {
        const current = previous[widgetId];
        if (!current) return previous;
        const tasksByDate = { ...current.tasksByDate };
        tasksByDate[task.date] = (tasksByDate[task.date] ?? []).map((item) =>
          item.id === task.id ? { ...item, completed: isCompleted } : item
        );
        return { ...previous, [widgetId]: { ...current, tasksByDate } };
      });
    };

    updateTaskInState(completed);
    try {
      const response = await fetch(
        `${API_BASE_URL}/integrations/notion/tasks/${encodeURIComponent(task.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ completed }),
        }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Could not update the Notion task.");
      }
    } catch (error) {
      updateTaskInState(!completed);
      window.alert(error.message || "Could not update the Notion task.");
    }
  };

  const removeCalendarTask = (widgetId, dateKey, taskIndex) => {
    const removeTaskFromWidget = (widget) => {
      const tasksByDate = widget.tasksByDate ?? {};
      const nextTasks = (tasksByDate[dateKey] ?? []).filter(
        (_, index) => index !== taskIndex
      );

      return {
        ...widget,
        tasksByDate: {
          ...tasksByDate,
          [dateKey]: nextTasks,
        },
      };
    };

    updateWidget(widgetId, removeTaskFromWidget);
  };

  const getWidgetStyle = (widget) => ({
    width: `${widget.width}px`,
    height: `${widget.height}px`,
    opacity: (widget.opacity ?? 100) / 100,
    borderRadius: `${widget.cornerRadius ?? 16}px`,
    padding: `${widget.padding ?? 16}px`,
    backgroundColor: widget.color ?? defaultWidgetColor,
    color: widget.textColor ?? "#000000",
  });

  const getWidgetContentScale = (widget) => {
    if (widget.type === "Task Management") {
      return 1;
    }

    const widthScale = (widget.width ?? 220) / 220;
    const heightScale = (widget.height ?? 140) / 140;

    return clamp(Math.min(widthScale, heightScale), 0.55, 1.8);
  };

  const renderScaledWidgetContent = (widget) => {
    const scale = getWidgetContentScale(widget);

    return (
      <div className="relative z-0 h-full w-full overflow-hidden">
        <div
          className="h-full w-full origin-top-left"
          style={{
            transform: `scale(${scale})`,
            width: `${100 / scale}%`,
            height: `${100 / scale}%`,
          }}
        >
          {renderWidgetContent(widget)}
        </div>
      </div>
    );
  };

  const renderWidgetContent = (widget) => {
    if (widget.type === "Task Management") {
      const currentMonth = new Date().toLocaleDateString([], { month: "short" });
      const tasksByDate = widget.tasksByDate ?? {};
      const notionTasksByDate = notionResources[widget.id]?.tasksByDate ?? {};
      const calendarDays = getCalendarDays([
        ...Object.entries(tasksByDate)
          .filter(([, tasks]) => tasks.length > 0)
          .map(([dateKey]) => dateKey),
        ...Object.keys(notionTasksByDate),
      ]);

      return (
        <div className="flex h-full flex-col overflow-hidden font-serif">
          <h2 className="text-3xl font-bold leading-none text-current">
            Tasks
          </h2>

          <div className="mt-6 flex min-h-0 flex-1 flex-col rounded-[24px] bg-[#f1efec] p-5" style={{ color: widget.textColor ?? "#000000" }}>
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold leading-none">{currentMonth}</h3>
                {widget.integrations?.notion && notionResources[widget.id]?.connected && (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-medium text-green-800">
                    Notion connected
                  </span>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {calendarDays.map((day, index) => {
                const localTasks = (tasksByDate[day.key] ?? []).map((task, taskIndex) => ({
                  text: typeof task === "string" ? task : task.text,
                  completed: typeof task === "string" ? false : Boolean(task.completed),
                  source: "local",
                  taskIndex,
                }));
                const notionTasks = notionTasksByDate[day.key] ?? [];
                const notionPages = Array.from(
                  new Map(
                    notionTasks
                      .filter((task) => task.page_url)
                      .map((task) => [task.page_url, task])
                  ).values()
                );

                return (
                  <div
                    key={day.key}
                    className={`grid grid-cols-[52px_1fr] gap-4 py-3 ${index !== calendarDays.length - 1
                        ? "border-b border-black/10"
                        : ""
                      }`}
                  >
                    <div>
                      <div className={day.isToday
                        ? "text-4xl font-extrabold leading-none text-[#412D15]"
                        : `text-3xl font-bold leading-none ${day.isAdjacentDay ? "opacity-70" : ""}`}>
                        {day.dayNumber}
                      </div>
                    </div>

                    <div className="pt-3">
                      {(day.isToday ? notionTasks.length === 0 : notionPages.length === 0) && localTasks.length === 0 ? (
                        <div className={`py-2 font-medium text-gray-500 ${day.isToday ? "text-base" : "text-sm"}`}>
                          No task scheduled
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {!day.isToday && notionPages.map((page) => (
                            <a
                              key={`${day.key}-notion-${page.page_url}`}
                              href={page.page_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title={`Open ${page.page_title} in Notion`}
                              className={`flex items-center justify-between rounded-xl bg-white font-medium text-blue-700 hover:underline ${day.isToday ? "min-h-[54px] px-4 py-3 text-base" : "min-h-[42px] px-3 py-2 text-sm"}`}
                            >
                              View tasks <span aria-hidden="true">↗</span>
                            </a>
                          ))}
                          {day.isToday && notionTasks.map((task) => (
                            <div
                              key={`${day.key}-notion-${task.id}`}
                              className={`flex min-h-[54px] items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-base font-medium ${task.completed ? "text-gray-400 line-through" : ""}`}
                            >
                              <span className="min-w-0 flex-1">{task.text}</span>
                              {task.page_url && (
                                <a
                                  href={task.page_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  title={`Open ${task.page_title} in Notion`}
                                  className="shrink-0 text-[10px] font-medium text-blue-700 hover:underline"
                                >
                                  Notion
                                </a>
                              )}
                              <input
                                type="checkbox"
                                checked={Boolean(task.completed)}
                                aria-label={`Mark ${task.text} ${task.completed ? "incomplete" : "complete"}`}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => toggleNotionTask(widget.id, task, e.target.checked)}
                                className="h-4 w-4 shrink-0 cursor-pointer accent-green-600"
                              />
                            </div>
                          ))}
                          {localTasks.map((task) => (
                            <div
                              key={`${day.key}-local-${task.taskIndex}`}
                              className={`flex items-center justify-between gap-3 rounded-xl bg-white font-medium ${day.isToday ? "min-h-[54px] px-4 py-3 text-base" : "min-h-[42px] px-3 py-2 text-sm"} ${task.completed ? "text-gray-400 line-through" : ""}`}
                            >
                              <span className="min-w-0 flex-1">{task.text}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCalendarTask(
                                    widget.id,
                                    day.key,
                                    task.taskIndex
                                  );
                                }}
                                className="shrink-0 text-lg font-light leading-none text-gray-400 hover:text-gray-600"
                              >
                                ×
                              </button>
                              <input
                                type="checkbox"
                                checked={Boolean(task.completed)}
                                aria-label={`Mark ${task.text} ${task.completed ? "incomplete" : "complete"}`}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const completed = e.target.checked;
                                  toggleCalendarTask(widget.id, day.key, task.taskIndex, completed);
                                }}
                                className="h-4 w-4 shrink-0 cursor-pointer accent-green-600"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={selectedWidgetId === widget.id ? calendarTaskInput : ""}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setCalendarTaskInput(e.target.value)}
                placeholder="Add today's tasks"
                className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-base outline-none"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addCalendarTask(widget.id);
                }}
                className="rounded-xl bg-black px-5 py-2 text-lg font-bold text-white"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (widget.type === "Weather") {
      const location = widget.weatherLocation ?? defaultWeatherLocation;
      const weather = weatherData[widget.id];
      const current = weather?.current;

      if (!weather || weather.status === "loading") {
        return (
          <div className="flex h-full flex-col justify-center pr-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-current opacity-70">
              {location.label}
            </span>
            <span className="mt-2 text-lg font-bold">Loading weather</span>
          </div>
        );
      }

      if (weather?.status === "error") {
        return (
          <div className="flex h-full flex-col justify-center pr-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-current opacity-70">
              {location.label}
            </span>
            <span className="mt-2 text-lg font-bold">Weather unavailable</span>
          </div>
        );
      }

      return (
        <div className="flex h-full flex-col justify-center pr-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-current opacity-70">
            {location.label}
          </span>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-4xl font-bold leading-none tabular-nums">
              {Math.round(current?.temperature_2m ?? 0)}°
            </span>
            <span className="pb-1 text-xs font-semibold text-current opacity-75">C</span>
          </div>
          <span className="mt-2 text-xs font-medium text-current opacity-80">
            {getWeatherCondition(current?.weather_code)}
          </span>
          <span className="mt-1 text-[11px] font-medium text-current opacity-65">
            H {current?.relative_humidity_2m ?? "--"}% · Wind{" "}
            {Math.round(current?.wind_speed_10m ?? 0)} km/h
          </span>
        </div>
      );
    }

    if (widget.type !== "Clock") {
      return <h2 className="font-bold">{widget.type}</h2>;
    }

    const timeZone = widget.timeZone ?? defaultTimeZone;
    const locationLabel =
      widget.locationLabel ??
      clockLocations.find((location) => location.timeZone === timeZone)
        ?.label ?? timeZone;

    return (
      <div className="flex h-full flex-col justify-center pr-12">
        <span className="text-xs font-semibold uppercase tracking-wider text-current opacity-70">
          {locationLabel}
        </span>
        <span className="mt-1 text-4xl font-bold leading-none tabular-nums">
          {currentTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            timeZone,
          })}
        </span>
        <span className="mt-2 text-xs font-medium text-current opacity-75">
          {currentTime.toLocaleDateString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone,
          })}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-primary dark:bg-[#0d1126] p-4 flex justify-center">
      <div className="w-full h-[90vh] bg-white dark:bg-secondary rounded-[20px] shadow-2xl flex overflow-hidden border border-[#EAE4D5] dark:border-[#1e2445]">

        {/* SIDEBAR */}
        <div className="w-[180px] bg-[#FBF5DD] dark:bg-secondarybackground p-2 flex flex-col gap-1 border-r border-[#EAE4D5] dark:border-[#1e2445]">
          <div className="flex flex-col h-full gap-1">
            <div className="relative">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#412D15] dark:bg-purple-600 text-white text-sm font-medium hover:opacity-90 transition-all"
              >
                <span className="text-lg leading-none">+</span>
                <span>Create Widget</span>
              </button>

              {showCreateMenu && (
                <div className="mt-2 w-full rounded-2xl bg-white dark:bg-[#0f1428] border border-[#EAE4D5] dark:border-[#1e2445] overflow-hidden shadow-2xl z-50">

                  {[
                    "Task Management",
                    "Clock",
                    "Weather",
                    "Notes",
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setSelectedWidgetType(item);
                        if (item === "Task Management") {
                          setShowIntegrationConsent(true);
                          setShowCreateMenu(false);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left
                  text-gray-700 dark:text-gray-300
                  hover:bg-[#F5F1E8] dark:hover:bg-[#151b35]
                  transition-colors
                  ${selectedWidgetType === item
                          ? "bg-[#EAE4D5] dark:bg-[#151b35]"
                          : ""
                        }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border ${selectedWidgetType === item
                            ? "bg-[#412D15] dark:bg-purple-500 border-white"
                            : "border-current"
                          }`}
                      />
                      <span>{item}</span>
                    </button>
                  ))}
                  <div className="p-2 border-t border-[#EAE4D5] dark:border-[#1e2445]">
                    <button
                      disabled={!selectedWidgetType}
                      onClick={() => {
                        if (selectedWidgetType === "Task Management") {
                          setShowIntegrationConsent(true);
                          setShowCreateMenu(false);
                          return;
                        }

                        createWidget();
                      }}
                      className="w-full p-2 rounded-xl bg-[#412D15] dark:bg-purple-600 text-white text-sm disabled:opacity-50"
                    >
                      Add Widget
                    </button>
                  </div>
                </div>
              )}
            </div>

            {[
              { icon: <FaStar />, label: "My Widgets" },
              { icon: <FaHeart />, label: "Favorites" },
              { icon: <FaTrash />, label: "Trash" },
            ].map(({ icon, label }) => (
              <button
                key={label}
                onClick={() => setActiveMenu(label)}
                className={`flex items-center gap-3 p-4 rounded-2xl duration-200 text-sm
                      ${activeMenu === label
                    ? "bg-[#EAE4D5] dark:bg-[#202554] text-black dark:text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-[#EAE4D5] dark:hover:bg-[#151b35] hover:text-black dark:hover:text-white"
                  }
                    `}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
            <div className="mt-auto flex flex-col gap-1">
              <button
                onClick={() => setActiveMenu("Settings")}
                className={`flex items-center gap-3 p-4 rounded-2xl duration-200 text-sm ${activeMenu === "Settings"
                    ? "bg-[#EAE4D5] dark:bg-[#202554] text-black dark:text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-[#EAE4D5] dark:hover:bg-[#151b35] hover:text-black dark:hover:text-white"
                  }`}
              >
                <FaCog />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 bg-[#FFFDF7] dark:bg-[#0f1428] p-6 overflow-auto">
          {activeMenu === "My Widgets" && (
            <div className="flex flex-wrap gap-4">

              {activeWidgets.map((widget) => {
                return (
                  <div
                    key={widget.id}
                    onClick={() => selectWidget(widget)}
                    style={getWidgetStyle(widget)}
                    className={`relative rounded-2xl text-white cursor-pointer transition-all ${selectedWidgetId === widget.id
                        ? "ring-2 ring-[#C8A46A] dark:ring-purple-300"
                        : "ring-0"
                      }`}
                  >
                    {/* ACTION BUTTONS */}
                    <div className="absolute top-2 right-2 z-30 flex items-center gap-2">

                      {/* FAVORITE */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateWidget(widget.id, {
                            isFavorite: !widget.isFavorite,
                          });
                        }}
                        className={`relative z-30 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all
                    ${widget.isFavorite
                            ? "bg-red-500 text-white"
                            : "bg-black/20 hover:bg-black/40 text-white"
                          }`}
                      >
                        <FaHeart />
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateWidget(widget.id, {
                            isDeleted: true,
                            isFavorite: false,
                          });

                          if (selectedWidgetId === widget.id) {
                            setSelectedWidgetId(null);
                          }
                        }}
                        type="button"
                        aria-label="Move widget to Trash"
                        title="Move to Trash"
                        className="relative z-30 w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-xs text-white"
                      >
                        <FaTrash />
                      </button>
                    </div>

                    {renderScaledWidgetContent(widget)}
                    {renderResizeHandle(widget)}
                  </div>
                );
              })}

            </div>
          )}

          {activeMenu === "Favorites" && (
            <div className="flex flex-wrap gap-4">

              {favoriteWidgets.map((widget) => (
                <div
                  key={widget.id}
                  onClick={() => selectWidget(widget)}
                  style={getWidgetStyle(widget)}
                  className={`relative rounded-2xl text-white cursor-pointer transition-all ${selectedWidgetId === widget.id
                      ? "ring-2 ring-[#C8A46A] dark:ring-purple-300"
                      : "ring-0"
                    }`}
                >
                  {/* REMOVE FROM FAVORITES */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();

                      updateWidget(widget.id, {
                        isFavorite: false,
                      });
                    }}
                    className="absolute top-2 right-2 z-30 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs transition-all"
                    aria-label="Remove from favorites"
                  >
                    <FaHeart />
                  </button>

                  {renderScaledWidgetContent(widget)}
                  {renderResizeHandle(widget)}
                </div>
              ))}

            </div>
          )}
          {activeMenu === "Trash" && (
            <div className="flex flex-wrap gap-4">

              {trashWidgets.map((widget) => (
                <div
                  key={widget.id}
                  style={getWidgetStyle(widget)}
                  className="relative rounded-2xl text-white opacity-70"
                >
                  <div className="absolute right-2 top-2 z-30 flex items-center gap-1 rounded-xl border border-white/50 bg-white/75 p-1 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-[#151b35]/80">
                    <button
                      type="button"
                      onClick={() => updateWidget(widget.id, { isDeleted: false })}
                      className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#55406B] transition-colors hover:bg-[#EEE5F6] dark:text-purple-200 dark:hover:bg-purple-400/15"
                      aria-label={`Restore ${widget.title || widget.type}`}
                    >
                      <FaUndo className="text-[11px]" />
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => permanentlyDeleteWidget(widget.id)}
                      disabled={permanentlyDeletingWidgetId === widget.id}
                      className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#8B4B57] transition-colors hover:bg-[#F8E9EB] disabled:cursor-wait disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-400/15"
                      aria-label={`Delete ${widget.title || widget.type} permanently`}
                    >
                      <FaTrash className="text-[11px]" />
                      {permanentlyDeletingWidgetId === widget.id ? "Deleting..." : "Delete permanently"}
                    </button>
                  </div>
                  {renderScaledWidgetContent(widget)}
                </div>
              ))}

            </div>
          )}

          {activeMenu === "Settings" && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-white dark:bg-[#0f1428] border border-[#EAE4D5] dark:border-[#1e2445] p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-3xl bg-[#412D15] dark:bg-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Thông tin của tôi
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Thông tin tài khoản hiện tại.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 text-sm text-gray-700 dark:text-gray-200">
                  <div className="grid gap-1 rounded-2xl bg-[#F5F1E8] dark:bg-[#111626] p-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Tên</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {user?.name ?? "Người dùng"}
                    </span>
                  </div>
                  <div className="grid gap-1 rounded-2xl bg-[#F5F1E8] dark:bg-[#111626] p-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Email</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {user?.email ?? "chưa có email"}
                    </span>
                  </div>
                  {user?.role && (
                    <div className="grid gap-1 rounded-2xl bg-[#F5F1E8] dark:bg-[#111626] p-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Vai trò</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.role}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="w-full rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 py-4 font-semibold transition hover:bg-red-100 dark:hover:bg-red-900"
              >
                <div className="inline-flex items-center gap-2 justify-center">
                  <FaSignOutAlt />
                  Đăng xuất
                </div>
              </button>
            </div>
          )}

        </div>

        {/* RIGHT PANEL */}
        <div className="w-[220px] bg-[#FBF5DD] dark:bg-[#0a0e20] border-l border-[#EAE4D5] dark:border-[#1e2445] flex flex-col text-black dark:text-white overflow-y-auto">

          {/* Tabs */}
          <div className="flex border-b border-[#EAE4D5] dark:border-[#1e2445]">
            {["layout"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-widest transition-colors ${activeTab === tab
                    ? "text-[#412D15] dark:text-purple-400 border-b-2 border-[#412D15] dark:border-purple-500"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4 flex flex-col gap-5">

            {/* SIZE */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                  Size
                </span>

                <svg
                  className="w-3 h-3 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              <div className="grid grid-cols-4 gap-1 mb-3">
                {sizes.map(({ key, label, icon }) => (
                  <SizeBtn
                    key={key}
                    label={label}
                    active={activeSize === key}
                    onClick={() => setActiveSize(key)}
                    icon={icon}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <div className="flex-1 bg-[#F5F1E8] dark:bg-[#12172e] rounded-lg px-3 py-2 flex items-center gap-1">
                  <span className="text-gray-500 text-xs">W</span>

                  <input
                    type="number"
                    value={width}
                    min={widgetSizeLimits.minWidth}
                    max={widgetSizeLimits.maxWidth}
                    disabled={!selectedWidgetId}
                    onChange={(e) =>
                      updateSelectedWidgetSize("width", e.target.value)
                    }
                    className="appearance-none bg-transparent text-black dark:text-white text-xs w-full outline-none"
                  />
                </div>

                <div className="flex-1 bg-[#F5F1E8] dark:bg-[#12172e] rounded-lg px-3 py-2 flex items-center gap-1">
                  <span className="text-gray-500 text-xs">H</span>

                  <input
                    type="number"
                    value={height}
                    min={widgetSizeLimits.minHeight}
                    max={widgetSizeLimits.maxHeight}
                    disabled={!selectedWidgetId}
                    onChange={(e) =>
                      updateSelectedWidgetSize("height", e.target.value)
                    }
                    className="bg-transparent text-black dark:text-white text-xs w-full outline-none"
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Content spacing
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {padding}px
                  </span>
                </div>
                <Slider
                  value={padding}
                  min={0}
                  max={40}
                  disabled={!selectedWidgetId}
                  onChange={updateSelectedWidgetPadding}
                />
              </div>
            </section>

            <div className="border-t border-[#EAE4D5] dark:border-[#1e2445]" />

            {selectedWidget?.type === "Clock" && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Location
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsClockLocationOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg bg-[#F5F1E8] px-3 py-2 text-left text-xs text-black outline-none dark:bg-[#12172e] dark:text-white"
                >
                  <span className="truncate">
                    {selectedWidget.locationLabel ?? "Local Time"}
                  </span>
                  <span className="shrink-0 text-[10px] text-gray-500 dark:text-gray-400">
                    {isClockLocationOpen ? "Close" : "Change"}
                  </span>
                </button>

                {isClockLocationOpen && (
                  <div className="mt-2 rounded-xl border border-[#EAE4D5] bg-white p-2 dark:border-[#1e2445] dark:bg-[#0f1428]">
                    <input
                      type="search"
                      value={clockLocationSearch}
                      onChange={(e) => setClockLocationSearch(e.target.value)}
                      placeholder="Search country or city"
                      className="mb-2 w-full rounded-lg bg-[#F5F1E8] px-3 py-2 text-xs text-black outline-none placeholder:text-gray-400 dark:bg-[#12172e] dark:text-white"
                    />

                    <div className="max-h-40 overflow-y-auto">
                      {filteredClockLocations.length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                          No locations found
                        </div>
                      )}

                      {filteredClockLocations.map((location) => {
                        const isSelected =
                          clockTimeZone === location.timeZone &&
                          (selectedWidget.locationLabel ?? "Local Time") ===
                          location.label;

                        return (
                          <button
                            key={`${location.label}-${location.timeZone}`}
                            type="button"
                            onClick={() => updateSelectedClockLocation(location)}
                            className={`mb-1 flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors last:mb-0 ${isSelected
                                ? "bg-[#EAE4D5] text-black dark:bg-[#202554] dark:text-white"
                                : "text-gray-700 hover:bg-[#F5F1E8] dark:text-gray-300 dark:hover:bg-[#151b35]"
                              }`}
                          >
                            <span className="font-medium">
                              {location.label}
                            </span>
                            <span className="shrink-0 text-[10px] text-gray-500 dark:text-gray-400">
                              {getTimeZoneOffsetLabel(location.timeZone)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            )}

            {selectedWidget?.type === "Weather" && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Weather Location
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsWeatherLocationOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg bg-[#F5F1E8] px-3 py-2 text-left text-xs text-black outline-none dark:bg-[#12172e] dark:text-white"
                >
                  <span className="truncate">
                    {(selectedWidget.weatherLocation ?? defaultWeatherLocation)
                      .label}
                  </span>
                  <span className="shrink-0 text-[10px] text-gray-500 dark:text-gray-400">
                    {isWeatherLocationOpen ? "Close" : "Change"}
                  </span>
                </button>

                {isWeatherLocationOpen && (
                  <div className="mt-2 rounded-xl border border-[#EAE4D5] bg-white p-2 dark:border-[#1e2445] dark:bg-[#0f1428]">
                    <input
                      type="search"
                      value={weatherLocationSearch}
                      onChange={(e) => setWeatherLocationSearch(e.target.value)}
                      placeholder="Search city or country"
                      className="mb-2 w-full rounded-lg bg-[#F5F1E8] px-3 py-2 text-xs text-black outline-none placeholder:text-gray-400 dark:bg-[#12172e] dark:text-white"
                    />

                    <div className="max-h-40 overflow-y-auto">
                      {isWeatherSearching && (
                        <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                          Searching...
                        </div>
                      )}

                      {!isWeatherSearching &&
                        visibleWeatherLocations.length === 0 && (
                          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                            No locations found
                          </div>
                        )}

                      {!isWeatherSearching &&
                        visibleWeatherLocations.map((location) => {
                          const locationLabel = `${location.name ?? location.label}${location.admin1 ? `, ${location.admin1}` : ""
                            }`;
                          const isSelected =
                            (selectedWidget.weatherLocation ?? defaultWeatherLocation)
                              .label === locationLabel;

                          return (
                            <button
                              key={`${locationLabel}-${location.latitude}-${location.longitude}`}
                              type="button"
                              onClick={() => updateSelectedWeatherLocation(location)}
                              className={`mb-1 flex w-full flex-col rounded-md px-2 py-2 text-left text-xs transition-colors last:mb-0 ${isSelected
                                  ? "bg-[#EAE4D5] text-black dark:bg-[#202554] dark:text-white"
                                  : "text-gray-700 hover:bg-[#F5F1E8] dark:text-gray-300 dark:hover:bg-[#151b35]"
                                }`}
                            >
                              <span className="font-medium">{locationLabel}</span>
                              <span className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                                {location.country ?? location.timezone}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </section>
            )}

            {(selectedWidget?.type === "Clock" ||
              selectedWidget?.type === "Weather") && (
                <div className="border-t border-[#EAE4D5] dark:border-[#1e2445]" />
              )}

            {/* APPEARANCE */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                  Appearance
                </span>
              </div>

              {/* Opacity */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Opacity
                  </span>

                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {opacity}%
                  </span>
                </div>

                <Slider
                  value={opacity}
                  onChange={(value) =>
                    updateSelectedWidgetAppearance("opacity", value)
                  }
                  min={0}
                  max={100}
                  disabled={!selectedWidgetId}
                />
              </div>

              {/* Corner Radius */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Corner Radius
                  </span>

                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {cornerRadius}px
                  </span>
                </div>

                <Slider
                  value={cornerRadius}
                  onChange={(value) =>
                    updateSelectedWidgetAppearance("cornerRadius", value)
                  }
                  min={0}
                  max={40}
                  disabled={!selectedWidgetId}
                />
              </div>

              {/* Background Color */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Background color
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-[#F5F1E8] p-2 dark:bg-[#12172e]">
                  <input
                    type="color"
                    value={color}
                    disabled={!selectedWidgetId}
                    onChange={(e) =>
                      updateSelectedWidgetAppearance("color", e.target.value)
                    }
                    className="h-9 w-12 cursor-pointer rounded border border-[#EAE4D5] bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#1e2445]"
                  />

                  <input
                    type="text"
                    value={color}
                    disabled={!selectedWidgetId}
                    onChange={(e) =>
                      updateSelectedWidgetAppearance("color", e.target.value)
                    }
                    className="w-full bg-transparent text-xs text-black outline-none disabled:opacity-50 dark:text-white"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Text color
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-[#F5F1E8] p-2 dark:bg-[#12172e]">
                  <input
                    type="color"
                    value={textColor}
                    disabled={!selectedWidgetId}
                    onChange={(e) =>
                      updateSelectedWidgetAppearance("textColor", e.target.value)
                    }
                    className="h-9 w-12 cursor-pointer rounded border border-[#EAE4D5] bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#1e2445]"
                    aria-label="Choose widget text color"
                  />

                  <input
                    type="text"
                    value={textColor}
                    disabled={!selectedWidgetId}
                    onChange={(e) =>
                      updateSelectedWidgetAppearance("textColor", e.target.value)
                    }
                    className="w-full bg-transparent text-xs text-black outline-none disabled:opacity-50 dark:text-white"
                    aria-label="Widget text color hex value"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      <IntegrationConsentModal
        isOpen={showIntegrationConsent}
        onContinue={handleIntegrationContinue}
        onSkip={() => createWidget([])}
      />
    </div>
  );
};

export default Dashboard;
