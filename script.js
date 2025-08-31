// Firebase yapılandırma
const firebaseConfig = {
    apiKey: "AIzaSyBteeGvXCW0H0Hxfc8P18AFpycInAXs8Fs",
    authDomain: "kitsuneanime-eddc6.firebaseapp.com",
    projectId: "kitsuneanime-eddc6",
    storageBucket: "kitsuneanime-eddc6.firebasestorage.app",
    messagingSenderId: "1073068949493",
    appId: "1:1073068949493:web:d77b25a795f40974886abc",
    measurementId: "G-RPM6XWLH8D"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Türkiye'ye özel erişim kontrolü
fetch('https://ipinfo.io/json')
    .then(response => response.json())
    .then(data => {
        if (data.country !== 'TR') {
            document.body.innerHTML = '<h1>Bu site sadece Türkiye’den erişime açıktır.</h1>';
            setTimeout(() => window.location.href = 'https://www.google.com', 3000);
        }
    })
    .catch(() => {
        document.body.innerHTML = '<h1>Konum doğrulaması başarısız. Lütfen Türkiye’den bağlanın.</h1>';
        setTimeout(() => window.location.href = 'https://www.google.com', 3000);
    });

// Örnek anime verileri (Firebase'den çekilebilir)
const animes = [
    { id: 1, title: "Tougen Anki", score: 8.3, year: 2025, type: "featured", episode: "1. Sezon 8. Bölüm", daysAgo: 1 },
    { id: 2, title: "Dan Da Dan", score: 7.5, year: 2025, type: "featured", episode: "2. Sezon 9. Bölüm", daysAgo: 2 },
    { id: 3, title: "I Was Reincarnated as the 7th...", score: 8.0, year: 2025, type: "latest", episode: "2. Sezon 8. Bölüm", daysAgo: 3 },
    { id: 4, title: "The Rising of the Shield Hero", score: 7.8, year: 2025, type: "latest", episode: "4. Sezon 8. Bölüm", daysAgo: 4 },
    { id: 5, title: "My Melody & Kuromi", score: 8.3, year: 2025, type: "new", episode: null, daysAgo: 0 },
    { id: 6, title: "Bullet Bullet", score: 6.4, year: 2025, type: "new", episode: null, daysAgo: 0 }
];

// Anime kartlarını oluştur
function loadAnimes() {
    const sections = {
        featured: document.getElementById('featured-animes'),
        latest: document.getElementById('latest-episodes'),
        new: document.getElementById('new-animes'),
        episodes: document.getElementById('new-episodes')
    };

    animes.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.innerHTML = `
            <img src="https://via.placeholder.com/180" alt="${anime.title}">
            <h3>${anime.title}</h3>
            <p class="rating">Puan: ${anime.score}/10</p>
            <p>Yıl: ${anime.year}</p>
            ${anime.episode ? `<p>${anime.episode} - ${anime.daysAgo} gün önce</p>` : ''}
            <div class="rating-controls" role="group" aria-label="Puanlama">
                <button class="rate-btn" onclick="rateAnime(${anime.id}, 1)">1</button>
                <button class="rate-btn" onclick="rateAnime(${anime.id}, 2)">2</button>
                <button class="rate-btn" onclick="rateAnime(${anime.id}, 3)">3</button>
                <button class="rate-btn" onclick="rateAnime(${anime.id}, 4)">4</button>
                <button class="rate-btn" onclick="rateAnime(${anime.id}, 5)">5</button>
            </div>
        `;
        if (anime.type === 'featured') sections.featured.appendChild(card.cloneNode(true));
        else if (anime.type === 'latest') sections.latest.appendChild(card.cloneNode(true));
        else if (anime.type === 'new') sections.new.appendChild(card.cloneNode(true));
    });

    // Son eklenen bölümler
    animes.forEach(anime => {
        if (anime.episode) {
            const episodeCard = document.createElement('div');
            episodeCard.className = 'anime-card';
            episodeCard.innerHTML = `
                <img src="https://via.placeholder.com/180" alt="${anime.title} Bölüm">
                <h3>${anime.episode} - ${anime.daysAgo} gün önce</h3>
                <p>${anime.title}</p>
            `;
            sections.episodes.appendChild(episodeCard);
        }
    });
}

