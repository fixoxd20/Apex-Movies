const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const cron = require('node-cron'); // ස්වයංක්‍රීයව වැඩ කිරීමට මෙය අවශ්‍යයි

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public'));

let database = []; // තාවකාලිකව දත්ත ගබඩා කිරීමට

// 1. Sinhalasub Scraper Function
async function autoScrapeSinhalasub() {
    console.log("🚀 Running Auto-Sync with Sinhalasub.lk...");
    try {
        const { data } = await axios.get('https://sinhalasub.lk/', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        
        $('.result-item').each((i, el) => {
            const movie = {
                id: Date.now() + i,
                title: $(el).find('.title a').text(),
                year: $(el).find('.year').text() || '2025',
                imageUrl: $(el).find('img').attr('src'),
                rating: $(el).find('.rating').text() || 'N/A',
                quality: 'HD',
                genre: 'New Release',
                streamUrl: $(el).find('.title a').attr('href'),
                isNew: true
            };
            if(movie.title) database.push(movie);
        });

        // Duplicate ඉවත් කිරීම
        database = Array.from(new Set(database.map(a => a.title)))
            .map(title => database.find(a => a.title === title));

        console.log(`✅ Sync Complete. Total movies: ${database.length}`);
    } catch (e) {
        console.log("❌ Sync Error: ", e.message);
    }
}

// 2. Cron Job - සෑම පැයකටම වරක් ස්වයංක්‍රීයව වැඩ කරයි
// '0 * * * *' යනු සෑම පැයකම ආරම්භයේදීය
cron.schedule('0 * * * *', () => {
    autoScrapeSinhalasub();
});

// API Endpoints
app.get('/api/movies', (req, res) => {
    res.json({ success: true, movies: database.length > 0 ? database : getFallbackMovies() });
});

// මුලින්ම server එක start වන විට එක වරක් scrape කිරීම
app.listen(PORT, () => {
    console.log(`CineMax Pro running on http://localhost:${PORT}`);
    autoScrapeSinhalasub(); 
});

function getFallbackMovies() {
    // ඔබ පෙර දුන් fallback movies මෙතැනට දමන්න
    return [ { title: "Waiting for Sync...", year: "2026", quality: "4K", imageUrl: "https://via.placeholder.com/300" } ];
}
