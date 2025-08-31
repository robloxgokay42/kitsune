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
            alert('Bu site sadece Türkiye’den erişime açıktır.');
            window.location.href = 'https://www.google.com';
        }
    })
    .catch(() => {
        alert('Konum doğrulaması başarısız. Lütfen Türkiye’den bağlanın.');
        window.location.href = 'https://www.google.com';
    });

// Örnek anime verileri (Firebase'den çekilecek şekilde düzenlenebilir)
const sampleAnimes = [
    { id: 1, title: "Tougen Anki", score: 8.3, year: 2025, type: "featured" },
    { id: 2, title: "Dan Da Dan", score: 7.5, year: 2025, type: "featured" },
    { id: 3, title: "I Was Reincarnated as the 7th...", score: 8.0, year: 2025, type: "latest" },
    { id: 4, title: "The Rising of the Shield Hero", score: 7.8, year: 2025, type: "latest" }
];

// Anime kartlarını oluştur
function loadAnimes() {
    const featured = document.getElementById('featured-animes');
    const latest = document.getElementById('latest-episodes');
    const newAnimes = document.getElementById('new-animes');
    const newEpisodes = document.getElementById('new-episodes');

    sampleAnimes.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.innerHTML = `
            <img src="https://via.placeholder.com/150" alt="${anime.title}">
            <h3>${anime.title}</h3>
            <p>Puan: ${anime.score}/10</p>
            <p>Yıl: ${anime.year}</p>
        `;
        if (anime.type === 'featured') featured.appendChild(card);
        else if (anime.type === 'latest') latest.appendChild(card);
    });

    // Yeni animeler ve bölümler için örnek
    for (let i = 1; i <= 2; i++) {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.innerHTML = `
            <img src="https://via.placeholder.com/150" alt="Yeni Anime ${i}">
            <h3>Yeni Anime ${i}</h3>
            <p>Yıl: 2025</p>
        `;
        newAnimes.appendChild(card);

        const episodeCard = document.createElement('div');
        episodeCard.className = 'anime-card';
        episodeCard.innerHTML = `
            <img src="https://via.placeholder.com/150" alt="Bölüm ${i}">
            <h3>Bölüm ${i} - 1 Gün Önce</h3>
            <p>${sampleAnimes[i-1].title}</p>
        `;
        newEpisodes.appendChild(episodeCard);
    }
}

loadAnimes();

// Yorum ekleme fonksiyonu
function addComment() {
    const commentInput = document.getElementById('comment-input').value;
    if (commentInput) {
        const commentsRef = database.ref('comments');
        commentsRef.push({
            text: commentInput,
            timestamp: new Date().toISOString(),
            replies: []
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
                <p>${comment.text} <small>${new Date(comment.timestamp).toLocaleString('tr-TR')}</small></p>
                <textarea class="reply-input" placeholder="Yanıt yaz..."></textarea>
                <button onclick="addReply('${childSnapshot.key}')">Yanıt Ekle</button>
                <div class="replies"></div>
            `;
            commentsList.appendChild(commentDiv);

            // Yanıtları yükle
            comment.replies.forEach(reply => {
                const replyDiv = document.createElement('div');
                replyDiv.className = 'reply';
                replyDiv.innerHTML = `<p>${reply.text} <small>${new Date(reply.timestamp).toLocaleString('tr-TR')}</small></p>`;
                commentDiv.querySelector('.replies').appendChild(replyDiv);
            });
        });
    });
}

function addReply(commentId) {
    const replyInput = document.querySelector(`#comments-list .comment:nth-child(${parseInt(commentId) + 1}) .reply-input`).value;
    if (replyInput) {
        const commentRef = database.ref(`comments/${commentId}`);
        commentRef.once('value', (snapshot) => {
            const comment = snapshot.val();
            comment.replies.push({
                text: replyInput,
                timestamp: new Date().toLocaleString('tr-TR')
            });
            commentRef.update(comment);
        });
        document.querySelector(`#comments-list .comment:nth-child(${parseInt(commentId) + 1}) .reply-input`).value = '';
    }
}

// Sayfa yüklendiğinde yorumları yükle
window.onload = loadComments;

// Puanlama fonksiyonu
function rateAnime(animeId, rating) {
    const ratingsRef = database.ref(`ratings/${animeId}`);
    ratingsRef.transaction(current => {
        if (current === null) return { total: rating, count: 1 };
        return { total: current.total + rating, count: current.count + 1 };
    });
    updateRatingDisplay(animeId);
}

function updateRatingDisplay(animeId) {
    const ratingsRef = database.ref(`ratings/${animeId}`);
    ratingsRef.once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const average = data.total / data.count;
            document.querySelector(`#anime-${animeId} .rating`).textContent = `Puan: ${average.toFixed(1)}/10 (${data.count} oy)`;
        }
    });
}