loadAnimes();

// Arama fonksiyonu
document.getElementById('search').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    document.querySelectorAll('.anime-card').forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = title.includes(searchTerm) ? 'block' : 'none';
    });
});

// Yorum ekleme fonksiyonu
function addComment() {
    const commentInput = document.getElementById('comment-input').value.trim();
    if (commentInput) {
        const commentsRef = database.ref('comments');
        commentsRef.push({
            text: commentInput,
            timestamp: new Date().toISOString(),
            user: `Kullanıcı${Math.floor(Math.random() * 1000)}`
        });
        document.getElementById('comment-input').value = '';
        loadComments();
    }
}

// Yorumları yükleme fonksiyonu
function loadComments() {
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = '';
    const commentsRef = database.ref('comments');
    commentsRef.on('value', (snapshot) => {
        snapshot.forEach(childSnapshot => {
            const comment = childSnapshot.val();
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment';
            commentDiv.innerHTML = `
                <p><strong>${comment.user}</strong>: ${comment.text} <small>${new Date(comment.timestamp).toLocaleString('tr-TR')}</small></p>
                <textarea class="reply-input" placeholder="Yanıt yaz..." aria-label="Yanıt gir"></textarea>
                <button class="btn" onclick="addReply('${childSnapshot.key}')">Yanıt Ekle</button>
                <div class="replies"></div>
            `;
            commentsList.appendChild(commentDiv);
            loadReplies(commentDiv, childSnapshot.key);
        });
    });
}

function loadReplies(commentDiv, commentId) {
    const repliesDiv = commentDiv.querySelector('.replies');
    const repliesRef = database.ref(`comments/${commentId}/replies`);
    repliesRef.on('value', (snapshot) => {
        repliesDiv.innerHTML = '';
        snapshot.forEach(childSnapshot => {
            const reply = childSnapshot.val();
            const replyDiv = document.createElement('div');
            replyDiv.className = 'reply';
            replyDiv.innerHTML = `<p><strong>${reply.user || 'Misafir'}</strong>: ${reply.text} <small>${new Date(reply.timestamp).toLocaleString('tr-TR')}</small></p>`;
            repliesDiv.appendChild(replyDiv);
        });
    });
}

function addReply(commentId) {
    const replyInput = document.querySelector(`#comments-list .comment:nth-child(${parseInt(commentId) + 1} .reply-input`).value.trim();
    if (replyInput) {
        const commentRef = database.ref(`comments/${commentId}`);
        commentRef.once('value', (snapshot) => {
            const comment = snapshot.val() || { replies: [] };
            comment.replies = comment.replies || [];
            comment.replies.push({
                text: replyInput,
                timestamp: new Date().toISOString(),
                user: `Misafir${Math.floor(Math.random() * 1000)}`
            });
            commentRef.update(comment);
        });
        document.querySelector(`#comments-list .comment:nth-child(${parseInt(commentId) + 1} .reply-input`).value = '';
    }
}

window.onload = loadComments;

// Puanlama fonksiyonu
function rateAnime(animeId, rating) {
    const ratingsRef = database.ref(`ratings/${animeId}`);
    ratingsRef.transaction(current => {
        if (current === null) return { total: rating, count: 1 };
        return { total: current.total + rating, count: current.count + 1 };
    }, () => updateRatingDisplay(animeId));
}

function updateRatingDisplay(animeId) {
    const ratingsRef = database.ref(`ratings/${animeId}`);
    ratingsRef.once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const average = data.total / data.count;
            document.querySelectorAll(`.anime-card`).forEach(card => {
                if (card.querySelector('h3').textContent.includes(animes.find(a => a.id === animeId).title)) {
                    card.querySelector('.rating').textContent = `Puan: ${average.toFixed(1)}/10 (${data.count} oy)`;
                }
            });
        }
    });
}

// Erişilebilirlik ve klavye navigasyonu
document.querySelectorAll('button, input, textarea').forEach(element => {
    element.setAttribute('tabindex', '0');
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') e.target.click();
    });
});
