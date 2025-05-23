const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

// USGS Earthquake API endpoint
const USGS_BASE_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

app.get('/earthquakes', async (req, res) => {
    const { 
        minmagnitude = '4.5', 
        limit = '1000',
        format = 'geojson',
        starttime,
        endtime
    } = req.query;
    
    console.log('🌍 📥 Received request for earthquakes');
    console.log('🌍 Query params:', { minmagnitude, limit, starttime, endtime });

    try {
        console.log('🌍 Fetching data from USGS Earthquake API...');
        
        // Build URL with query parameters
        const params = new URLSearchParams();
        params.append('format', format);
        params.append('minmagnitude', minmagnitude);
        params.append('limit', limit);
        params.append('orderby', 'time');
        
        // Add time filters if provided, otherwise get recent earthquakes
        if (starttime) {
            params.append('starttime', starttime);
        } else {
            // Get earthquakes from the last 30 days by default
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            params.append('starttime', thirtyDaysAgo.toISOString().split('T')[0]);
        }
        
        if (endtime) {
            params.append('endtime', endtime);
        }

        const url = `${USGS_BASE_URL}?${params.toString()}`;
        console.log('🔗 Request URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Visual-Globe-App/1.0'
            }
        });

        if (!response.ok) {
            console.error(`❌ USGS API responded with status ${response.status}`);
            throw new Error(`USGS API responded with status ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Successfully fetched earthquake data');
        console.log('📊 Total earthquakes:', data.features?.length || 0);
        
        if (data.features && data.features.length > 0) {
            console.log('🔍 Sample earthquake:', JSON.stringify(data.features[0], null, 2));
        }

        // Process the GeoJSON data for the globe
        const processedData = data.features ? data.features.map((earthquake, index) => {
            const coords = earthquake.geometry.coordinates;
            const props = earthquake.properties;
            
            const processed = {
                id: earthquake.id,
                lat: coords[1], // latitude
                lng: coords[0], // longitude  
                depth: coords[2], // depth in km
                magnitude: props.mag,
                place: props.place,
                time: props.time,
                timeString: new Date(props.time).toISOString(),
                title: props.title,
                url: props.url,
                tsunami: props.tsunami,
                type: props.type,
                status: props.status,
                updated: props.updated
            };
            
            if (index < 3) {
                console.log(`🔍 Earthquake ${index} processed:`, JSON.stringify(processed, null, 2));
            }
            
            return processed;
        }) : [];

        console.log(`📤 Sending ${processedData.length} processed earthquakes`);
        console.log(`📍 All earthquakes have coordinates: ${processedData.length}`);
        
        res.json({
            count: processedData.length,
            earthquakes: processedData,
            metadata: {
                generated: data.metadata?.generated,
                url: data.metadata?.url,
                title: data.metadata?.title,
                count: data.metadata?.count
            }
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to fetch earthquake data', 
            details: error.message 
        });
    }
});

const PORT = 3001;
const server = app.listen(PORT, () => {
    console.log(`🚀 USGS Earthquake Proxy server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('ℹ️ SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('ℹ️ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('ℹ️ SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('ℹ️ Server closed');
        process.exit(0);
    });
}); 