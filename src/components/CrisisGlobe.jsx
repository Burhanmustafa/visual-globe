import { useEffect, useState, useRef } from 'react';
import Globe from 'react-globe.gl';

const EarthquakeGlobe = () => {
    const [earthquakes, setEarthquakes] = useState([]);
    const [filteredEarthquakes, setFilteredEarthquakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState(null);
    const [globeReady, setGlobeReady] = useState(false);
    const [hoveredEarthquake, setHoveredEarthquake] = useState(null);
    const [lightMode, setLightMode] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationIndex, setAnimationIndex] = useState(0);
    
    // Filter states
    const [filters, setFilters] = useState({
        minMagnitude: 4.5,
        maxMagnitude: 10.0,
        startDate: '',
        endDate: '',
        region: 'all',
        searchTerm: ''
    });
    
    const globeRef = useRef();
    const animationRef = useRef();

    // Geographic regions for filtering
    const regions = {
        'all': 'All Regions',
        'pacific-ring': 'Pacific Ring of Fire',
        'americas': 'Americas',
        'asia-pacific': 'Asia Pacific', 
        'europe-africa': 'Europe & Africa',
        'atlantic': 'Atlantic Region'
    };

    // Magnitude to color mapping
    const getMagnitudeColor = (magnitude) => {
        if (magnitude >= 7) return '#ff0000'; // Red - Major
        if (magnitude >= 6) return '#ff4500'; // Orange Red - Strong  
        if (magnitude >= 5) return '#ff8c00'; // Dark Orange - Moderate
        if (magnitude >= 4) return '#ffd700'; // Gold - Light
        return '#90ee90'; // Light Green - Minor
    };

    // Magnitude to size mapping (tripled)
    const getMagnitudeSize = (magnitude) => {
        return Math.max(0.15, magnitude * 0.15); // Much larger points
    };

    // Dynamic elevation based on hover state
    const getElevation = (earthquake) => {
        if (!earthquake) return 0;
        
        if (hoveredEarthquake && hoveredEarthquake.id === earthquake.id) {
            // Show full height when hovered
            return Math.max(0.02, earthquake.magnitude * 0.02);
        }
        
        // Flat when not hovered
        return 0;
    };

    // Check if earthquake is in selected region
    const isInRegion = (earthquake, region) => {
        if (region === 'all') return true;
        
        const { lat, lng } = earthquake;
        
        switch (region) {
            case 'pacific-ring':
                return (lng >= 120 && lng <= 180) || (lng >= -180 && lng <= -100) || 
                       (lat >= -60 && lat <= 70 && (lng >= 120 || lng <= -100));
            case 'americas':
                return lng >= -180 && lng <= -30;
            case 'asia-pacific':
                return lng >= 60 && lng <= 180 && lat >= -50 && lat <= 70;
            case 'europe-africa':
                return lng >= -30 && lng <= 60;
            case 'atlantic':
                return lng >= -60 && lng <= 20 && lat >= -60 && lat <= 70;
            default:
                return true;
        }
    };

    // Apply filters to earthquakes
    const applyFilters = () => {
        let filtered = earthquakes.filter(eq => {
            // Magnitude filter
            if (eq.magnitude < filters.minMagnitude || eq.magnitude > filters.maxMagnitude) {
                return false;
            }
            
            // Date filter
            if (filters.startDate && new Date(eq.time) < new Date(filters.startDate)) {
                return false;
            }
            if (filters.endDate && new Date(eq.time) > new Date(filters.endDate)) {
                return false;
            }
            
            // Region filter
            if (!isInRegion(eq, filters.region)) {
                return false;
            }
            
            // Search filter
            if (filters.searchTerm && !eq.place.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
                return false;
            }
            
            return true;
        });
        
        setFilteredEarthquakes(filtered);
    };

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Time animation
    const startAnimation = () => {
        if (filteredEarthquakes.length === 0) return;
        
        setIsAnimating(true);
        setAnimationIndex(0);
        
        const animate = () => {
            setAnimationIndex(prev => {
                const next = prev + 1;
                if (next >= filteredEarthquakes.length) {
                    setIsAnimating(false);
                    return 0;
                }
                return next;
            });
        };
        
        animationRef.current = setInterval(animate, 100); // Show 10 earthquakes per second
    };

    const stopAnimation = () => {
        setIsAnimating(false);
        clearInterval(animationRef.current);
        setAnimationIndex(0);
    };

    // Get earthquakes to display (all or up to animation index)
    const displayEarthquakes = isAnimating 
        ? filteredEarthquakes.slice(0, animationIndex)
        : filteredEarthquakes;

    // Statistics
    const getStatistics = () => {
        if (displayEarthquakes.length === 0) return null;
        
        const magnitudes = displayEarthquakes.map(eq => eq.magnitude);
        const avgMagnitude = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
        const maxMagnitude = Math.max(...magnitudes);
        const minMagnitude = Math.min(...magnitudes);
        
        const last24h = displayEarthquakes.filter(eq => 
            new Date() - new Date(eq.time) < 24 * 60 * 60 * 1000
        ).length;
        
        return {
            total: displayEarthquakes.length,
            avgMagnitude: avgMagnitude.toFixed(1),
            maxMagnitude: maxMagnitude.toFixed(1),
            minMagnitude: minMagnitude.toFixed(1),
            last24h
        };
    };

    const handleEarthquakeClick = (earthquake) => {
        console.log('Clicked earthquake:', earthquake);
        if (earthquake.url) {
            window.open(earthquake.url, '_blank');
        }
    };

    const handleEarthquakeHover = (earthquake) => {
        setHoveredEarthquake(earthquake);
    };

    const fetchEarthquakes = async () => {
        try {
            console.log('🌍 Fetching earthquake data...');
            const response = await fetch('/earthquakes?minmagnitude=4.5&limit=1000');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Earthquake data received:', data);
            
            if (data.earthquakes && Array.isArray(data.earthquakes)) {
                const processedEarthquakes = data.earthquakes.map(eq => ({
                    ...eq,
                    color: getMagnitudeColor(eq.magnitude),
                    size: getMagnitudeSize(eq.magnitude),
                    label: `${eq.place}\nMagnitude: ${eq.magnitude}\nDepth: ${eq.depth}km\nTime: ${new Date(eq.time).toLocaleString()}`
                }));
                
                console.log(`🌍 Processed ${processedEarthquakes.length} earthquakes`);
                setEarthquakes(processedEarthquakes);
                setDataLoaded(true);
            } else {
                console.error('❌ Invalid data structure:', data);
                setError('Invalid data received from server');
            }
        } catch (err) {
            console.error('❌ Error fetching earthquake data:', err);
            setError(`Failed to fetch earthquake data: ${err.message}`);
            setDataLoaded(true);
        }
    };

    // Apply filters when earthquakes or filters change
    useEffect(() => {
        if (earthquakes.length > 0) {
            applyFilters();
        }
    }, [earthquakes, filters]);

    // Artificial loading with progress bar (minimum 5 seconds)
    useEffect(() => {
        console.log('🚀 Starting earthquake data fetch...');
        
        // Start fetching data immediately
        fetchEarthquakes();
        
        // Artificial progress simulation (5 seconds minimum)
        const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
                const increment = Math.random() * 3 + 1; // Random increment between 1-4%
                const newProgress = Math.min(prev + increment, 95); // Cap at 95% until data is loaded
                return newProgress;
            });
        }, 100); // Update every 100ms
        
        // Complete loading after minimum 5 seconds AND data is loaded
        const checkCompletion = () => {
            if (dataLoaded && loadingProgress >= 95) {
                setLoadingProgress(100);
                setTimeout(() => {
                    setLoading(false);
                    clearInterval(progressInterval);
                }, 300); // Small delay to show 100%
            } else {
                setTimeout(checkCompletion, 100);
            }
        };
        
        // Start checking for completion after 5 seconds minimum
        setTimeout(() => {
            if (dataLoaded) {
                setLoadingProgress(100);
                setTimeout(() => {
                    setLoading(false);
                    clearInterval(progressInterval);
                }, 300);
            } else {
                checkCompletion();
            }
        }, 5000); // 5 second minimum
        
        return () => {
            clearInterval(progressInterval);
        };
    }, [dataLoaded, loadingProgress]);

    useEffect(() => {
        if (globeRef.current && globeReady) {
            const globe = globeRef.current;
            
            // Set initial camera position
            globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
            
            // Auto-rotate the globe
            globe.controls().autoRotate = true;
            globe.controls().autoRotateSpeed = 0.5;
            globe.controls().enableDamping = true;
            globe.controls().dampingFactor = 0.1;
        }
    }, [globeReady]);

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                clearInterval(animationRef.current);
            }
        };
    }, []);

    const handleGlobeReady = () => {
        console.log('🌍 Globe is ready');
        setGlobeReady(true);
    };

    const toggleLightMode = () => {
        setLightMode(!lightMode);
    };

    // Get default date range (last 30 days)
    const getDefaultDateRange = () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    };

    // Initialize default date range
    useEffect(() => {
        const defaultDates = getDefaultDateRange();
        setFilters(prev => ({
            ...prev,
            startDate: defaultDates.start,
            endDate: defaultDates.end
        }));
    }, []);

    // Globe configuration based on mode
    const globeConfig = lightMode ? {
        globeImageUrl: "//unpkg.com/three-globe/example/img/earth-day.jpg",
        bumpImageUrl: "//unpkg.com/three-globe/example/img/earth-topology.png",
        backgroundImageUrl: null,
        backgroundColor: '#87ceeb',
        atmosphereColor: "#4a90e2",
        containerStyle: { backgroundColor: '#f0f8ff' }
    } : {
        globeImageUrl: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
        bumpImageUrl: "//unpkg.com/three-globe/example/img/earth-topology.png",
        backgroundImageUrl: "//unpkg.com/three-globe/example/img/night-sky.png",
        backgroundColor: '#000011',
        atmosphereColor: "#87ceeb",
        containerStyle: { backgroundColor: '#000011' }
    };

    const stats = getStatistics();

    if (loading) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #0c1524 0%, #1a1a2e 50%, #16213e 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                zIndex: 9999
            }}>
                {/* Animated Earth Icon */}
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #4CAF50, #2196F3)',
                    marginBottom: '30px',
                    animation: 'spin 2s linear infinite',
                    boxShadow: '0 0 30px rgba(76, 175, 80, 0.5)'
                }} />
                
                {/* Loading Text */}
                <h2 style={{ 
                    margin: '0 0 20px 0', 
                    fontSize: '1.8rem',
                    fontWeight: '300',
                    letterSpacing: '2px'
                }}>
                    Loading Earthquake Data
                </h2>
                
                {/* Progress Bar Container */}
                <div style={{
                    width: '400px',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '15px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    {/* Progress Bar Fill */}
                    <div style={{
                        width: `${loadingProgress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                        backgroundSize: '200% 100%',
                        animation: 'gradientShift 2s ease-in-out infinite'
                    }} />
                </div>
                
                {/* Progress Percentage */}
                <p style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '1.2rem',
                    fontWeight: '500',
                    opacity: 0.9
                }}>
                    {Math.round(loadingProgress)}%
                </p>
                
                {/* Loading Status Text */}
                <p style={{ 
                    margin: 0, 
                    fontSize: '0.9rem',
                    opacity: 0.7,
                    letterSpacing: '1px'
                }}>
                    {loadingProgress < 30 ? 'Connecting to USGS API...' :
                     loadingProgress < 60 ? 'Fetching earthquake data...' :
                     loadingProgress < 90 ? 'Processing coordinates...' :
                     'Preparing visualization...'}
                </p>
                
                {/* CSS Animations */}
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    @keyframes gradientShift {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: lightMode ? '#f0f8ff' : '#000011',
                color: '#ff6b6b',
                fontSize: '18px',
                textAlign: 'center',
                padding: '20px'
            }}>
                <div>❌ Error loading earthquake data</div>
                <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
                    {error}
                </div>
                <button 
                    onClick={fetchEarthquakes}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        backgroundColor: '#4a90e2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div style={{ width: '100vw', height: '100vh', ...globeConfig.containerStyle }}>
            {/* Control Panel */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                {/* Mode Toggle Button */}
                <button
                    onClick={toggleLightMode}
                    style={{
                        backgroundColor: lightMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                        color: lightMode ? '#333' : 'white',
                        border: 'none',
                        borderRadius: '25px',
                        padding: '10px 15px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                >
                    {lightMode ? '🌙' : '☀️'} {lightMode ? 'Dark' : 'Light'} Mode
                </button>

                {/* Filters Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        backgroundColor: lightMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                        color: lightMode ? '#333' : 'white',
                        border: 'none',
                        borderRadius: '25px',
                        padding: '10px 15px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease'
                    }}
                >
                    🎛️ Filters {showFilters ? '✕' : '☰'}
                </button>

                {/* Animation Controls */}
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                        onClick={isAnimating ? stopAnimation : startAnimation}
                        disabled={filteredEarthquakes.length === 0}
                        style={{
                            backgroundColor: isAnimating ? '#ff4444' : '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            padding: '8px 12px',
                            fontSize: '14px',
                            cursor: filteredEarthquakes.length === 0 ? 'not-allowed' : 'pointer',
                            backdropFilter: 'blur(10px)',
                            opacity: filteredEarthquakes.length === 0 ? 0.5 : 1
                        }}
                    >
                        {isAnimating ? '⏹️ Stop' : '▶️ Animate'}
                    </button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div style={{
                    position: 'absolute',
                    top: '140px',
                    left: '20px',
                    zIndex: 1000,
                    backgroundColor: lightMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.9)',
                    color: lightMode ? '#333' : 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    fontSize: '14px',
                    backdropFilter: 'blur(15px)',
                    maxWidth: '350px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '16px' }}>
                        🎛️ Filter Controls
                    </div>
                    
                    {/* Magnitude Range */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                            Magnitude Range: {filters.minMagnitude} - {filters.maxMagnitude}
                        </label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                type="range"
                                min="1"
                                max="9"
                                step="0.1"
                                value={filters.minMagnitude}
                                onChange={(e) => handleFilterChange('minMagnitude', parseFloat(e.target.value))}
                                style={{ flex: 1 }}
                            />
                            <input
                                type="range"
                                min="1"
                                max="9"
                                step="0.1"
                                value={filters.maxMagnitude}
                                onChange={(e) => handleFilterChange('maxMagnitude', parseFloat(e.target.value))}
                                style={{ flex: 1 }}
                            />
                        </div>
                    </div>

                    {/* Date Range */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                            📅 Date Range
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '5px',
                                    borderRadius: '5px',
                                    border: '1px solid #ccc',
                                    backgroundColor: lightMode ? 'white' : '#333',
                                    color: lightMode ? '#333' : 'white'
                                }}
                            />
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '5px',
                                    borderRadius: '5px',
                                    border: '1px solid #ccc',
                                    backgroundColor: lightMode ? 'white' : '#333',
                                    color: lightMode ? '#333' : 'white'
                                }}
                            />
                        </div>
                    </div>

                    {/* Region Filter */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                            🌍 Region
                        </label>
                        <select
                            value={filters.region}
                            onChange={(e) => handleFilterChange('region', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                                backgroundColor: lightMode ? 'white' : '#333',
                                color: lightMode ? '#333' : 'white'
                            }}
                        >
                            {Object.entries(regions).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                            🔍 Search Location
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Japan, California, Alaska..."
                            value={filters.searchTerm}
                            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                                backgroundColor: lightMode ? 'white' : '#333',
                                color: lightMode ? '#333' : 'white'
                            }}
                        />
                    </div>

                    {/* Quick Filters */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                            ⚡ Quick Filters
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, minMagnitude: 6.0 }))}
                                style={{
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    borderRadius: '15px',
                                    border: 'none',
                                    backgroundColor: '#ff4444',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Major 6.0+
                            </button>
                            <button
                                onClick={() => {
                                    const yesterday = new Date();
                                    yesterday.setDate(yesterday.getDate() - 1);
                                    setFilters(prev => ({ 
                                        ...prev, 
                                        startDate: yesterday.toISOString().split('T')[0] 
                                    }));
                                }}
                                style={{
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    borderRadius: '15px',
                                    border: 'none',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Last 24h
                            </button>
                            <button
                                onClick={() => {
                                    const defaultDates = getDefaultDateRange();
                                    setFilters({
                                        minMagnitude: 4.5,
                                        maxMagnitude: 10.0,
                                        startDate: defaultDates.start,
                                        endDate: defaultDates.end,
                                        region: 'all',
                                        searchTerm: ''
                                    });
                                }}
                                style={{
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    borderRadius: '15px',
                                    border: 'none',
                                    backgroundColor: '#2196F3',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Reset All
                            </button>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div style={{
                        padding: '10px',
                        backgroundColor: lightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        textAlign: 'center'
                    }}>
                        Showing {displayEarthquakes.length} of {earthquakes.length} earthquakes
                        {isAnimating && (
                            <div style={{ marginTop: '5px', opacity: 0.8 }}>
                                Animation: {animationIndex}/{filteredEarthquakes.length}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Statistics Panel */}
            {stats && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 1000,
                    backgroundColor: lightMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                    color: lightMode ? '#333' : 'white',
                    padding: '15px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    backdropFilter: 'blur(10px)',
                    minWidth: '200px'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>
                        📊 Real-time Statistics
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>Total: <strong>{stats.total}</strong></div>
                        <div>Last 24h: <strong>{stats.last24h}</strong></div>
                        <div>Avg Mag: <strong>{stats.avgMagnitude}</strong></div>
                        <div>Max Mag: <strong>{stats.maxMagnitude}</strong></div>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.7 }}>
                        Range: {stats.minMagnitude} - {stats.maxMagnitude}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 1000,
                backgroundColor: lightMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                color: lightMode ? '#333' : 'white',
                padding: '15px',
                borderRadius: '10px',
                fontSize: '12px',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                    🌍 Earthquake Magnitude Scale
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div><span style={{ color: '#ff0000' }}>●</span> 7.0+ Major</div>
                    <div><span style={{ color: '#ff4500' }}>●</span> 6.0-6.9 Strong</div>
                    <div><span style={{ color: '#ff8c00' }}>●</span> 5.0-5.9 Moderate</div>
                    <div><span style={{ color: '#ffd700' }}>●</span> 4.0-4.9 Light</div>
                    <div><span style={{ color: '#90ee90' }}>●</span> &lt;4.0 Minor</div>
                </div>
                <div style={{ marginTop: '10px', fontSize: '10px', opacity: 0.8 }}>
                    Total earthquakes: {earthquakes.length}
                </div>
                <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.7 }}>
                    Hover points to see height
                </div>
            </div>

            {/* Info Panel */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                zIndex: 1000,
                backgroundColor: lightMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                color: lightMode ? '#333' : 'white',
                padding: '15px',
                borderRadius: '10px',
                fontSize: '12px',
                backdropFilter: 'blur(10px)',
                maxWidth: '300px'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    🌍 Global Earthquake Monitor
                </div>
                <div style={{ opacity: 0.9 }}>
                    Real-time earthquake data from USGS
                </div>
                <div style={{ opacity: 0.8, fontSize: '10px', marginTop: '5px' }}>
                    Showing magnitude 4.5+ from last 30 days
                </div>
                {isAnimating && (
                    <div style={{ 
                        marginTop: '8px', 
                        padding: '5px', 
                        backgroundColor: '#4CAF50', 
                        borderRadius: '5px', 
                        fontSize: '10px',
                        textAlign: 'center'
                    }}>
                        🎬 Timeline Animation Active
                    </div>
                )}
            </div>

            <Globe
                ref={globeRef}
                globeImageUrl={globeConfig.globeImageUrl}
                bumpImageUrl={globeConfig.bumpImageUrl}
                backgroundImageUrl={globeConfig.backgroundImageUrl}
                backgroundColor={globeConfig.backgroundColor}
                
                // Enhanced visual settings
                atmosphereColor={globeConfig.atmosphereColor}
                atmosphereAltitude={0.15}
                enablePointerInteraction={true}
                
                // Points data for earthquakes
                pointsData={displayEarthquakes}
                pointAltitude={d => getElevation(d)}
                pointRadius={d => d.size}
                pointColor={d => d.color}
                pointLabel={d => d.label}
                onPointClick={handleEarthquakeClick}
                onPointHover={handleEarthquakeHover}
                
                // Animation settings
                pointsTransitionDuration={1000}
                
                // Globe ready callback
                onGlobeReady={handleGlobeReady}
                
                // Enhanced lighting
                enableAtmosphere={true}
            />
        </div>
    );
};

export default EarthquakeGlobe;