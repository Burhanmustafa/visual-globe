# 🌍 Visual Globe - Real-time Earthquake Visualization

A stunning 3D interactive globe that visualizes real-time earthquake data from the USGS (United States Geological Survey). Built with React, Three.js, and react-globe.gl for an immersive earthquake monitoring experience.

![Visual Globe Screenshot](https://via.placeholder.com/800x400/1a1a2e/ffffff?text=Visual+Globe+Earthquake+Visualization)

## ✨ Features

### 🎯 Core Visualization
- **Interactive 3D Globe**: Smooth rotation, zoom, and navigation
- **Real-time Earthquake Data**: Live data from USGS Earthquake API
- **Dynamic Point Visualization**: Earthquake points with magnitude-based sizing and color coding
- **Hover Effects**: Points expand to show full height when hovered
- **Click Interactions**: Direct links to detailed USGS earthquake pages

### 🎛️ Advanced Filtering System
- **Magnitude Range**: Filter earthquakes by magnitude (4.5 - 10.0)
- **Date Range**: Custom date filtering with default 30-day window
- **Geographic Regions**: 
  - All Regions
  - Pacific Ring of Fire
  - Americas
  - Asia Pacific
  - Europe & Africa
  - Atlantic Region
- **Location Search**: Search by place names (e.g., "Japan", "California")
- **Quick Filters**: One-click filters for major earthquakes (6.0+) and recent activity

### 🎬 Interactive Controls
- **Time Animation**: Watch earthquakes appear chronologically
- **Light/Dark Mode**: Toggle between day and night globe themes
- **Auto-rotation**: Smooth globe rotation with customizable speed
- **Statistics Panel**: Real-time stats including total count, average magnitude, and 24-hour activity

### 🎨 Visual Design
- **Magnitude Color Coding**:
  - 🔴 Red: Major (7.0+)
  - 🟠 Orange Red: Strong (6.0-6.9)
  - 🟤 Dark Orange: Moderate (5.0-5.9)
  - 🟡 Gold: Light (4.0-4.9)
  - 🟢 Light Green: Minor (<4.0)
- **Enhanced Loading Experience**: 5-second minimum with animated progress bar
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/visual-globe.git
   cd visual-globe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the proxy server** (in one terminal)
   ```bash
   node proxy.cjs
   ```

4. **Start the development server** (in another terminal)
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Frontend: `http://localhost:5173` (or next available port)
   - Backend API: `http://localhost:3001`

## 🏗️ Architecture

### Frontend Stack
- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **react-globe.gl**: 3D globe visualization library
- **Three.js**: 3D graphics engine

### Backend Stack
- **Node.js**: Runtime environment
- **Express.js**: Web server framework
- **USGS Earthquake API**: Real-time earthquake data source

### Data Flow
```
USGS API → Proxy Server (Node.js) → Frontend (React) → 3D Globe Visualization
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
# API Configuration
PROXY_PORT=3001
VITE_API_URL=http://localhost:3001

# Earthquake Data Settings
MIN_MAGNITUDE=4.5
MAX_EARTHQUAKES=1000
DEFAULT_DAYS=30
```

### Proxy Server Configuration
The proxy server (`proxy.cjs`) handles:
- CORS issues with USGS API
- Data processing and formatting
- Error handling and retries
- Coordinate extraction and validation

## 📊 Data Sources

### USGS Earthquake API
- **Endpoint**: `https://earthquake.usgs.gov/fdsnws/event/1/query`
- **Format**: GeoJSON
- **Update Frequency**: Real-time
- **Coverage**: Global earthquakes magnitude 4.5+
- **Data Points**: ~490 earthquakes from last 30 days

### Data Fields
Each earthquake includes:
- Geographic coordinates (latitude, longitude)
- Magnitude and depth
- Timestamp and location description
- USGS event page URL
- Tsunami warning status

## 🎮 Usage Guide

### Basic Navigation
- **Rotate**: Click and drag on the globe
- **Zoom**: Mouse wheel or pinch gesture
- **Reset View**: Refresh page or use controls

### Filtering Earthquakes
1. Click the "🎛️ Filters" button
2. Adjust magnitude range with sliders
3. Set custom date range
4. Select geographic region
5. Use search to find specific locations
6. Apply quick filters for common scenarios

### Time Animation
1. Click "▶️ Animate" to start chronological playback
2. Watch earthquakes appear in time sequence
3. Click "⏹️ Stop" to end animation
4. Animation speed: 10 earthquakes per second

### Statistics Panel
Real-time statistics show:
- Total earthquake count
- Average magnitude
- Maximum magnitude
- Last 24-hour activity

## 🛠️ Development

### Project Structure
```
visual-globe/
├── src/
│   ├── components/
│   │   └── CrisisGlobe.jsx    # Main globe component
│   ├── App.jsx                # Root component
│   └── main.jsx              # Entry point
├── proxy.cjs                 # Backend proxy server
├── package.json              # Dependencies
├── vite.config.js           # Vite configuration
└── README.md                # Documentation
```

### Available Scripts
```bash
# Development
npm run dev          # Start development server
node proxy.cjs       # Start proxy server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Utilities
npm run lint         # Run ESLint
```

### API Endpoints
- `GET /earthquakes` - Fetch earthquake data with optional filters
  - Query parameters: `minmagnitude`, `limit`, `starttime`, `endtime`

## 🌟 Advanced Features

### Custom Regions
The application includes predefined geographic regions:
- **Pacific Ring of Fire**: High seismic activity zone
- **Americas**: North and South America
- **Asia Pacific**: Asian and Pacific regions
- **Europe & Africa**: European and African continents
- **Atlantic**: Atlantic Ocean region

### Performance Optimizations
- **Data Caching**: Reduces API calls
- **Efficient Rendering**: Optimized Three.js performance
- **Progressive Loading**: Smooth user experience
- **Memory Management**: Proper cleanup of resources

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow React best practices
- Maintain consistent code formatting
- Add comments for complex logic
- Test new features thoroughly
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **USGS**: For providing real-time earthquake data
- **react-globe.gl**: For the amazing 3D globe library
- **Three.js**: For powerful 3D graphics capabilities
- **Vite**: For fast development experience

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/visual-globe/issues) page
2. Create a new issue with detailed information
3. Include browser version and error messages

## 🔄 Updates

### Recent Changes
- ✅ Switched from ReliefWeb to USGS Earthquake API
- ✅ Added comprehensive filtering system
- ✅ Implemented time animation features
- ✅ Enhanced loading experience with progress bar
- ✅ Added statistics panel and real-time data
- ✅ Improved hover effects and interactions

### Roadmap
- 🔲 Mobile app version
- 🔲 Historical earthquake data analysis
- 🔲 Earthquake prediction models
- 🔲 Social media integration
- 🔲 Multi-language support

---

**Built with ❤️ for earthquake awareness and education**

*Stay informed, stay prepared* 🌍
